<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanyBillingEvent;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class BillingService
{
    private const STRIPE_API_BASE_DEFAULT = 'https://api.stripe.com/v1';

    public function listPlans(bool $publicOnly = true)
    {
        return SubscriptionPlan::query()
            ->when($publicOnly, fn ($query) => $query->where('is_public', true))
            ->orderBy('price')
            ->get();
    }

    public function getCompanyBillingStatus(User $user): array
    {
        $company = $user->company()->with('plan')->firstOrFail();
        $plan = $company->plan;
        $usage = $this->usageSnapshot($company, $plan);

        $events = CompanyBillingEvent::query()
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(20)
            ->get();

        return [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'is_active' => (bool) $company->is_active,
                'billing_provider' => $company->billing_provider,
                'billing_status' => $company->billing_status,
                'trial_ends_at' => optional($company->trial_ends_at)?->toDateString(),
                'subscription_starts_at' => optional($company->subscription_starts_at)?->toIso8601String(),
                'subscription_ends_at' => optional($company->subscription_ends_at)?->toIso8601String(),
                'billing_cycle_anchor' => optional($company->billing_cycle_anchor)?->toIso8601String(),
                'stripe_customer_id' => $company->stripe_customer_id,
                'stripe_subscription_id' => $company->stripe_subscription_id,
            ],
            'plan' => $plan,
            'usage' => $usage,
            'available_plans' => $this->listPlans(true),
            'events' => $events,
            'can_manage_billing' => $user->role === 'admin',
            'stripe_configured' => $this->isStripeConfigured(),
        ];
    }

    public function checkoutSession(
        User $user,
        SubscriptionPlan $plan,
        string $successUrl,
        string $cancelUrl
    ): array {
        $company = $user->company()->with('plan')->firstOrFail();

        if ($plan->price <= 0) {
            $this->applyFreePlan($company, $plan, $user->id);

            return [
                'mode' => 'internal',
                'message' => 'Plan changed successfully.',
            ];
        }

        if (!$plan->stripe_price_id) {
            throw new RuntimeException('Selected plan is not linked to Stripe pricing.');
        }

        $customerId = $this->ensureStripeCustomer($company, $user);

        $payload = [
            'customer' => $customerId,
            'mode' => 'subscription',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'allow_promotion_codes' => 'true',
            'line_items' => [
                [
                    'price' => $plan->stripe_price_id,
                    'quantity' => 1,
                ],
            ],
            'metadata' => [
                'company_id' => (string) $company->id,
                'plan_id' => (string) $plan->id,
                'requested_by' => (string) $user->id,
            ],
            'subscription_data' => [
                'metadata' => [
                    'company_id' => (string) $company->id,
                    'plan_id' => (string) $plan->id,
                    'requested_by' => (string) $user->id,
                ],
            ],
        ];

        $response = $this->stripePost('/checkout/sessions', $payload);

        $this->recordEvent($company, [
            'provider' => 'stripe',
            'event_type' => 'checkout.session.created',
            'status' => 'pending',
            'amount' => (float) $plan->price,
            'currency' => 'USD',
            'external_reference' => $response['id'] ?? null,
            'payload' => $response,
            'occurred_at' => now(),
        ]);

        return [
            'mode' => 'stripe_checkout',
            'session_id' => $response['id'] ?? null,
            'url' => $response['url'] ?? null,
        ];
    }

    public function portalSession(User $user, string $returnUrl): array
    {
        $company = $user->company;
        $customerId = $company->stripe_customer_id;

        if (!$customerId) {
            throw new RuntimeException('Stripe customer does not exist for this company.');
        }

        $response = $this->stripePost('/billing_portal/sessions', [
            'customer' => $customerId,
            'return_url' => $returnUrl,
        ]);

        return [
            'url' => $response['url'] ?? null,
        ];
    }

    public function listCompanyBillingEvents(int $limit = 25)
    {
        $safeLimit = max(1, min($limit, 100));

        return CompanyBillingEvent::query()
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit($safeLimit)
            ->get();
    }

    public function handleStripeWebhook(string $payload, ?string $signatureHeader): array
    {
        $event = json_decode($payload, true);

        if (!is_array($event)) {
            throw new RuntimeException('Invalid Stripe payload.');
        }

        $this->assertStripeSignature($payload, $signatureHeader);

        $type = (string) ($event['type'] ?? '');
        $object = $event['data']['object'] ?? [];

        match ($type) {
            'checkout.session.completed' => $this->handleCheckoutSessionCompleted($object, $event),
            'customer.subscription.created', 'customer.subscription.updated' => $this->handleSubscriptionUpdated($object, $event),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($object, $event),
            'invoice.paid' => $this->handleInvoicePaid($object, $event),
            'invoice.payment_failed' => $this->handleInvoicePaymentFailed($object, $event),
            default => null,
        };

        return [
            'received' => true,
            'type' => $type,
        ];
    }

    private function applyFreePlan(Company $company, SubscriptionPlan $plan, ?int $requestedBy): void
    {
        DB::transaction(function () use ($company, $plan, $requestedBy) {
            $company->update([
                'subscription_plan_id' => $plan->id,
                'billing_provider' => 'internal',
                'billing_status' => 'active',
                'is_active' => true,
                'subscription_starts_at' => now(),
                'subscription_ends_at' => null,
                'billing_cycle_anchor' => null,
            ]);

            $this->recordEvent($company, [
                'provider' => 'internal',
                'event_type' => 'plan.changed.free',
                'status' => 'success',
                'amount' => 0,
                'currency' => 'USD',
                'external_reference' => null,
                'payload' => [
                    'plan_id' => $plan->id,
                    'requested_by' => $requestedBy,
                ],
                'occurred_at' => now(),
            ]);
        });
    }

    private function usageSnapshot(Company $company, ?SubscriptionPlan $plan): array
    {
        $usersCount = $company->users()->count();
        $clientsCount = Client::count();
        $productsCount = Product::count();
        $invoicesCount = Invoice::query()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return [
            'users' => $this->withLimit($usersCount, $plan?->max_users),
            'clients' => $this->withLimit($clientsCount, $plan?->max_clients),
            'products' => $this->withLimit($productsCount, $plan?->max_products),
            'invoices_this_month' => $this->withLimit($invoicesCount, $plan?->max_invoices_per_month),
        ];
    }

    private function withLimit(int $current, ?int $limit): array
    {
        $usagePercent = $limit !== null && $limit > 0
            ? min(100, round(($current / $limit) * 100, 2))
            : null;

        return [
            'current' => $current,
            'limit' => $limit,
            'remaining' => $limit === null ? null : max($limit - $current, 0),
            'usage_percent' => $usagePercent,
            'is_unlimited' => $limit === null,
        ];
    }

    private function ensureStripeCustomer(Company $company, User $user): string
    {
        if ($company->stripe_customer_id) {
            return $company->stripe_customer_id;
        }

        $email = $company->users()->where('role', 'admin')->value('email') ?? $user->email;

        $response = $this->stripePost('/customers', [
            'name' => $company->name,
            'email' => $email,
            'metadata' => [
                'company_id' => (string) $company->id,
            ],
        ]);

        $customerId = (string) ($response['id'] ?? '');

        if (!$customerId) {
            throw new RuntimeException('Stripe customer ID missing from response.');
        }

        $company->update([
            'billing_provider' => 'stripe',
            'stripe_customer_id' => $customerId,
        ]);

        return $customerId;
    }

    private function handleCheckoutSessionCompleted(array $session, array $event): void
    {
        $companyId = (int) (
            $session['metadata']['company_id']
            ?? $session['client_reference_id']
            ?? 0
        );

        if ($companyId <= 0) {
            return;
        }

        $company = Company::query()->find($companyId);

        if (!$company) {
            return;
        }

        $subscriptionId = $session['subscription'] ?? null;
        $customerId = $session['customer'] ?? null;
        $planId = (int) ($session['metadata']['plan_id'] ?? 0);

        $updatePayload = [
            'billing_provider' => 'stripe',
            'billing_status' => 'active',
            'is_active' => true,
            'stripe_customer_id' => $customerId ?: $company->stripe_customer_id,
            'stripe_subscription_id' => $subscriptionId ?: $company->stripe_subscription_id,
        ];

        if ($planId > 0 && SubscriptionPlan::query()->whereKey($planId)->exists()) {
            $updatePayload['subscription_plan_id'] = $planId;
        }

        if ($subscriptionId) {
            $stripeSubscription = $this->stripeGet('/subscriptions/' . $subscriptionId);
            $this->mergeSubscriptionTimeline($updatePayload, $stripeSubscription);
            $this->applyPlanFromStripePrice($updatePayload, $stripeSubscription);
        } else {
            $updatePayload['subscription_starts_at'] = now();
        }

        $company->update($updatePayload);

        $this->recordEvent($company, [
            'provider' => 'stripe',
            'event_type' => 'checkout.session.completed',
            'status' => 'success',
            'amount' => isset($session['amount_total']) ? ((float) $session['amount_total']) / 100 : null,
            'currency' => strtoupper((string) ($session['currency'] ?? 'USD')),
            'external_reference' => $session['id'] ?? null,
            'payload' => $event,
            'occurred_at' => now(),
        ]);
    }

    private function handleSubscriptionUpdated(array $subscription, array $event): void
    {
        $company = $this->findCompanyByStripeReferences(
            $subscription['customer'] ?? null,
            $subscription['id'] ?? null
        );

        if (!$company) {
            return;
        }

        $status = (string) ($subscription['status'] ?? 'inactive');

        $updatePayload = [
            'billing_provider' => 'stripe',
            'billing_status' => $status,
            'is_active' => $this->isCompanyActiveForStatus($status),
            'stripe_customer_id' => $subscription['customer'] ?? $company->stripe_customer_id,
            'stripe_subscription_id' => $subscription['id'] ?? $company->stripe_subscription_id,
        ];

        $this->mergeSubscriptionTimeline($updatePayload, $subscription);
        $this->applyPlanFromStripePrice($updatePayload, $subscription);

        $company->update($updatePayload);

        $this->recordEvent($company, [
            'provider' => 'stripe',
            'event_type' => (string) ($event['type'] ?? 'customer.subscription.updated'),
            'status' => $status,
            'amount' => null,
            'currency' => 'USD',
            'external_reference' => $subscription['id'] ?? null,
            'payload' => $event,
            'occurred_at' => now(),
        ]);
    }

    private function handleSubscriptionDeleted(array $subscription, array $event): void
    {
        $company = $this->findCompanyByStripeReferences(
            $subscription['customer'] ?? null,
            $subscription['id'] ?? null
        );

        if (!$company) {
            return;
        }

        $endedAt = isset($subscription['ended_at'])
            ? Carbon::createFromTimestamp((int) $subscription['ended_at'])
            : now();

        $company->update([
            'billing_provider' => 'stripe',
            'billing_status' => 'canceled',
            'is_active' => false,
            'stripe_subscription_id' => $subscription['id'] ?? $company->stripe_subscription_id,
            'subscription_ends_at' => $endedAt,
        ]);

        $this->recordEvent($company, [
            'provider' => 'stripe',
            'event_type' => 'customer.subscription.deleted',
            'status' => 'canceled',
            'amount' => null,
            'currency' => 'USD',
            'external_reference' => $subscription['id'] ?? null,
            'payload' => $event,
            'occurred_at' => $endedAt,
        ]);
    }

    private function handleInvoicePaid(array $invoice, array $event): void
    {
        $company = $this->findCompanyByStripeReferences($invoice['customer'] ?? null, null);

        if (!$company) {
            return;
        }

        $amountPaid = isset($invoice['amount_paid']) ? ((float) $invoice['amount_paid']) / 100 : null;

        $company->update([
            'billing_status' => 'active',
            'is_active' => true,
        ]);

        $this->recordEvent($company, [
            'provider' => 'stripe',
            'event_type' => 'invoice.paid',
            'status' => 'paid',
            'amount' => $amountPaid,
            'currency' => strtoupper((string) ($invoice['currency'] ?? 'USD')),
            'external_reference' => $invoice['id'] ?? null,
            'payload' => $event,
            'occurred_at' => now(),
        ]);
    }

    private function handleInvoicePaymentFailed(array $invoice, array $event): void
    {
        $company = $this->findCompanyByStripeReferences($invoice['customer'] ?? null, null);

        if (!$company) {
            return;
        }

        $amountDue = isset($invoice['amount_due']) ? ((float) $invoice['amount_due']) / 100 : null;

        $company->update([
            'billing_status' => 'past_due',
            'is_active' => false,
        ]);

        $this->recordEvent($company, [
            'provider' => 'stripe',
            'event_type' => 'invoice.payment_failed',
            'status' => 'failed',
            'amount' => $amountDue,
            'currency' => strtoupper((string) ($invoice['currency'] ?? 'USD')),
            'external_reference' => $invoice['id'] ?? null,
            'payload' => $event,
            'occurred_at' => now(),
        ]);
    }

    private function mergeSubscriptionTimeline(array &$payload, array $subscription): void
    {
        if (isset($subscription['current_period_start'])) {
            $payload['subscription_starts_at'] = Carbon::createFromTimestamp((int) $subscription['current_period_start']);
            $payload['billing_cycle_anchor'] = Carbon::createFromTimestamp((int) $subscription['current_period_start']);
        }

        if (isset($subscription['current_period_end'])) {
            $payload['subscription_ends_at'] = Carbon::createFromTimestamp((int) $subscription['current_period_end']);
        }
    }

    private function applyPlanFromStripePrice(array &$payload, array $subscription): void
    {
        $priceId = data_get($subscription, 'items.data.0.price.id');

        if (!$priceId) {
            return;
        }

        $plan = SubscriptionPlan::query()->where('stripe_price_id', $priceId)->first();

        if ($plan) {
            $payload['subscription_plan_id'] = $plan->id;
        }
    }

    private function findCompanyByStripeReferences(?string $customerId, ?string $subscriptionId): ?Company
    {
        $query = Company::query();

        if ($subscriptionId) {
            $company = (clone $query)->where('stripe_subscription_id', $subscriptionId)->first();

            if ($company) {
                return $company;
            }
        }

        if ($customerId) {
            return (clone $query)->where('stripe_customer_id', $customerId)->first();
        }

        return null;
    }

    private function recordEvent(Company $company, array $payload): void
    {
        CompanyBillingEvent::create([
            'company_id' => $company->id,
            'provider' => $payload['provider'] ?? 'internal',
            'event_type' => $payload['event_type'] ?? 'unknown',
            'status' => $payload['status'] ?? null,
            'amount' => $payload['amount'] ?? null,
            'currency' => $payload['currency'] ?? 'USD',
            'external_reference' => $payload['external_reference'] ?? null,
            'payload' => $payload['payload'] ?? null,
            'occurred_at' => $payload['occurred_at'] ?? now(),
        ]);
    }

    private function isCompanyActiveForStatus(string $status): bool
    {
        return in_array($status, ['active', 'trialing'], true);
    }

    private function assertStripeSignature(string $payload, ?string $signatureHeader): void
    {
        $secret = config('services.stripe.webhook_secret');

        // Allow local testing without signature verification when secret is not configured.
        if (!$secret) {
            return;
        }

        if (!$signatureHeader) {
            throw new RuntimeException('Missing Stripe signature header.');
        }

        $parts = [];
        foreach (explode(',', $signatureHeader) as $segment) {
            [$key, $value] = array_pad(explode('=', trim($segment), 2), 2, null);
            if ($key && $value) {
                $parts[$key][] = $value;
            }
        }

        $timestamp = $parts['t'][0] ?? null;
        $signatures = $parts['v1'] ?? [];

        if (!$timestamp || empty($signatures)) {
            throw new RuntimeException('Invalid Stripe signature format.');
        }

        $signedPayload = $timestamp . '.' . $payload;
        $expected = hash_hmac('sha256', $signedPayload, $secret);

        $valid = collect($signatures)->contains(fn ($sig) => hash_equals($expected, $sig));

        if (!$valid) {
            throw new RuntimeException('Stripe signature verification failed.');
        }
    }

    private function stripePost(string $path, array $payload): array
    {
        $response = Http::withBasicAuth($this->stripeSecret(), '')
            ->asForm()
            ->acceptJson()
            ->timeout(30)
            ->post($this->stripeBaseUrl() . $path, $this->flattenForStripe($payload));

        return $this->stripeDecodeResponse($response->status(), $response->json());
    }

    private function stripeGet(string $path): array
    {
        $response = Http::withBasicAuth($this->stripeSecret(), '')
            ->acceptJson()
            ->timeout(30)
            ->get($this->stripeBaseUrl() . $path);

        return $this->stripeDecodeResponse($response->status(), $response->json());
    }

    private function stripeDecodeResponse(int $status, mixed $json): array
    {
        $payload = is_array($json) ? $json : [];

        if ($status < 200 || $status >= 300) {
            $message = data_get($payload, 'error.message') ?? 'Stripe API request failed.';
            throw new RuntimeException($message);
        }

        return $payload;
    }

    private function flattenForStripe(array $payload, string $prefix = ''): array
    {
        $result = [];

        foreach ($payload as $key => $value) {
            $compound = $prefix === '' ? (string) $key : "{$prefix}[{$key}]";

            if (is_array($value)) {
                $result += $this->flattenForStripe($value, $compound);
                continue;
            }

            if (is_bool($value)) {
                $result[$compound] = $value ? 'true' : 'false';
                continue;
            }

            if ($value !== null) {
                $result[$compound] = (string) $value;
            }
        }

        return $result;
    }

    private function stripeSecret(): string
    {
        $secret = config('services.stripe.secret');

        if (!$secret) {
            throw new RuntimeException('Stripe secret key is not configured.');
        }

        return $secret;
    }

    private function stripeBaseUrl(): string
    {
        return rtrim((string) (config('services.stripe.api_base') ?: self::STRIPE_API_BASE_DEFAULT), '/');
    }

    private function isStripeConfigured(): bool
    {
        return (bool) config('services.stripe.secret');
    }
}

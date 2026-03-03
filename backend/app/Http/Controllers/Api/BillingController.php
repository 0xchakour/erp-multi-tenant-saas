<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\BillingCheckoutSessionRequest;
use App\Http\Requests\Billing\BillingEventsRequest;
use App\Http\Requests\Billing\BillingPortalSessionRequest;
use App\Models\SubscriptionPlan;
use App\Services\BillingService;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function __construct(private BillingService $billingService)
    {
    }

    public function status(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'data' => $this->billingService->getCompanyBillingStatus($user),
        ]);
    }

    public function plans()
    {
        return response()->json([
            'data' => $this->billingService->listPlans(true),
        ]);
    }

    public function publicPlans()
    {
        return response()->json([
            'data' => $this->billingService->listPlans(true),
        ]);
    }

    public function events(BillingEventsRequest $request)
    {
        return response()->json([
            'data' => $this->billingService->listCompanyBillingEvents(
                (int) ($request->validated()['limit'] ?? 25)
            ),
        ]);
    }

    public function createCheckoutSession(BillingCheckoutSessionRequest $request)
    {
        $user = $request->user();
        $this->ensureAdmin($user->role ?? null);

        $plan = SubscriptionPlan::query()->findOrFail($request->validated()['plan_id']);

        $response = $this->billingService->checkoutSession(
            $user,
            $plan,
            $request->validated()['success_url'],
            $request->validated()['cancel_url']
        );

        return response()->json([
            'data' => $response,
        ]);
    }

    public function createPortalSession(BillingPortalSessionRequest $request)
    {
        $user = $request->user();
        $this->ensureAdmin($user->role ?? null);

        $response = $this->billingService->portalSession(
            $user,
            $request->validated()['return_url']
        );

        return response()->json([
            'data' => $response,
        ]);
    }

    public function stripeWebhook(Request $request)
    {
        try {
            $payload = $this->billingService->handleStripeWebhook(
                (string) $request->getContent(),
                $request->header('Stripe-Signature')
            );

            return response()->json($payload);
        } catch (\Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'code' => 'STRIPE_WEBHOOK_FAILED',
            ], 400);
        }
    }

    private function ensureAdmin(?string $role): void
    {
        abort_unless($role === 'admin', 403, 'Admin role required.');
    }
}

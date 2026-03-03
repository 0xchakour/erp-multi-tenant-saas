<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $selectedPlanId = $data['subscription_plan_id'] ?? null;

            $plan = null;

            if ($selectedPlanId) {
                $plan = SubscriptionPlan::query()
                    ->whereKey($selectedPlanId)
                    ->where('is_public', true)
                    ->first();
            }

            if (!$plan) {
                $plan = SubscriptionPlan::query()
                    ->where('slug', 'free')
                    ->orWhere('name', 'Free')
                    ->first();
            }

            if (!$plan) {
                throw new \RuntimeException('Free plan not found.');
            }

            $company = Company::create([
                'name' => $data['company_name'],
                'subscription_plan_id' => $plan->id,
                'trial_ends_at' => now()->addDays(14),
                'is_active' => true,
                'billing_provider' => 'internal',
                'billing_status' => 'trialing',
            ]);

            CompanySetting::create([
                'company_id' => $company->id,
                'currency' => 'USD',
                'tax_rate' => 0,
                'invoice_prefix' => 'INV',
            ]);

            $user = User::create([
                'company_id' => $company->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'admin',
            ])->load('company.plan');

            $token = $user->createToken('api-token')->plainTextToken;

            return [
                'user' => $user,
                'token' => $token,
            ];
        });
    }

    public function login(array $data): array
    {
        $email = $data['email'];
        $companyId = $data['company_id'] ?? null;
        $companyName = isset($data['company_name']) ? trim((string) $data['company_name']) : null;

        $usersForEmail = User::query()->where('email', $email)->get();

        if ($usersForEmail->count() > 1 && !$companyId && !$companyName) {
            throw new \InvalidArgumentException(
                'Multiple tenants found for this email. Please provide company_id or company_name.'
            );
        }

        $query = User::query()->where('email', $email);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($companyName) {
            $query->whereHas('company', function ($companyQuery) use ($companyName) {
                $companyQuery->where('name', $companyName);
            });
        }

        $user = $query->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw new \RuntimeException('Invalid credentials.');
        }

        $company = $user->company;

        if (!$company) {
            throw new \RuntimeException('Company context is missing.');
        }

        if (!$company->is_active && $user->role !== 'admin') {
            throw new \RuntimeException('Company subscription inactive. Please contact your admin.');
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'user' => $user->load('company.plan'),
            'token' => $token,
        ];
    }
}

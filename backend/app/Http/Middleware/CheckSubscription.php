<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
                'code' => 'UNAUTHORIZED',
            ], 401);
        }

        $company = $user->company;

        if (!$company) {
            return response()->json([
                'message' => 'Company context is missing.',
                'code' => 'COMPANY_CONTEXT_MISSING',
            ], 403);
        }

        $billingStatus = strtolower((string) ($company->billing_status ?? 'active'));
        $inactiveStatuses = ['canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'];

        if (!$company->is_active || in_array($billingStatus, $inactiveStatuses, true)) {
            return response()->json([
                'message' => 'Subscription inactive. Please upgrade your plan.',
                'code' => 'SUBSCRIPTION_INACTIVE',
            ], 403);
        }

        if (
            $billingStatus === 'trialing'
            && $company->trial_ends_at
            && now()->greaterThan($company->trial_ends_at)
        ) {
            return response()->json([
                'message' => 'Trial expired. Please upgrade your plan.',
                'code' => 'TRIAL_EXPIRED',
            ], 403);
        }

        if (
            $company->subscription_ends_at
            && now()->greaterThan($company->subscription_ends_at)
            && $billingStatus !== 'active'
        ) {
            return response()->json([
                'message' => 'Subscription period ended. Please upgrade your plan.',
                'code' => 'SUBSCRIPTION_ENDED',
            ], 403);
        }

        return $next($request);
    }
}

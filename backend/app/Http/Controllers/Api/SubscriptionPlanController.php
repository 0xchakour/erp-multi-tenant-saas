<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StoreSubscriptionPlanRequest;
use App\Http\Requests\Billing\UpdateSubscriptionPlanRequest;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    public function index()
    {
        $plans = SubscriptionPlan::query()
            ->orderBy('price')
            ->get();

        return response()->json([
            'data' => $plans,
        ]);
    }

    public function show(SubscriptionPlan $subscription_plan)
    {
        return response()->json([
            'data' => $subscription_plan,
        ]);
    }

    public function store(StoreSubscriptionPlanRequest $request)
    {
        $this->ensureAdmin($request);

        $plan = SubscriptionPlan::query()->create($request->validated());

        return response()->json([
            'data' => $plan,
        ], 201);
    }

    public function update(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $subscription_plan)
    {
        $this->ensureAdmin($request);

        $subscription_plan->update($request->validated());

        return response()->json([
            'data' => $subscription_plan->fresh(),
        ]);
    }

    public function destroy(Request $request, SubscriptionPlan $subscription_plan)
    {
        $this->ensureAdmin($request);

        $inUse = $subscription_plan->companies()->exists();

        if ($inUse) {
            return response()->json([
                'message' => 'Cannot delete a plan currently assigned to companies.',
                'code' => 'PLAN_IN_USE',
            ], 422);
        }

        $subscription_plan->delete();

        return response()->json([], 204);
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Admin role required.');
    }
}

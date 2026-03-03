<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Seed baseline plans required by registration and subscription checks.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Starter plan for small teams.',
                'price' => 0,
                'billing_interval' => 'month',
                'stripe_price_id' => null,
                'is_public' => true,
                'max_users' => 3,
                'max_clients' => 50,
                'max_products' => 50,
                'max_invoices_per_month' => 30,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Growth plan for scaling operations.',
                'price' => 49,
                'billing_interval' => 'month',
                'stripe_price_id' => null,
                'is_public' => true,
                'max_users' => 20,
                'max_clients' => 500,
                'max_products' => 500,
                'max_invoices_per_month' => 1000,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Unlimited usage with premium support.',
                'price' => 199,
                'billing_interval' => 'month',
                'stripe_price_id' => null,
                'is_public' => true,
                'max_users' => null,
                'max_clients' => null,
                'max_products' => null,
                'max_invoices_per_month' => null,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}

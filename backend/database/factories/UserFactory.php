<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $plan = SubscriptionPlan::query()->firstOrCreate(
            ['name' => 'Factory Plan'],
            [
                'slug' => 'factory-plan',
                'description' => 'Factory bootstrap plan',
                'price' => 0,
                'billing_interval' => 'month',
                'is_public' => true,
                'max_users' => 10,
                'max_clients' => 100,
                'max_products' => 100,
                'max_invoices_per_month' => 100,
            ]
        );

        $company = Company::query()->firstOrCreate(
            [
                'name' => 'Factory Company',
                'subscription_plan_id' => $plan->id,
            ],
            [
                'trial_ends_at' => now()->addDays(14),
                'is_active' => true,
                'billing_provider' => 'internal',
                'billing_status' => 'trialing',
            ]
        );

        return [
            'company_id' => $company->id,
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'employee',
        ];
    }
}

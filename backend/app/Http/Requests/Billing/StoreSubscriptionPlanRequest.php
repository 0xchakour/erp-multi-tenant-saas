<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:120', 'alpha_dash', 'unique:subscription_plans,slug'],
            'description' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_interval' => ['required', Rule::in(['month', 'year'])],
            'stripe_price_id' => ['nullable', 'string', 'max:150', 'unique:subscription_plans,stripe_price_id'],
            'is_public' => ['nullable', 'boolean'],
            'max_users' => ['nullable', 'integer', 'min:1'],
            'max_clients' => ['nullable', 'integer', 'min:1'],
            'max_products' => ['nullable', 'integer', 'min:1'],
            'max_invoices_per_month' => ['nullable', 'integer', 'min:1'],
        ];
    }
}

<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $planId = $this->route('subscription_plan')?->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:120',
                'alpha_dash',
                Rule::unique('subscription_plans', 'slug')->ignore($planId),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'billing_interval' => ['sometimes', 'required', Rule::in(['month', 'year'])],
            'stripe_price_id' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
                Rule::unique('subscription_plans', 'stripe_price_id')->ignore($planId),
            ],
            'is_public' => ['sometimes', 'boolean'],
            'max_users' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'max_clients' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'max_products' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'max_invoices_per_month' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ];
    }
}

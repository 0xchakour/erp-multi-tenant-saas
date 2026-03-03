<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_interval',
        'stripe_price_id',
        'is_public',
        'max_users',
        'max_clients',
        'max_products',
        'max_invoices_per_month',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'is_public' => 'boolean',
        ];
    }

    public function companies()
    {
        return $this->hasMany(Company::class, 'subscription_plan_id');
    }
}

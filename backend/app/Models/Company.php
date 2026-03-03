<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'name',
        'subscription_plan_id',
        'trial_ends_at',
        'is_active',
        'billing_provider',
        'billing_status',
        'stripe_customer_id',
        'stripe_subscription_id',
        'subscription_starts_at',
        'subscription_ends_at',
        'billing_cycle_anchor',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'is_active' => 'boolean',
            'subscription_starts_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
            'billing_cycle_anchor' => 'datetime',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function settings()
    {
        return $this->hasOne(CompanySetting::class);
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function billingEvents()
    {
        return $this->hasMany(CompanyBillingEvent::class);
    }
}

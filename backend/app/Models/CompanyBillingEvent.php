<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class CompanyBillingEvent extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'provider',
        'event_type',
        'status',
        'amount',
        'currency',
        'external_reference',
        'payload',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'payload' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}

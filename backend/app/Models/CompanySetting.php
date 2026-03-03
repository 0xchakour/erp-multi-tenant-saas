<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_id',
        'logo',
        'currency',
        'tax_rate',
        'invoice_prefix',
        'invoice_footer',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
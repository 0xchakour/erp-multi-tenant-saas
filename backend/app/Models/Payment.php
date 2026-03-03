<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use BelongsToCompany, LogsActivity;

    protected $fillable = [
        'invoice_id',
        'user_id',
        'amount',
        'paid_at',
        'method',
        'reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'paid_at' => 'date',
        ];
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

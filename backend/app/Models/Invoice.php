<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;
use App\Traits\LogsActivity;

class Invoice extends Model
{
    use BelongsToCompany,LogsActivity;

    protected $fillable = [
        'client_id',
        'invoice_number',
        'subtotal',
        'tax_amount',
        'total',
        'status',
        'due_date',
        'sent_at',
        'paid_at',
        'cancelled_at',
        'cancelled_reason',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'float',
            'tax_amount' => 'float',
            'total' => 'float',
            'due_date' => 'date',
            'sent_at' => 'datetime',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}

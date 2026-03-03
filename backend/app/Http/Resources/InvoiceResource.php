<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $paidAmount = $this->resolvePaidAmount();
        $balanceDue = max((float) $this->total - $paidAmount, 0.0);

        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'status' => $this->status,
            'due_date' => optional($this->due_date)->toDateString(),
            'sent_at' => optional($this->sent_at)->toDateTimeString(),
            'paid_at' => optional($this->paid_at)->toDateTimeString(),
            'cancelled_at' => optional($this->cancelled_at)->toDateTimeString(),
            'cancelled_reason' => $this->cancelled_reason,

            'financials' => [
                'subtotal' => $this->subtotal,
                'tax_amount' => $this->tax_amount,
                'total' => $this->total,
                'paid_amount' => $paidAmount,
                'balance_due' => $balanceDue,
            ],

            'client' => [
                'id' => $this->client?->id,
                'name' => $this->client?->name,
            ],

            'items' => $this->items->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                ];
            }),

            'payments' => $this->when(
                $this->relationLoaded('payments'),
                function () {
                    return $this->payments->map(function ($payment) {
                        return [
                            'id' => $payment->id,
                            'amount' => $payment->amount,
                            'paid_at' => optional($payment->paid_at)->toDateString(),
                            'method' => $payment->method,
                            'reference' => $payment->reference,
                            'notes' => $payment->notes,
                            'created_at' => $payment->created_at,
                            'created_by' => [
                                'id' => $payment->user?->id,
                                'name' => $payment->user?->name,
                            ],
                        ];
                    });
                }
            ),

            'created_at' => $this->created_at,
        ];
    }

    private function resolvePaidAmount(): float
    {
        if (isset($this->payments_sum_amount)) {
            return (float) $this->payments_sum_amount;
        }

        if ($this->relationLoaded('payments')) {
            return (float) $this->payments->sum('amount');
        }

        return 0.0;
    }
}

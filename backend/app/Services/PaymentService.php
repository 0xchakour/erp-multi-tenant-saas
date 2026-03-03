<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public function __construct(private InvoiceService $invoiceService)
    {
    }

    public function listForInvoice(Invoice $invoice)
    {
        return $invoice->payments()
            ->latest('paid_at')
            ->latest('id')
            ->get();
    }

    public function createForInvoice(Invoice $invoice, array $data): Payment
    {
        return DB::transaction(function () use ($invoice, $data) {
            $invoice->loadMissing('payments');

            if ($invoice->status === 'cancelled') {
                throw new \Exception("Cancelled invoices cannot receive payments.");
            }

            $paidAmount = (float) $invoice->payments->sum('amount');
            $balanceDue = max((float) $invoice->total - $paidAmount, 0.0);
            $amount = (float) $data['amount'];

            if ($amount > $balanceDue + 0.0001) {
                throw new \Exception("Payment exceeds remaining balance.");
            }

            $payment = $invoice->payments()->create([
                'user_id' => Auth::id(),
                'amount' => $amount,
                'paid_at' => $data['paid_at'],
                'method' => $data['method'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->invoiceService->synchronizeStatus($invoice->fresh());

            return $payment->fresh();
        });
    }

    public function deleteForInvoice(Invoice $invoice, Payment $payment): void
    {
        DB::transaction(function () use ($invoice, $payment) {
            if ($payment->invoice_id !== $invoice->id) {
                throw new \InvalidArgumentException("Payment does not belong to this invoice.");
            }

            $payment->delete();

            $this->invoiceService->synchronizeStatus($invoice->fresh());
        });
    }
}

<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function create(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            $user = Auth::user();
            $company = $user->company;
            $plan = $company->plan;
            $settings = $company->settings;

            // Enforce monthly invoice limit.
            if ($plan->max_invoices_per_month !== null) {
                $monthlyCount = Invoice::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count();

                if ($monthlyCount >= $plan->max_invoices_per_month) {
                    throw new \Exception("Monthly invoice limit reached.");
                }
            }

            $totals = $this->buildItemsAndTotals($data['items'], (float) $settings->tax_rate);

            // Generate invoice number scoped to tenant.
            $count = Invoice::count() + 1;
            $invoiceNumber = $settings->invoice_prefix
                . '-' . now()->year
                . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);

            $invoice = Invoice::create([
                'client_id' => $data['client_id'],
                'invoice_number' => $invoiceNumber,
                'subtotal' => $totals['subtotal'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
                'status' => 'draft',
                'due_date' => $data['due_date'],
                'sent_at' => null,
                'paid_at' => null,
                'cancelled_at' => null,
                'cancelled_reason' => null,
            ]);

            $invoice->items()->createMany($totals['items']);

            return $invoice->load(['client', 'items', 'payments']);
        });
    }

    public function update(Invoice $invoice, array $data): Invoice
    {
        $this->ensureInvoiceMutable($invoice);

        return DB::transaction(function () use ($invoice, $data) {
            $settings = Auth::user()->company->settings;
            $totals = $this->buildItemsAndTotals($data['items'], (float) $settings->tax_rate);

            $invoice->update([
                'client_id' => $data['client_id'],
                'due_date' => $data['due_date'],
                'subtotal' => $totals['subtotal'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
            ]);

            $invoice->items()->delete();
            $invoice->items()->createMany($totals['items']);

            return $this->synchronizeStatus($invoice->fresh()->load('payments'));
        });
    }

    public function delete(Invoice $invoice): void
    {
        $invoice->loadMissing('payments');

        if ($invoice->status === 'paid') {
            throw new \Exception("Paid invoices cannot be deleted.");
        }

        if ($invoice->payments->count() > 0) {
            throw new \Exception("Invoices with recorded payments cannot be deleted.");
        }

        $invoice->delete();
    }

    public function transitionStatus(Invoice $invoice, string $nextStatus, ?string $reason = null): Invoice
    {
        $invoice->loadMissing('payments');
        $currentStatus = (string) $invoice->status;
        $normalizedNext = trim(strtolower($nextStatus));

        if (in_array($normalizedNext, ['paid', 'partially_paid', 'overdue'], true)) {
            throw new \InvalidArgumentException(
                "Status '{$normalizedNext}' is system-controlled. Use payments and due-date rules instead."
            );
        }

        $allowedTransitions = [
            'draft' => ['sent', 'cancelled'],
            'sent' => ['draft', 'cancelled'],
            'overdue' => ['sent', 'cancelled'],
            'partially_paid' => ['sent'],
            'paid' => [],
            'cancelled' => [],
        ];

        $allowed = $allowedTransitions[$currentStatus] ?? [];

        if (!in_array($normalizedNext, $allowed, true)) {
            throw new \InvalidArgumentException(
                "Invalid status transition from {$currentStatus} to {$normalizedNext}."
            );
        }

        if ($normalizedNext === 'cancelled' && $invoice->payments->sum('amount') > 0) {
            throw new \InvalidArgumentException(
                "Invoices with payments cannot be cancelled."
            );
        }

        $payload = [
            'status' => $normalizedNext,
        ];

        if ($normalizedNext === 'sent') {
            $payload['sent_at'] = $invoice->sent_at ?? now();
            $payload['cancelled_at'] = null;
            $payload['cancelled_reason'] = null;
        }

        if ($normalizedNext === 'cancelled') {
            $payload['cancelled_at'] = now();
            $payload['cancelled_reason'] = $reason;
            $payload['paid_at'] = null;
        }

        if ($normalizedNext === 'draft') {
            $payload['sent_at'] = null;
            $payload['cancelled_at'] = null;
            $payload['cancelled_reason'] = null;
            $payload['paid_at'] = null;
        }

        $invoice->update($payload);

        return $invoice->fresh()->load(['client', 'items', 'payments']);
    }

    public function synchronizeStatus(Invoice $invoice): Invoice
    {
        $invoice->loadMissing('payments');

        if ($invoice->status === 'cancelled') {
            return $invoice->fresh()->load(['client', 'items', 'payments']);
        }

        $paidAmount = (float) $invoice->payments->sum('amount');
        $total = (float) $invoice->total;
        $balance = max($total - $paidAmount, 0.0);

        $nextStatus = (string) $invoice->status;
        $payload = [];

        if ($balance <= 0.0001) {
            $nextStatus = 'paid';
            $payload['paid_at'] = $invoice->paid_at ?? now();
        } elseif ($paidAmount > 0) {
            if (now()->startOfDay()->greaterThan($invoice->due_date)) {
                $nextStatus = 'overdue';
            } else {
                $nextStatus = 'partially_paid';
            }

            $payload['paid_at'] = null;
            $payload['sent_at'] = $invoice->sent_at ?? now();
        } else {
            if ($invoice->status === 'draft') {
                $nextStatus = 'draft';
                $payload['sent_at'] = null;
            } else {
                if (now()->startOfDay()->greaterThan($invoice->due_date)) {
                    $nextStatus = 'overdue';
                    $payload['sent_at'] = $invoice->sent_at ?? now();
                } else {
                    $nextStatus = 'sent';
                    $payload['sent_at'] = $invoice->sent_at ?? now();
                }
            }

            $payload['paid_at'] = null;
        }

        $payload['status'] = $nextStatus;

        $invoice->update($payload);

        return $invoice->fresh()->load(['client', 'items', 'payments']);
    }

    public function synchronizeOverdueStatuses(): void
    {
        $candidateInvoices = Invoice::query()
            ->whereIn('status', ['sent', 'overdue', 'partially_paid'])
            ->with('payments')
            ->get();

        foreach ($candidateInvoices as $invoice) {
            $this->synchronizeStatus($invoice);
        }
    }

    private function buildItemsAndTotals(array $itemsInput, float $taxRate): array
    {
        $subtotal = 0.0;
        $items = [];

        foreach ($itemsInput as $itemInput) {
            $product = Product::findOrFail($itemInput['product_id']);
            $quantity = (int) $itemInput['quantity'];
            $lineTotal = (float) $product->price * $quantity;

            $subtotal += $lineTotal;
            $items[] = [
                'product_id' => $product->id,
                'quantity' => $quantity,
                // Keep snapshot price for historical integrity.
                'price' => $product->price,
            ];
        }

        $taxAmount = $subtotal * ($taxRate / 100);
        $total = $subtotal + $taxAmount;

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'items' => $items,
        ];
    }

    private function ensureInvoiceMutable(Invoice $invoice): void
    {
        if ($invoice->status !== 'draft') {
            throw new \Exception("Only draft invoices can be modified.");
        }
    }
}

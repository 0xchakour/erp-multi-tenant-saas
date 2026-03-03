<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function __construct(private InvoiceService $invoiceService)
    {
    }

    public function getStats(): array
    {
        // Keep lifecycle statuses coherent with due dates and payment progress.
        $this->invoiceService->synchronizeOverdueStatuses();

        $totalRevenue = (float) Payment::sum('amount');

        $monthlyRevenue = (float) Payment::whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        $statusCounts = Invoice::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $openInvoices = Invoice::query()
            ->whereIn('status', ['sent', 'overdue', 'partially_paid'])
            ->withSum('payments', 'amount')
            ->get();

        $outstandingAmount = (float) $openInvoices->sum(function ($invoice) {
            $paid = (float) ($invoice->payments_sum_amount ?? 0);

            return max((float) $invoice->total - $paid, 0.0);
        });

        $revenueByMonth = $this->monthlyRevenueFromPayments(now()->subMonths(12)->toDateString());

        return [
            'total_revenue' => $totalRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'paid_invoices' => (int) ($statusCounts['paid'] ?? 0),
            'overdue_invoices' => (int) ($statusCounts['overdue'] ?? 0),
            'sent_invoices' => (int) ($statusCounts['sent'] ?? 0),
            'partially_paid_invoices' => (int) ($statusCounts['partially_paid'] ?? 0),
            'cancelled_invoices' => (int) ($statusCounts['cancelled'] ?? 0),
            'outstanding_amount' => $outstandingAmount,
            'revenue_by_month' => $revenueByMonth,
        ];
    }

    private function monthlyRevenueFromPayments(string $fromDate)
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return Payment::select(
                DB::raw("CAST(strftime('%Y', paid_at) AS INTEGER) as year"),
                DB::raw("CAST(strftime('%m', paid_at) AS INTEGER) as month"),
                DB::raw('SUM(amount) as total')
            )
                ->where('paid_at', '>=', $fromDate)
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get();
        }

        return Payment::select(
            DB::raw('YEAR(paid_at) as year'),
            DB::raw('MONTH(paid_at) as month'),
            DB::raw('SUM(amount) as total')
        )
            ->where('paid_at', '>=', $fromDate)
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();
    }
}

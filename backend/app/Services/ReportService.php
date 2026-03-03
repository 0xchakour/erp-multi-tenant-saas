<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function revenue(array $filters): array
    {
        $from = isset($filters['from'])
            ? Carbon::parse($filters['from'])->startOfDay()
            : now()->subMonths(11)->startOfMonth();
        $to = isset($filters['to'])
            ? Carbon::parse($filters['to'])->endOfDay()
            : now()->endOfDay();

        $paymentsBase = Payment::query()
            ->whereBetween('paid_at', [$from->toDateString(), $to->toDateString()]);

        $totalRevenue = (float) (clone $paymentsBase)->sum('amount');
        $paymentsCount = (int) (clone $paymentsBase)->count();

        $driver = DB::getDriverName();
        $monthlyQuery = (clone $paymentsBase);

        if ($driver === 'sqlite') {
            $revenueByMonth = $monthlyQuery
                ->selectRaw("CAST(strftime('%Y', paid_at) AS INTEGER) as year")
                ->selectRaw("CAST(strftime('%m', paid_at) AS INTEGER) as month")
                ->selectRaw('SUM(amount) as total')
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get();
        } else {
            $revenueByMonth = $monthlyQuery
                ->selectRaw('YEAR(paid_at) as year')
                ->selectRaw('MONTH(paid_at) as month')
                ->selectRaw('SUM(amount) as total')
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get();
        }

        $revenueByMethod = (clone $paymentsBase)
            ->select('method')
            ->selectRaw('SUM(amount) as total')
            ->selectRaw('COUNT(*) as payments')
            ->groupBy('method')
            ->orderByDesc('total')
            ->get();

        $openInvoices = Invoice::query()
            ->whereIn('status', ['sent', 'overdue', 'partially_paid'])
            ->withSum('payments', 'amount')
            ->get();

        $outstandingAmount = (float) $openInvoices->sum(function ($invoice) {
            $paid = (float) ($invoice->payments_sum_amount ?? 0);

            return max((float) $invoice->total - $paid, 0.0);
        });

        return [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'summary' => [
                'total_revenue' => $totalRevenue,
                'payments_count' => $paymentsCount,
                'average_payment' => $paymentsCount > 0 ? $totalRevenue / $paymentsCount : 0,
                'outstanding_amount' => $outstandingAmount,
            ],
            'revenue_by_month' => $revenueByMonth,
            'revenue_by_method' => $revenueByMethod,
        ];
    }

    public function aging(array $filters): array
    {
        $asOf = isset($filters['as_of'])
            ? Carbon::parse($filters['as_of'])->startOfDay()
            : now()->startOfDay();

        $rows = Invoice::query()
            ->whereIn('status', ['sent', 'overdue', 'partially_paid'])
            ->with(['client'])
            ->withSum('payments', 'amount')
            ->get()
            ->map(function ($invoice) use ($asOf) {
                $paid = (float) ($invoice->payments_sum_amount ?? 0);
                $balance = max((float) $invoice->total - $paid, 0.0);
                $daysOverdue = Carbon::parse($invoice->due_date)->diffInDays($asOf, false);

                return [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'client_name' => $invoice->client?->name,
                    'status' => $invoice->status,
                    'due_date' => optional($invoice->due_date)->toDateString(),
                    'days_overdue' => max($daysOverdue, 0),
                    'balance_due' => $balance,
                ];
            })
            ->filter(fn ($row) => $row['balance_due'] > 0)
            ->values();

        $buckets = [
            'current' => 0.0,
            'days_1_30' => 0.0,
            'days_31_60' => 0.0,
            'days_61_90' => 0.0,
            'days_91_plus' => 0.0,
        ];

        foreach ($rows as $row) {
            $days = (int) $row['days_overdue'];
            $amount = (float) $row['balance_due'];

            if ($days <= 0) {
                $buckets['current'] += $amount;
            } elseif ($days <= 30) {
                $buckets['days_1_30'] += $amount;
            } elseif ($days <= 60) {
                $buckets['days_31_60'] += $amount;
            } elseif ($days <= 90) {
                $buckets['days_61_90'] += $amount;
            } else {
                $buckets['days_91_plus'] += $amount;
            }
        }

        return [
            'filters' => [
                'as_of' => $asOf->toDateString(),
            ],
            'summary' => [
                'open_invoices' => $rows->count(),
                'total_outstanding' => array_sum($buckets),
                'buckets' => $buckets,
            ],
            'rows' => $rows,
        ];
    }

    public function topClients(array $filters): array
    {
        $from = isset($filters['from'])
            ? Carbon::parse($filters['from'])->startOfDay()
            : now()->subMonths(11)->startOfMonth();
        $to = isset($filters['to'])
            ? Carbon::parse($filters['to'])->endOfDay()
            : now()->endOfDay();
        $limit = isset($filters['limit']) ? (int) $filters['limit'] : 10;

        $rows = Payment::query()
            ->join('invoices', 'payments.invoice_id', '=', 'invoices.id')
            ->join('clients', 'invoices.client_id', '=', 'clients.id')
            ->whereBetween('payments.paid_at', [$from->toDateString(), $to->toDateString()])
            ->groupBy('invoices.client_id', 'clients.name')
            ->selectRaw('invoices.client_id as client_id')
            ->selectRaw('clients.name as client_name')
            ->selectRaw('SUM(payments.amount) as total_paid')
            ->selectRaw('COUNT(payments.id) as payments_count')
            ->orderByDesc('total_paid')
            ->limit($limit)
            ->get();

        return [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'limit' => $limit,
            ],
            'rows' => $rows,
            'summary' => [
                'clients_count' => $rows->count(),
                'total_paid' => (float) $rows->sum('total_paid'),
            ],
        ];
    }
}

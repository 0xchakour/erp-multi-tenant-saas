<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'metrics' => [
                'total_revenue' => $this['total_revenue'],
                'monthly_revenue' => $this['monthly_revenue'],
                'paid_invoices' => $this['paid_invoices'],
                'overdue_invoices' => $this['overdue_invoices'],
                'sent_invoices' => $this['sent_invoices'],
                'partially_paid_invoices' => $this['partially_paid_invoices'],
                'cancelled_invoices' => $this['cancelled_invoices'],
                'outstanding_amount' => $this['outstanding_amount'],
            ],
            'revenue_chart' => $this['revenue_by_month'],
        ];
    }
}

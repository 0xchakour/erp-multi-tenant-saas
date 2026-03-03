<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\AgingReportRequest;
use App\Http\Requests\Report\RevenueReportRequest;
use App\Http\Requests\Report\TopClientsReportRequest;
use App\Models\Invoice;
use App\Services\ReportService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ReportController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ReportService $reportService)
    {
    }

    public function revenue(RevenueReportRequest $request)
    {
        $this->authorize('viewAny', Invoice::class);

        return response()->json([
            'data' => $this->reportService->revenue($request->validated()),
        ]);
    }

    public function aging(AgingReportRequest $request)
    {
        $this->authorize('viewAny', Invoice::class);

        return response()->json([
            'data' => $this->reportService->aging($request->validated()),
        ]);
    }

    public function topClients(TopClientsReportRequest $request)
    {
        $this->authorize('viewAny', Invoice::class);

        return response()->json([
            'data' => $this->reportService->topClients($request->validated()),
        ]);
    }
}

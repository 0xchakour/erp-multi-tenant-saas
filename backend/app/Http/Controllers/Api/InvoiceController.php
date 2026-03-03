<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\StoreInvoiceRequest;
use App\Http\Requests\Invoice\UpdateInvoiceRequest;
use App\Http\Requests\Invoice\UpdateInvoiceStatusRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class InvoiceController extends Controller
{
    use AuthorizesRequests;

    protected $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    public function index()
    {
        $this->authorize('viewAny', Invoice::class);

        $invoices = Invoice::with(['client', 'items'])
            ->withSum('payments', 'amount')
            ->latest()
            ->get();

        return InvoiceResource::collection($invoices);
    }

    public function show(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $invoice->load(['client', 'items', 'payments.user']);

        return new InvoiceResource($invoice);
    }

    public function store(StoreInvoiceRequest $request)
    {
        $this->authorize('create', Invoice::class);

        try {
            $invoice = $this->invoiceService->create($request->validated());

            return response()->json(
                new InvoiceResource($invoice),
                201
            );
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'INVOICE_CREATE_FAILED',
            ], 403);
        }
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        try {
            $updatedInvoice = $this->invoiceService->update($invoice, $request->validated());

            return response()->json(new InvoiceResource($updatedInvoice));
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'INVOICE_UPDATE_FAILED',
            ], 403);
        }
    }

    public function destroy(Invoice $invoice)
    {
        $this->authorize('delete', $invoice);

        try {
            $this->invoiceService->delete($invoice);

            return response()->json([], 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'INVOICE_DELETE_FAILED',
            ], 403);
        }
    }

    public function updateStatus(UpdateInvoiceStatusRequest $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        try {
            $updatedInvoice = $this->invoiceService->transitionStatus(
                $invoice,
                $request->validated()['status'],
                $request->validated()['reason'] ?? null
            );

            return response()->json(new InvoiceResource($updatedInvoice));
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'INVOICE_STATUS_TRANSITION_INVALID',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'INVOICE_STATUS_UPDATE_FAILED',
            ], 403);
        }
    }

    public function pdf(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $invoice->load(['client', 'items', 'payments']);

        $rows = '';
        foreach ($invoice->items as $item) {
            $rows .= '<tr>'
                . '<td style="border:1px solid #ddd;padding:8px;">' . e($item->product_id) . '</td>'
                . '<td style="border:1px solid #ddd;padding:8px;">' . e($item->quantity) . '</td>'
                . '<td style="border:1px solid #ddd;padding:8px;">' . e($item->price) . '</td>'
                . '</tr>';
        }

        $html = '
            <h1>Invoice ' . e($invoice->invoice_number) . '</h1>
            <p><strong>Client:</strong> ' . e(optional($invoice->client)->name) . '</p>
            <p><strong>Status:</strong> ' . e($invoice->status) . '</p>
            <p><strong>Due date:</strong> ' . e($invoice->due_date) . '</p>
            <h3>Items</h3>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="border:1px solid #ddd;padding:8px;text-align:left;">Product ID</th>
                        <th style="border:1px solid #ddd;padding:8px;text-align:left;">Quantity</th>
                        <th style="border:1px solid #ddd;padding:8px;text-align:left;">Price</th>
                    </tr>
                </thead>
                <tbody>' . $rows . '</tbody>
            </table>
            <h3>Totals</h3>
            <p><strong>Subtotal:</strong> ' . e($invoice->subtotal) . '</p>
            <p><strong>Tax:</strong> ' . e($invoice->tax_amount) . '</p>
            <p><strong>Total:</strong> ' . e($invoice->total) . '</p>
        ';

        $pdf = Pdf::loadHTML($html);

        return $pdf->download('invoice-' . $invoice->invoice_number . '.pdf');
    }
}

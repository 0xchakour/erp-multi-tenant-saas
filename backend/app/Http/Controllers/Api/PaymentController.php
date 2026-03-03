<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PaymentResource;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PaymentController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private PaymentService $paymentService)
    {
    }

    public function index(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $payments = $this->paymentService->listForInvoice($invoice);

        return PaymentResource::collection($payments);
    }

    public function store(StorePaymentRequest $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        try {
            $payment = $this->paymentService->createForInvoice($invoice, $request->validated());
            $updatedInvoice = $invoice->fresh()->load(['client', 'items', 'payments.user']);

            return response()->json([
                'payment' => new PaymentResource($payment->load('user')),
                'invoice' => new InvoiceResource($updatedInvoice),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PAYMENT_CREATE_FAILED',
            ], 403);
        }
    }

    public function destroy(Invoice $invoice, Payment $payment)
    {
        $this->authorize('update', $invoice);

        try {
            $this->paymentService->deleteForInvoice($invoice, $payment);
            $updatedInvoice = $invoice->fresh()->load(['client', 'items', 'payments.user']);

            return response()->json([
                'invoice' => new InvoiceResource($updatedInvoice),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PAYMENT_INVOICE_MISMATCH',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PAYMENT_DELETE_FAILED',
            ], 403);
        }
    }
}

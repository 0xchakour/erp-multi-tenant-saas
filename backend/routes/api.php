<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::get('/plans/public', [BillingController::class, 'publicPlans'])->middleware('throttle:tenant-api');

Route::post('/webhooks/stripe', [BillingController::class, 'stripeWebhook'])
    ->middleware('throttle:tenant-api');

Route::middleware(['auth:sanctum', 'throttle:tenant-api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/billing/status', [BillingController::class, 'status']);
    Route::get('/billing/plans', [BillingController::class, 'plans']);
    Route::get('/billing/events', [BillingController::class, 'events']);
    Route::post('/billing/checkout-session', [BillingController::class, 'createCheckoutSession']);
    Route::post('/billing/portal-session', [BillingController::class, 'createPortalSession']);

    Route::apiResource('subscription-plans', SubscriptionPlanController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);
});

Route::middleware(['auth:sanctum', 'subscription', 'throttle:tenant-api'])->group(function () {
    Route::apiResource('clients', ClientController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::apiResource('products', ProductController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::apiResource('invoices', InvoiceController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::patch('/invoices/{invoice}/status', [InvoiceController::class, 'updateStatus']);
    Route::get('/invoices/{invoice}/payments', [PaymentController::class, 'index']);
    Route::post('/invoices/{invoice}/payments', [PaymentController::class, 'store']);
    Route::delete('/invoices/{invoice}/payments/{payment}', [PaymentController::class, 'destroy']);
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/reports/revenue', [ReportController::class, 'revenue']);
    Route::get('/reports/aging', [ReportController::class, 'aging']);
    Route::get('/reports/top-clients', [ReportController::class, 'topClients']);
});

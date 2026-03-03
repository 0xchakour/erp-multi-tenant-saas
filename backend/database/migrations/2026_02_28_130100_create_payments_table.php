<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('invoice_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->decimal('amount', 12, 2);
            $table->date('paid_at');
            $table->string('method', 50);
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['company_id', 'invoice_id'], 'payments_company_invoice_idx');
            $table->index(['company_id', 'paid_at'], 'payments_company_paid_at_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

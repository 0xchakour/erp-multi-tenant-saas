<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('client_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->string('invoice_number');

            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax_amount', 12, 2);
            $table->decimal('total', 12, 2);

            $table->enum('status', ['draft', 'paid', 'overdue'])
                  ->default('draft');

            $table->date('due_date');

            $table->timestamps();

            // Unique per company
            $table->unique(['company_id', 'invoice_number']);

            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
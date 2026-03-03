<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->string('logo')->nullable();

            $table->string('currency')->default('USD');

            // Tax percentage (e.g. 20.00 = 20%)
            $table->decimal('tax_rate', 5, 2)->default(0);

            $table->string('invoice_prefix')->default('INV');

            $table->text('invoice_footer')->nullable();

            $table->timestamps();

            $table->unique('company_id'); // One settings row per company
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_billing_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('internal');
            $table->string('event_type');
            $table->string('status')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            $table->string('external_reference')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'occurred_at']);
            $table->index(['provider', 'event_type']);
            $table->index('external_reference');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_billing_events');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->decimal('price', 10, 2)->default(0);

            // Limits
            $table->integer('max_users')->nullable();
            $table->integer('max_clients')->nullable();
            $table->integer('max_products')->nullable();
            $table->integer('max_invoices_per_month')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
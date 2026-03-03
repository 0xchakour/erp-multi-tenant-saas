<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->string('action'); // created, updated, deleted

            $table->string('model_type'); // Client, Invoice, Product...
            $table->unsignedBigInteger('model_id');

            $table->timestamps();

            $table->index('company_id');
            $table->index('model_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
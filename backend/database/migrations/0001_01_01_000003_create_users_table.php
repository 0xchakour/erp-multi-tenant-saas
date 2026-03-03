<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->string('name');
            $table->string('email');
            $table->string('password');

            $table->enum('role', ['admin', 'employee'])
                  ->default('employee');

            $table->timestamps();

            // Email must be unique per company (NOT globally)
            $table->unique(['company_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
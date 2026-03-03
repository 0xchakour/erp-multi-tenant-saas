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
        Schema::table('clients', function (Blueprint $table) {
            $table->index(['company_id', 'created_at'], 'clients_company_created_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['company_id', 'created_at'], 'products_company_created_idx');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['company_id', 'status', 'created_at'], 'invoices_company_status_created_idx');
            $table->index(['company_id', 'status', 'due_date'], 'invoices_company_status_due_idx');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['company_id', 'model_type', 'model_id'], 'activity_logs_company_model_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_company_model_idx');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_company_status_created_idx');
            $table->dropIndex('invoices_company_status_due_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_company_created_idx');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex('clients_company_created_idx');
        });
    }
};

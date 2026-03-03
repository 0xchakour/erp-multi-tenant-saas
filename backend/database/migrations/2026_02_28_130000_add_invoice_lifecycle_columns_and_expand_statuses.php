<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->timestamp('sent_at')->nullable()->after('due_date');
            $table->timestamp('paid_at')->nullable()->after('sent_at');
            $table->timestamp('cancelled_at')->nullable()->after('paid_at');
            $table->text('cancelled_reason')->nullable()->after('cancelled_at');

            $table->index(['company_id', 'status', 'due_date'], 'invoices_company_status_due_lifecycle_idx');
        });

        $driver = DB::getDriverName();

        // MySQL stores enum natively; expand allowed values for new lifecycle states.
        if ($driver === 'mysql') {
            DB::statement(
                "ALTER TABLE invoices MODIFY status ENUM('draft','sent','partially_paid','overdue','paid','cancelled') NOT NULL DEFAULT 'draft'"
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement(
                "ALTER TABLE invoices MODIFY status ENUM('draft','paid','overdue') NOT NULL DEFAULT 'draft'"
            );
        }

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_company_status_due_lifecycle_idx');
            $table->dropColumn(['sent_at', 'paid_at', 'cancelled_at', 'cancelled_reason']);
        });
    }
};

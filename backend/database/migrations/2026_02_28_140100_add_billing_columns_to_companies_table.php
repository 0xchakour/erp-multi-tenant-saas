<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('billing_provider')->default('internal')->after('is_active');
            $table->string('billing_status')->default('trialing')->after('billing_provider');
            $table->string('stripe_customer_id')->nullable()->after('billing_status');
            $table->string('stripe_subscription_id')->nullable()->after('stripe_customer_id');
            $table->timestamp('subscription_starts_at')->nullable()->after('stripe_subscription_id');
            $table->timestamp('subscription_ends_at')->nullable()->after('subscription_starts_at');
            $table->timestamp('billing_cycle_anchor')->nullable()->after('subscription_ends_at');

            $table->index('billing_status');
            $table->unique('stripe_customer_id');
            $table->unique('stripe_subscription_id');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropUnique(['stripe_customer_id']);
            $table->dropUnique(['stripe_subscription_id']);
            $table->dropIndex(['billing_status']);
            $table->dropColumn([
                'billing_provider',
                'billing_status',
                'stripe_customer_id',
                'stripe_subscription_id',
                'subscription_starts_at',
                'subscription_ends_at',
                'billing_cycle_anchor',
            ]);
        });
    }
};

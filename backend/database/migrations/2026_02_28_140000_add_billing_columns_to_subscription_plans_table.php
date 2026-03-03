<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
            $table->string('description')->nullable()->after('slug');
            $table->string('billing_interval')->default('month')->after('price');
            $table->string('stripe_price_id')->nullable()->after('billing_interval');
            $table->boolean('is_public')->default(true)->after('stripe_price_id');

            $table->unique('slug');
            $table->unique('stripe_price_id');
            $table->index(['is_public', 'price']);
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropIndex(['is_public', 'price']);
            $table->dropUnique(['slug']);
            $table->dropUnique(['stripe_price_id']);
            $table->dropColumn([
                'slug',
                'description',
                'billing_interval',
                'stripe_price_id',
                'is_public',
            ]);
        });
    }
};

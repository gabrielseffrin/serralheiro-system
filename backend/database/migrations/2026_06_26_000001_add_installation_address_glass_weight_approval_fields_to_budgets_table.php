<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->text('installation_address')->nullable()->after('notes');
            $table->decimal('total_glass_area', 10, 4)->nullable()->after('total');
            $table->decimal('total_weight', 10, 3)->nullable()->after('total_glass_area');
            $table->timestamp('approved_at')->nullable()->after('total_weight');
            $table->string('approved_ip', 45)->nullable()->after('approved_at');
            $table->timestamp('rejected_at')->nullable()->after('approved_ip');
            $table->string('rejected_ip', 45)->nullable()->after('rejected_at');
            $table->string('signer_name', 255)->nullable()->after('rejected_ip');
        });
    }

    public function down(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->dropColumn([
                'installation_address',
                'total_glass_area',
                'total_weight',
                'approved_at',
                'approved_ip',
                'rejected_at',
                'rejected_ip',
                'signer_name',
            ]);
        });
    }
};

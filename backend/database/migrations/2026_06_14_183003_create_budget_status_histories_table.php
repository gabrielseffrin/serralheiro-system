<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_status_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('budget_id')->index();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->string('changed_by')->nullable(); // user UUID string, 'system' or 'customer'
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('budget_id')->references('id')->on('budgets')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_status_histories');
    }
};

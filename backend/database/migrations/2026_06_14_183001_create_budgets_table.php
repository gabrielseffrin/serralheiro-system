<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->index();
            $table->uuid('customer_id')->index();
            $table->integer('number');
            $table->integer('version')->default(1);
            $table->uuid('parent_budget_id')->nullable()->index();
            $table->string('status'); // draft | sent | viewed | negotiating | approved | rejected | expired
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('discount', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->date('expiration_date')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('delivery_term')->nullable();
            $table->string('warranty_term')->nullable();
            $table->text('notes')->nullable();
            $table->string('public_token', 64)->unique();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');

            $table->unique(['company_id', 'number', 'version']);
            $table->index(['company_id', 'status']);
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->foreign('parent_budget_id')->references('id')->on('budgets')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};

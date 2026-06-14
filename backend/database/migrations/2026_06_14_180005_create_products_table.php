<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->uuid('default_line_id')->nullable()->index();
            $table->string('pricing_type'); // fixed | per_m2 | per_meter | per_kg
            $table->decimal('base_price', 12, 2);
            $table->boolean('requires_dimensions')->default(false);
            $table->integer('min_width')->nullable(); // mm
            $table->integer('min_height')->nullable(); // mm
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->foreign('default_line_id')->references('id')->on('product_lines')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};

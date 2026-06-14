<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('budget_id')->index();
            $table->uuid('product_id')->nullable()->index();
            $table->string('tag')->nullable(); // P01, J02, etc.
            $table->string('location')->nullable(); // Ambiente (Sala, Cozinha)
            $table->integer('quantity')->default(1);
            $table->integer('width')->nullable(); // mm
            $table->integer('height')->nullable(); // mm
            $table->decimal('calculated_area', 10, 4)->nullable(); // m²
            $table->uuid('line_id')->nullable()->index();
            $table->uuid('profile_color_id')->nullable()->index();
            $table->uuid('glass_type_id')->nullable()->index();
            $table->uuid('accessory_color_id')->nullable()->index();
            $table->decimal('unit_price', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->date('delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('image_path')->nullable();
            $table->timestamps();

            $table->foreign('budget_id')->references('id')->on('budgets')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            $table->foreign('line_id')->references('id')->on('product_lines')->onDelete('set null');
            $table->foreign('profile_color_id')->references('id')->on('product_colors')->onDelete('set null');
            $table->foreign('glass_type_id')->references('id')->on('glass_types')->onDelete('set null');
            $table->foreign('accessory_color_id')->references('id')->on('product_colors')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_items');
    }
};

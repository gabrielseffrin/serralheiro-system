<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->index();
            $table->string('name');
            $table->string('slug');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->unique(['company_id', 'slug']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('description');
            $table->uuid('category_id')->nullable()->after('code');
            $table->string('image_path')->nullable()->after('category_id');
            $table->string('unit')->default('piece')->after('pricing_type');
            $table->decimal('cost_price', 12, 4)->nullable()->after('base_price');
            $table->integer('max_width')->nullable()->after('min_height');
            $table->integer('max_height')->nullable()->after('max_width');
            $table->decimal('default_weight', 10, 3)->nullable()->after('max_height');
            $table->uuid('default_profile_color_id')->nullable()->after('default_weight');
            $table->uuid('default_accessory_color_id')->nullable()->after('default_profile_color_id');
            $table->uuid('default_glass_type_id')->nullable()->after('default_accessory_color_id');

            $table->unique(['company_id', 'code']);
            $table->foreign('category_id')->references('id')->on('product_categories')->onDelete('set null');
            $table->foreign('default_profile_color_id')->references('id')->on('product_colors')->onDelete('set null');
            $table->foreign('default_accessory_color_id')->references('id')->on('product_colors')->onDelete('set null');
            $table->foreign('default_glass_type_id')->references('id')->on('glass_types')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['default_profile_color_id']);
            $table->dropForeign(['default_accessory_color_id']);
            $table->dropForeign(['default_glass_type_id']);
            $table->dropUnique(['company_id', 'code']);
            $table->dropColumn([
                'code',
                'category_id',
                'image_path',
                'unit',
                'cost_price',
                'max_width',
                'max_height',
                'default_weight',
                'default_profile_color_id',
                'default_accessory_color_id',
                'default_glass_type_id',
            ]);
        });

        Schema::dropIfExists('product_categories');
    }
};

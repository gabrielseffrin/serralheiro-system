<?php

namespace Database\Factories;

use App\Modules\Companies\Models\Company;
use App\Modules\Products\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Porta de Correr 2 Folhas', 'Janela de Correr 4 Folhas', 'Portão Basculante', 'Grade de Proteção']),
            'description' => fake()->sentence(),
            'code' => fake()->unique()->bothify('??-###'),
            'category_id' => null,
            'image_path' => null,
            'default_line_id' => null,
            'pricing_type' => fake()->randomElement(['fixed', 'per_m2', 'per_meter']),
            'unit' => fake()->randomElement(['piece', 'm2', 'linear_meter']),
            'base_price' => fake()->randomFloat(2, 100, 1500),
            'cost_price' => fake()->optional(0.7)->randomFloat(2, 50, 1000),
            'requires_dimensions' => fake()->boolean(),
            'min_width' => fake()->numberBetween(400, 1000),
            'min_height' => fake()->numberBetween(400, 1000),
            'max_width' => null,
            'max_height' => null,
            'default_weight' => null,
            'default_profile_color_id' => null,
            'default_accessory_color_id' => null,
            'default_glass_type_id' => null,
            'active' => true,
            'company_id' => Company::factory(),
        ];
    }
}

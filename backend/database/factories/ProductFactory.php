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
            'default_line_id' => null, // Set dynamically in tests or relationships
            'pricing_type' => fake()->randomElement(['fixed', 'per_m2', 'per_meter']),
            'base_price' => fake()->randomFloat(2, 100, 1500),
            'requires_dimensions' => fake()->boolean(),
            'min_width' => fake()->numberBetween(400, 1000),
            'min_height' => fake()->numberBetween(400, 1000),
            'active' => true,
            'company_id' => Company::factory(),
        ];
    }
}

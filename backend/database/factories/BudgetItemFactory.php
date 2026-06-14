<?php

namespace Database\Factories;

use App\Modules\Budgets\Models\Budget;
use App\Modules\Budgets\Models\BudgetItem;
use App\Modules\Products\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class BudgetItemFactory extends Factory
{
    protected $model = BudgetItem::class;

    public function definition(): array
    {
        return [
            'budget_id' => Budget::factory(),
            'product_id' => Product::factory(),
            'tag' => fake()->randomElement(['P01', 'P02', 'J01', 'J02']),
            'location' => fake()->randomElement(['Sala', 'Cozinha', 'Quarto']),
            'quantity' => fake()->numberBetween(1, 5),
            'width' => fake()->numberBetween(600, 2000),
            'height' => fake()->numberBetween(600, 2200),
            'calculated_area' => null,
            'line_id' => null,
            'profile_color_id' => null,
            'glass_type_id' => null,
            'accessory_color_id' => null,
            'unit_price' => fake()->randomFloat(2, 200, 1000),
            'total' => 0.00,
            'notes' => fake()->sentence(),
        ];
    }
}

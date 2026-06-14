<?php

namespace Database\Factories;

use App\Modules\Companies\Models\Company;
use App\Modules\Products\Models\ProductColor;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductColorFactory extends Factory
{
    protected $model = ProductColor::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Branco Brilhante', 'Preto Fosco', 'Bronze Escuro', 'Fosco Natural']),
            'hex' => fake()->safeHexColor(),
            'type' => fake()->randomElement(['profile', 'accessory']),
            'company_id' => Company::factory(),
        ];
    }
}

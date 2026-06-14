<?php

namespace Database\Factories;

use App\Modules\Companies\Models\Company;
use App\Modules\Products\Models\ProductLine;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductLineFactory extends Factory
{
    protected $model = ProductLine::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Linha Suprema', 'Linha Gold', 'Linha Bella', 'Linha Inova']),
            'active' => true,
            'company_id' => Company::factory(),
        ];
    }
}

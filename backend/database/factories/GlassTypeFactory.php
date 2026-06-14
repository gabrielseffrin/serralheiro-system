<?php

namespace Database\Factories;

use App\Modules\Companies\Models\Company;
use App\Modules\Products\Models\GlassType;
use Illuminate\Database\Eloquent\Factories\Factory;

class GlassTypeFactory extends Factory
{
    protected $model = GlassType::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Comum Incolor 4mm', 'Temperado Incolor 8mm', 'Laminado Verde 3+3mm', 'Refletivo Bronze 6mm']),
            'description' => fake()->sentence(),
            'company_id' => Company::factory(),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Modules\Companies\Models\Company;
use App\Modules\Products\Models\ProductCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductCategoryFactory extends Factory
{
    protected $model = ProductCategory::class;

    public function definition(): array
    {
        $name = fake()->unique()->randomElement(['Portões', 'Janelas', 'Grades', 'Portas', 'Serviços']);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'active' => true,
            'company_id' => Company::factory(),
        ];
    }
}

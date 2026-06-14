<?php

namespace Database\Factories;

use App\Modules\Companies\Models\Company;
use App\Modules\Customers\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'document' => fake()->numerify('###.###.###-##'), // CPF format
            'address' => fake()->address(),
            'notes' => fake()->sentence(),
            'company_id' => Company::factory(),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Modules\Budgets\Models\Budget;
use App\Modules\Companies\Models\Company;
use App\Modules\Customers\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BudgetFactory extends Factory
{
    protected $model = Budget::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'customer_id' => Customer::factory(),
            'number' => fake()->numberBetween(1, 1000),
            'version' => 1,
            'parent_budget_id' => null,
            'status' => 'draft',
            'subtotal' => 0.00,
            'discount' => 0.00,
            'total' => 0.00,
            'expiration_date' => fake()->dateTimeBetween('+10 days', '+30 days'),
            'payment_method' => '50% entrada, 50% entrega',
            'delivery_term' => '25 dias úteis',
            'warranty_term' => '1 ano contra defeitos',
            'notes' => fake()->sentence(),
            'public_token' => Str::random(64),
        ];
    }
}

<?php

use App\Models\User;
use App\Modules\Budgets\Models\Budget;
use App\Modules\Companies\Models\Company;
use App\Modules\Customers\Models\Customer;
use App\Modules\Products\Models\GlassType;
use App\Modules\Products\Models\Product;
use App\Modules\Products\Models\ProductCategory;
use App\Modules\Products\Models\ProductColor;
use App\Modules\Products\Models\ProductLine;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->user = User::factory()->for($this->company)->create();
    Sanctum::actingAs($this->user);
});

it('allows user to view own company models', function (string $modelClass, array $attributes) {
    $model = $modelClass::factory()->for($this->company)->create($attributes);

    $policy = policy($model);
    expect($policy->view($this->user, $model))->toBeTrue();
    expect($policy->update($this->user, $model))->toBeTrue();
    expect($policy->delete($this->user, $model))->toBeTrue();
})->with([
    'Customer' => [Customer::class, []],
    'Product' => [Product::class, ['pricing_type' => 'fixed', 'unit' => 'piece', 'base_price' => 100]],
    'ProductCategory' => [ProductCategory::class, ['slug' => 'test']],
    'ProductLine' => [ProductLine::class, []],
    'ProductColor' => [ProductColor::class, ['type' => 'profile']],
    'GlassType' => [GlassType::class, []],
]);

it('denies user from viewing other company models', function (string $modelClass, array $attributes) {
    $otherCompany = Company::factory()->create();
    $model = $modelClass::factory()->for($otherCompany)->create($attributes);

    $policy = policy($model);
    expect($policy->view($this->user, $model))->toBeFalse();
    expect($policy->update($this->user, $model))->toBeFalse();
    expect($policy->delete($this->user, $model))->toBeFalse();
})->with([
    'Customer' => [Customer::class, []],
    'Product' => [Product::class, ['pricing_type' => 'fixed', 'unit' => 'piece', 'base_price' => 100]],
    'ProductCategory' => [ProductCategory::class, ['slug' => 'test']],
    'ProductLine' => [ProductLine::class, []],
    'ProductColor' => [ProductColor::class, ['type' => 'profile']],
    'GlassType' => [GlassType::class, []],
]);

it('allows user to view own company budget', function () {
    $customer = Customer::factory()->for($this->company)->create();
    $budget = Budget::factory()->for($this->company)->for($customer, 'customer')->create(['status' => 'draft']);

    $policy = policy($budget);
    expect($policy->view($this->user, $budget))->toBeTrue();
    expect($policy->update($this->user, $budget))->toBeTrue();
    expect($policy->delete($this->user, $budget))->toBeTrue();
});

it('denies user from viewing other company budget', function () {
    $otherCompany = Company::factory()->create();
    $customer = Customer::factory()->for($otherCompany)->create();
    $budget = Budget::factory()->for($otherCompany)->for($customer, 'customer')->create(['status' => 'draft']);

    $policy = policy($budget);
    expect($policy->view($this->user, $budget))->toBeFalse();
    expect($policy->update($this->user, $budget))->toBeFalse();
    expect($policy->delete($this->user, $budget))->toBeFalse();
});

it('denies update and delete on non-draft budgets', function () {
    $customer = Customer::factory()->for($this->company)->create();
    $budget = Budget::factory()->for($this->company)->for($customer, 'customer')->create(['status' => 'sent']);

    $policy = policy($budget);
    expect($policy->view($this->user, $budget))->toBeTrue();
    expect($policy->update($this->user, $budget))->toBeFalse();
    expect($policy->delete($this->user, $budget))->toBeFalse();
});

it('allows duplicate, version, changeStatus, and downloadPdf on own budget', function () {
    $customer = Customer::factory()->for($this->company)->create();
    $budget = Budget::factory()->for($this->company)->for($customer, 'customer')->create(['status' => 'sent']);

    $policy = policy($budget);
    expect($policy->duplicate($this->user, $budget))->toBeTrue();
    expect($policy->createVersion($this->user, $budget))->toBeTrue();
    expect($policy->changeStatus($this->user, $budget))->toBeTrue();
    expect($policy->downloadPdf($this->user, $budget))->toBeTrue();
});

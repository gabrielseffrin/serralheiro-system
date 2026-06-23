<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use App\Modules\Products\Models\Product;
use App\Modules\Products\Models\ProductLine;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->user = User::factory()->for($this->company)->create();
    Sanctum::actingAs($this->user);
});

it('lists products only for the authenticated users company', function () {
    Product::factory()->for($this->company)->count(3)->create();

    $otherCompany = Company::factory()->create();
    Product::factory()->for($otherCompany)->count(2)->create();

    $response = $this->getJson('/api/products');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('shows product details', function () {
    $line = ProductLine::factory()->for($this->company)->create();
    $product = Product::factory()->for($this->company)->create([
        'name' => 'Janela Gold',
        'default_line_id' => $line->id,
    ]);

    $response = $this->getJson("/api/products/{$product->id}");

    $response->assertOk()
        ->assertJsonPath('data.name', 'Janela Gold')
        ->assertJsonPath('data.default_line.id', $line->id);
});

it('does not show product from another company', function () {
    $otherCompany = Company::factory()->create();
    $otherProduct = Product::factory()->for($otherCompany)->create();

    $response = $this->getJson("/api/products/{$otherProduct->id}");

    $response->assertStatus(404);
});

it('creates product under the company context', function () {
    $line = ProductLine::factory()->for($this->company)->create();

    $response = $this->postJson('/api/products', [
        'name' => 'Novo Portão',
        'description' => 'Portão de alumínio reforçado',
        'default_line_id' => $line->id,
        'pricing_type' => 'fixed',
        'base_price' => 1250.00,
        'requires_dimensions' => true,
        'min_width' => 1000,
        'min_height' => 1500,
        'active' => true,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Novo Portão')
        ->assertJsonPath('data.default_line.id', $line->id);

    $this->assertDatabaseHas('products', [
        'name' => 'Novo Portão',
        'company_id' => $this->company->id,
        'default_line_id' => $line->id,
    ]);
});

it('updates product belonging to the company', function () {
    $product = Product::factory()->for($this->company)->create();

    $response = $this->putJson("/api/products/{$product->id}", [
        'name' => 'Produto Atualizado',
        'base_price' => 999.99,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Produto Atualizado')
        ->assertJsonPath('data.base_price', '999.9900');

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Produto Atualizado',
        'base_price' => '999.9900',
    ]);
});

it('does not update product from another company', function () {
    $otherCompany = Company::factory()->create();
    $otherProduct = Product::factory()->for($otherCompany)->create();

    $response = $this->putJson("/api/products/{$otherProduct->id}", [
        'name' => 'Hack',
    ]);

    $response->assertStatus(404);
});

it('deletes product belonging to the company', function () {
    $product = Product::factory()->for($this->company)->create();

    $response = $this->deleteJson("/api/products/{$product->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('products', [
        'id' => $product->id,
    ]);
});

it('does not delete product from another company', function () {
    $otherCompany = Company::factory()->create();
    $otherProduct = Product::factory()->for($otherCompany)->create();

    $response = $this->deleteJson("/api/products/{$otherProduct->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('products', [
        'id' => $otherProduct->id,
    ]);
});

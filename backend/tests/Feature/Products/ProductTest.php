<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use App\Modules\Products\Models\Product;
use App\Modules\Products\Models\ProductCategory;
use App\Modules\Products\Models\ProductColor;
use App\Modules\Products\Models\GlassType;
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

it('shows product details with relationships', function () {
    $line = ProductLine::factory()->for($this->company)->create();
    $category = ProductCategory::factory()->for($this->company)->create();
    $product = Product::factory()->for($this->company)->create([
        'name' => 'Janela Gold',
        'code' => 'JG-001',
        'default_line_id' => $line->id,
        'category_id' => $category->id,
        'unit' => 'piece',
        'cost_price' => 500.00,
    ]);

    $response = $this->getJson("/api/products/{$product->id}");

    $response->assertOk()
        ->assertJsonPath('data.name', 'Janela Gold')
        ->assertJsonPath('data.code', 'JG-001')
        ->assertJsonPath('data.default_line.id', $line->id)
        ->assertJsonPath('data.category.id', $category->id)
        ->assertJsonPath('data.unit', 'piece')
        ->assertJsonPath('data.cost_price', '500.0000');
});

it('does not show product from another company', function () {
    $otherCompany = Company::factory()->create();
    $otherProduct = Product::factory()->for($otherCompany)->create();

    $response = $this->getJson("/api/products/{$otherProduct->id}");

    $response->assertStatus(404);
});

it('creates product with all new fields', function () {
    $line = ProductLine::factory()->for($this->company)->create();
    $category = ProductCategory::factory()->for($this->company)->create();
    $profileColor = ProductColor::factory()->for($this->company)->create(['type' => 'profile']);
    $accessoryColor = ProductColor::factory()->for($this->company)->create(['type' => 'accessory']);
    $glassType = GlassType::factory()->for($this->company)->create();

    $response = $this->postJson('/api/products', [
        'name' => 'Novo Portão',
        'code' => 'PT-001',
        'description' => 'Portão de alumínio reforçado',
        'category_id' => $category->id,
        'default_line_id' => $line->id,
        'pricing_type' => 'fixed',
        'unit' => 'piece',
        'base_price' => 1250.00,
        'cost_price' => 800.00,
        'requires_dimensions' => true,
        'min_width' => 1000,
        'min_height' => 1500,
        'max_width' => 3000,
        'max_height' => 2500,
        'default_weight' => 45.5,
        'default_profile_color_id' => $profileColor->id,
        'default_accessory_color_id' => $accessoryColor->id,
        'default_glass_type_id' => $glassType->id,
        'active' => true,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Novo Portão')
        ->assertJsonPath('data.code', 'PT-001')
        ->assertJsonPath('data.unit', 'piece')
        ->assertJsonPath('data.cost_price', '800.0000')
        ->assertJsonPath('data.max_width', 3000)
        ->assertJsonPath('data.max_height', 2500)
        ->assertJsonPath('data.default_weight', '45.500');

    $this->assertDatabaseHas('products', [
        'name' => 'Novo Portão',
        'company_id' => $this->company->id,
        'code' => 'PT-001',
    ]);
});

it('validates duplicate code within same company', function () {
    Product::factory()->for($this->company)->create(['code' => 'DUPLICATE']);

    $response = $this->postJson('/api/products', [
        'name' => 'Outro Produto',
        'code' => 'DUPLICATE',
        'pricing_type' => 'fixed',
        'unit' => 'piece',
        'base_price' => 100,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['code']);
});

it('updates product with new fields', function () {
    $product = Product::factory()->for($this->company)->create();

    $response = $this->putJson("/api/products/{$product->id}", [
        'name' => 'Produto Atualizado',
        'code' => 'UPD-001',
        'base_price' => 999.99,
        'unit' => 'm2',
        'cost_price' => 500.00,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Produto Atualizado')
        ->assertJsonPath('data.code', 'UPD-001')
        ->assertJsonPath('data.unit', 'm2')
        ->assertJsonPath('data.base_price', '999.9900');

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Produto Atualizado',
        'code' => 'UPD-001',
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

it('validates max dimensions are greater than or equal to min', function () {
    $response = $this->postJson('/api/products', [
        'name' => 'Teste',
        'pricing_type' => 'fixed',
        'unit' => 'piece',
        'base_price' => 100,
        'min_width' => 2000,
        'max_width' => 1000,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['max_width']);
});

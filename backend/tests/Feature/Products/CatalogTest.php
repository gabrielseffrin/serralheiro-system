<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use App\Modules\Products\Models\GlassType;
use App\Modules\Products\Models\ProductColor;
use App\Modules\Products\Models\ProductLine;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->user = User::factory()->for($this->company)->create();
    Sanctum::actingAs($this->user);
});

// --- PRODUCT LINES ---

it('manages product lines CRUD and tenant isolation', function () {
    $line = ProductLine::factory()->for($this->company)->create(['name' => 'Suprema']);

    $otherCompany = Company::factory()->create();
    $otherLine = ProductLine::factory()->for($otherCompany)->create(['name' => 'Gold Outra Empresa']);

    // List
    $response = $this->getJson('/api/product-lines');
    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Suprema');

    // Create
    $response = $this->postJson('/api/product-lines', [
        'name' => 'Gold',
        'active' => true,
    ]);
    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Gold');

    $this->assertDatabaseHas('product_lines', [
        'name' => 'Gold',
        'company_id' => $this->company->id,
    ]);

    // Update
    $response = $this->putJson("/api/product-lines/{$line->id}", [
        'name' => 'Suprema II',
    ]);
    $response->assertOk()
        ->assertJsonPath('data.name', 'Suprema II');

    // Update (Isolation check)
    $response = $this->putJson("/api/product-lines/{$otherLine->id}", [
        'name' => 'Hack',
    ]);
    $response->assertStatus(404);

    // Delete
    $response = $this->deleteJson("/api/product-lines/{$line->id}");
    $response->assertStatus(204);
    $this->assertDatabaseMissing('product_lines', ['id' => $line->id]);

    // Delete (Isolation check)
    $response = $this->deleteJson("/api/product-lines/{$otherLine->id}");
    $response->assertStatus(404);
});

// --- PRODUCT COLORS ---

it('manages product colors CRUD, filters, and tenant isolation', function () {
    $colorProfile = ProductColor::factory()->for($this->company)->create([
        'name' => 'Preto Perfil',
        'type' => 'profile',
    ]);
    $colorAccessory = ProductColor::factory()->for($this->company)->create([
        'name' => 'Branco Acessório',
        'type' => 'accessory',
    ]);

    $otherCompany = Company::factory()->create();
    $otherColor = ProductColor::factory()->for($otherCompany)->create(['name' => 'Cinza Hack']);

    // List (all)
    $response = $this->getJson('/api/product-colors');
    $response->assertOk()
        ->assertJsonCount(2, 'data');

    // List filtered by type
    $response = $this->getJson('/api/product-colors?type=profile');
    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Preto Perfil');

    // Create
    $response = $this->postJson('/api/product-colors', [
        'name' => 'Bronze',
        'hex' => '#4A3B32',
        'type' => 'profile',
    ]);
    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Bronze');

    // Update
    $response = $this->putJson("/api/product-colors/{$colorProfile->id}", [
        'name' => 'Preto Fosco',
    ]);
    $response->assertOk()
        ->assertJsonPath('data.name', 'Preto Fosco');

    // Update (Isolation)
    $response = $this->putJson("/api/product-colors/{$otherColor->id}", [
        'name' => 'Hack',
    ]);
    $response->assertStatus(404);

    // Delete
    $response = $this->deleteJson("/api/product-colors/{$colorProfile->id}");
    $response->assertStatus(204);

    // Delete (Isolation)
    $response = $this->deleteJson("/api/product-colors/{$otherColor->id}");
    $response->assertStatus(404);
});

// --- GLASS TYPES ---

it('manages glass types CRUD and tenant isolation', function () {
    $glass = GlassType::factory()->for($this->company)->create(['name' => 'Temperado 8mm']);

    $otherCompany = Company::factory()->create();
    $otherGlass = GlassType::factory()->for($otherCompany)->create(['name' => 'Comum Hack']);

    // List
    $response = $this->getJson('/api/glass-types');
    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Temperado 8mm');

    // Create
    $response = $this->postJson('/api/glass-types', [
        'name' => 'Laminado 6mm',
        'description' => 'Vidro laminado de segurança',
    ]);
    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Laminado 6mm');

    // Update
    $response = $this->putJson("/api/glass-types/{$glass->id}", [
        'name' => 'Temperado Blindex 8mm',
    ]);
    $response->assertOk()
        ->assertJsonPath('data.name', 'Temperado Blindex 8mm');

    // Update (Isolation)
    $response = $this->putJson("/api/glass-types/{$otherGlass->id}", [
        'name' => 'Hack',
    ]);
    $response->assertStatus(404);

    // Delete
    $response = $this->deleteJson("/api/glass-types/{$glass->id}");
    $response->assertStatus(204);

    // Delete (Isolation)
    $response = $this->deleteJson("/api/glass-types/{$otherGlass->id}");
    $response->assertStatus(404);
});

<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

it('requires authentication to access company data', function () {
    $response = $this->getJson('/api/company');
    $response->assertStatus(401);
});

it('returns authenticated users company data', function () {
    $company = Company::factory()->create([
        'name' => 'Serralheria Metalúrgica',
        'trade_name' => 'Metalúrgica VIP',
    ]);
    $user = User::factory()->for($company)->create();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/company');

    $response->assertOk()
        ->assertJsonPath('data.id', $company->id)
        ->assertJsonPath('data.name', 'Serralheria Metalúrgica')
        ->assertJsonPath('data.trade_name', 'Metalúrgica VIP');
});

it('updates company data with valid input', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    Sanctum::actingAs($user);

    $response = $this->putJson('/api/company', [
        'name' => 'Nova Serralheria',
        'trade_name' => 'Nova Metalúrgica',
        'document' => '12.345.678/0001-90',
        'phone' => '(11) 99999-9999',
        'email' => 'contato@nova.com',
        'address' => 'Rua Teste, 123',
        'default_notes' => 'Observações padrão.',
        'default_payment_method' => 'PIX',
        'default_delivery_term' => '10 dias',
        'default_warranty_term' => '1 ano',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Nova Serralheria')
        ->assertJsonPath('data.document', '12.345.678/0001-90');

    $this->assertDatabaseHas('companies', [
        'id' => $company->id,
        'name' => 'Nova Serralheria',
        'document' => '12.345.678/0001-90',
    ]);
});

it('validates company update request', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    Sanctum::actingAs($user);

    $response = $this->putJson('/api/company', [
        'name' => '', // Required
        'email' => 'invalid-email',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email']);
});

it('uploads company logo successfully', function () {
    Storage::fake('public');

    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    Sanctum::actingAs($user);

    $file = UploadedFile::fake()->image('logo.png', 200, 200);

    $response = $this->postJson('/api/company/logo', [
        'logo' => $file,
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['logo']]);

    $company->refresh();
    expect($company->logo)->not->toBeNull();
    Storage::disk('public')->assertExists($company->logo);
});

it('validates logo upload request', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/company/logo', [
        'logo' => 'not-a-file',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['logo']);
});

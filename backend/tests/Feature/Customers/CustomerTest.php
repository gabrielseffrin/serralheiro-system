<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use App\Modules\Customers\Models\Customer;
use Laravel\Sanctum\Sanctum;

it('requires authentication to access customers', function () {
    $response = $this->getJson('/api/customers');
    $response->assertStatus(401);
});

it('lists customers only for the authenticated users company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();

    Customer::factory()->for($companyA)->count(3)->create();
    Customer::factory()->for($companyB)->count(2)->create();

    Sanctum::actingAs($userA);

    $response = $this->getJson('/api/customers');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('shows customer belonging to the company', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create(['name' => 'Cliente A']);

    Sanctum::actingAs($user);

    $response = $this->getJson("/api/customers/{$customer->id}");

    $response->assertOk()
        ->assertJsonPath('data.name', 'Cliente A');
});

it('does not show customer from another company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();
    $customerB = Customer::factory()->for($companyB)->create();

    Sanctum::actingAs($userA);

    $response = $this->getJson("/api/customers/{$customerB->id}");

    $response->assertStatus(404);
});

it('creates customer under the company context', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/customers', [
        'name' => 'Novo Cliente',
        'phone' => '(11) 98888-8888',
        'email' => 'cliente@email.com',
        'document' => '123.456.789-00',
        'address' => 'Avenida Principal, 456',
        'notes' => 'Notas sobre o cliente.',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Novo Cliente');

    $this->assertDatabaseHas('customers', [
        'name' => 'Novo Cliente',
        'company_id' => $company->id,
    ]);
});

it('updates customer belonging to the company', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();

    Sanctum::actingAs($user);

    $response = $this->putJson("/api/customers/{$customer->id}", [
        'name' => 'Cliente Atualizado',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Cliente Atualizado');

    $this->assertDatabaseHas('customers', [
        'id' => $customer->id,
        'name' => 'Cliente Atualizado',
    ]);
});

it('does not update customer from another company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();
    $customerB = Customer::factory()->for($companyB)->create();

    Sanctum::actingAs($userA);

    $response = $this->putJson("/api/customers/{$customerB->id}", [
        'name' => 'Tentar Atualizar',
    ]);

    $response->assertStatus(404);
});

it('deletes customer belonging to the company', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();

    Sanctum::actingAs($user);

    $response = $this->deleteJson("/api/customers/{$customer->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('customers', [
        'id' => $customer->id,
    ]);
});

it('does not delete customer from another company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();
    $customerB = Customer::factory()->for($companyB)->create();

    Sanctum::actingAs($userA);

    $response = $this->deleteJson("/api/customers/{$customerB->id}");

    $response->assertStatus(404);

    $this->assertDatabaseHas('customers', [
        'id' => $customerB->id,
    ]);
});

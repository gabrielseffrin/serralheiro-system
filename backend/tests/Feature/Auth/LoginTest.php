<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;

it('logs in with valid credentials', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create([
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'token',
            'user' => ['id', 'name', 'email', 'company_id'],
        ]);
});

it('rejects login with invalid credentials', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401);
});

it('validates login request', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => 'not-an-email',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});

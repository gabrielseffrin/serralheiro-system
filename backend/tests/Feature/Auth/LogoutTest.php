<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use Laravel\Sanctum\Sanctum;

it('logs out authenticated user', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/auth/logout');

    $response->assertOk()
        ->assertJson(['message' => 'Logged out successfully.']);
});

it('rejects logout without authentication', function () {
    $response = $this->postJson('/api/auth/logout');

    $response->assertStatus(401);
});

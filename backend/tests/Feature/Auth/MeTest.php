<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use Laravel\Sanctum\Sanctum;

it('returns authenticated user data', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.email', $user->email);
});

it('rejects unauthenticated access to me', function () {
    $response = $this->getJson('/api/auth/me');

    $response->assertStatus(401);
});

<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;

it('sends password reset link', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();

    $response = $this->postJson('/api/auth/forgot-password', [
        'email' => $user->email,
    ]);

    $response->assertOk()
        ->assertJson(['message' => 'If the email exists, a reset link has been sent.']);
});

it('validates forgot-password request', function () {
    $response = $this->postJson('/api/auth/forgot-password', [
        'email' => 'not-an-email',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

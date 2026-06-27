<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->user = User::factory()->for($this->company)->create([
        'email' => 'test@example.com',
        'password' => Hash::make('oldpassword'),
    ]);
});

it('resets password with valid token', function () {
    $token = Password::createToken($this->user);

    $response = $this->postJson('/api/auth/reset-password', [
        'token' => $token,
        'email' => 'test@example.com',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertOk()
        ->assertJson(['message' => 'Senha alterada com sucesso.']);

    $this->assertTrue(Hash::check('newpassword123', $this->user->fresh()->password));
});

it('rejects reset with invalid token', function () {
    $response = $this->postJson('/api/auth/reset-password', [
        'token' => 'invalid-token',
        'email' => 'test@example.com',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertStatus(422);
});

it('rejects reset with wrong email', function () {
    $token = Password::createToken($this->user);

    $response = $this->postJson('/api/auth/reset-password', [
        'token' => $token,
        'email' => 'wrong@example.com',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertStatus(422);
});

it('validates password confirmation', function () {
    $token = Password::createToken($this->user);

    $response = $this->postJson('/api/auth/reset-password', [
        'token' => $token,
        'email' => 'test@example.com',
        'password' => 'newpassword123',
        'password_confirmation' => 'different',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

it('validates minimum password length', function () {
    $token = Password::createToken($this->user);

    $response = $this->postJson('/api/auth/reset-password', [
        'token' => $token,
        'email' => 'test@example.com',
        'password' => '1234567',
        'password_confirmation' => '1234567',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

<?php

use App\Models\User;
use App\Modules\Companies\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('filters models by authenticated user company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    User::factory()->for($companyA)->count(3)->create();
    User::factory()->for($companyB)->count(2)->create();

    $userA = User::factory()->for($companyA)->create();
    $this->actingAs($userA);

    // User model uses BelongsToTenant, so it should filter by company
    $users = User::all();
    expect($users)->toHaveCount(4); // 3 + the authenticated user
    $users->each(function ($user) use ($companyA) {
        expect($user->company_id)->toBe($companyA->id);
    });
});

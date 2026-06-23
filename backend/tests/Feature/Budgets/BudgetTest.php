<?php

use App\Models\User;
use App\Modules\Budgets\Models\Budget;
use App\Modules\Budgets\Models\BudgetItem;
use App\Modules\Budgets\Services\BudgetNumberGenerator;
use App\Modules\Budgets\Services\BudgetService;
use App\Modules\Companies\Models\Company;
use App\Modules\Customers\Models\Customer;
use App\Modules\Products\Models\Product;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->budgetService = new BudgetService;
});

/*
|--------------------------------------------------------------------------
| Service & Calculation Tests
|--------------------------------------------------------------------------
*/

it('generates sequential numbers correctly per company and isolates them', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    // Generate for Company A
    $numA1 = BudgetNumberGenerator::generate($companyA->id);
    expect($numA1)->toBe(1);

    // Create a mock budget in DB for A to increment sequence
    $customerA = Customer::factory()->for($companyA)->create();
    Budget::factory()->create([
        'company_id' => $companyA->id,
        'customer_id' => $customerA->id,
        'number' => 1,
        'version' => 1,
    ]);

    $numA2 = BudgetNumberGenerator::generate($companyA->id);
    expect($numA2)->toBe(2);

    // Sequence for Company B should still start at 1
    $numB1 = BudgetNumberGenerator::generate($companyB->id);
    expect($numB1)->toBe(1);
});

it('calculates prices correctly based on pricing type', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();

    // 1. Fixed Pricing Product
    $fixedProduct = Product::factory()->for($company)->create([
        'pricing_type' => 'fixed',
        'base_price' => 500.00,
    ]);

    // 2. Area Pricing Product
    $areaProduct = Product::factory()->for($company)->create([
        'pricing_type' => 'per_m2',
        'base_price' => 200.00, // R$ 200 per m²
    ]);

    // 3. Perimeter Pricing Product
    $perimeterProduct = Product::factory()->for($company)->create([
        'pricing_type' => 'per_meter',
        'base_price' => 150.00, // R$ 150 per linear meter
    ]);

    // 4. Weight Pricing Product
    $perKgProduct = Product::factory()->for($company)->create([
        'pricing_type' => 'per_kg',
        'base_price' => 80.00, // R$ 80 per kg
    ]);

    $items = [
        [
            'product_id' => $fixedProduct->id,
            'quantity' => 2,
            'unit_price' => 450.00, // manual override
        ],
        [
            'product_id' => $areaProduct->id,
            'quantity' => 1,
            'width' => 1200,  // 1.2m
            'height' => 1500, // 1.5m
        ],
        [
            'product_id' => $perimeterProduct->id,
            'quantity' => 3,
            'width' => 1000, // 1m
            'height' => 1000, // 1m
        ],
        [
            'product_id' => $perKgProduct->id,
            'quantity' => 2,
            'weight' => 15.500, // 15.5 kg
        ],
    ];

    $budget = $this->budgetService->create([
        'customer_id' => $customer->id,
        'discount' => 100.00,
        'status' => 'draft',
    ], $items, $company->id, $user->id);

    expect($budget->number)->toBe(1);
    expect($budget->version)->toBe(1);

    $dbItems = $budget->items()->get();
    expect($dbItems)->toHaveCount(4);

    // Item 1 (fixed override)
    expect((float) $dbItems[0]->unit_price)->toBe(450.00);
    expect((float) $dbItems[0]->total)->toBe(900.00);

    // Item 2 (area pricing)
    expect((float) $dbItems[1]->calculated_area)->toBe(1.8000);
    expect((float) $dbItems[1]->unit_price)->toBe(360.00);
    expect((float) $dbItems[1]->total)->toBe(360.00);

    // Item 3 (perimeter pricing)
    expect((float) $dbItems[2]->unit_price)->toBe(600.00);
    expect((float) $dbItems[2]->total)->toBe(1800.00);

    // Item 4 (weight pricing)
    expect((float) $dbItems[3]->weight)->toBe(15.500);
    expect((float) $dbItems[3]->unit_price)->toBe(1240.00);
    expect((float) $dbItems[3]->total)->toBe(2480.00);

    // Budget totals
    expect((float) $budget->subtotal)->toBe(5540.00);
    expect((float) $budget->total)->toBe(5440.00);
});

it('syncs items correctly during update', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $product = Product::factory()->for($company)->create(['pricing_type' => 'fixed', 'base_price' => 100]);

    $budget = $this->budgetService->create([
        'customer_id' => $customer->id,
        'status' => 'draft',
    ], [['product_id' => $product->id, 'quantity' => 1]], $company->id, $user->id);

    expect((float) $budget->total)->toBe(100.00);

    $newItems = [
        ['product_id' => $product->id, 'quantity' => 5],
        ['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 80.00],
    ];

    $updatedBudget = $this->budgetService->update($budget, [
        'customer_id' => $customer->id,
        'discount' => 20.00,
        'status' => 'sent',
        'status_change_notes' => 'Enviado ao cliente',
    ], $newItems, $user->id);

    expect((float) $updatedBudget->subtotal)->toBe(660.00);
    expect((float) $updatedBudget->total)->toBe(640.00);
    expect($updatedBudget->status)->toBe('sent');

    $this->assertDatabaseHas('budget_status_histories', [
        'budget_id' => $budget->id,
        'from_status' => 'draft',
        'to_status' => 'sent',
        'changed_by' => $user->id,
        'notes' => 'Enviado ao cliente',
    ]);
});

it('duplicates a budget as v1 draft with new sequential number', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $product = Product::factory()->for($company)->create(['pricing_type' => 'fixed', 'base_price' => 250]);

    $original = $this->budgetService->create([
        'customer_id' => $customer->id,
        'status' => 'approved',
    ], [['product_id' => $product->id, 'quantity' => 2]], $company->id, $user->id);

    $duplicated = $this->budgetService->duplicate($original, $user->id);

    expect($duplicated->id)->not->toBe($original->id);
    expect($duplicated->number)->toBe(2);
    expect($duplicated->version)->toBe(1);
    expect($duplicated->status)->toBe('draft');
    expect((float) $duplicated->total)->toBe(500.00);
});

it('versions a budget keeping number and incrementing version', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $product = Product::factory()->for($company)->create(['pricing_type' => 'fixed', 'base_price' => 150]);

    $original = $this->budgetService->create([
        'customer_id' => $customer->id,
        'status' => 'negotiating',
    ], [['product_id' => $product->id, 'quantity' => 3]], $company->id, $user->id);

    $versioned = $this->budgetService->createVersion($original, $user->id);

    expect($versioned->id)->not->toBe($original->id);
    expect($versioned->number)->toBe(1);
    expect($versioned->version)->toBe(2);
    expect($versioned->parent_budget_id)->toBe($original->id);
});

/*
|--------------------------------------------------------------------------
| HTTP / Controller Endpoint Tests
|--------------------------------------------------------------------------
*/

it('requires authentication to access budgets endpoints', function () {
    $this->getJson('/api/budgets')->assertStatus(401);
    $this->postJson('/api/budgets', [])->assertStatus(401);
});

it('lists budgets belonging to the tenants company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();

    $customerA = Customer::factory()->for($companyA)->create();
    $customerB = Customer::factory()->for($companyB)->create();

    Budget::factory()->for($companyA)->for($customerA)->create(['number' => 1]);
    Budget::factory()->for($companyA)->for($customerA)->create(['number' => 2]);
    Budget::factory()->for($companyB)->for($customerB)->create(['number' => 1]);

    Sanctum::actingAs($userA);

    $response = $this->getJson('/api/budgets');

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.number', 2)
        ->assertJsonPath('data.1.number', 1);
});

it('creates a budget via API and stores it correctly', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $product = Product::factory()->for($company)->create(['pricing_type' => 'fixed', 'base_price' => 300.00]);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/budgets', [
        'customer_id' => $customer->id,
        'discount' => 50.00,
        'status' => 'draft',
        'payment_method' => 'Boleto 30 dias',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 3,
                'unit_price' => 280.00, // manual override
            ],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.number', 1)
        ->assertJsonPath('data.subtotal', '840.00') // 280 * 3
        ->assertJsonPath('data.total', '790.00'); // 840 - 50

    $this->assertDatabaseHas('budgets', [
        'company_id' => $company->id,
        'customer_id' => $customer->id,
        'total' => 790.00,
    ]);

    $this->assertDatabaseHas('budget_items', [
        'quantity' => 3,
        'unit_price' => 280.00,
        'total' => 840.00,
    ]);
});

it('does not allow creating a budget for another companys customer', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();
    $customerB = Customer::factory()->for($companyB)->create();
    $productA = Product::factory()->for($companyA)->create();

    Sanctum::actingAs($userA);

    $response = $this->postJson('/api/budgets', [
        'customer_id' => $customerB->id,
        'items' => [
            ['product_id' => $productA->id, 'quantity' => 1],
        ],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['customer_id']);
});

it('shows budget details for owned company', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create(['number' => 5]);

    Sanctum::actingAs($user);

    $response = $this->getJson("/api/budgets/{$budget->id}");

    $response->assertOk()
        ->assertJsonPath('data.number', 5);
});

it('does not show budget belonging to another company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();
    $customerB = Customer::factory()->for($companyB)->create();
    $budgetB = Budget::factory()->for($companyB)->for($customerB)->create();

    Sanctum::actingAs($userA);

    $response = $this->getJson("/api/budgets/{$budgetB->id}");

    $response->assertStatus(404);
});

it('updates budget and recreates items via API', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $product = Product::factory()->for($company)->create(['pricing_type' => 'fixed', 'base_price' => 200.00]);

    $budget = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'draft',
    ]);
    BudgetItem::factory()->for($budget)->create([
        'product_id' => $product->id,
        'quantity' => 1,
        'unit_price' => 200.00,
        'total' => 200.00,
    ]);

    Sanctum::actingAs($user);

    $response = $this->putJson("/api/budgets/{$budget->id}", [
        'customer_id' => $customer->id,
        'discount' => 10.00,
        'status' => 'negotiating',
        'status_change_notes' => 'Ajuste de desconto',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
            ],
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.subtotal', '400.00')
        ->assertJsonPath('data.total', '390.00');

    $this->assertDatabaseHas('budget_status_histories', [
        'budget_id' => $budget->id,
        'from_status' => 'draft',
        'to_status' => 'negotiating',
        'notes' => 'Ajuste de desconto',
    ]);
});

it('deletes budget belonging to company', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create();

    Sanctum::actingAs($user);

    $response = $this->deleteJson("/api/budgets/{$budget->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('budgets', [
        'id' => $budget->id,
    ]);
});

it('duplicates budget via API endpoint', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();

    $budget = Budget::factory()->for($company)->for($customer)->create([
        'number' => 1,
        'version' => 1,
        'status' => 'approved',
    ]);

    Sanctum::actingAs($user);

    $response = $this->postJson("/api/budgets/{$budget->id}/duplicate");

    $response->assertStatus(201)
        ->assertJsonPath('data.number', 2)
        ->assertJsonPath('data.version', 1)
        ->assertJsonPath('data.status', 'draft');
});

it('creates a new version via API endpoint', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();

    $budget = Budget::factory()->for($company)->for($customer)->create([
        'number' => 3,
        'version' => 1,
        'status' => 'negotiating',
    ]);

    Sanctum::actingAs($user);

    $response = $this->postJson("/api/budgets/{$budget->id}/version");

    $response->assertStatus(201)
        ->assertJsonPath('data.number', 3)
        ->assertJsonPath('data.version', 2)
        ->assertJsonPath('data.parent_budget_id', $budget->id)
        ->assertJsonPath('data.status', 'draft');
});

it('changes status via patch endpoint', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();

    $budget = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'draft',
    ]);

    Sanctum::actingAs($user);

    $response = $this->patchJson("/api/budgets/{$budget->id}/status", [
        'status' => 'sent',
        'notes' => 'Enviado ao e-mail',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'sent');

    $this->assertDatabaseHas('budget_status_histories', [
        'budget_id' => $budget->id,
        'from_status' => 'draft',
        'to_status' => 'sent',
        'notes' => 'Enviado ao e-mail',
    ]);
});

it('returns dashboard stats correctly filtered by tenant', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();

    $customerA = Customer::factory()->for($companyA)->create();
    $customerB = Customer::factory()->for($companyB)->create();

    // Company A budgets
    Budget::factory()->for($companyA)->for($customerA)->create(['status' => 'approved', 'total' => 1000.00]);
    Budget::factory()->for($companyA)->for($customerA)->create(['status' => 'draft', 'total' => 500.00]);

    // Company B budgets
    Budget::factory()->for($companyB)->for($customerB)->create(['status' => 'approved', 'total' => 9999.00]);

    Sanctum::actingAs($userA);

    $response = $this->getJson('/api/dashboard/stats');

    $response->assertOk()
        ->assertJsonPath('data.total_count', 2)
        ->assertJsonPath('data.total_value', 1500)
        ->assertJsonPath('data.approved_count', 1)
        ->assertJsonPath('data.approved_value', 1000)
        ->assertJsonPath('data.pending_count', 1)
        ->assertJsonPath('data.pending_value', 500)
        ->assertJsonPath('data.conversion_rate', 50);
});

it('allows viewing a budget via public token and transitions status to viewed', function () {
    $company = Company::factory()->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'sent',
    ]);

    $response = $this->getJson("/api/public/budgets/{$budget->public_token}");

    $response->assertOk()
        ->assertJsonPath('data.id', $budget->id)
        ->assertJsonPath('data.status', 'viewed');

    $this->assertDatabaseHas('budgets', [
        'id' => $budget->id,
        'status' => 'viewed',
    ]);

    $this->assertDatabaseHas('budget_status_histories', [
        'budget_id' => $budget->id,
        'from_status' => 'sent',
        'to_status' => 'viewed',
        'changed_by' => 'customer',
    ]);
});

it('does not transition status to viewed if already approved or rejected', function () {
    $company = Company::factory()->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'approved',
    ]);

    $response = $this->getJson("/api/public/budgets/{$budget->public_token}");

    $response->assertOk()
        ->assertJsonPath('data.id', $budget->id)
        ->assertJsonPath('data.status', 'approved');

    $this->assertDatabaseHas('budgets', [
        'id' => $budget->id,
        'status' => 'approved',
    ]);
});

it('allows customer to approve a budget via public link', function () {
    $company = Company::factory()->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'viewed',
    ]);

    $response = $this->postJson("/api/public/budgets/{$budget->public_token}/approve", [
        'notes' => 'Tudo certo, pode iniciar a fabricação.',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'approved');

    $this->assertDatabaseHas('budgets', [
        'id' => $budget->id,
        'status' => 'approved',
    ]);

    $this->assertDatabaseHas('budget_status_histories', [
        'budget_id' => $budget->id,
        'from_status' => 'viewed',
        'to_status' => 'approved',
        'changed_by' => 'customer',
        'notes' => 'Aprovado pelo cliente via link público: Tudo certo, pode iniciar a fabricação.',
    ]);
});

it('allows customer to reject a budget via public link', function () {
    $company = Company::factory()->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'viewed',
    ]);

    $response = $this->postJson("/api/public/budgets/{$budget->public_token}/reject", [
        'notes' => 'Achei o valor um pouco alto.',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'rejected');

    $this->assertDatabaseHas('budgets', [
        'id' => $budget->id,
        'status' => 'rejected',
    ]);

    $this->assertDatabaseHas('budget_status_histories', [
        'budget_id' => $budget->id,
        'from_status' => 'viewed',
        'to_status' => 'rejected',
        'changed_by' => 'customer',
        'notes' => 'Rejeitado pelo cliente via link público: Achei o valor um pouco alto.',
    ]);
});

it('allows downloading a budget PDF if authenticated and owner', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create();

    Sanctum::actingAs($user);

    $response = $this->getJson("/api/budgets/{$budget->id}/pdf");

    $response->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('does not allow downloading a budget PDF from another company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    $userA = User::factory()->for($companyA)->create();
    $customerB = Customer::factory()->for($companyB)->create();
    $budgetB = Budget::factory()->for($companyB)->for($customerB)->create();

    Sanctum::actingAs($userA);

    $response = $this->getJson("/api/budgets/{$budgetB->id}/pdf");

    $response->assertStatus(404);
});

it('marks expired budgets automatically when running expiration command', function () {
    $company = Company::factory()->create();
    $customer = Customer::factory()->for($company)->create();

    // 1. Budget sent but expired
    $budget1 = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'sent',
        'expiration_date' => now()->subDay()->format('Y-m-d'),
    ]);

    // 2. Budget negotiating but expired
    $budget2 = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'negotiating',
        'expiration_date' => now()->subDay()->format('Y-m-d'),
    ]);

    // 3. Budget draft (should NOT expire)
    $budget3 = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'draft',
        'expiration_date' => now()->subDay()->format('Y-m-d'),
    ]);

    // 4. Budget approved but expired (should NOT expire)
    $budget4 = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'approved',
        'expiration_date' => now()->subDay()->format('Y-m-d'),
    ]);

    // 5. Budget sent and not expired (should NOT expire)
    $budget5 = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'sent',
        'expiration_date' => now()->addDay()->format('Y-m-d'),
    ]);

    // Run expiration command
    $this->artisan('app:expire-budgets')->assertExitCode(0);

    // Assert statuses
    expect($budget1->fresh()->status)->toBe('expired');
    expect($budget2->fresh()->status)->toBe('expired');
    expect($budget3->fresh()->status)->toBe('draft');
    expect($budget4->fresh()->status)->toBe('approved');
    expect($budget5->fresh()->status)->toBe('sent');

    $this->assertDatabaseHas('budget_status_histories', [
        'budget_id' => $budget1->id,
        'from_status' => 'sent',
        'to_status' => 'expired',
        'changed_by' => 'system',
        'notes' => 'Orçamento expirado automaticamente por atingir a data limite',
    ]);
});

it('allows guest to download budget PDF via public token', function () {
    $company = Company::factory()->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create();

    $response = $this->getJson("/api/public/budgets/{$budget->public_token}/pdf");

    $response->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('rejects budget update when status is not draft', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $product = Product::factory()->for($company)->create(['pricing_type' => 'fixed', 'base_price' => 200.00]);

    $budget = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'approved',
    ]);
    BudgetItem::factory()->for($budget)->create([
        'product_id' => $product->id,
        'quantity' => 1,
        'unit_price' => 200.00,
        'total' => 200.00,
    ]);

    Sanctum::actingAs($user);

    $response = $this->putJson("/api/budgets/{$budget->id}", [
        'customer_id' => $customer->id,
        'discount' => 10.00,
        'status' => 'approved',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 2,
            ],
        ],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

it('rejects budget deletion when status is not draft', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();
    $customer = Customer::factory()->for($company)->create();
    $budget = Budget::factory()->for($company)->for($customer)->create([
        'status' => 'approved',
    ]);

    Sanctum::actingAs($user);

    $response = $this->deleteJson("/api/budgets/{$budget->id}");

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});


# 06 — Estratégia de Testes e TDD

## Princípio fundamental

**TDD obrigatório.** Toda funcionalidade nova deve nascer de um teste que falha.

Ciclo:

```
🔴 Red       → escreva um teste que falha
🟢 Green     → escreva o mínimo para o teste passar
🔵 Refactor  → melhore o código mantendo testes verdes
```

### Regras

- Pull Request **sem teste correspondente é rejeitado**;
- Cobertura mínima: **80% nos módulos de domínio** (Services, cálculos, regras);
- Testes devem ser rápidos (use transactions, não recrie banco);
- Nome dos testes descreve o comportamento, não a implementação.

---

## Stack

### Backend (Laravel)

- **Pest PHP** — framework principal (não usar PHPUnit puro);
- **PHPUnit** — subjacente, para compatibilidade;
- **Database transactions** entre testes (`RefreshDatabase` ou `DatabaseTransactions`);
- **Factories** obrigatórias para todos os models;
- **Faker** para dados realistas.

Comandos:

```bash
docker compose exec backend ./vendor/bin/pest
docker compose exec backend ./vendor/bin/pest --filter=BudgetCalculation
docker compose exec backend ./vendor/bin/pest --coverage
```

### Frontend (React)

- **Vitest** — unit tests;
- **Testing Library** — componentes;
- **MSW (Mock Service Worker)** — mock de API.

Comandos:

```bash
docker compose exec frontend npm run test
docker compose exec frontend npm run test:coverage
```

---

## Tipos de teste obrigatórios

### 1. Unit tests — Services de domínio

Cobrem a lógica de cálculo, validações de regra e geração de números.

Exemplos:

- `BudgetCalculationService` (subtotal, total, área);
- `BudgetNumberGenerator` (sequencial por empresa, sem race condition);
- `BudgetStatusTransitionService` (transições válidas).

### 2. Feature tests — Endpoints da API

Cada endpoint precisa de testes para:

- Cenário de sucesso;
- Cenários de erro (validação, autorização, not found);
- Autenticação obrigatória.

### 3. Tenant isolation tests

**Críticos.** Garantem que usuário da empresa A nunca acessa dados da empresa B.

```php
it('does not list customers from other tenants', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    Customer::factory()->for($companyA)->count(3)->create();
    Customer::factory()->for($companyB)->count(2)->create();

    $userA = User::factory()->for($companyA)->create();
    actingAs($userA);

    getJson('/api/customers')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});
```

### 4. Policy tests

Cada Policy precisa cobrir:

- Permissão concedida ao dono;
- Permissão negada a outro tenant;
- Permissão negada a usuário não autenticado.

---

## Convenções de nomenclatura

### Backend (Pest)

```php
it('calculates total area for per_m2 product', function () {
    // ...
});

it('rejects budget update when status is approved', function () {
    // ...
});
```

### Frontend (Vitest)

```ts
describe('CustomerForm', () => {
  it('shows validation error when name is empty', () => {
    // ...
  });
});
```

---

## Organização dos testes

### Backend

```
backend/tests/
├── Feature/
│   ├── Budgets/
│   ├── Customers/
│   └── Products/
├── Unit/
│   ├── Services/
│   └── Calculations/
└── TestCase.php
```

### Frontend

Testes ficam **ao lado do código** que testam:

```
modules/customers/components/CustomerForm.tsx
modules/customers/components/CustomerForm.test.tsx
```

---

## Workflow de TDD na prática

1. Leia o requisito;
2. Escreva o teste que descreve o comportamento esperado;
3. Rode o teste — ele **deve falhar** (red);
4. Implemente o mínimo para o teste passar (green);
5. Refatore (refactor);
6. Repita para o próximo comportamento;
7. Antes do commit, rode toda a suíte;
8. Antes do PR, rode lint + análise estática.

---

## O que NÃO testar

- Código de framework (Laravel já está testado);
- Getters/setters triviais;
- Bibliotecas de terceiros.

## O que SEMPRE testar

- Services de cálculo;
- Regras de transição de status;
- Geração de número de orçamento;
- Isolamento por tenant;
- Endpoints da API (happy path + erros);
- Policies;
- Formulários com validação não-trivial.
# 07 — Multi-Tenancy

## Estratégia adotada

**Single database, shared schema, discriminator column** (`company_id`).

Razões:

- Simplicidade operacional (um único banco);
- Backup unificado;
- Fácil de migrar para schema-per-tenant no futuro se necessário;
- Adequado ao volume esperado do MVP.

---

## Conceito

Cada empresa é um **tenant** (`Company`). Todo dado de negócio está associado a um `company_id`.

Usuários pertencem a uma empresa. O tenant atual é deduzido do usuário autenticado:

```php
auth()->user()->company_id
```

---

## Implementação obrigatória

### 1. Trait `BelongsToTenant`

Aplicada em todos os models tenant-aware:

```php
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            if (! $model->company_id && auth()->check()) {
                $model->company_id = auth()->user()->company_id;
            }
        });
    }
}
```

### 2. Global Scope

```php
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check()) {
            $builder->where(
                $model->getTable().'.company_id',
                auth()->user()->company_id
            );
        }
    }
}
```

### 3. Observer / creating event

Preenche `company_id` automaticamente ao criar um registro (já incluído no trait acima).

### 4. Middleware `EnsureTenantContext`

Valida que toda rota autenticada possui um tenant ativo:

```php
public function handle($request, Closure $next)
{
    if (auth()->check() && ! auth()->user()->company_id) {
        abort(403, 'No tenant context.');
    }
    return $next($request);
}
```

### 5. Policies

Toda Policy deve validar `company_id`:

```php
public function update(User $user, Customer $customer): bool
{
    return $user->company_id === $customer->company_id;
}
```

> Mesmo com Global Scope, valide na Policy como **defesa em profundidade**.

### 6. Testes de isolamento

**Obrigatórios** para cada recurso tenant-aware. Ver `06-testing.md`.

---

## Tabelas tenant-aware

Todas exigem `company_id` indexado:

- `users`
- `customers`
- `products`
- `product_lines`
- `product_colors`
- `glass_types`
- `budgets`
- `budget_items` (indireta, via `budget_id`)
- `budget_status_histories` (indireta, via `budget_id`)

---

## Regras inegociáveis

1. **Nunca usar `Model::withoutGlobalScopes()`** sem revisão explícita no PR;
2. **Toda query nova** deve respeitar o tenant scope automaticamente;
3. **Toda Policy** valida `company_id` (defesa em profundidade);
4. **Toda migration** que cria tabela tenant-aware inclui `company_id` + index;
5. **Toda factory** preenche `company_id` corretamente;
6. **Testes de vazamento** entre tenants são obrigatórios.

---

## Exceções permitidas

### Rotas públicas (link público do orçamento)

A rota `/api/public/budgets/{token}` não tem usuário autenticado. O tenant é deduzido do **próprio orçamento** (`Budget` carregado via token).

Nesse caso:

- Não há `auth()->user()`;
- O scope global é ignorado por não haver contexto;
- A consulta é feita explicitamente: `Budget::where('public_token', $token)->first()`;
- Apenas dados do orçamento são expostos.

### Jobs / Commands

Jobs em background podem rodar sem usuário autenticado. Quando precisarem atuar sobre dados de um tenant específico, devem **definir o contexto manualmente** ou consultar com filtros explícitos.

---

## UUID v7

Complementar ao multi-tenancy:

- **UUID v7** em todas as PKs (ordenáveis temporalmente);
- Evita exposição de IDs sequenciais;
- Permite geração no frontend antes do POST;
- Facilita merge de bases.

Helper sugerido:

```php
$id = (string) Str::uuid7();
```

Ou via Ramsey UUID:

```php
use Ramsey\Uuid\Uuid;
$id = Uuid::uuid7()->toString();
```

---

## Checklist ao criar nova entidade

- [ ] Migration tem `company_id` (UUID) com FK e index;
- [ ] Model usa trait `BelongsToTenant`;
- [ ] Factory preenche `company_id`;
- [ ] Policy valida `company_id` em todas as ações;
- [ ] Testes de isolamento entre tenants implementados;
- [ ] Endpoints documentados em `04-api-spec.md`.
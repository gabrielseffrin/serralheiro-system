# 04 — Especificação da API

API REST consumida pelo SPA React. Autenticação via **Laravel Sanctum** (token).

Base URL: `/api`

---

## Convenções

- Todas as rotas autenticadas exigem header `Authorization: Bearer {token}`;
- Tenant é deduzido do usuário autenticado (não vai no header);
- Respostas em JSON, usando API Resources do Laravel;
- IDs são UUID v7;
- Erros seguem padrão Laravel (`422` validação, `403` policy, `404` not found, `401` não autenticado).

---

## Autenticação

```
POST   /api/auth/login              # { email, password } → { token, user }
POST   /api/auth/logout             # revoga token
POST   /api/auth/forgot-password    # { email } → envia e-mail
POST   /api/auth/reset-password     # { token, email, password }
GET    /api/auth/me                 # dados do usuário autenticado
```

---

## Empresa (tenant atual)

```
GET    /api/company                 # dados da empresa do usuário
PUT    /api/company                 # atualizar dados
POST   /api/company/logo            # upload de logo
```

---

## Clientes

```
GET    /api/customers               # lista paginada
GET    /api/customers/{id}
POST   /api/customers
PUT    /api/customers/{id}
DELETE /api/customers/{id}
GET    /api/customers/{id}/budgets  # histórico de orçamentos
```

---

## Produtos

```
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

---

## Catálogos auxiliares

```
GET    /api/product-lines
POST   /api/product-lines
PUT    /api/product-lines/{id}
DELETE /api/product-lines/{id}

GET    /api/product-colors          # query ?type=profile|accessory
POST   /api/product-colors
PUT    /api/product-colors/{id}
DELETE /api/product-colors/{id}

GET    /api/glass-types
POST   /api/glass-types
PUT    /api/glass-types/{id}
DELETE /api/glass-types/{id}
```

---

## Orçamentos

```
GET    /api/budgets                       # lista paginada, com filtros
GET    /api/budgets/{id}
POST   /api/budgets
PUT    /api/budgets/{id}                  # apenas se status = draft
DELETE /api/budgets/{id}                  # apenas se status = draft

POST   /api/budgets/{id}/items            # adicionar item
PUT    /api/budgets/{id}/items/{itemId}
DELETE /api/budgets/{id}/items/{itemId}

POST   /api/budgets/{id}/status           # { to_status, notes? }
POST   /api/budgets/{id}/pdf              # gera e retorna PDF (stream)
POST   /api/budgets/{id}/duplicate        # cria novo budget como draft
POST   /api/budgets/{id}/new-version      # cria nova versão
GET    /api/budgets/{id}/history          # histórico de status
```

### Filtros disponíveis em `GET /api/budgets`

- `status` (csv)
- `customer_id`
- `from_date` / `to_date`
- `search` (número, cliente)
- `page`, `per_page`

---

## Rota Pública (sem autenticação)

Acessada via link compartilhado com o cliente final.

```
GET    /api/public/budgets/{token}        # visualiza orçamento + marca como viewed
GET    /api/public/budgets/{token}/pdf    # download do PDF
POST   /api/public/budgets/{token}/approve # { signer_name }
POST   /api/public/budgets/{token}/reject  # { reason }
```

**Segurança:**

- Token de 64 caracteres (`Str::random(64)`);
- Rate limit por IP;
- Expira automaticamente após `expiration_date`;
- Captura IP + user agent + timestamp na aprovação.

---

## Dashboard

```
GET    /api/dashboard/summary
```

Retorna:

```json
{
  "budgets_count": 42,
  "budgets_total_value": 158430.00,
  "pending_count": 12,
  "approved_count": 18,
  "conversion_rate": 0.42,
  "recent_budgets": [...]
}
```

---

## Padrão de resposta

### Sucesso

```json
{
  "data": { ... },
  "meta": { ... }
}
```

### Lista paginada

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 142
  }
}
```

### Erro de validação

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["O campo nome é obrigatório."]
  }
}
```
# 03 — Modelo de Dados

> Todas as PKs são **UUID v7**. Todas as tabelas tenant-aware têm `company_id` com Global Scope (ver `07-multi-tenancy.md`).

---

## Tabela `users`

```
User
- id (UUID v7)
- name
- email (unique)
- password
- company_id (UUID, FK companies)
- created_at
- updated_at
```

---

## Tabela `companies`

```
Company
- id (UUID v7)
- name
- trade_name
- document            // CNPJ
- phone
- email
- address
- logo                // path / URL
- default_notes       // observações padrão para orçamentos
- default_payment_method
- default_delivery_term
- default_warranty_term
- created_at
- updated_at
```

---

## Tabela `customers`

```
Customer
- id (UUID v7)
- company_id (UUID, FK)
- name
- phone
- email
- document            // CPF/CNPJ
- address
- notes
- created_at
- updated_at
```

---

## Tabela `products`

```
Product
- id (UUID v7)
- company_id (UUID, FK)
- name                // ex: "Porta de Correr 04 Folhas"
- description
- default_line_id (UUID, FK product_lines, nullable)
- pricing_type        // fixed | per_m2 | per_meter | per_kg
- base_price          // decimal(12,4)
- requires_dimensions // boolean
- min_width           // int (mm)
- min_height          // int (mm)
- active              // boolean
- created_at
- updated_at
```

---

## Tabela `product_lines`

```
ProductLine
- id (UUID v7)
- company_id (UUID, FK)
- name                // ex: "L. Gold", "L. Suprema"
- active
- created_at
- updated_at
```

---

## Tabela `product_colors`

```
ProductColor
- id (UUID v7)
- company_id (UUID, FK)
- name
- hex                 // ex: "#1a1a1a"
- type                // profile | accessory
- created_at
- updated_at
```

---

## Tabela `glass_types`

```
GlassType
- id (UUID v7)
- company_id (UUID, FK)
- name                // ex: "Laminado Incolor 3+3"
- description
- created_at
- updated_at
```

---

## Tabela `budgets`

```
Budget
- id (UUID v7)
- company_id (UUID, FK)
- customer_id (UUID, FK)
- number              // sequencial por empresa
- version             // default 1
- parent_budget_id    // UUID, nullable — versão anterior
- status              // draft|sent|viewed|negotiating|approved|rejected|expired
- subtotal            // decimal(12,2)
- discount            // decimal(12,2)
- total               // decimal(12,2)
- expiration_date     // date — validade do orçamento
- payment_method      // string
- delivery_term       // string
- warranty_term       // string
- notes
- public_token        // string(64), unique
- created_at
- updated_at
```

**Constraints:**

- `UNIQUE (company_id, number, version)`;
- `UNIQUE (public_token)`;
- Index em `(company_id, status)`.

**Geração do `number`:**

Via `BudgetNumberGenerator` Service, com transação + `SELECT ... FOR UPDATE`, garantindo sequência sem race condition.

Formato de exibição: `#000123` (6 dígitos zero-padded). Com versão: `#000123 v2`.

---

## Tabela `budget_items`

```
BudgetItem
- id (UUID v7)
- budget_id (UUID, FK)
- product_id (UUID, FK)
- tag                 // ex: P01, P02, J1 — referência visual
- location            // ambiente / local de instalação
- quantity            // int
- width               // int (mm)
- height              // int (mm)
- calculated_area     // decimal(10,4) — m² computado
- weight              // decimal(10,3) — peso informado em kg
- line_id             // UUID, FK product_lines
- profile_color_id    // UUID, FK product_colors (type=profile)
- glass_type_id       // UUID, FK glass_types
- accessory_color_id  // UUID, FK product_colors (type=accessory)
- unit_price          // decimal(12,4)
- total               // decimal(12,2)
- delivery_date       // date, nullable — entrega individual
- notes
- image_path          // path opcional
- created_at
- updated_at
```

---

## Tabela `budget_status_histories`

```
BudgetStatusHistory
- id (UUID v7)
- budget_id (UUID, FK)
- from_status
- to_status
- changed_by          // user_id (UUID) | 'system' | 'customer'
- changed_at
- notes
- created_at
```

Permite cálculo de **taxa de conversão**, **tempo médio em cada status** e **funil de vendas**.

---

## Cálculo de valores

O Service de cálculo respeita `pricing_type`:

| Tipo | Fórmula |
|---|---|
| `fixed` | `unit_price` informado manualmente |
| `per_m2` | `base_price × (width × height / 1.000.000)` |
| `per_meter` | `base_price × perímetro` |
| `per_kg` | `base_price × peso` |

Total do item: `unit_price × quantity`.
Subtotal do orçamento: soma de todos os itens.
Total: `subtotal - discount`.

---

## Diagrama de relacionamento (resumo)

```
Company 1 ── n User
Company 1 ── n Customer
Company 1 ── n Product
Company 1 ── n ProductLine
Company 1 ── n ProductColor
Company 1 ── n GlassType
Company 1 ── n Budget

Customer 1 ── n Budget
Budget 1 ── n BudgetItem
Budget 1 ── n BudgetStatusHistory
Budget n ── 1 Budget (parent_budget_id — versionamento)

BudgetItem n ── 1 Product
BudgetItem n ── 1 ProductLine
BudgetItem n ── 1 GlassType
BudgetItem n ── 1 ProductColor (profile)
BudgetItem n ── 1 ProductColor (accessory)
```
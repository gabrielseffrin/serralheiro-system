# 01 — Arquitetura

## Padrão arquitetural

**Monolito Modular em Monorepo.**

Justificativa:

- Velocidade de desenvolvimento;
- Baixa complexidade operacional;
- Organização de código por contexto de negócio;
- Possibilidade de extrair módulos no futuro se necessário;
- Domínio inicial não justifica microserviços.

---

## Estrutura do monorepo

```
serralheiro-system/
├── backend/              # API Laravel
├── frontend/             # SPA React
├── docs/                 # Documentação
├── docker-compose.yml
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

---

## Backend

### Tecnologia

- Laravel 12
- PHP 8.3
- PostgreSQL 16
- Laravel Sanctum (autenticação API)
- Pest PHP (testes)
- Browsershot (PDF)

### Organização modular

```
backend/app/Modules/
├── Auth/
├── Companies/
├── Customers/
├── Products/
└── Budgets/
```

Cada módulo:

```
Module/
├── Models/
├── Controllers/
├── Services/
├── Requests/
├── Policies/
└── Resources/
```

### Responsabilidades

- Regras de negócio (em `Services`);
- Persistência (Eloquent);
- Autenticação (Sanctum);
- Geração de documentos (Browsershot);
- API REST.

---

## Frontend

### Tecnologia

- React 18
- TypeScript (strict)
- Vite
- TailwindCSS
- shadcn/ui
- React Query
- React Hook Form + Zod
- Axios

### Estrutura

```
frontend/src/
├── modules/
│   ├── customers/
│   ├── products/
│   └── budgets/
├── components/
├── layouts/
├── services/
└── routes/
```

### Responsabilidades

- Interface do usuário;
- Validação de formulários (Zod);
- Consumo da API (React Query + Axios);
- Estado da aplicação.

---

## Banco de Dados — PostgreSQL

Escolha baseada em:

- Excelente suporte relacional;
- JSONB para dados semiestruturados;
- Suporte nativo a UUID;
- Recursos avançados para relatórios futuros;
- Boa escalabilidade.

Tabelas iniciais:

```
users
companies
customers
products
product_lines
product_colors
glass_types
budgets
budget_items
budget_status_histories
```

Todas as PKs em **UUID v7**.

---

## Infraestrutura — Docker

Containers do MVP:

```
nginx
backend
frontend
postgres
```

> Redis **não está no MVP**. Será reintroduzido quando houver demanda real (filas, cache, rate limiting distribuído).

---

## Estratégia de Deploy

- Hospedagem: VPS, cloud privada ou servidor interno;
- Docker garante paridade entre dev / homolog / produção;
- CI/CD planejado para fase futura (ver `08-roadmap.md` e `adr/`).

---

## Diretrizes arquiteturais

1. **Controllers magros**, regra de negócio em `Services`;
2. **Validação** sempre em Form Requests;
3. **Saída de API** sempre via Resources;
4. **Tenant scope** automático via Global Scope;
5. **UUIDs gerados** preferencialmente no servidor (ou no front quando justificado);
6. **Testes** em Pest (backend) e Vitest (frontend), TDD obrigatório.
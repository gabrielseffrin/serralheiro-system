# Sistema de Gestão de Orçamentos para Serralheria

## Sobre o projeto

SaaS B2B para serralherias gerenciarem orçamentos comerciais profissionais.
Multi-tenant, monolito modular em monorepo, Laravel 12 + React + PostgreSQL.

Substitui processos manuais (planilhas, documentos individuais) por uma plataforma centralizada de criação, gerenciamento e emissão de orçamentos.

---

## Regras inegociáveis (NÃO VIOLAR)

1. **TDD obrigatório**: todo código novo nasce de um teste que falha (red → green → refactor).
2. **Multi-tenancy**: toda query tenant-aware DEVE passar pelo Global Scope. Nunca usar `Model::withoutGlobalScopes()` sem revisão explícita.
3. **UUIDs v7** em todas as PKs. Nunca `bigint` autoincrement.
4. **Numeração de orçamento** é sequencial POR EMPRESA (não global). Use `BudgetNumberGenerator` com transação.
5. **Toda alteração em domínio** requer atualização dos testes correspondentes.
6. **PR sem teste não é aceito.** Cobertura mínima de 80% em Services e regras de domínio.
7. **Controllers magros**: lógica de negócio vive em `Services`.

---

## Stack

- **Backend:** Laravel 12, PHP 8.3, PostgreSQL 16, Laravel Sanctum, Pest PHP
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Infra:** Docker Compose
- **PDF:** Browsershot (Chrome headless)

---

## Estrutura do monorepo

```
serralheiro-system/
├── backend/          # API Laravel (app/Modules/)
├── frontend/         # SPA React
├── docs/             # Documentação técnica detalhada
├── docker-compose.yml
├── CLAUDE.md         # (este arquivo)
└── AGENTS.md         # Instruções genéricas para outros agentes
```

---

## Comandos frequentes

```bash
# Subir ambiente
docker compose up -d
docker compose down

# Backend
docker compose exec backend php artisan migrate
docker compose exec backend php artisan test
docker compose exec backend ./vendor/bin/pest
docker compose exec backend ./vendor/bin/pest --filter=NomeDoTeste
docker compose exec backend ./vendor/bin/pint
docker compose exec backend ./vendor/bin/phpstan analyse

# Frontend
docker compose exec frontend npm run dev
docker compose exec frontend npm run test
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

---

## Onde buscar contexto adicional

| Tópico | Arquivo |
|---|---|
| Visão geral / escopo | `docs/00-overview.md` |
| Arquitetura | `docs/01-architecture.md` |
| Domínio do negócio | `docs/02-domain.md` |
| Modelo de dados | `docs/03-data-model.md` |
| Especificação da API | `docs/04-api-spec.md` |
| Frontend | `docs/05-frontend.md` |
| Testes e TDD | `docs/06-testing.md` |
| Multi-tenancy | `docs/07-multi-tenancy.md` |
| Roadmap | `docs/08-roadmap.md` |
| Decisões arquiteturais | `docs/adr/` |

---

## Convenções de código

### Backend (Laravel)

- PSR-12 + Laravel Pint;
- Estrutura modular em `app/Modules/{Modulo}/`;
- Cada módulo contém: `Models/`, `Controllers/`, `Services/`, `Requests/`, `Policies/`, `Resources/`;
- Form Requests para validação (nunca validar no Controller);
- API Resources para serialização de saída;
- Pest PHP para testes (não PHPUnit puro);
- Sempre usar `Str::uuid7()` ou helper equivalente para PKs.

### Frontend (React)

- TypeScript strict mode;
- Componentes funcionais + hooks;
- **React Query** para estado de servidor;
- **React Hook Form + Zod** para formulários;
- **shadcn/ui** para componentes base;
- Estrutura por módulo (`src/modules/{modulo}/`).

---

## Workflow ao implementar nova funcionalidade

1. **Leia** o requisito em `docs/` e ADRs relacionados;
2. **Apresente um plano** antes de codar (em poucas linhas);
3. **Escreva o teste que falha** (Pest no backend / Vitest no frontend);
4. **Implemente o mínimo** para o teste passar;
5. **Refatore** mantendo testes verdes;
6. **Rode lint e análise estática** antes de finalizar;
7. **Atualize a documentação** se mudar contrato, modelo ou decisão técnica.

---

## O que NÃO fazer

- ❌ Criar migration com PK em `bigint` ou `int` autoincrement;
- ❌ Endpoint sem teste de feature;
- ❌ Query sem respeitar tenant scope;
- ❌ Lógica de negócio em Controller (vai para Service);
- ❌ Commit sem rodar `pest` e `vitest`;
- ❌ Adicionar dependências sem justificar no PR;
- ❌ Modificar documentação sem refletir em código (ou vice-versa);
- ❌ Usar Redis no MVP (foi removido por decisão consciente — ver ADR);
- ❌ Bypassar `BelongsToTenant` sem revisão explícita.

---

## Glossário rápido

- **Tenant** = Empresa (Company);
- **Orçamento** = Budget (sempre versionado e numerado por empresa);
- **Item** = BudgetItem (com tag, ambiente, dimensões, cor, vidro);
- **Link público** = URL com `public_token` para o cliente final visualizar/aprovar sem login.
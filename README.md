# Serralheiro System

SaaS B2B multi-tenant para serralherias gerenciarem orçamentos comerciais profissionais.

## Stack

- **Backend:** Laravel 12, PHP 8.3+, PostgreSQL 16
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Infra:** Docker Compose (nginx, backend, frontend, postgres)
- **Testes:** Pest PHP (backend), Vitest + Testing Library (frontend)

## Quick Start

### Pré-requisitos

- Docker e Docker Compose
- (ou) PHP 8.3+, Composer, Node 20+, PostgreSQL 16

### Subindo com Docker

```bash
# Clonar o repositório
git clone <repo-url> serralheiro-system
cd serralheiro-system

# Subir todos os serviços
docker compose up -d

# Acessar a aplicação
open http://localhost
```

O entrypoint do backend executa automaticamente:
1. `composer install`
2. `php artisan key:generate` (se necessário)
3. `php artisan migrate`
4. `php artisan serve`

### Subindo localmente (sem Docker)

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## Comandos Úteis

```bash
# Backend
docker compose exec backend php artisan test          # Rodar testes
docker compose exec backend ./vendor/bin/pest         # Pest direto
docker compose exec backend ./vendor/bin/pint         # Lint PHP
docker compose exec backend ./vendor/bin/phpstan analyse  # Análise estática

# Frontend
docker compose exec frontend npm run test             # Rodar testes
docker compose exec frontend npm run lint             # Lint TypeScript
docker compose exec frontend npm run build            # Build produção
```

## Estrutura do Monorepo

```
serralheiro-system/
├── backend/          # API Laravel (app/Modules/)
├── frontend/         # SPA React (src/modules/)
├── docker/           # Dockerfiles e configurações
│   ├── backend/
│   ├── frontend/
│   └── nginx/
├── docs/             # Documentação técnica
│   ├── 00-overview.md
│   ├── 01-architecture.md
│   ├── ...
│   └── adr/          # Architecture Decision Records
├── docker-compose.yml
├── CLAUDE.md         # Instruções para Claude
├── AGENTS.md         # Instruções para outros agentes
└── README.md         # Este arquivo
```

## Documentação

| Tópico | Arquivo |
|---|---|
| Visão geral | `docs/00-overview.md` |
| Arquitetura | `docs/01-architecture.md` |
| Domínio | `docs/02-domain.md` |
| Modelo de dados | `docs/03-data-model.md` |
| API REST | `docs/04-api-spec.md` |
| Frontend | `docs/05-frontend.md` |
| Testes e TDD | `docs/06-testing.md` |
| Multi-tenancy | `docs/07-multi-tenancy.md` |
| Roadmap | `docs/08-roadmap.md` |

## Regras do Projeto

- **TDD obrigatório** — toda feature nasce de um teste que falha
- **Multi-tenancy** — todo dado filtrado por `company_id` via Global Scope
- **UUID v7** em todas as PKs
- **Controllers magros** — lógica em Services
- **PR sem teste é rejeitado**

## Licença

Proprietário. Todos os direitos reservados.

# AGENTS.md

> Instruções gerais para agentes de IA (Claude Code, Antigravity CLI, Cursor, Aider, Codex, etc.) que trabalharem neste repositório.

Este arquivo segue a convenção emergente `AGENTS.md`. O conteúdo é equivalente ao `CLAUDE.md`, mantido por compatibilidade com diferentes ferramentas. Em caso de divergência, **`CLAUDE.md` prevalece**.

---

## Resumo do projeto

SaaS B2B multi-tenant para serralherias gerenciarem orçamentos comerciais.
Stack: **Laravel 12 + React 18 + PostgreSQL 16 + Docker**, em monorepo com monolito modular.

---

## Regras inegociáveis

1. **TDD obrigatório** — toda feature nasce de um teste que falha.
2. **Multi-tenancy via `company_id`** com Global Scope. Nunca bypassar.
3. **UUID v7** em todas as PKs.
4. **Numeração de orçamento é sequencial por empresa.**
5. **Controllers magros**, lógica em Services.
6. **PR sem teste é rejeitado.**

---

## Antes de codar

1. Leia `CLAUDE.md`;
2. Consulte os arquivos relevantes em `docs/`;
3. Apresente um plano curto antes de executar;
4. Confirme em qual fase do roadmap (`docs/08-roadmap.md`) a tarefa se encaixa.

---

## Comandos essenciais

```bash
docker compose up -d
docker compose exec backend php artisan test
docker compose exec backend ./vendor/bin/pest
docker compose exec frontend npm run test
docker compose exec frontend npm run lint
```

---

## Documentação fatiada

```
docs/
├── 00-overview.md       # Visão geral
├── 01-architecture.md   # Arquitetura
├── 02-domain.md         # Domínio
├── 03-data-model.md     # Modelo de dados
├── 04-api-spec.md       # API REST
├── 05-frontend.md       # Estrutura frontend
├── 06-testing.md        # TDD
├── 07-multi-tenancy.md  # Multi-tenant
├── 08-roadmap.md        # Roadmap
└── adr/                 # Architecture Decision Records
```

---

## Princípios de execução para agentes

- **Pergunte se houver ambiguidade**, não invente requisitos;
- **Não introduza dependências novas** sem justificar;
- **Não altere arquitetura** (monolito modular, multi-tenant, UUID) sem ADR;
- **Sempre rode os testes** antes de declarar a tarefa concluída;
- **Reporte mudanças em contratos públicos** (API, eventos, modelos).

---

## O que NÃO fazer

- Criar migration sem UUID;
- Endpoint sem teste de feature;
- Lógica em Controller;
- Reintroduzir Redis (removido por decisão consciente do MVP);
- Modificar documentação sem refletir em código.
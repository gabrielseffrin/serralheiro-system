# 08 — Roadmap

## Visão geral

Entrega incremental em **5 fases**. Cada fase produz software funcional e testado.

---

## Fase 1 — Base

**Objetivo:** ambiente rodando + autenticação + estrutura modular pronta.

Entregas:

- Configuração do monorepo;
- Docker Compose (nginx, backend, frontend, postgres);
- Laravel 12 instalado + estrutura modular (`app/Modules/`);
- React + Vite + TailwindCSS + shadcn/ui inicializados;
- Setup de testes (Pest, Vitest, MSW);
- Setup de TDD (regra de PR);
- Autenticação (Sanctum + login/logout/forgot password — log mailer em dev);
- Layout inicial (AppLayout, AuthLayout);
- Trait `BelongsToTenant` + `TenantScope` + middleware;
- ADRs iniciais documentados.

---

## Fase 2 — Cadastros

**Objetivo:** todos os cadastros básicos prontos.

Entregas:

- CRUD de **Empresa** (dados, logo, defaults);
- CRUD de **Clientes**;
- CRUD de **Produtos**;
- CRUD de catálogos: **Linhas**, **Cores** (perfil/acessório), **Tipos de Vidro**;
- Testes feature de todos os endpoints;
- Testes de isolamento de tenant.

---

## Fase 3 — Orçamentos

**Objetivo:** núcleo do sistema funcional.

Entregas:

- Modelo `Budget` + `BudgetItem`;
- `BudgetNumberGenerator` (sequencial por empresa);
- Cálculo automático (`per_m2`, `per_meter`, `fixed`);
- CRUD de orçamento;
- Adicionar/editar/remover itens;
- Transição de status com histórico (`budget_status_histories`);
- Duplicação de orçamento;
- Versionamento de orçamento;
- Dashboard inicial com indicadores básicos.

---

## Fase 4 — Documentos

**Objetivo:** geração e compartilhamento de propostas.

Entregas:

- Template Blade do orçamento (Tailwind);
- Geração de PDF via **Browsershot**;
- Download de PDF autenticado;
- **Link público** (`/api/public/budgets/{token}` + página `/p/:token`);
- Captura de aprovação/rejeição pelo cliente;
- Marcação automática de status `viewed`;
- Job diário para marcar orçamentos como `expired`.

---

## Fase 5 — Evolução (pós-MVP)

Backlog de funcionalidades futuras, sem prazo definido:

- **E-mail transacional** (Resend ou similar) em produção;
- **CI/CD completo** (GitHub Actions + deploy automático);
- **Persistência de PDF** em storage (S3) com versionamento imutável;
- **Estoque** e controle de materiais;
- **Composição de produtos** (BOM — lista técnica);
- **Ordem de produção**;
- **Módulo financeiro** (recebíveis, contas a pagar);
- **App mobile** para vendedor externo;
- **Importação em lote** de produtos / clientes;
- **Reintrodução do Redis** para filas + cache;
- **Relatórios avançados** (BI).

---

## Critérios para fechar uma fase

- Todas as entregas implementadas;
- Cobertura de testes ≥ 80% nos Services de domínio;
- Testes de isolamento de tenant verdes;
- Documentação atualizada (`docs/`);
- Lint + análise estática sem erros;
- Smoke test manual aprovado.

---

## Não-objetivos do MVP (lembrete)

- ❌ Microserviços;
- ❌ Cache distribuído / Redis;
- ❌ Gateway de pagamento;
- ❌ App mobile;
- ❌ Multi-idioma;
- ❌ White-label além do logo da empresa.
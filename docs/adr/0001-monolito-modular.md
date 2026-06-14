# ADR 0001 — Monolito Modular em Monorepo

**Status:** Aceito
**Data:** 2025-01
**Decisores:** time técnico

---

## Contexto

O sistema é um SaaS B2B para serralherias, com domínio inicial focado em orçamentos. O time é pequeno e a complexidade do domínio é moderada.

Foi avaliado:

- Monolito tradicional;
- Monolito modular (com fronteiras explícitas);
- Microserviços.

---

## Decisão

Adotar **monolito modular em monorepo**, com backend (Laravel) e frontend (React) em pastas separadas dentro do mesmo repositório.

A organização interna do backend segue `app/Modules/{Modulo}/`, com cada módulo contendo `Models`, `Controllers`, `Services`, `Requests`, `Policies` e `Resources`.

---

## Consequências

### Positivas

- Velocidade de desenvolvimento;
- Baixa complexidade operacional (um deploy, um banco);
- Fronteiras claras entre contextos (Customers, Products, Budgets);
- Possibilidade de extrair módulos no futuro se necessário;
- Onboarding simples para novos devs.

### Negativas

- Risco de acoplamento se as fronteiras não forem respeitadas;
- Necessidade de disciplina arquitetural;
- Escalabilidade horizontal exige soluções de sessão / cache compartilhado (não relevante no MVP).

---

## Alternativas descartadas

### Microserviços

Descartados porque:

- Domínio inicial não justifica;
- Custo operacional alto (orquestração, observabilidade, contratos);
- Time pequeno.

### Monolito tradicional sem módulos

Descartado por dificultar evolução e manter código orgânico difícil de refatorar.
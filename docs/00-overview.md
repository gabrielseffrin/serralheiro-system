# 00 — Visão Geral

## Propósito

Sistema web para **gestão comercial de empresas de serralheria**, com foco inicial na criação, gerenciamento e emissão de orçamentos profissionais para clientes finais.

O objetivo do MVP é **substituir processos manuais** (planilhas, documentos e cálculos individuais) por uma plataforma centralizada.

---

## O que o MVP entrega

- Cadastro de clientes;
- Cadastro de produtos e serviços (com dimensões, linhas, cores e vidros);
- Criação e edição de orçamentos;
- Cálculo automático de valores (por m², metro linear, preço fixo);
- Geração de documentos em PDF;
- Padronização da proposta comercial;
- Link público para o cliente visualizar e aprovar;
- Dashboard com indicadores básicos.

---

## O que NÃO faz parte do MVP

- Gestão de estoque;
- Composição de materiais / lista técnica;
- Ordem de produção;
- Módulo financeiro (recebíveis, contas a pagar);
- Aplicativo mobile;
- Integração com gateway de pagamento (o pagamento ocorre fora da plataforma);
- Cache distribuído / Redis (removido conscientemente).

---

## Princípios

- **Arquitetura preparada para evolução**, sem over-engineering;
- **Velocidade de entrega** sem sacrificar qualidade (TDD obrigatório);
- **Isolamento por empresa** (multi-tenancy nativo desde o dia 1);
- **Documentação viva**, próxima do código.

---

## Público-alvo

- **Cliente do sistema:** empresas de serralheria (tenant);
- **Usuário interno:** vendedor / orçamentista da serralheria;
- **Usuário externo:** cliente final da serralheria, que recebe o orçamento via link público.

---

## Decisão técnica final

Monolito modular em monorepo, Laravel 12 (backend) + React (frontend), PostgreSQL, Docker. Multi-tenant via `company_id` com Global Scope. UUID v7 em todas as PKs. TDD obrigatório.

Detalhamento em `01-architecture.md` e `adr/`.
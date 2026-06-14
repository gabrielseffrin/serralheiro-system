# ADR 0004 — TDD obrigatório em todo o projeto

**Status:** Aceito
**Data:** 2025-01

---

## Contexto

O sistema lida com **cálculos financeiros** (orçamentos, descontos, totais), **transições de status** com regras de negócio, e **isolamento multi-tenant** crítico para segurança.

Bugs nessas áreas geram impacto direto no cliente (valores errados, vazamento de dados). O custo de prevenção via testes é muito menor que o custo de correção.

---

## Decisão

**TDD obrigatório** para todo código novo no projeto.

Ciclo:

```
🔴 Red       → escrever um teste que falha
🟢 Green     → escrever o mínimo para o teste passar
🔵 Refactor  → melhorar o código mantendo testes verdes
```

### Regras

1. **Toda nova funcionalidade nasce de um teste que falha;**
2. **Pull Request sem teste correspondente é rejeitado;**
3. **Cobertura mínima de 80%** nos módulos de domínio (Services, cálculos, regras);
4. **Testes de isolamento entre tenants** são obrigatórios para cada recurso tenant-aware;
5. **Toda transição de status** tem teste cobrindo cenários válidos e inválidos;
6. **Lint + análise estática** rodam junto com os testes antes do merge.

---

## Consequências

### Positivas

- Redução drástica de regressões;
- Documentação executável do comportamento esperado;
- Segurança para refatorar;
- Onboarding mais rápido (novos devs leem os testes);
- Confiança ao alterar regras de negócio sensíveis (cálculos, status, tenant).

### Negativas

- Tempo inicial maior por feature;
- Requer disciplina do time;
- Necessidade de manter factories e fixtures atualizadas;
- Pode gerar fricção se não houver cultura prévia de testes.

---

## Stack

### Backend (Laravel)

- **Pest PHP** (principal);
- **PHPUnit** (subjacente);
- **Database transactions** entre testes;
- **Factories** obrigatórias para todos os models.

### Frontend (React)

- **Vitest** para unit tests;
- **Testing Library** para componentes;
- **MSW** para mock de API.

---

## Detalhamento

Ver `docs/06-testing.md` para a estratégia completa, tipos de teste obrigatórios, convenções e exemplos.

---

## Alternativas descartadas

### Testes apenas após implementação ("test-after")

Descartado porque na prática tende a:

- Reproduzir bugs de implementação;
- Cobrir apenas o "happy path";
- Ser deixado de lado sob pressão de prazo.

### Testes opcionais

Descartado porque a natureza do domínio (cálculos financeiros, multi-tenant) exige garantias.
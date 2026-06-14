# ADR 0005 — Sem Redis no MVP

**Status:** Aceito
**Data:** 2025-01

---

## Contexto

Redis é comumente usado em projetos Laravel para filas, cache e sessões. No entanto, para o MVP deste projeto, a complexidade adicional não se justifica.

O sistema atende um número pequeno de usuários por tenant, sem necessidade de:

- Filas em tempo real;
- Cache distribuído;
- Rate limiting distribuído;
- WebSocket com broadcast.

---

## Decisão

**Não incluir Redis no MVP.**

- Sessões usam `database` driver;
- Cache usa `database` driver;
- Filas usam `sync` driver (execução síncrona);
- Rate limiting usa o driver padrão do Laravel (file/database).

---

## Consequências

### Positivas

- Menos um container para gerenciar;
- Menos complexidade operacional;
- Menos custo de infraestrutura;
- Setup mais simples para novos desenvolvedores.

### Negativas

- Filas são síncronas (geração de PDF pode bloquear o request — aceitável no MVP);
- Cache menos performático que Redis (aceitável para o volume esperado);
- Rate limiting básico (sem distribuição entre instâncias — aceita para deploy single-node).

---

## Quando reintroduzir

Redis será reintroduzido quando houver demanda real:

- Geração de PDF assíncrona (filas);
- Deploy multi-instância com cache/sessão compartilhada;
- WebSocket com Laravel Echo/Broadcasting;
- Rate limiting distribuído.

Ver `08-roadmap.md` — Fase 5.

---

## Alternativas descartadas

### Redis desde o início

Descartado por adicionar complexidade desnecessária ao MVP e ao setup de desenvolvimento.

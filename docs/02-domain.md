# 02 — Domínio do Negócio

## Contexto

Empresas de serralheria produzem itens **sob medida** (portões, janelas, esquadrias, guarda-corpos, etc.) e precisam emitir orçamentos detalhados para clientes finais antes da produção.

O orçamento profissional inclui:

- Identificação visual de cada item (tag tipo P01, J3);
- Local/ambiente de instalação;
- Dimensões (largura × altura);
- Linha do produto, cor do perfil, tipo de vidro, cor de acessório;
- Quantidade, valores unitários e totais;
- Condições comerciais (pagamento, entrega, garantia);
- Validade do orçamento.

---

## Módulos do MVP

### 1. Autenticação

- Login / Logout;
- Recuperação de senha (e-mail — dependência externa);
- Usuários vinculados a uma empresa (`company_id`).

### 2. Empresa (Tenant)

- Dados cadastrais usados no cabeçalho dos PDFs;
- Logo, identidade visual;
- Notas padrão (condições comerciais default).

### 3. Clientes

- CRUD;
- Histórico de orçamentos;
- Pertencem a uma empresa.

### 4. Produtos e Serviços

Catálogo da serralheria. Cada produto tem:

- Tipo de precificação (`fixed`, `per_m2`, `per_meter`, `per_kg`);
- Linha padrão;
- Indicador se requer dimensões;
- Dimensões mínimas (validação).

Catálogos auxiliares:

- **ProductLine** — linha (ex: "L. Gold", "L. Suprema");
- **ProductColor** — cor de perfil ou acessório;
- **GlassType** — tipo de vidro.

### 5. Orçamentos

Núcleo do sistema.

Fluxo:

```
Selecionar cliente
   ↓
Criar orçamento (rascunho)
   ↓
Adicionar itens (com tag, ambiente, dimensões, atributos)
   ↓
Aplicar descontos / condições
   ↓
Gerar PDF
   ↓
Enviar ao cliente (link público)
   ↓
Cliente visualiza → status "viewed"
   ↓
Aprovação / Rejeição / Negociação
```

Cada orçamento tem:

- Número **sequencial por empresa**;
- Versão (suporta versionamento — ver 4.11 e `03-data-model.md`);
- Status com histórico de transições;
- Condições comerciais (pagamento, entrega, garantia);
- Validade (`expiration_date`, ex: 15 dias).

### 6. Geração de PDF

Via **Browsershot**. Templates Blade + Tailwind. Geração on-the-fly no MVP.

Conteúdo do PDF:

- Cabeçalho com empresa + logo;
- Dados do cliente;
- Tabela de itens com todas as características;
- Totais, condições comerciais, validade;
- Espaço para aceite do cliente.

### 7. Dashboard

Indicadores:

- Quantidade de orçamentos;
- Valor total orçado;
- Orçamentos pendentes / aprovados;
- Taxa de conversão.

---

## Aprendizados extraídos do orçamento real do cliente

Análise de um PDF real (modelo Grupo D12) trouxe insights importantes:

1. **Tag do item** (P01, P02, J1, J3) — referência visual essencial;
2. **Local / Ambiente** — onde será instalado (Sala, Cozinha, Sacada);
3. **4 dimensões catalogáveis** — Linha + Cor de Perfil + Vidro + Cor de Acessório;
4. **Data de entrega por item** — diferente da data total do orçamento;
5. **Validade do orçamento** — tipicamente 15 dias (`expiration_date`).

Esses pontos estão refletidos no modelo `BudgetItem` em `03-data-model.md`.

---

## Estados do orçamento

```
draft         → rascunho, em edição
sent          → enviado ao cliente
viewed        → cliente abriu o link público
negotiating   → em negociação / ajustes
approved      → aprovado pelo cliente
rejected      → rejeitado
expired       → vencido (job diário)
```

Toda transição é registrada em `budget_status_histories`.

---

## Condições comerciais

O **pagamento ocorre fora da plataforma**, mas o orçamento registra a condição prevista:

- `payment_method` — ex: "À vista", "50% entrada + 50% entrega";
- `delivery_term` — ex: "30 dias úteis após aprovação";
- `warranty_term` — ex: "12 meses contra defeitos de fabricação".

Valores padrão por empresa, sobrescritos por orçamento.

---

## Funcionalidades complementares

- **Link público** com token (`public_token`) para o cliente visualizar/aprovar sem login;
- **Duplicação de orçamento** (cria novo número, status `draft`);
- **Versionamento** (mesmo número, `version + 1`, anterior vira imutável).
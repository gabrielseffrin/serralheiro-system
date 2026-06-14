# ADR 0003 — Browsershot para geração de PDF

**Status:** Aceito
**Data:** 2025-01

---

## Contexto

O sistema precisa gerar propostas comerciais em PDF com qualidade visual próxima a documentos profissionais (cabeçalho com logo, tabelas estilizadas, tipografia consistente).

Foram avaliados:

- **DomPDF** — puro PHP, sem JS;
- **mPDF** — puro PHP;
- **Snappy / wkhtmltopdf** — Webkit antigo;
- **Browsershot** — Chrome/Puppeteer headless.

---

## Decisão

Adotar **Browsershot** (Chrome headless via Puppeteer).

Templates em **Blade + TailwindCSS** (com CSS print).

---

## Consequências

### Positivas

- Renderização **idêntica ao navegador** (HTML/CSS modernos);
- Suporte completo a Flexbox, Grid, fontes web;
- Permite reaproveitar componentes visuais entre PDF e página pública (HTML);
- Qualidade visual superior aos motores PHP puros;
- Documentação rica (pacote do Spatie).

### Negativas

- Requer **Chrome instalado** no container backend (ou serviço sidecar);
- Imagem Docker maior;
- Tempo de geração ligeiramente maior que DomPDF (~1-2s);
- Maior consumo de memória durante a renderização.

---

## Mitigações

- **Container Docker dedicado** com Chrome headless já configurado;
- Geração **on-the-fly no MVP**, sem persistência;
- Em fase futura: persistir PDF em storage (S3) quando o orçamento for marcado como `sent`, garantindo imutabilidade;
- Eventual migração para fila (assíncrona) se o volume crescer.

---

## Alternativas descartadas

### DomPDF / mPDF

Limitações com CSS moderno (Flexbox, Grid, fontes). Qualidade visual inferior, especialmente para layouts complexos.

### Snappy / wkhtmltopdf

Engine descontinuada (WebKit antigo). Sem suporte ativo. Bugs conhecidos com CSS3.

### Serviço externo (Gotenberg, PDFShift, DocRaptor)

Adiciona dependência externa e custo recorrente. Pode ser considerado no futuro se a geração local virar gargalo.
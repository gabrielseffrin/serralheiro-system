# Memory: Decisões Importantes do Projeto

Este arquivo registra decisões arquiteturais, de infraestrutura e desenvolvimento tomadas pelos agentes de IA durante a execução do projeto.

---

## 🐳 Infraestrutura & Docker (Fase 1)

1. **Portas de Serviço Alternativas:**
   - Para evitar conflitos com serviços locais rodando na máquina host, alteramos as portas padrão no `docker-compose.yml`:
     - **PostgreSQL:** Mapeado do host para a porta `5433:5432`.
     - **Nginx:** Mapeado do host para a porta `8080:80`. A aplicação principal roda em `http://localhost:8080`.
2. **Atualização do PHP (Backend):**
   - Alteramos a imagem base do backend no `Dockerfile` de `php:8.3-cli` para `php:8.4-cli`. Isso foi necessário pois dependências principais (Symfony v8.1.0 e Laravel 13) no `composer.lock` exigem PHP >= 8.4.1.
3. **Resolução de `SIGBUS` (Frontend):**
   - A imagem base do frontend foi alterada de `node:20-alpine` para `node:20-slim`. A versão Alpine (`musl` libc) causava falhas silenciosas de sinal de barramento (`SIGBUS` com erro code 135) no dev server do Vite rodando sob emulação Rosetta 2 no macOS (Apple Silicon). O uso da versão Slim (`glibc`) resolveu o problema de forma robusta.
   - Decidimos também limpar `node_modules` no host para garantir que pacotes compilados de forma nativa não cruzassem os limites do container.

---

## 🐘 Banco de Dados & Testes (Backend)

1. **UUID v7 como Chave Primária:**
   - Modificamos a migração padrão de usuários e criamos a de empresas para usar UUID v7 como PK. A chave estrangeira `company_id` na tabela `users` foi adicionada e referenciada adequadamente.
   - Ajustamos a tabela `sessions` (onde `user_id` agora é do tipo UUID) e a tabela `personal_access_tokens` do Sanctum (onde alteramos `$table->morphs('tokenable')` para `$table->uuidMorphs('tokenable')` para suportar chaves UUID).
2. **Banco em Memória para Testes Locais:**
   - Configuramos a suíte de testes do Pest para rodar usando o driver SQLite em memória (`:memory:`) no `phpunit.xml`. Isso permite rodar a suíte inteira de forma extremamente rápida via CLI local sem depender do estado ou conexão do container Postgres.

---

## 🚀 Fase 2 (Cadastros) - Iniciada em 14/06/2026

1. **CRUD da Empresa (Tenant) e Logotipo:**
   - Criamos endpoints de visualização, atualização e upload de logotipo.
   - Os arquivos de logo enviados são armazenados no disco público e o arquivo anterior é excluído para liberar espaço.
2. **Modelos Modulares e CRUDs de Cadastros:**
   - Criamos os modelos, recursos, validações de requisições e controladores para as seguintes entidades:
     - `Customer` (Clientes)
     - `Product` (Produtos)
     - `ProductLine` (Linhas de Produto)
     - `ProductColor` (Cores de Perfil/Acessórios)
     - `GlassType` (Tipos de Vidro)
   - Todos os modelos estendem a trait `BelongsToTenant` para herdar o `TenantScope` global e o preenchimento automático do `company_id`.
   - Adicionamos a relação de `company()` em todos eles para suporte correto aos resolvedores de Factories do Eloquent nos testes.
3. **Validação de Tipagem e Análise Estática:**
   - Adicionamos PHPDocs `@mixin` nos recursos de API correspondentes para resolver avisos do PHPStan.
   - Análise estática do PHPStan e linter do Pint executados com sucesso (0 erros).
   - Suíte completa de testes de feature e de isolamento de tenant implementada no Pest, alcançando **36/36 testes verdes**.
4. **Frontend - Telas de CRUD e Integração com API (React + React Query + Hook Form + Zod):**
   - **VerbatimModuleSyntax:** Em conformidade com as configurações estritas do `tsconfig.json`, todos os modelos importados como tipos são declarados como `import type` para evitar erros de compilação.
   - **Zod & Hook Form Interoperabilidade:** Removemos helpers `.default()` de booleanos nos esquemas Zod (passando a configurá-los em `defaultValues` no `useForm`) para resolver divergências de tipagem entre inputs e outputs detectadas pelo `zodResolver`.
   - **Campos Numéricos Opcionais:** Campos de dimensões/preços que podem vir vazios no HTML são mapeados com `{ valueAsNumber: true }` no `register` do Hook Form e limpos no Zod com `.or(z.nan().transform(() => null))`, garantindo tipagem pura e segura.
   - **Mapeamento de Payload:** Valores de preço editados como número na interface são convertidos em string decimal (`.toString()`) no `onSubmit` antes de serem enviados à API, mantendo compatibilidade com o formato decimal do banco e tipagem estrita de `Partial<Product>`.

---

## 🚀 Fase 3 (Orçamentos) - Concluída em 14/06/2026

1. **Estrutura de Banco de Dados e Modelagem:**
   - Implementadas tabelas e modelos `Budget`, `BudgetItem` e `BudgetStatusHistory` com suporte completo a UUID v7 e isolamento por inquilino (`BelongsToTenant`).
   - Para evitar erros de referência circular no Postgres ao rodar migrations de forma limpa, a chave estrangeira autorreferencial `parent_budget_id` na tabela `budgets` foi configurada em um bloco `Schema::table` apartado.
2. **Geração Segura de Números de Orçamento:**
   - Criado o gerador `BudgetNumberGenerator` que obtém um lock pessimista (`lockForUpdate`) na linha correspondente da tabela `companies` sob transação de banco de dados. Isso garante que a numeração sequencial por tenant seja linear e livre de concorrência, além de evitar erros do PostgreSQL que proíbem cláusula `FOR UPDATE` em consultas agregadas (`max('number')`).
3. **Calculadora e Regras de Negócio de Preços:**
   - Centralizada a lógica de precificação de esquadrias em `BudgetCalculator` para orquestrar preços baseados em dimensões (m² ou perímetro) e preços fixos unitários de forma consistente entre o cálculo do backend e as estimativas do front.
4. **Duplicação e Controle de Versão (Versioning):**
   - **Duplicação:** Gera um orçamento novo na versão 1 com número sequencial novo no status `draft` (Rascunho).
   - **Versionamento:** Gera um novo orçamento com o mesmo número, porém incrementando a versão (e.g. de `1` para `2`) e referenciando o ID pai (`parent_budget_id`), mantendo o histórico corporativo.
5. **Painel do Dashboard e Interface do Usuário:**
   - Criada a tela de Dashboard que exibe o somatório e quantidade de propostas `approved` e `pending`, além de listar propostas recentes.
   - Tela de orçamentos com paginação, filtros, duplicação rápida, versionamento de rascunhos e modal de mudança de status para transicionar orçamentos.
   - Formulário dinâmico utilizando React Hook Form (`useFieldArray`) para manipulação interativa de itens do orçamento, populando automaticamente dimensões e preços padrão conforme o produto e recalculando totais/descontos em tempo real.

---

## 🚀 Fase 4 (Documentos) - Concluída em 14/06/2026

1. **Geração de PDF via Spatie Browsershot:**
   - Atualizado o container do `backend` com Node.js v20 e Chromium headless para viabilizar a renderização de PDFs usando o pacote `spatie/browsershot` e o pacote npm `puppeteer`.
   - Adicionado o parâmetro `--no-sandbox` e especificado o caminho `/usr/bin/chromium` para permitir a execução correta sob privilégios do container Docker.
2. **Template Blade & Estilização:**
   - Criada a view em `backend/resources/views/pdf/budget.blade.php` com o template do orçamento comercial, estilizada com classes do TailwindCSS compiladas via CDN para fins de agilidade e portabilidade.
3. **Página Pública de Proposta Comercial (`/p/:token`):**
   - Criados endpoints públicos `/api/public/budgets/{token}` (com endpoints correspondentes de `/approve`, `/reject` e `/pdf` para download de PDF).
   - O controlador `PublicBudgetController` busca orçamentos utilizando a cláusula `withoutGlobalScopes()`. Isso é essencial para que o link público funcione mesmo se o navegador estiver logado em outra conta tenant, contornando a restrição de `TenantScope`.
   - Marcação automática de status: se o orçamento for acessado no status `sent` ou `negotiating`, ele transiciona automaticamente para `viewed`, registrando o log de histórico.
   - Tela pública implementada no React com design limpo e premium (ações de baixar PDF, aceitar/aprovar com comentários e rejeitar com justificativa).
4. **Job de Expiração de Orçamentos:**
   - Implementado o comando Artisan `app:expire-budgets` que busca orçamentos com validade vencida nos status `sent`, `viewed` ou `negotiating` e os transiciona para `expired` com log do sistema. Registrado no agendador diário do Laravel em `routes/console.php`.

---

## 🎨 Refatoração Geral de UI/UX - Concluída em 14/06/2026

1. **Adoção de Ícones Lucide:**
   - Instalada a biblioteca `lucide-react` para fornecer uma identidade de ícones consistente, leve e profissional em todo o frontend, eliminando emojis antigos da interface.
2. **Identidade Visual, Tipografia & Reset:**
   - Importadas as fontes Google "Outfit" (títulos/headers) e "Inter" (texto corrido) em `index.css`.
   - Adicionado reset global de scrollbar (`::-webkit-scrollbar`) com dimensões finas e cantos arredondados no tom slate escuro.
   - Definidos keyframes e utilitários de animação CSS (`animate-fade-in` e `animate-scale-up`) para transições suaves de páginas e overlays de modais.
3. **Casca de Navegação (`AppLayout.tsx`):**
   - Refatorado o layout com menu lateral em vidro de desfoque sutil (glassmorphism), efeitos dinâmicos de escala em hover nos links e seção de perfil de usuário com avatar e dados da empresa inquilina.
   - Adicionado cabeçalho fixo com widget de data atual por extenso e indicador visual "Sistema Online" com pulso dinâmico.
4. **Painel do Dashboard (`DashboardPage.tsx`):**
   - Adicionados gradientes radiais em hover nos indicadores numéricos.
   - Criado um widget de **anel circular dinâmico (SVG Circular Progress Ring)** para representar visualmente a taxa de fechamento comercial de maneira moderna.
   - Reformulados os atalhos rápidos com gradientes de alta tecnologia e listagem de propostas recentes com fontes mono-espaçadas limpas.
5. **Formulário de Orçamentos de Alto Desempenho (`BudgetFormPage.tsx`):**
   - Substituída a tela longa por um **Stepper UX de 3 passos interativos** (Identificação -> Itens -> Condições Comerciais).
   - O resumo financeiro de totais, impostos e descontos foi fixado em um **painel lateral aderente (Sticky Card)**, atualizado em tempo real.
   - Os seletores de perfil e acessórios agora contam com pré-visualizadores rápidos de cores (exibindo círculos da cor real selecionada em hex).
6. **Listagem e Gestão Comercial (`BudgetsPage.tsx`):**
   - Substituídas as ações em emojis na listagem por botões elegantes de ícone Lucide com estados de hover temáticos (azul, verde, roxo, vermelho, etc.) e feedbacks de download em tempo real (spinner de progresso de download).



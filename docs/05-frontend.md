# 05 — Frontend

## Stack

- **React 18**
- **TypeScript** (strict)
- **Vite**
- **TailwindCSS**
- **shadcn/ui** (componentes base)
- **React Query** (estado de servidor)
- **React Hook Form + Zod** (formulários)
- **Axios** (HTTP)
- **React Router** (rotas)
- **Vitest + Testing Library** (testes)

---

## Estrutura de pastas

```
frontend/src/
├── modules/
│   ├── auth/
│   ├── customers/
│   ├── products/
│   ├── budgets/
│   └── dashboard/
├── components/         # componentes compartilhados
├── layouts/            # layouts (AppLayout, AuthLayout)
├── services/           # api client, auth, etc.
├── hooks/              # hooks reutilizáveis
├── lib/                # utilitários
├── routes/             # configuração de rotas
├── types/              # tipos compartilhados
└── main.tsx
```

### Cada módulo segue:

```
modules/customers/
├── components/         # CustomerForm, CustomerList
├── pages/              # CustomersPage, CustomerDetailPage
├── hooks/              # useCustomers, useCustomer
├── schemas/            # zod schemas
├── api.ts              # chamadas à API
└── types.ts
```

---

## Responsabilidades

- Interface do usuário;
- Validação de formulários (Zod);
- Consumo da API (React Query);
- Estado da aplicação;
- Roteamento.

---

## Padrões

### Estado de servidor

Sempre via **React Query**. Nunca usar `useState` para dados vindos da API.

```ts
const { data, isLoading } = useQuery({
  queryKey: ['customers'],
  queryFn: customersApi.list,
});
```

### Formulários

**React Hook Form + Zod**:

```ts
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const form = useForm({ resolver: zodResolver(schema) });
```

### HTTP

Cliente axios centralizado em `services/api.ts`, com interceptor de auth.

### Componentes

- shadcn/ui como base;
- Componentes específicos do módulo dentro do próprio módulo;
- Componentes genéricos (Button, Table) em `components/`.

---

## Páginas principais

| Página | Rota |
|---|---|
| Login | `/login` |
| Recuperar senha | `/forgot-password` |
| Dashboard | `/` |
| Lista de clientes | `/customers` |
| Detalhe do cliente | `/customers/:id` |
| Lista de produtos | `/products` |
| Catálogos | `/catalogs` |
| Lista de orçamentos | `/budgets` |
| Editar orçamento | `/budgets/:id/edit` |
| Visualizar orçamento | `/budgets/:id` |
| **Página pública** | `/p/:token` |

---

## Página pública do orçamento

Rota **fora** do app autenticado: `/p/:token`.

Funcionalidades:

- Visualização da proposta em HTML responsivo;
- Botão "Baixar PDF";
- Botões "Aprovar" e "Rejeitar";
- Captura assinatura simples (nome + data, IP no backend).

---

## Convenções de código

- **TypeScript strict** (no `any` sem justificativa);
- Componentes funcionais + hooks;
- Nomes de arquivo em **kebab-case** para rotas, **PascalCase** para componentes;
- Hooks começam com `use`;
- Schemas Zod no mesmo módulo da feature;
- Testes em arquivos `*.test.tsx` colocados próximos ao componente.

---

## Testes

- **Vitest** para unit tests;
- **Testing Library** para componentes;
- **MSW (Mock Service Worker)** para mock de API;
- TDD obrigatório (ver `06-testing.md`).
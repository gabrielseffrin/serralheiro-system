import { z } from 'zod';

export const budgetItemSchema = z.object({
  product_id: z.string().min(1, 'Selecione um produto'),
  tag: z.string().nullable().optional().or(z.literal('')),
  location: z.string().nullable().optional().or(z.literal('')),
  quantity: z.number().int().min(1, 'Mínimo de 1 unidade'),
  width: z.number().int('Largura deve ser inteiro').min(0, 'Largura inválida').nullable().optional().or(z.nan().transform(() => null)),
  height: z.number().int('Altura deve ser inteiro').min(0, 'Altura inválida').nullable().optional().or(z.nan().transform(() => null)),
  line_id: z.string().nullable().optional().or(z.literal('')),
  profile_color_id: z.string().nullable().optional().or(z.literal('')),
  glass_type_id: z.string().nullable().optional().or(z.literal('')),
  accessory_color_id: z.string().nullable().optional().or(z.literal('')),
  unit_price: z.number().min(0, 'Preço unitário inválido').nullable().optional().or(z.nan().transform(() => null)),
  notes: z.string().nullable().optional().or(z.literal('')),
});

export const budgetSchema = z.object({
  customer_id: z.string().min(1, 'Selecione um cliente'),
  discount: z.number().min(0, 'O desconto deve ser maior ou igual a zero'),
  expiration_date: z.string().nullable().optional().or(z.literal('')),
  payment_method: z.string().nullable().optional().or(z.literal('')),
  delivery_term: z.string().nullable().optional().or(z.literal('')),
  warranty_term: z.string().nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional().or(z.literal('')),
  items: z.array(budgetItemSchema).min(1, 'Adicione pelo menos um item ao orçamento'),
});

export type BudgetItemFormData = z.infer<typeof budgetItemSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;

import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().nullable().optional().or(z.literal('')),
  default_line_id: z.string().nullable().optional().or(z.literal('')),
  pricing_type: z.enum(['fixed', 'per_m2', 'per_meter', 'per_kg']),
  base_price: z.number().min(0, 'O preço base deve ser maior ou igual a zero'),
  requires_dimensions: z.boolean(),
  min_width: z.number().int('Largura deve ser um número inteiro').min(0, 'Deve ser maior ou igual a zero').nullable().optional().or(z.nan().transform(() => null)),
  min_height: z.number().int('Altura deve ser um número inteiro').min(0, 'Deve ser maior ou igual a zero').nullable().optional().or(z.nan().transform(() => null)),
  active: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;

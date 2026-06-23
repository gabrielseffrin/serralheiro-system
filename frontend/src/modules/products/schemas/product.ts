import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().nullable().optional().or(z.literal('')),
  description: z.string().nullable().optional().or(z.literal('')),
  category_id: z.string().nullable().optional().or(z.literal('')),
  image_path: z.string().nullable().optional().or(z.literal('')),
  default_line_id: z.string().nullable().optional().or(z.literal('')),
  pricing_type: z.enum(['fixed', 'per_m2', 'per_meter', 'per_kg']),
  unit: z.enum(['piece', 'm2', 'linear_meter', 'kg', 'pair', 'set']),
  base_price: z.number().min(0, 'O preço base deve ser maior ou igual a zero'),
  cost_price: z.number().min(0, 'O preço de custo deve ser maior ou igual a zero').nullable().optional().or(z.nan().transform(() => null)),
  requires_dimensions: z.boolean(),
  min_width: z.number().int('Largura deve ser um número inteiro').min(0, 'Deve ser maior ou igual a zero').nullable().optional().or(z.nan().transform(() => null)),
  min_height: z.number().int('Altura deve ser um número inteiro').min(0, 'Deve ser maior ou igual a zero').nullable().optional().or(z.nan().transform(() => null)),
  max_width: z.number().int('Largura máxima deve ser um número inteiro').min(0, 'Deve ser maior ou igual a zero').nullable().optional().or(z.nan().transform(() => null)),
  max_height: z.number().int('Altura máxima deve ser um número inteiro').min(0, 'Deve ser maior ou igual a zero').nullable().optional().or(z.nan().transform(() => null)),
  default_weight: z.number().min(0, 'Peso deve ser maior ou igual a zero').nullable().optional().or(z.nan().transform(() => null)),
  default_profile_color_id: z.string().nullable().optional().or(z.literal('')),
  default_accessory_color_id: z.string().nullable().optional().or(z.literal('')),
  default_glass_type_id: z.string().nullable().optional().or(z.literal('')),
  active: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;

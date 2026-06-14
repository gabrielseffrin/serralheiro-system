import { z } from 'zod';

export const productLineSchema = z.object({
  name: z.string().min(1, 'Nome da linha é obrigatório'),
  active: z.boolean(),
});

export const productColorSchema = z.object({
  name: z.string().min(1, 'Nome da cor é obrigatório'),
  hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato hexadecimal inválido (ex: #FFFFFF)').or(z.literal('')).nullable().optional(),
  type: z.enum(['profile', 'accessory']),
});

export const glassTypeSchema = z.object({
  name: z.string().min(1, 'Nome do tipo de vidro é obrigatório'),
  description: z.string().nullable().optional().or(z.literal('')),
});

export type ProductLineFormData = z.infer<typeof productLineSchema>;
export type ProductColorFormData = z.infer<typeof productColorSchema>;
export type GlassTypeFormData = z.infer<typeof glassTypeSchema>;

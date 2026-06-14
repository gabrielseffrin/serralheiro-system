import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().nullable().optional().or(z.literal('')),
  email: z.string().email('E-mail inválido').or(z.literal('')).nullable().optional(),
  document: z.string().nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional().or(z.literal('')),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

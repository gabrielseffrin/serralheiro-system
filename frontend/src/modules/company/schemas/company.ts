import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  trade_name: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')).nullable().optional(),
  address: z.string().nullable().optional(),
  default_notes: z.string().nullable().optional(),
  default_payment_method: z.string().nullable().optional(),
  default_delivery_term: z.string().nullable().optional(),
  default_warranty_term: z.string().nullable().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

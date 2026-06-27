import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 */
export function formatPrice(price: number | string | undefined): string {
  const numeric = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(numeric || 0);
}

/**
 * Formata uma data ISO em formato brasileiro dd/mm/aaaa.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Estilo base reutilizável para inputs de formulário.
 */
export const inputStyle =
  'w-full rounded-xl border border-input bg-input/50 px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200';

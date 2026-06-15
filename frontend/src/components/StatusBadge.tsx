import type { Budget } from '@/types';

export const STATUS_THEMES: Record<Budget['status'], { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Rascunho', bg: 'bg-slate-800/60', text: 'text-slate-400', border: 'border-slate-700/60' },
  sent: { label: 'Enviado', bg: 'bg-blue-950/50', text: 'text-blue-400', border: 'border-blue-900/50' },
  viewed: { label: 'Visualizado', bg: 'bg-purple-950/50', text: 'text-purple-400', border: 'border-purple-900/50' },
  negotiating: { label: 'Negociação', bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-900/50' },
  approved: { label: 'Aprovado', bg: 'bg-emerald-950/50', text: 'text-emerald-400', border: 'border-emerald-900/50' },
  rejected: { label: 'Rejeitado', bg: 'bg-red-950/50', text: 'text-red-400', border: 'border-red-900/50' },
  expired: { label: 'Expirado', bg: 'bg-zinc-800/40', text: 'text-zinc-500', border: 'border-zinc-800/60' },
};

interface StatusBadgeProps {
  status: Budget['status'];
  onClick?: () => void;
  showIcon?: boolean;
}

export default function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const theme = STATUS_THEMES[status] || STATUS_THEMES.draft;

  const className = `inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}${
    onClick ? ' cursor-pointer hover:scale-102 transition-transform' : ''
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {theme.label}
      </button>
    );
  }

  return <span className={className}>{theme.label}</span>;
}

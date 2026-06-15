import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  isLoading = false,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-950/20 px-6 py-4">
      <span className="text-xs text-slate-400">
        Página <strong className="text-white">{currentPage}</strong> de{' '}
        <strong className="text-white">{totalPages}</strong> (
        Total: {totalItems} )
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
          className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-850 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-850 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1"
        >
          Próximo <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

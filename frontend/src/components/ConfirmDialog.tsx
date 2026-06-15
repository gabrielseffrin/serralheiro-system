import { X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false,
}: ConfirmDialogProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl animate-scale-up text-slate-100 z-10">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-405 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`rounded-xl p-3 flex items-center justify-center ${
            isDangerous 
              ? 'bg-red-500/10 text-red-400 border border-red-500/10' 
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
          }`}>
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-850 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-350 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
              isDangerous
                ? 'bg-red-650 hover:bg-red-550 shadow-red-950/20'
                : 'bg-blue-650 hover:bg-blue-550 shadow-blue-950/20'
            }`}
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

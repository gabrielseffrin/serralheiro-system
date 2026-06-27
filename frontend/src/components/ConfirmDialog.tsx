import { X, AlertTriangle } from 'lucide-react';
import { useEffect, useCallback } from 'react';

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
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/95 p-6 shadow-2xl animate-scale-up text-foreground z-10">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`rounded-xl p-3 flex items-center justify-center ${
              isDangerous
                ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-foreground tracking-tight">
              {title}
            </h3>
            <p id="confirm-dialog-description" className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-border bg-card/50 hover:bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-500 shadow-red-950/20'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/20'
            }`}
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

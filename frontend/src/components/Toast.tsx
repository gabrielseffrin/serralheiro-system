import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string | null;
  variant?: ToastVariant;
}

const variants: Record<ToastVariant, { bg: string; border: string; text: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: 'bg-green-950/20', border: 'border-green-800', text: 'text-green-400', Icon: CheckCircle2 },
  error: { bg: 'bg-red-950/20', border: 'border-red-800', text: 'text-red-400', Icon: XCircle },
  warning: { bg: 'bg-amber-950/20', border: 'border-amber-800', text: 'text-amber-400', Icon: AlertTriangle },
  info: { bg: 'bg-blue-950/20', border: 'border-blue-800', text: 'text-blue-400', Icon: Info },
};

export default function Toast({ message, variant = 'success' }: ToastProps) {
  if (!message) return null;

  const { bg, border, text, Icon } = variants[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border ${border} ${bg} p-4 text-sm ${text} transition-all flex items-center gap-2.5 shadow-lg animate-scale-up`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

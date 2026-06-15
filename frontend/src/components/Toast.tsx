import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-green-800 bg-green-950/20 p-4 text-sm text-green-400 transition-all flex items-center gap-2.5 shadow-lg animate-scale-up">
      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
      <CheckCircle2 className="h-4 w-4 text-green-400" />
      {message}
    </div>
  );
}

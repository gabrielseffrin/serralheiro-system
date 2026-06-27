import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center px-6">
          <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Algo deu errado</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página ou entre em contato com o suporte.
            </p>
            {this.state.error && (
              <p className="mt-3 text-xs text-muted-foreground/80 font-mono bg-muted/50 rounded-lg p-3 max-w-md break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

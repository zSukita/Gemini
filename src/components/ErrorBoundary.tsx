import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Nome da seção protegida (para exibir ao usuário) */
  sectionName?: string;
  /** Fallback customizado opcional */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary genérico para proteger seções da aplicação.
 * Se um componente filho lançar um erro, exibe um fallback amigável
 * em vez de crashar toda a aplicação.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(`[ErrorBoundary:${this.props.sectionName || 'App'}]`, error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-slate-900/80 border border-red-500/30 text-center min-h-[200px]">
          <AlertTriangle className="w-10 h-10 text-red-400 animate-pulse" />
          <div>
            <h3 className="text-lg font-serif font-bold text-red-300 mb-1">
              Algo deu errado{this.props.sectionName ? ` em "${this.props.sectionName}"` : ''}
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              {this.state.error?.message || 'Um erro inesperado ocorreu nesta seção.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/40 hover:bg-amber-500/30 transition-all text-sm font-semibold"
          >
            <RotateCcw size={14} />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

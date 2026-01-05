import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary pour capturer les erreurs React et afficher un fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Ici on pourrait envoyer l'erreur à un service de monitoring (Sentry, etc.)
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Recharger la page pour repartir sur une base saine
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback par défaut
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#2f2f2f] to-[#1c1b1f] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <span className="material-icons text-red-600 text-4xl">error_outline</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Une erreur est survenue</h1>
                <p className="text-gray-600 mt-1">L'application a rencontré un problème inattendu</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Détails de l'erreur :</p>
              <p className="text-sm text-red-600 font-mono break-all">
                {this.state.error?.toString()}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Stack trace (développement uniquement)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-64 bg-white p-3 rounded border border-gray-200">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-[#a84383] text-white px-6 py-3 rounded-full font-medium hover:bg-[#8d3669] transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-icons">refresh</span>
                <span>Recharger l'application</span>
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 rounded-full font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-icons">arrow_back</span>
                <span>Retour</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">
                <span className="font-medium">💡 Conseil :</span> Si le problème persiste, essayez de vider le cache de votre navigateur ou contactez le support technique.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


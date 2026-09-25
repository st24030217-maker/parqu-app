import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("Storage clear error", e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-black/90 text-white font-mono rounded-2xl border border-neutral-800 my-4 space-y-4">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {this.props.fallbackText || "Cargando módulo..."}
          </h3>
          <p className="text-xs text-neutral-400 max-w-md">
            {this.state.error?.message || "Ocurrió una sincronización inesperada en la interfaz."}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-mono font-bold text-white transition"
            >
              Reintentar
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-xs font-mono font-bold text-black transition"
            >
              Reiniciar App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

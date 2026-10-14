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
        <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-[#01033E] text-white font-sans rounded-3xl border border-blue-500/20 my-4 space-y-4 shadow-2xl shadow-blue-950/50">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {this.props.fallbackText || "Cargando módulo..."}
          </h3>
          <p className="text-xs text-blue-200/80 max-w-md">
            {this.state.error?.message || "Ocurrió una sincronización inesperada en la interfaz."}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white transition border border-white/20 cursor-pointer"
            >
              Reintentar
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#0033FF] hover:bg-[#0026cc] text-xs font-mono font-bold text-white transition shadow-md shadow-blue-500/30 cursor-pointer border-0"
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

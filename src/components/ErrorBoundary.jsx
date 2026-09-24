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
    console.warn("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full py-8 text-center text-neutral-400 font-mono text-xs">
          <span>{this.props.fallbackText || "Cargando módulo..."}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

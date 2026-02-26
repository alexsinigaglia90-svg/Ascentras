import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  fallbackRender?: (error: Error) => React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[Simulator ErrorBoundary] Caught runtime error:', error, info);
    this.props.onError?.(error, info);
  }

  render() {
    const { error } = this.state;

    if (error) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender(error);
      }

      return (
        <div className="relative z-50 grid h-screen place-items-center bg-[#f6f2ea] p-4 text-[#0d1b2c]">
          <div className="w-full max-w-xl rounded-2xl border border-red-300/50 bg-[#fffaf3] p-5 shadow-panel">
            <h1 className="text-lg font-semibold text-red-800">Simulator runtime error</h1>
            <p className="mt-2 text-sm text-red-700">The simulator hit an unexpected error. You can reload the page.</p>
            <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-red-300/50 bg-red-50 p-3 text-xs text-red-800">
              {error.message}
            </pre>
            <button
              type="button"
              className="mt-4 rounded-full border border-red-700/20 bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

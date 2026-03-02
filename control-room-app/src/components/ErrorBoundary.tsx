import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Control Room fatal UI error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            color: 'var(--text)',
            zIndex: 1000,
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '1.15rem',
                lineHeight: 1.3,
              }}
            >
              Control room temporarily unavailable
            </h2>
            <p
              style={{
                marginTop: 10,
                marginBottom: 14,
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
              }}
            >
              A runtime error interrupted rendering. Reload to recover safely.
            </p>
            <p
              style={{
                marginTop: 0,
                marginBottom: 16,
                color: 'var(--text-light)',
                fontSize: '0.75rem',
                wordBreak: 'break-word',
              }}
            >
              {this.state.errorMessage}
            </p>
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 10,
                border: '1px solid var(--accent)',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload control room
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

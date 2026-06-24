import React from 'react';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', maxWidth: 900, margin: '40px auto' }}>
          <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h1 style={{ color: '#dc2626', margin: '0 0 8px', fontSize: 20 }}>⚠️ Application Error</h1>
            <p style={{ color: '#7f1d1d', margin: '0 0 16px', fontSize: 14 }}>
              A runtime error crashed the app. Here are the details:
            </p>
            <pre style={{ background: '#450a0a', color: '#fca5a5', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </div>
          <button 
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/core/lib/logger';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // Fix: Reverted to a standard constructor for state initialization.
  // The class property initializer was causing TypeScript to fail to recognize 'this.props',
  // leading to a compilation error. Using a constructor with super(props) is the canonical
  // way to set up a React class component and ensures proper type inference for both state and props.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error in component', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-8">
          <h1 className="text-4xl font-black text-red-500 mb-4">System Malfunction</h1>
          <p className="text-lg text-slate-600 mb-8">
            An unexpected error has occurred. We have logged the issue for our engineers to investigate.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all"
          >
            Refresh Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

"use client";

import React from "react";

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">
          We apologize for the inconvenience. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Refresh Page
        </button>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundary;

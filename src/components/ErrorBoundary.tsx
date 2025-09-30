"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Heading, P, Button, Space } from '@dnb/eufemia';
import { logError } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
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
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console and external service
    logError('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error boundary if reset keys change
    if (this.state.hasError && prevProps.resetKeys !== this.props.resetKeys) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Space top="large" bottom="large">
          <Card>
            <Space top="medium" bottom="medium" left="large" right="large">
              <Heading size="large" style={{ color: 'var(--color-cherry-red)' }}>
                Noe gikk galt
              </Heading>

              <Space top="medium">
                <P>
                  En uventet feil oppstod. Du kan prøve å laste siden på nytt, eller kontakt oss
                  hvis problemet vedvarer.
                </P>
              </Space>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Space top="medium">
                  <details style={{ whiteSpace: 'pre-wrap' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      Tekniske detaljer (kun synlig i utviklingsmodus)
                    </summary>
                    <Space top="small">
                      <P size="small" style={{ color: 'var(--color-text-muted)' }}>
                        {this.state.error.toString()}
                      </P>
                      {this.state.errorInfo && (
                        <P size="small" style={{ color: 'var(--color-text-muted)' }}>
                          {this.state.errorInfo.componentStack}
                        </P>
                      )}
                    </Space>
                  </details>
                </Space>
              )}

              <Space top="large">
                <Button onClick={this.resetErrorBoundary}>
                  Prøv igjen
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                  style={{ marginLeft: 'var(--spacing-small)' }}
                >
                  Last siden på nytt
                </Button>
              </Space>
            </Space>
          </Card>
        </Space>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based Error Boundary wrapper for functional components
 * Usage: Wrap components that might throw errors
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default ErrorBoundary;
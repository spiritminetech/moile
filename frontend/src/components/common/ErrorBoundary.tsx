// Error Boundary Component for React Error Handling
// Requirements: 12.4

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ConstructionButton from './ConstructionButton';
import ConstructionCard from './ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { errorHandler, ConstructionError } from '../../utils/errorHandling/ErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error
    const constructionError = new ConstructionError(
      error.message || 'React component error',
      {
        code: 'REACT_ERROR',
        details: {
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        },
        context: 'React Error Boundary',
        recoverable: true,
        severity: 'high',
      }
    );

    errorHandler.handleError(constructionError);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ConstructionCard
            title="⚠️ Something went wrong"
            variant="error"
            style={styles.errorCard}
          >
            <Text style={styles.errorMessage}>
              The app encountered an unexpected error. This has been logged for investigation.
            </Text>
            
            <Text style={styles.errorDetails}>
              {this.state.error?.message || 'Unknown error occurred'}
            </Text>

            <View style={styles.actions}>
              <ConstructionButton
                title="Try Again"
                onPress={this.handleRetry}
                variant="primary"
                size="medium"
                icon="🔄"
              />
            </View>

            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.stack}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
          </ConstructionCard>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.lg,
    backgroundColor: ConstructionTheme.colors.background,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
  },
  errorMessage: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.md,
    lineHeight: 24,
  },
  errorDetails: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.error,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
    fontStyle: 'italic',
  },
  actions: {
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  debugInfo: {
    marginTop: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  debugTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  debugText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 10,
  },
});

export default ErrorBoundary;
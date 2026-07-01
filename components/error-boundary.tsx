/**
 * Error Boundary Component
 * Catches errors and displays user-friendly error UI
 */

import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScreenContainer className="flex-1 items-center justify-center px-6">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View className="items-center gap-6">
              {/* Error Icon */}
              <View className="w-20 h-20 rounded-full bg-error/20 items-center justify-center">
                <Text className="text-4xl">⚠️</Text>
              </View>

              {/* Error Message */}
              <View className="items-center gap-2">
                <Text className="text-2xl font-bold text-foreground text-center">
                  Oops! Something went wrong
                </Text>
                <Text className="text-base text-muted text-center">
                  We encountered an unexpected error. Please try again.
                </Text>
              </View>

              {/* Error Details (Development Only) */}
              {__DEV__ && this.state.error && (
                <View className="w-full bg-surface rounded-lg p-4 gap-2">
                  <Text className="text-xs font-bold text-error">Error Details:</Text>
                  <Text className="text-xs text-muted font-mono">
                    {this.state.error.message}
                  </Text>
                  <Text className="text-xs text-muted font-mono mt-2">
                    {this.state.error.stack}
                  </Text>
                </View>
              )}

              {/* Reset Button */}
              <TouchableOpacity
                onPress={this.resetError}
                className="w-full bg-primary rounded-lg px-6 py-3 items-center"
              >
                <Text className="text-white font-semibold text-base">Try Again</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ScreenContainer>
      );
    }

    return this.props.children;
  }
}

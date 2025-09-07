import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AnalyticsProvider } from '../analytics-provider';
import { useAnalytics } from '../use-analytics';
import { createAnalyticsClient } from '../client';
import consoleProvider from '../providers/console';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

describe('AnalyticsProvider', () => {
  const mockClient = createAnalyticsClient([consoleProvider]);
  const mockEmit = vi.spyOn(mockClient, 'emit');

  beforeEach(() => {
    mockEmit.mockClear();
  });

  it('should provide client to children', () => {
    const TestComponent = () => {
      const { emit } = useAnalytics();
      return (
        <button onClick={() => emit('clicked', 'test')}>
          Test Button
        </button>
      );
    };

    render(
      <AnalyticsProvider client={mockClient}>
        <TestComponent />
      </AnalyticsProvider>
    );

    screen.getByRole('button').click();

    expect(mockEmit).toHaveBeenCalledWith(
      'clicked',
      'test',
      void 0,
      {},
      void 0
    );
  });

  it('should handle undefined client', () => {
    const TestComponent = () => {
      const { emit } = useAnalytics();
      return (
        <button onClick={() => emit('clicked', 'test')}>
          Test Button
        </button>
      );
    };

    render(
      <AnalyticsProvider client={void 0}>
        <TestComponent />
      </AnalyticsProvider>
    );

    // Should not throw when client is undefined
    expect(() => {
      screen.getByRole('button').click();
    }).not.toThrow();
  });

  it('should maintain client reference across re-renders', () => {
    const TestComponent = () => {
      const { emit } = useAnalytics();
      return (
        <button onClick={() => emit('clicked', 'test')}>
          Test Button
        </button>
      );
    };

    const { rerender } = render(
      <AnalyticsProvider client={mockClient}>
        <TestComponent />
      </AnalyticsProvider>
    );

    // Re-render with same client
    rerender(
      <AnalyticsProvider client={mockClient}>
        <TestComponent />
      </AnalyticsProvider>
    );

    screen.getByRole('button').click();

    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  describe('client changes and nested providers', () => {
    it('should handle client prop changes', () => {
      const newClient = createAnalyticsClient([consoleProvider]);
      const newMockEmit = vi.spyOn(newClient, 'emit');

      const TestComponent = () => {
        const { emit } = useAnalytics();
        return (
          <button onClick={() => emit('clicked', 'test')}>
            Test Button
          </button>
        );
      };

      const { rerender } = render(
        <AnalyticsProvider client={mockClient}>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByRole('button').click();
      expect(mockEmit).toHaveBeenCalledTimes(1);

      // Change client
      rerender(
        <AnalyticsProvider client={newClient}>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByRole('button').click();
      expect(newMockEmit).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledTimes(1); // Original client should not be called
    });

    it('should handle nested providers', () => {
      const innerClient = createAnalyticsClient([consoleProvider]);
      const innerMockEmit = vi.spyOn(innerClient, 'emit');

      const InnerComponent = () => {
        const { emit } = useAnalytics();
        return (
          <button onClick={() => emit('clicked', 'inner')}>
            Inner Button
          </button>
        );
      };

      const OuterComponent = () => {
        const { emit } = useAnalytics();
        return (
          <div>
            <button onClick={() => emit('clicked', 'outer')}>
              Outer Button
            </button>
            <AnalyticsProvider client={innerClient}>
              <InnerComponent />
            </AnalyticsProvider>
          </div>
        );
      };

      render(
        <AnalyticsProvider client={mockClient}>
          <OuterComponent />
        </AnalyticsProvider>
      );

      screen.getByText('Outer Button').click();
      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'outer',
        void 0,
        {},
        void 0
      );

      screen.getByText('Inner Button').click();
      expect(innerMockEmit).toHaveBeenCalledWith(
        'clicked',
        'inner',
        void 0,
        {},
        void 0
      );
    });

    it('should handle client method errors gracefully', () => {
      class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
        constructor(props: any) {
          super(props);
          this.state = { hasError: false };
        }
        static getDerivedStateFromError() {
          return { hasError: true };
        }
        componentDidCatch() { }
        render() {
          if (this.state.hasError) return <div>Error caught</div>;
          return this.props.children;
        }
      }

      const errorClient = createAnalyticsClient([consoleProvider]);
      const mockError = new Error('Test error');
      vi.spyOn(errorClient, 'emit').mockImplementation(() => {
        throw mockError;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      class TestComponent extends React.Component<{}, { hasError: boolean }> {
        constructor(props: {}) {
          super(props);
          this.state = { hasError: false };
        }

        handleClick = () => {
          try {
            const { emit } = useAnalytics();
            emit('clicked', 'test');
          } catch (error) {
            this.setState({ hasError: true });
          }
        }

        render() {
          if (this.state.hasError) {
            throw new Error('Test error');
          }
          return (
            <button onClick={this.handleClick}>
              Test
            </button>
          );
        }
      }

      const { getByText, queryByText } = render(
        <ErrorBoundary>
          <AnalyticsProvider client={errorClient}>
            <TestComponent />
          </AnalyticsProvider>
        </ErrorBoundary>
      );

      // Click should trigger error state and error boundary should catch
      fireEvent.click(getByText('Test'));
      expect(queryByText('Error caught')).toBeDefined();

      // Cleanup
      consoleSpy.mockRestore();
    });
  });
}); 

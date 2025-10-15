import React from 'react';
import { renderHook, act, render } from '@testing-library/react';
import { useAnalytics, useUnsafeInternalEmitter } from '../use-analytics';
import { AnalyticsProvider } from '../analytics-provider';
import { AnalyticsBoundary } from '../boundary-provider';
import { createAnalyticsClient } from '../client';
import consoleProvider from '../providers/console';
import { vi } from 'vitest';

describe('useAnalytics', () => {
  const mockClient = createAnalyticsClient([consoleProvider]);
  const mockEmit = vi.spyOn(mockClient, 'emit');

  beforeEach(() => {
    mockEmit.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AnalyticsProvider client={mockClient}>
      <AnalyticsBoundary name="test-boundary" attributes={{ testAttr: 'value' }}>
        {children}
      </AnalyticsBoundary>
    </AnalyticsProvider>
  );

  it('should emit events with boundary context', () => {
    const { result } = renderHook(() => useAnalytics(), { wrapper });

    act(() => {
      result.current.emit('clicked', 'button', { extra: 'data' });
    });

    expect(mockEmit).toHaveBeenCalledWith(
      'clicked',
      'button',
      'test-boundary',
      {
        testAttr: 'value',
        extra: 'data'
      },
      void 0
    );
  });

  it('should merge hook attributes with event attributes', () => {
    const { result } = renderHook(() => useAnalytics({ hookAttr: 'value' }), { wrapper });

    act(() => {
      result.current.emit('clicked', 'button', { eventAttr: 'value' });
    });

    expect(mockEmit).toHaveBeenCalledWith(
      'clicked',
      'button',
      'test-boundary',
      {
        testAttr: 'value',
        hookAttr: 'value',
        eventAttr: 'value'
      },
      void 0
    );
  });

  it('should handle omitContext option', () => {
    const { result } = renderHook(() => useAnalytics(), { wrapper });

    act(() => {
      result.current.emit('clicked', 'button', { extra: 'data' }, { omitContext: true });
    });

    expect(mockEmit).toHaveBeenCalledWith(
      'clicked',
      'button',
      'test-boundary',
      {
        testAttr: 'value',
        extra: 'data'
      },
      { omitContext: true }
    );
  });

  describe('useUnsafeInternalEmitter', () => {
    it('should use boundary override when provided', () => {
      const { result } = renderHook(
        () => useUnsafeInternalEmitter({
          boundaryOverride: {
            name: 'override-boundary',
            attributes: { overrideAttr: 'value' }
          }
        }),
        { wrapper }
      );

      act(() => {
        result.current.emit('clicked', 'button', { extra: 'data' });
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button',
        'override-boundary',
        {
          overrideAttr: 'value',
          extra: 'data'
        },
        void 0
      );
    });

    it('should fall back to boundary context when no override', () => {
      const { result } = renderHook(
        () => useUnsafeInternalEmitter({}),
        { wrapper }
      );

      act(() => {
        result.current.emit('clicked', 'button', { extra: 'data' });
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button',
        'test-boundary',
        {
          testAttr: 'value',
          extra: 'data'
        },
        void 0
      );
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle undefined event name', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.emit('clicked', void 0 as any, { extra: 'data' });
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        void 0,
        'test-boundary',
        {
          testAttr: 'value',
          extra: 'data'
        },
        void 0
      );
    });

    it('should handle undefined attributes', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      act(() => {
        result.current.emit('clicked', 'button', void 0 as any);
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button',
        'test-boundary',
        {
          testAttr: 'value'
        },
        void 0
      );
    });

    it('should maintain hook attributes across re-renders', () => {
      const { result, rerender } = renderHook(
        ({ attrs }) => useAnalytics(attrs),
        {
          wrapper,
          initialProps: { attrs: { hookAttr: 'initial' } }
        }
      );

      act(() => {
        result.current.emit('clicked', 'button', { eventAttr: 'value' });
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button',
        'test-boundary',
        {
          testAttr: 'value',
          hookAttr: 'initial',
          eventAttr: 'value'
        },
        void 0
      );

      mockEmit.mockClear();

      // Re-render with new props
      rerender({ attrs: { hookAttr: 'updated' } });

      act(() => {
        result.current.emit('clicked', 'button', { eventAttr: 'new' });
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button',
        'test-boundary',
        {
          testAttr: 'value',
          hookAttr: 'updated',
          eventAttr: 'new'
        },
        void 0
      );
    });

    it('should handle multiple hook instances in the same boundary', () => {
      const TestComponent = () => {
        const analytics1 = useAnalytics({ hook1: 'value1' });
        const analytics2 = useAnalytics({ hook2: 'value2' });

        return (
          <div>
            <button onClick={() => analytics1.emit('clicked', 'button1')}>Button 1</button>
            <button onClick={() => analytics2.emit('clicked', 'button2')}>Button 2</button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />, { wrapper });

      getByText('Button 1').click();
      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button1',
        'test-boundary',
        {
          testAttr: 'value',
          hook1: 'value1'
        },
        void 0
      );

      mockEmit.mockClear();

      getByText('Button 2').click();
      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button2',
        'test-boundary',
        {
          testAttr: 'value',
          hook2: 'value2'
        },
        void 0
      );
    });
  });
});

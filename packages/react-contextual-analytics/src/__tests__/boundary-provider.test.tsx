import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnalyticsBoundary } from '../boundary-provider';
import { AnalyticsProvider } from '../analytics-provider';
import { createAnalyticsClient } from '../client';
import consoleProvider from '../providers/console';
import { AnalyticsEmitter } from '../use-analytics';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AnalyticsBoundary', () => {
  const mockClient = createAnalyticsClient([consoleProvider]);
  const mockEmit = vi.spyOn(mockClient, 'emit');

  beforeEach(() => {
    mockEmit.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AnalyticsProvider client={mockClient}>
      {children}
    </AnalyticsProvider>
  );

  it('should render children directly', () => {
    render(
      <AnalyticsBoundary name="test">
        <div>Test Content</div>
      </AnalyticsBoundary>,
      { wrapper }
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render children with emit callback', () => {
    render(
      <AnalyticsBoundary name="test">
        {(emit: AnalyticsEmitter) => (
          <button onClick={() => emit('clicked', 'button')}>
            Test Button
          </button>
        )}
      </AnalyticsBoundary>,
      { wrapper }
    );

    screen.getByRole('button').click();

    expect(mockEmit).toHaveBeenCalledWith(
      'clicked',
      'button',
      'test',
      {},
      void 0
    );
  });

  it('should send viewed event on mount when sendViewedEvent is true', () => {
    render(
      <AnalyticsBoundary name="test" sendViewedEvent={true}>
        <div>Test Content</div>
      </AnalyticsBoundary>,
      { wrapper }
    );

    expect(mockEmit).toHaveBeenCalledWith(
      'viewed',
      void 0,
      'test',
      {},
      void 0
    );
  });

  it('should not send viewed event when sendViewedEvent is false', () => {
    render(
      <AnalyticsBoundary name="test" sendViewedEvent={false}>
        <div>Test Content</div>
      </AnalyticsBoundary>,
      { wrapper }
    );

    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should merge attributes from parent boundaries', () => {
    render(
      <AnalyticsBoundary name="parent" attributes={{ parentAttr: 'value' }}>
        <AnalyticsBoundary name="child" attributes={{ childAttr: 'value' }}>
          {(emit: AnalyticsEmitter) => (
            <button onClick={() => emit('clicked', 'button')}>
              Test Button
            </button>
          )}
        </AnalyticsBoundary>
      </AnalyticsBoundary>,
      { wrapper }
    );

    screen.getByRole('button').click();

    expect(mockEmit).toHaveBeenCalledWith(
      'clicked',
      'button',
      'parent.child',
      {
        parentAttr: 'value',
        childAttr: 'value'
      },
      void 0
    );
  });

  it('should handle nested boundaries with emit callbacks', () => {
    render(
      <AnalyticsBoundary name="parent" attributes={{ parentAttr: 'value' }}>
        {(parentEmit: AnalyticsEmitter) => (
          <AnalyticsBoundary name="child" attributes={{ childAttr: 'value' }}>
            {(childEmit: AnalyticsEmitter) => (
              <div>
                <button onClick={() => parentEmit('clicked', 'parent-button')}>
                  Parent Button
                </button>
                <button onClick={() => childEmit('clicked', 'child-button')}>
                  Child Button
                </button>
              </div>
            )}
          </AnalyticsBoundary>
        )}
      </AnalyticsBoundary>,
      { wrapper }
    );

    screen.getByText('Parent Button').click();
    expect(mockEmit).toHaveBeenCalledWith(
      'clicked',
      'parent-button',
      'parent',
      { parentAttr: 'value' },
      void 0
    );

    mockEmit.mockClear();

    screen.getByText('Child Button').click();
    expect(mockEmit).toHaveBeenCalledWith(
      'clicked',
      'child-button',
      'parent.child',
      {
        parentAttr: 'value',
        childAttr: 'value'
      },
      void 0
    );
  });

  describe('validation and edge cases', () => {
    it('should handle empty boundary name', () => {
      render(
        <AnalyticsBoundary name="">
          <div>Test Content</div>
        </AnalyticsBoundary>,
        { wrapper }
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should handle deeply nested boundaries', () => {
      render(
        <AnalyticsBoundary name="level1" attributes={{ attr1: 'value1' }}>
          <AnalyticsBoundary name="level2" attributes={{ attr2: 'value2' }}>
            <AnalyticsBoundary name="level3" attributes={{ attr3: 'value3' }}>
              {(emit: AnalyticsEmitter) => (
                <button onClick={() => emit('clicked', 'deep-button')}>
                  Deep Button
                </button>
              )}
            </AnalyticsBoundary>
          </AnalyticsBoundary>
        </AnalyticsBoundary>,
        { wrapper }
      );

      screen.getByRole('button').click();

      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'deep-button',
        'level1.level2.level3',
        {
          attr1: 'value1',
          attr2: 'value2',
          attr3: 'value3'
        },
        void 0
      );
    });

    it('should only send viewed event once on mount', () => {
      const { rerender } = render(
        <AnalyticsBoundary name="test" sendViewedEvent={true}>
          <div>Test Content</div>
        </AnalyticsBoundary>,
        { wrapper }
      );

      expect(mockEmit).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledWith(
        'viewed',
        undefined,
        'test',
        {},
        void 0
      );

      mockEmit.mockClear();

      // Re-render with same props
      rerender(
        <AnalyticsBoundary name="test" sendViewedEvent={true}>
          <div>Test Content Updated</div>
        </AnalyticsBoundary>
      );

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should handle attribute updates', () => {
      const { rerender } = render(
        <AnalyticsBoundary name="test" attributes={{ initial: 'value' }}>
          {(emit: AnalyticsEmitter) => (
            <button onClick={() => emit('clicked', 'button')}>
              Test Button
            </button>
          )}
        </AnalyticsBoundary>,
        { wrapper }
      );

      screen.getByRole('button').click();
      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button',
        'test',
        { initial: 'value' },
        void 0
      );

      mockEmit.mockClear();

      // Update attributes
      rerender(
        <AnalyticsBoundary name="test" attributes={{ updated: 'value' }}>
          {(emit: AnalyticsEmitter) => (
            <button onClick={() => emit('clicked', 'button')}>
              Test Button
            </button>
          )}
        </AnalyticsBoundary>
      );

      screen.getByRole('button').click();
      expect(mockEmit).toHaveBeenCalledWith(
        'clicked',
        'button',
        'test',
        { updated: 'value' },
          void 0
      );
    });

    it('should handle unmounting', () => {
      const { unmount } = render(
        <AnalyticsBoundary name="test" sendViewedEvent={true}>
          <div>Test Content</div>
        </AnalyticsBoundary>,
        { wrapper }
      );

      expect(mockEmit).toHaveBeenCalledTimes(1);
      mockEmit.mockClear();

      unmount();
      // Should not emit any events on unmount
      expect(mockEmit).not.toHaveBeenCalled();
    });
  });
});

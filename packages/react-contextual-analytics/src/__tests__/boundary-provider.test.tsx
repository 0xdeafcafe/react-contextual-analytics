import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnalyticsBoundaryProvider } from '../boundary-provider';
import { AnalyticsProvider } from '../analytics-provider';
import { createAnalyticsClient } from '../client';
import consoleProvider from '../providers/console';
import { AnalyticsEmitter } from '../use-analytics';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AnalyticsBoundaryProvider', () => {
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
      <AnalyticsBoundaryProvider name="test">
        <div>Test Content</div>
      </AnalyticsBoundaryProvider>,
      { wrapper }
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render children with emit callback', () => {
    render(
      <AnalyticsBoundaryProvider name="test">
        {(emit: AnalyticsEmitter) => (
          <button onClick={() => emit('clicked', 'button')}>
            Test Button
          </button>
        )}
      </AnalyticsBoundaryProvider>,
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
      <AnalyticsBoundaryProvider name="test" sendViewedEvent={true}>
        <div>Test Content</div>
      </AnalyticsBoundaryProvider>,
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
      <AnalyticsBoundaryProvider name="test" sendViewedEvent={false}>
        <div>Test Content</div>
      </AnalyticsBoundaryProvider>,
      { wrapper }
    );

    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should merge attributes from parent boundaries', () => {
    render(
      <AnalyticsBoundaryProvider name="parent" attributes={{ parentAttr: 'value' }}>
        <AnalyticsBoundaryProvider name="child" attributes={{ childAttr: 'value' }}>
          {(emit: AnalyticsEmitter) => (
            <button onClick={() => emit('clicked', 'button')}>
              Test Button
            </button>
          )}
        </AnalyticsBoundaryProvider>
      </AnalyticsBoundaryProvider>,
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
      <AnalyticsBoundaryProvider name="parent" attributes={{ parentAttr: 'value' }}>
        {(parentEmit: AnalyticsEmitter) => (
          <AnalyticsBoundaryProvider name="child" attributes={{ childAttr: 'value' }}>
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
          </AnalyticsBoundaryProvider>
        )}
      </AnalyticsBoundaryProvider>,
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
        <AnalyticsBoundaryProvider name="">
          <div>Test Content</div>
        </AnalyticsBoundaryProvider>,
        { wrapper }
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should handle deeply nested boundaries', () => {
      render(
        <AnalyticsBoundaryProvider name="level1" attributes={{ attr1: 'value1' }}>
          <AnalyticsBoundaryProvider name="level2" attributes={{ attr2: 'value2' }}>
            <AnalyticsBoundaryProvider name="level3" attributes={{ attr3: 'value3' }}>
              {(emit: AnalyticsEmitter) => (
                <button onClick={() => emit('clicked', 'deep-button')}>
                  Deep Button
                </button>
              )}
            </AnalyticsBoundaryProvider>
          </AnalyticsBoundaryProvider>
        </AnalyticsBoundaryProvider>,
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
        <AnalyticsBoundaryProvider name="test" sendViewedEvent={true}>
          <div>Test Content</div>
        </AnalyticsBoundaryProvider>,
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
        <AnalyticsBoundaryProvider name="test" sendViewedEvent={true}>
          <div>Test Content Updated</div>
        </AnalyticsBoundaryProvider>
      );

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should handle attribute updates', () => {
      const { rerender } = render(
        <AnalyticsBoundaryProvider name="test" attributes={{ initial: 'value' }}>
          {(emit: AnalyticsEmitter) => (
            <button onClick={() => emit('clicked', 'button')}>
              Test Button
            </button>
          )}
        </AnalyticsBoundaryProvider>,
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
        <AnalyticsBoundaryProvider name="test" attributes={{ updated: 'value' }}>
          {(emit: AnalyticsEmitter) => (
            <button onClick={() => emit('clicked', 'button')}>
              Test Button
            </button>
          )}
        </AnalyticsBoundaryProvider>
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
        <AnalyticsBoundaryProvider name="test" sendViewedEvent={true}>
          <div>Test Content</div>
        </AnalyticsBoundaryProvider>,
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

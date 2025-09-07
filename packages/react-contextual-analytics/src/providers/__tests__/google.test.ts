import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import googleProvider from '../google';
import { Event } from '../../event';

// Mock window.gtag
const mockGtag = vi.fn();

describe('Google Provider', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider structure', () => {
    it('should have correct id', () => {
      expect(googleProvider.id).toBe('google');
    });

    it('should have send function', () => {
      expect(typeof googleProvider.send).toBe('function');
    });

    it('should not have setup function', () => {
      expect(googleProvider.setup).toBeUndefined();
    });
  });

  describe('send function', () => {
    describe('when gtag is available', () => {
      beforeEach(() => {
        // Mock window with gtag
        Object.defineProperty(window, 'gtag', {
          value: {
            event: mockGtag
          },
          writable: true
        });
      });

      it('should call gtag.event with complete event name when all properties are present', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: 'button',
          boundary: 'test.boundary',
          attributes: { test: 'value' },
          context: { href: 'https://example.com' }
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('test.boundary button clicked', event);
      });

      it('should call gtag.event with partial event name when some properties are missing', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: 'button'
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('button clicked', event);
      });

      it('should call gtag.event with only action when only action is present', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'viewed'
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('viewed', event);
      });

      it('should call gtag.event with boundary and action when name is missing', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          boundary: 'test.boundary'
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('test.boundary clicked', event);
      });

      it('should call gtag.event with boundary and name when action is missing', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: 'button',
          boundary: 'test.boundary'
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('test.boundary button clicked', event);
      });

      it('should filter out falsy values from event name', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: '',
          boundary: null as any
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('clicked', event);
      });

      it('should handle empty string values in event name construction', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: '',
          boundary: ''
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('clicked', event);
      });

      it('should pass the complete event object to gtag', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: 'button',
          boundary: 'test.boundary',
          attributes: {
            buttonId: 'submit-btn',
            category: 'form'
          },
          context: {
            href: 'https://example.com',
            windowWidth: 1024
          }
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('test.boundary button clicked', event);
      });
    });

    describe('when gtag is not available', () => {
      beforeEach(() => {
        // Mock window without gtag
        Object.defineProperty(window, 'gtag', {
          value: undefined,
          writable: true
        });
      });

      it('should log warning when gtag is not available', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked'
        };

        await googleProvider.send(event);

        expect(console.warn).toHaveBeenCalledWith('gtag is not available');
        expect(mockGtag).not.toHaveBeenCalled();
      });

      it('should not throw error when gtag is not available', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked'
        };

        await expect(googleProvider.send(event)).resolves.not.toThrow();
      });
    });

    describe('when gtag exists but is not an object', () => {
      beforeEach(() => {
        // Mock window with gtag as string
        Object.defineProperty(window, 'gtag', {
          value: 'not-an-object',
          writable: true
        });
      });

      it('should log warning when gtag is not an object', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked'
        };

        await googleProvider.send(event);

        expect(console.warn).toHaveBeenCalledWith('gtag is not available');
        expect(mockGtag).not.toHaveBeenCalled();
      });
    });

    describe('when gtag exists but does not have event method', () => {
      beforeEach(() => {
        // Mock window with gtag object without event method
        Object.defineProperty(window, 'gtag', {
          value: {
            config: vi.fn()
          },
          writable: true
        });
      });

      it('should log warning when gtag does not have event method', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked'
        };

        await googleProvider.send(event);

        expect(console.warn).toHaveBeenCalledWith('gtag is not available');
        expect(mockGtag).not.toHaveBeenCalled();
      });
    });

    describe('when window is undefined (server-side)', () => {
      let originalWindow: any;

      beforeEach(() => {
        // Store original window
        originalWindow = global.window;
        // Mock server-side environment
        Object.defineProperty(global, 'window', {
          value: undefined,
          writable: true
        });
      });

      afterEach(() => {
        // Restore window
        Object.defineProperty(global, 'window', {
          value: originalWindow,
          writable: true
        });
      });

      it('should log warning when window is undefined', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked'
        };

        await googleProvider.send(event);

        expect(console.warn).toHaveBeenCalledWith('gtag is not available');
        expect(mockGtag).not.toHaveBeenCalled();
      });
    });

    describe('event name construction edge cases', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'gtag', {
          value: {
            event: mockGtag
          },
          writable: true
        });
      });

      it('should handle undefined values in event name construction', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: undefined,
          boundary: undefined
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('clicked', event);
      });

      it('should handle null values in event name construction', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: null as any,
          boundary: null as any
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('clicked', event);
      });

      it('should handle zero values in event name construction', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: 0 as any,
          boundary: 0 as any
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('clicked', event);
      });

      it('should handle false values in event name construction', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: false as any,
          boundary: false as any
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('clicked', event);
      });

      it('should preserve spaces in event name parts', async () => {
        const event: Event = {
          version: '2025-05-29',
          action: 'clicked',
          name: 'submit button',
          boundary: 'user dashboard'
        };

        await googleProvider.send(event);

        expect(mockGtag).toHaveBeenCalledWith('user dashboard submit button clicked', event);
      });
    });
  });
});

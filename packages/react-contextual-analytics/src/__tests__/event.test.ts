import { Event, EventOptions, EventGlobalContext } from '../event';

describe('Event Types', () => {
  describe('Event', () => {
    it('should have required properties', () => {
      const event: Event = {
        version: '2025-05-29',
        action: 'clicked',
        name: 'button',
        boundary: 'test.boundary',
        attributes: { test: 'value' },
        context: {
          href: 'https://example.com',
          windowWidth: 1024,
          windowHeight: 768,
          userAgent: 'test-agent'
        }
      };

      expect(event).toMatchObject({
        version: '2025-05-29',
        action: 'clicked',
        name: 'button',
        boundary: 'test.boundary',
        attributes: { test: 'value' },
        context: {
          href: 'https://example.com',
          windowWidth: 1024,
          windowHeight: 768,
          userAgent: 'test-agent'
        }
      });
    });

    it('should allow optional properties to be undefined', () => {
      const event: Event = {
        version: '2025-05-29',
        action: 'clicked'
      };

      expect(event).toMatchObject({
        version: '2025-05-29',
        action: 'clicked'
      });
      expect(event.name).toBeUndefined();
      expect(event.boundary).toBeUndefined();
      expect(event.attributes).toBeUndefined();
      expect(event.context).toBeUndefined();
    });
  });

  describe('EventOptions', () => {
    it('should allow omitContext option', () => {
      const options: EventOptions = {
        omitContext: true
      };

      expect(options).toEqual({ omitContext: true });
    });

    it('should allow empty options', () => {
      const options: EventOptions = {};

      expect(options).toEqual({});
    });
  });

  describe('EventGlobalContext', () => {
    it('should allow all properties to be optional', () => {
      const context: EventGlobalContext = {};

      expect(context).toEqual({});
    });

    it('should allow partial context', () => {
      const context: EventGlobalContext = {
        href: 'https://example.com',
        windowWidth: 1024
      };

      expect(context).toEqual({
        href: 'https://example.com',
        windowWidth: 1024
      });
      expect(context.windowHeight).toBeUndefined();
      expect(context.userAgent).toBeUndefined();
    });
  });
}); 

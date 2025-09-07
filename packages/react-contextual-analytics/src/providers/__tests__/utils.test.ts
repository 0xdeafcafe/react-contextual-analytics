import { describe, it, expect } from 'vitest';
import { flattenEvent } from '../utils';
import { Event } from '../../event';

describe('flattenEvent', () => {
  it('should flatten a basic event without key transformer', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      name: 'button',
      boundary: 'test.boundary',
      attributes: {
        testAttr: 'value1',
        anotherAttr: 'value2'
      },
      context: {
        href: 'https://example.com',
        windowWidth: 1024,
        windowHeight: 768,
        userAgent: 'test-agent'
      }
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked',
      name: 'button',
      boundary: 'test.boundary',
      testAttr: 'value1',
      anotherAttr: 'value2',
      href: 'https://example.com',
      windowWidth: 1024,
      windowHeight: 768,
      userAgent: 'test-agent'
    });
  });

  it('should flatten an event with minimal properties', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'viewed'
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'viewed'
    });
  });

  it('should flatten an event with only attributes', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      attributes: {
        buttonId: 'submit-btn',
        category: 'form'
      }
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked',
      buttonId: 'submit-btn',
      category: 'form'
    });
  });

  it('should flatten an event with only context', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'page_view',
      context: {
        href: 'https://example.com/page',
        windowWidth: 1920
      }
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'page_view',
      href: 'https://example.com/page',
      windowWidth: 1920
    });
  });

  it('should apply key transformer to all keys', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      name: 'button',
      boundary: 'test.boundary',
      attributes: {
        testAttr: 'value1',
        anotherAttr: 'value2'
      },
      context: {
        href: 'https://example.com',
        windowWidth: 1024
      }
    };

    const keyTransformer = {
      pattern: /([A-Z])/g,
      replacement: '_$1'
    };

    const result = flattenEvent(event, keyTransformer);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked',
      name: 'button',
      boundary: 'test.boundary',
      test_Attr: 'value1',
      another_Attr: 'value2',
      href: 'https://example.com',
      window_Width: 1024
    });
  });

  it('should apply key transformer that converts camelCase to snake_case', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      attributes: {
        buttonId: 'submit-btn',
        categoryName: 'form',
        isActive: true
      },
      context: {
        windowWidth: 1024,
        windowHeight: 768,
        userAgent: 'test-agent'
      }
    };

    const keyTransformer = {
      pattern: /([A-Z])/g,
      replacement: '_$1'
    };

    const result = flattenEvent(event, keyTransformer);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked',
      button_Id: 'submit-btn',
      category_Name: 'form',
      is_Active: true,
      window_Width: 1024,
      window_Height: 768,
      user_Agent: 'test-agent'
    });
  });

  it('should apply key transformer that converts to lowercase', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      name: 'Button',
      boundary: 'Test.Boundary',
      attributes: {
        TestAttr: 'value1',
        AnotherAttr: 'value2'
      }
    };

    const keyTransformer = {
      pattern: /[A-Z]/g,
      replacement: (match: string) => match.toLowerCase()
    };

    const result = flattenEvent(event, keyTransformer);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked',
      name: 'button',
      boundary: 'test.boundary',
      testattr: 'value1',
      anotherattr: 'value2'
    });
  });

  it('should handle empty attributes and context', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      attributes: {},
      context: {}
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked'
    });
  });

  it('should handle undefined attributes and context', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      attributes: undefined,
      context: undefined
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked'
    });
  });

  it('should preserve nested object values in attributes and context', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      attributes: {
        metadata: { type: 'button', priority: 'high' },
        tags: ['submit', 'form']
      },
      context: {
        href: 'https://example.com'
      }
    };

    const result = flattenEvent(event);

      expect(result).toEqual({
        version: '2025-05-29',
        action: 'clicked',
        metadata: { type: 'button', priority: 'high' },
        tags: ['submit', 'form'],
        href: 'https://example.com'
      });
  });

  it('should handle special characters in attribute keys', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      attributes: {
        'attr-with-dash': 'value1',
        'attr_with_underscore': 'value2',
        'attr.with.dots': 'value3',
        'attr with spaces': 'value4'
      }
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked',
      'attr-with-dash': 'value1',
      'attr_with_underscore': 'value2',
      'attr.with.dots': 'value3',
      'attr with spaces': 'value4'
    });
  });

  it('should handle numeric values in attributes and context', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      attributes: {
        count: 42,
        price: 19.99,
        isActive: true,
        isDisabled: false
      },
      context: {
        windowWidth: 1920,
        windowHeight: 1080
      }
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked',
      count: 42,
      price: 19.99,
      isActive: true,
      isDisabled: false,
      windowWidth: 1920,
      windowHeight: 1080
    });
  });

  it('should handle null and undefined values', () => {
    const event: Event = {
      version: '2025-05-29',
      action: 'clicked',
      attributes: {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zeroValue: 0
      }
    };

    const result = flattenEvent(event);

    expect(result).toEqual({
      version: '2025-05-29',
      action: 'clicked',
      nullValue: null,
      undefinedValue: undefined,
      emptyString: '',
      zeroValue: 0
    });
  });
});

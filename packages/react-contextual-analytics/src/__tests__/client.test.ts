import { createAnalyticsClient } from '../client';
import { Provider } from '../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock provider
const mockProvider: Provider = {
  id: 'test-provider',
  send: vi.fn().mockResolvedValue(undefined)
};

// Create a mutable mock value
let mockIsBrowser = true;

// Mock the isBrowser module
vi.mock('../utils/is-browser', () => ({
  get isBrowser() {
    return mockIsBrowser;
  }
}));

describe('createAnalyticsClient', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Reset mock value
    mockIsBrowser = true;
  });

  it('should not be available in server environment', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    
    // Override the mock for this test
    mockIsBrowser = false;
    
    const client = createAnalyticsClient([mockProvider]);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith('Analytics client is not available in the server');
    expect(client.emit).toBeDefined();
    expect(client.providers).toEqual([]);
    
    consoleWarnSpy.mockRestore();
  });

  it('should emit events with correct structure', async () => {
    const client = createAnalyticsClient([mockProvider]);
    
    await client.emit(
      'test-action',
      'test-name',
      'test-boundary',
      { testAttr: 'value' }
    );

    // Instead of checking exact values, check the structure and types
    expect(mockProvider.send).toHaveBeenCalledWith(expect.objectContaining({
      version: '2025-05-29',
      boundary: 'test-boundary',
      action: 'test-action',
      name: 'test-name',
      attributes: { testAttr: 'value' },
      context: expect.objectContaining({
        href: expect.any(String),
        windowWidth: expect.any(Number),
        windowHeight: expect.any(Number),
        userAgent: expect.any(String)
      })
    }));
  });

  it('should omit context when options.omitContext is true', async () => {
    const client = createAnalyticsClient([mockProvider]);
    
    await client.emit(
      'test-action',
      'test-name',
      'test-boundary',
      { testAttr: 'value' },
      { omitContext: true }
    );

    expect(mockProvider.send).toHaveBeenCalledWith({
      version: '2025-05-29',
      boundary: 'test-boundary',
      action: 'test-action',
      name: 'test-name',
      attributes: { testAttr: 'value' },
      context: undefined
    });
  });

  it('should handle provider errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
    const errorProvider: Provider = {
      id: 'error-provider',
      send: vi.fn().mockRejectedValue(new Error('Provider error'))
    };

    const client = createAnalyticsClient([mockProvider, errorProvider]);
    
    await client.emit('test-action');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'analytic provider error-provider failed',
      expect.any(Object)
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should attach client to window.__0xdeafcafe_rca__ in browser environment', () => {
    const client = createAnalyticsClient([mockProvider]);
    
    expect((window as any).__0xdeafcafe_rca__).toBe(client);
  });
});

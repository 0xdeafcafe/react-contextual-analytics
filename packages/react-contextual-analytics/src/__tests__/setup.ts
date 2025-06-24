import '@testing-library/jest-dom/vitest';

// Mock window properties
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com'
  },
  writable: true
});

Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true
});

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true
});

Object.defineProperty(window.navigator, 'userAgent', {
  value: 'test-agent',
  writable: true
}); 

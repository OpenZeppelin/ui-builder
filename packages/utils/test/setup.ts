import { beforeAll } from 'vitest';

beforeAll(() => {
  // Ensure a default location for tests that rely on window.location
  if (typeof window !== 'undefined' && !window.location.href) {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/'),
      writable: true,
    });
  }
});

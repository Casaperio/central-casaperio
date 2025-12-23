import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from '../mocks/server';

// Import vitest-axe separately due to module compatibility
import * as vitestAxe from 'vitest-axe';

// Extend Vitest matchers (only if toHaveNoViolations exists)
if (vitestAxe.toHaveNoViolations) {
  expect.extend(vitestAxe.toHaveNoViolations);
}

// Comprehensive Firebase mock to prevent initialization errors
vi.mock('../../services/firebase', () => {
  const mockDoc = vi.fn(() => ({
    get: vi.fn(() => Promise.resolve({
      exists: () => false,
      data: () => ({}),
      id: 'mock-id'
    })),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    onSnapshot: vi.fn((callback) => {
      callback({ exists: () => false, data: () => ({}) });
      return vi.fn();
    })
  }));

  const mockCollection = vi.fn(() => ({
    onSnapshot: vi.fn((callback) => {
      callback({ docs: [], empty: true, size: 0 });
      return vi.fn(); // unsubscribe
    }),
    add: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
    doc: mockDoc,
    get: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
    where: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ docs: [] }))
    }))
  }));

  const mockDb = {
    collection: mockCollection
  };

  const mockStorage = {
    ref: vi.fn((path) => ({
      put: vi.fn(() => Promise.resolve({
        ref: {
          getDownloadURL: vi.fn(() => Promise.resolve(`https://mock-storage.com/${path || 'file'}`))
        }
      })),
      delete: vi.fn(() => Promise.resolve()),
      getDownloadURL: vi.fn(() => Promise.resolve('https://mock-storage.com/file'))
    })),
    refFromURL: vi.fn(() => ({
      delete: vi.fn(() => Promise.resolve())
    }))
  };

  const mockAuth = {
    signInAnonymously: vi.fn(() => Promise.resolve({ user: { uid: 'mock-uid' } })),
    onAuthStateChanged: vi.fn((callback) => {
      setTimeout(() => callback({ uid: 'mock-uid' }), 0);
      return vi.fn(); // unsubscribe
    }),
    signOut: vi.fn(() => Promise.resolve()),
    currentUser: { uid: 'mock-uid' }
  };

  return {
    db: mockDb,
    storage: mockStorage,
    auth: mockAuth
  };
});

// Setup MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// Global test utilities
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Suppress console errors in tests (optional - remove if you want to see all errors)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

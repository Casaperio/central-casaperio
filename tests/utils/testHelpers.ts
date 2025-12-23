import { waitFor } from '@testing-library/react';

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 3000
): Promise<void> {
  await waitFor(() => {
    expect(condition()).toBe(true);
  }, { timeout });
}

/**
 * Flush all promises in the queue
 */
export const flushPromises = () =>
  new Promise((resolve) => setImmediate(resolve));

/**
 * Wait for a specific amount of time
 */
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export const todayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get date N days from now in ISO format
 */
export const daysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Get date N days ago in ISO format
 */
export const daysAgo = (days: number): string => {
  return daysFromNow(-days);
};

/**
 * Simulate Firebase subscription callback trigger
 */
export function triggerFirebaseCallback<T>(
  mockFn: any,
  data: T[]
): void {
  const callback = mockFn.mock.calls[0]?.[0];
  if (callback) {
    callback(data);
  }
}

/**
 * Create a delayed promise for testing async behavior
 */
export function delayedPromise<T>(value: T, delay: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delay);
  });
}

/**
 * Mock console methods to avoid noise in tests
 */
export function suppressConsole() {
  const originalConsole = { ...console };

  beforeEach(() => {
    global.console = {
      ...console,
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
  });
}

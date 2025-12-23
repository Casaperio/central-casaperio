import { vi } from 'vitest';

// Mock Firestore collection snapshot
export const createMockSnapshot = (docs: any[]) => ({
  docs: docs.map((data, index) => ({
    id: data.id || `mock-id-${index}`,
    data: () => data,
    exists: () => true
  })),
  empty: docs.length === 0,
  size: docs.length
});

// Mock Firestore collection reference
export const createMockCollection = () => {
  const subscriptions = new Map<string, (snapshot: any) => void>();

  return {
    onSnapshot: vi.fn((callback: any, errorCallback?: any) => {
      const key = Math.random().toString();
      subscriptions.set(key, callback);

      // Immediately call with empty snapshot
      callback(createMockSnapshot([]));

      // Return unsubscribe function
      return () => {
        subscriptions.delete(key);
      };
    }),

    add: vi.fn((data: any) => Promise.resolve({ id: `mock-id-${Date.now()}` })),

    doc: vi.fn((id: string) => ({
      get: vi.fn(() => Promise.resolve({
        id,
        data: () => ({}),
        exists: () => false
      })),
      set: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve())
    })),

    // Helper to trigger subscription updates in tests
    _triggerSnapshot: (data: any[]) => {
      const snapshot = createMockSnapshot(data);
      subscriptions.forEach(callback => callback(snapshot));
    }
  };
};

// Mock Firestore instance
export const createMockFirestore = () => ({
  collection: vi.fn((name: string) => createMockCollection())
});

// Mock Firebase Storage
export const createMockStorage = () => ({
  ref: vi.fn((path?: string) => ({
    put: vi.fn(() => Promise.resolve({
      ref: {
        getDownloadURL: vi.fn(() => Promise.resolve(`https://mock-storage.com/${path || 'file'}`))
      }
    })),
    delete: vi.fn(() => Promise.resolve())
  })),
  refFromURL: vi.fn((url: string) => ({
    delete: vi.fn(() => Promise.resolve())
  }))
});

// Default mock instances
export const mockDb = createMockFirestore();
export const mockStorage = createMockStorage();

import { vi } from 'vitest';
import type { Ticket, Reservation } from '../../types';

// Mock storage service for testing
export const createMockStorageService = () => ({
  tickets: {
    subscribe: vi.fn((callback: (tickets: Ticket[]) => void) => {
      callback([]);
      return vi.fn(); // unsubscribe function
    }),
    add: vi.fn((ticket: Ticket) => Promise.resolve()),
    update: vi.fn((ticket: Ticket) => Promise.resolve()),
    delete: vi.fn((id: string) => Promise.resolve())
  },

  reservations: {
    subscribe: vi.fn((callback: (reservations: Reservation[]) => void) => {
      callback([]);
      return vi.fn();
    }),
    add: vi.fn((reservation: Reservation) => Promise.resolve()),
    update: vi.fn((reservation: Reservation) => Promise.resolve()),
    delete: vi.fn((id: string) => Promise.resolve())
  },

  users: {
    subscribe: vi.fn((callback: any) => {
      callback([]);
      return vi.fn();
    }),
    add: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve())
  },

  properties: {
    subscribe: vi.fn((callback: any) => {
      callback([]);
      return vi.fn();
    }),
    add: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve())
  },

  logs: {
    subscribe: vi.fn((callback: any) => {
      callback([]);
      return vi.fn();
    }),
    add: vi.fn(() => Promise.resolve())
  },

  settings: {
    subscribe: vi.fn((callback: any) => {
      callback({});
      return vi.fn();
    }),
    update: vi.fn(() => Promise.resolve())
  }
});

export const mockStorageService = createMockStorageService();

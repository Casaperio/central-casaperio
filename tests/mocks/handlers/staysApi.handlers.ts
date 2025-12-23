import { http, HttpResponse } from 'msw';

// Match any host for flexibility (dev proxy or production)
const matchStaysApi = (path: string) => new RegExp(`.*${path}$`);

// Mock Stays API handlers - matches both dev proxy and production URLs
export const staysApiHandlers = [
  // Unified all-data endpoint
  http.get(matchStaysApi('/api/v1/all-data'), () => {
    return HttpResponse.json({
      dashboard: {
        weekData: [],
        occupancyStats: {
          available: 5,
          occupied: 7,
          total: 12
        }
      },
      calendar: {
        units: []
      },
      sync: {
        lastSyncAt: new Date().toISOString(),
        status: 'success',
        bookingsCount: 0,
        listingsCount: 0,
        durationMs: 100
      },
      meta: {
        generatedAt: new Date().toISOString(),
        queryTimeMs: 50,
        bookingsCount: 0
      }
    });
  }),

  // Dashboard endpoint
  http.get(matchStaysApi('/api/v1/dashboard'), () => {
    return HttpResponse.json({
      weekData: [],
      occupancyStats: {
        available: 5,
        occupied: 7,
        total: 12
      }
    });
  }),

  // Calendar endpoint
  http.get(matchStaysApi('/api/v1/calendar'), () => {
    return HttpResponse.json({
      units: []
    });
  }),

  // Sync status endpoint
  http.get(matchStaysApi('/api/v1/sync/status'), () => {
    return HttpResponse.json({
      lastSyncAt: null,
      status: 'never',
      lastError: null,
      bookingsCount: 0,
      listingsCount: 0,
      durationMs: 0
    });
  }),

  // Sync trigger endpoint
  http.post(matchStaysApi('/api/v1/sync/trigger'), () => {
    return HttpResponse.json({
      message: 'Sync started',
      timestamp: new Date().toISOString()
    });
  }),

  // Health check endpoint
  http.get(matchStaysApi('/api/v1/health'), () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Properties endpoint
  http.get(matchStaysApi('/api/v1/properties'), () => {
    return HttpResponse.json([]);
  }),

  // Inventory endpoints
  http.get(matchStaysApi('/api/v1/inventory/items'), () => {
    return HttpResponse.json([]);
  }),

  http.get(matchStaysApi('/api/v1/inventory/transactions'), () => {
    return HttpResponse.json([]);
  }),
];

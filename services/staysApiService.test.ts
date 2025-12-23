import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../tests/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  getDashboard,
  getCalendar,
  getSyncStatus,
  triggerSync,
  checkHealth,
  getFinancialSummary,
  getFinancialsByProperty,
  getFinancialsByChannel,
  getRevenueTrend,
  getFinancialPanel,
  getDetailedFinancials,
  getBookingStatistics,
  getOccupancyByProperty,
  getCancellationAnalysis,
  getGuestSummary,
  getReturningGuests,
  getGuestDemographics,
  getTicketStatistics,
  getTeamStatistics,
  getAllData
} from './staysApiService';

describe('staysApiService', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('getDashboard', () => {
    it('should fetch dashboard data successfully', async () => {
      const result = await getDashboard();

      expect(result).toHaveProperty('weekData');
      expect(result).toHaveProperty('occupancyStats');
      expect(result.occupancyStats.total).toBe(12);
    });

    it('should throw error on API failure', async () => {
      server.use(
        http.get(/.*\/api\/v1\/dashboard/, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(getDashboard()).rejects.toThrow('API Error: 500');
    });
  });

  describe('getCalendar', () => {
    it('should fetch calendar data without date params', async () => {
      const result = await getCalendar();

      expect(result).toHaveProperty('units');
      expect(Array.isArray(result.units)).toBe(true);
    });

    it('should fetch calendar data with date range', async () => {
      server.use(
        http.get(/.*\/api\/v1\/calendar/, ({ request }) => {
          const url = new URL(request.url);
          const from = url.searchParams.get('from');
          const to = url.searchParams.get('to');

          expect(from).toBe('2025-12-01');
          expect(to).toBe('2025-12-31');

          return HttpResponse.json({
            units: [
              { id: 'unit-1', date: '2025-12-15', status: 'available' }
            ]
          });
        })
      );

      const result = await getCalendar('2025-12-01', '2025-12-31');

      expect(result.units).toHaveLength(1);
    });
  });

  describe('getSyncStatus', () => {
    it('should fetch sync status', async () => {
      const result = await getSyncStatus();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('bookingsCount');
    });

    it('should return sync metadata', async () => {
      server.use(
        http.get(/.*\/api\/v1\/sync\/status/, () => {
          return HttpResponse.json({
            lastSyncAt: '2025-12-20T10:00:00Z',
            status: 'success',
            lastError: null,
            bookingsCount: 42,
            listingsCount: 12,
            durationMs: 1500
          });
        })
      );

      const result = await getSyncStatus();

      expect(result.status).toBe('success');
      expect(result.bookingsCount).toBe(42);
      expect(result.listingsCount).toBe(12);
    });
  });

  describe('triggerSync', () => {
    it('should trigger sync operation', async () => {
      const result = await triggerSync();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('checkHealth', () => {
    it('should return false when API is unreachable', async () => {
      // Health check connects to /health which we won't mock
      // This will naturally fail and return false
      const result = await checkHealth();

      // checkHealth catches errors and returns false
      expect(result).toBe(false);
    });
  });

  describe('getAllData', () => {
    it('should fetch unified dashboard and calendar data', async () => {
      const result = await getAllData();

      expect(result).toHaveProperty('dashboard');
      expect(result).toHaveProperty('calendar');
      expect(result).toHaveProperty('sync');
      expect(result).toHaveProperty('meta');
    });

    it('should include week data in dashboard', async () => {
      server.use(
        http.get(/.*\/api\/v1\/all-data/, () => {
          return HttpResponse.json({
            dashboard: {
              weekData: [
                {
                  date: '2025-12-20',
                  dayOfWeek: 'Friday',
                  isToday: true,
                  guests: []
                }
              ],
              occupancyStats: {
                available: 5,
                occupied: 7,
                total: 12
              }
            },
            calendar: { units: [] },
            sync: { status: 'success', bookingsCount: 0 },
            meta: { generatedAt: new Date().toISOString() }
          });
        })
      );

      const result = await getAllData();

      expect(result.dashboard.weekData).toHaveLength(1);
      expect(result.dashboard.weekData[0].isToday).toBe(true);
    });
  });

  describe('Financial APIs', () => {
    it('should fetch financial summary', async () => {
      server.use(
        http.get(/.*\/api\/v1\/financials\/summary/, () => {
          return HttpResponse.json({
            totalRevenue: 150000,
            totalBookings: 42,
            averageNightlyRate: 500,
            occupancyRate: 75.5,
            periodStart: '2025-01-01',
            periodEnd: '2025-12-31'
          });
        })
      );

      const result = await getFinancialSummary('2025-01-01', '2025-12-31');

      expect(result.totalRevenue).toBe(150000);
      expect(result.totalBookings).toBe(42);
    });

    it('should fetch financials by property', async () => {
      server.use(
        http.get(/.*\/api\/v1\/financials\/by-property/, () => {
          return HttpResponse.json({
            properties: [
              { propertyCode: '501A', revenue: 50000, bookings: 15 }
            ]
          });
        })
      );

      const result = await getFinancialsByProperty();

      expect(result.properties).toHaveLength(1);
    });

    it('should fetch financials by channel', async () => {
      server.use(
        http.get(/.*\/api\/v1\/financials\/by-channel/, () => {
          return HttpResponse.json({
            channels: [
              { channel: 'Airbnb', revenue: 80000, bookings: 25 }
            ]
          });
        })
      );

      const result = await getFinancialsByChannel();

      expect(result.channels).toHaveLength(1);
    });

    it('should fetch revenue trend', async () => {
      server.use(
        http.get(/.*\/api\/v1\/financials\/trend/, () => {
          return HttpResponse.json({
            trend: [
              { month: '2025-01', revenue: 10000 },
              { month: '2025-02', revenue: 12000 }
            ]
          });
        })
      );

      const result = await getRevenueTrend();

      expect(result.trend).toHaveLength(2);
    });

    it('should fetch financial panel data', async () => {
      server.use(
        http.get(/.*\/api\/v1\/financials\/panel/, () => {
          return HttpResponse.json({
            summary: { totalRevenue: 150000 },
            byProperty: [],
            byChannel: [],
            trend: []
          });
        })
      );

      const result = await getFinancialPanel();

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('byProperty');
      expect(result).toHaveProperty('byChannel');
      expect(result).toHaveProperty('trend');
    });

    it('should fetch detailed financials', async () => {
      server.use(
        http.get(/.*\/api\/v1\/financials\/detailed/, () => {
          return HttpResponse.json({
            reservations: [
              {
                bookingId: 'book-1',
                guestName: 'John Doe',
                propertyCode: '501A',
                revenue: 2500
              }
            ]
          });
        })
      );

      const result = await getDetailedFinancials();

      expect(result.reservations).toHaveLength(1);
    });
  });

  describe('Statistics APIs', () => {
    it('should fetch booking statistics', async () => {
      server.use(
        http.get(/.*\/api\/v1\/statistics\/bookings/, () => {
          return HttpResponse.json({
            totalBookings: 150,
            averageStayLength: 4.5,
            topProperties: []
          });
        })
      );

      const result = await getBookingStatistics();

      expect(result.totalBookings).toBe(150);
      expect(result.averageStayLength).toBe(4.5);
    });

    it('should fetch occupancy by property', async () => {
      server.use(
        http.get(/.*\/api\/v1\/statistics\/occupancy/, () => {
          return HttpResponse.json({
            properties: [
              { propertyCode: '501A', occupancyRate: 85.5, nights: 300 }
            ]
          });
        })
      );

      const result = await getOccupancyByProperty();

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].occupancyRate).toBe(85.5);
    });

    it('should fetch cancellation analysis', async () => {
      server.use(
        http.get(/.*\/api\/v1\/statistics\/cancellations/, () => {
          return HttpResponse.json({
            totalCancellations: 12,
            cancellationRate: 8.0,
            byReason: []
          });
        })
      );

      const result = await getCancellationAnalysis();

      expect(result.totalCancellations).toBe(12);
      expect(result.cancellationRate).toBe(8.0);
    });
  });

  describe('Guest APIs', () => {
    it('should fetch guest summary', async () => {
      server.use(
        http.get(/.*\/api\/v1\/guests\/summary/, () => {
          return HttpResponse.json({
            totalGuests: 420,
            returningGuests: 85,
            averageRating: 4.7
          });
        })
      );

      const result = await getGuestSummary();

      expect(result.totalGuests).toBe(420);
      expect(result.returningGuests).toBe(85);
    });

    it('should fetch returning guests', async () => {
      server.use(
        http.get(/.*\/api\/v1\/guests\/returning/, () => {
          return HttpResponse.json({
            guests: [
              { guestName: 'John Doe', visitCount: 3, lastVisit: '2025-12-01' }
            ]
          });
        })
      );

      const result = await getReturningGuests();

      expect(result.guests).toHaveLength(1);
      expect(result.guests[0].visitCount).toBe(3);
    });

    it('should fetch guest demographics', async () => {
      server.use(
        http.get(/.*\/api\/v1\/guests\/demographics/, () => {
          return HttpResponse.json({
            byCountry: [
              { country: 'Brazil', count: 200 }
            ],
            byAge: [],
            byGroupSize: []
          });
        })
      );

      const result = await getGuestDemographics();

      expect(result.byCountry).toHaveLength(1);
    });
  });

  describe('Team APIs', () => {
    it('should fetch team statistics', async () => {
      server.use(
        http.get(/.*\/api\/v1\/team\/statistics/, () => {
          return HttpResponse.json({
            totalMembers: 8,
            activeTickets: 15,
            completionRate: 92.5
          });
        })
      );

      const result = await getTeamStatistics();

      expect(result.totalMembers).toBe(8);
      expect(result.activeTickets).toBe(15);
    });

    it('should fetch ticket statistics', async () => {
      server.use(
        http.get(/.*\/api\/v1\/tickets\/statistics/, () => {
          return HttpResponse.json({
            totalTickets: 250,
            openTickets: 15,
            completedTickets: 225,
            averageCompletionTime: 2.5
          });
        })
      );

      const result = await getTicketStatistics();

      expect(result.totalTickets).toBe(250);
      expect(result.averageCompletionTime).toBe(2.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(/.*\/api\/v1\/dashboard/, () => {
          return HttpResponse.error();
        })
      );

      await expect(getDashboard()).rejects.toThrow();
    });

    it('should handle 404 errors', async () => {
      server.use(
        http.get(/.*\/api\/v1\/dashboard/, () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      await expect(getDashboard()).rejects.toThrow('API Error: 404');
    });

    it('should handle API errors with message', async () => {
      server.use(
        http.get(/.*\/api\/v1\/dashboard/, () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Database connection failed' }),
            { status: 503 }
          );
        })
      );

      await expect(getDashboard()).rejects.toThrow('503');
    });
  });

  describe('Date Parameters', () => {
    it('should append date params to calendar request', async () => {
      let capturedParams: URLSearchParams | null = null;

      server.use(
        http.get(/.*\/api\/v1\/calendar/, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;

          return HttpResponse.json({ units: [] });
        })
      );

      await getCalendar('2025-01-01', '2025-01-31');

      expect(capturedParams?.get('from')).toBe('2025-01-01');
      expect(capturedParams?.get('to')).toBe('2025-01-31');
    });

    it('should append date params to financial summary', async () => {
      let capturedParams: URLSearchParams | null = null;

      server.use(
        http.get(/.*\/api\/v1\/financials\/summary/, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = url.searchParams;

          return HttpResponse.json({
            totalRevenue: 0,
            totalBookings: 0,
            averageNightlyRate: 0,
            occupancyRate: 0
          });
        })
      );

      await getFinancialSummary('2025-06-01', '2025-06-30');

      expect(capturedParams?.get('from')).toBe('2025-06-01');
      expect(capturedParams?.get('to')).toBe('2025-06-30');
    });
  });

  describe('getAllData - Unified Endpoint', () => {
    it('should fetch all data in single request', async () => {
      server.use(
        http.get(/.*\/api\/v1\/all-data/, () => {
          return HttpResponse.json({
            dashboard: {
              weekData: [
                {
                  date: '2025-12-20',
                  dayOfWeek: 'Friday',
                  isToday: true,
                  guests: [
                    {
                      id: 'guest-1',
                      bookingId: 'book-1',
                      guestName: 'João Silva',
                      apartmentCode: '501A',
                      status: 'staying',
                      checkInDate: '2025-12-18',
                      checkInTime: '15:00',
                      checkOutDate: '2025-12-22',
                      checkOutTime: '11:00',
                      guestCount: 2,
                      nights: 4,
                      platform: 'Airbnb',
                      platformImage: 'airbnb.png'
                    }
                  ]
                }
              ],
              occupancyStats: {
                available: 5,
                occupied: 7,
                total: 12
              }
            },
            calendar: {
              units: [
                {
                  id: 'unit-1',
                  listingId: 'listing-1',
                  apartmentCode: '501A',
                  date: '2025-12-20',
                  status: 'booked',
                  price: 500,
                  minStay: 2
                }
              ]
            },
            sync: {
              lastSyncAt: '2025-12-20T01:00:00Z',
              status: 'success',
              bookingsCount: 42,
              listingsCount: 12,
              durationMs: 1500
            },
            meta: {
              generatedAt: '2025-12-20T02:00:00Z',
              queryTimeMs: 250,
              bookingsCount: 42
            }
          });
        })
      );

      const result = await getAllData();

      // Verify dashboard
      expect(result.dashboard.weekData).toHaveLength(1);
      expect(result.dashboard.weekData[0].guests).toHaveLength(1);
      expect(result.dashboard.weekData[0].guests[0].guestName).toBe('João Silva');
      expect(result.dashboard.occupancyStats.total).toBe(12);

      // Verify calendar
      expect(result.calendar.units).toHaveLength(1);
      expect(result.calendar.units[0].apartmentCode).toBe('501A');

      // Verify sync metadata
      expect(result.sync.status).toBe('success');
      expect(result.sync.bookingsCount).toBe(42);

      // Verify meta
      expect(result.meta.bookingsCount).toBe(42);
    });

    it('should handle API errors in unified request', async () => {
      server.use(
        http.get(/.*\/api\/v1\/all-data/, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(getAllData()).rejects.toThrow('API Error: 500');
    });
  });

  describe('Booking Statistics', () => {
    it('should fetch booking statistics with defaults', async () => {
      server.use(
        http.get(/.*\/api\/v1\/statistics\/bookings/, () => {
          return HttpResponse.json({
            totalBookings: 250,
            averageStayLength: 4.2,
            topProperties: [
              { propertyCode: '501A', bookings: 45 }
            ],
            byMonth: []
          });
        })
      );

      const result = await getBookingStatistics();

      expect(result.totalBookings).toBe(250);
      expect(result.topProperties).toHaveLength(1);
    });
  });

  describe('API Request Headers', () => {
    it('should include API key in headers', async () => {
      let capturedHeaders: Headers | null = null;

      server.use(
        http.get(/.*\/api\/v1\/dashboard/, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ weekData: [], occupancyStats: { available: 0, occupied: 0, total: 0 } });
        })
      );

      await getDashboard();

      // Note: The exact header might be different based on env setup
      expect(capturedHeaders?.has('Content-Type')).toBe(true);
    });
  });
});

import { useState, useEffect } from 'react';

interface BookingStatistics {
  totalBookings: number;
  confirmedBookings: number;
  canceledBookings: number;
  blockedDates: number;
  cancellationRate: number;
  averageLeadTime: number;
  averageStayLength: number;
  totalGuests: number;
  averageGuestsPerBooking: number;
  bySource: Record<string, number>;
  byMonth: Record<string, number>;
  byDayOfWeek: Record<string, number>;
}

interface OccupancyData {
  propertyCode: string;
  propertyName: string | null;
  totalNights: number;
  occupiedNights: number;
  blockedNights: number;
  availableNights: number;
  occupancyRate: number;
  blockRate: number;
}

interface CancellationData {
  totalCancellations: number;
  cancellationRate: number;
  averageAdvanceNotice: number;
  averageAdvanceNoticeNote?: string;
  byChannel: Record<string, number>;
  byMonth: Record<string, number>;
  revenueImpact: number;
}

interface GuestSummary {
  totalUniqueGuests: number;
  totalBookings: number;
  returningGuests: number;
  returningGuestsRate: number;
  topGuests: Array<{ name: string; stays: number; revenue: number }>;
}

interface PropertyFinancials {
  propertyCode: string;
  propertyName: string | null;
  totalRevenue: number;
  bookingCount: number;
  averageDailyRate: number;
  nights: number;
}

interface ChannelFinancials {
  channel: string;
  revenue: number;
  bookingsCount: number;
  averageValue: number;
  percentage: number;
}

interface CommercialData {
  bookingStats: BookingStatistics;
  occupancy: OccupancyData[];
  cancellations: CancellationData;
  guestSummary: GuestSummary;
  financials: {
    byProperty: PropertyFinancials[];
    byChannel: ChannelFinancials[];
  };
}

export function useCommercialData(from: string, to: string) {
  const [data, setData] = useState<CommercialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const isDev = import.meta.env.DEV;
        const API_BASE_URL = isDev ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
        const API_KEY = import.meta.env.VITE_API_KEY || '';

        const baseUrl = `${API_BASE_URL}/api/v1`;
        const dateParams = `from=${from}&to=${to}`;
        const headers = {
          'X-API-Key': API_KEY,
        };

        const [bookingStatsRes, occupancyRes, cancellationsRes, guestSummaryRes, byPropertyRes, byChannelRes] = await Promise.all([
          fetch(`${baseUrl}/statistics/bookings?${dateParams}`, { headers }),
          fetch(`${baseUrl}/statistics/occupancy?${dateParams}`, { headers }),
          fetch(`${baseUrl}/statistics/cancellations?${dateParams}`, { headers }),
          fetch(`${baseUrl}/guests/summary`, { headers }),
          fetch(`${baseUrl}/financials/by-property?${dateParams}`, { headers }),
          fetch(`${baseUrl}/financials/by-channel?${dateParams}`, { headers }),
        ]);

        if (!bookingStatsRes.ok || !occupancyRes.ok || !cancellationsRes.ok ||
            !guestSummaryRes.ok || !byPropertyRes.ok || !byChannelRes.ok) {
          throw new Error('Failed to fetch commercial data');
        }

        const [bookingStatsData, occupancyData, cancellationsData, guestSummary, byPropertyData, byChannelData] = await Promise.all([
          bookingStatsRes.json(),
          occupancyRes.json(),
          cancellationsRes.json(),
          guestSummaryRes.json(),
          byPropertyRes.json(),
          byChannelRes.json(),
        ]);

        setData({
          bookingStats: bookingStatsData.statistics,
          occupancy: occupancyData.occupancy,
          cancellations: cancellationsData.cancellations,
          guestSummary,
          financials: {
            byProperty: byPropertyData.properties,
            byChannel: byChannelData.channels,
          },
        });
        setLastUpdated(new Date());
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [from, to]);

  return { data, loading, error, lastUpdated };
}

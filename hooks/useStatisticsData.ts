/**
 * Hook for fetching and caching statistics data from the Stays API
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getBookingStatistics,
  getOccupancyByProperty,
  getCancellationAnalysis,
  getGuestSummary,
  BookingStatistics,
  OccupancyData,
  CancellationData,
  GuestSummary,
} from '../services/staysApiService';

interface UseStatisticsDataOptions {
  from?: string;
  to?: string;
  autoFetch?: boolean;
}

interface StatisticsDataState {
  bookingStats: BookingStatistics | null;
  occupancy: OccupancyData[];
  cancellations: CancellationData | null;
  guestSummary: GuestSummary | null;
  loading: boolean;
  error: string | null;
}

export function useStatisticsData(options: UseStatisticsDataOptions = {}) {
  const { from, to, autoFetch = true } = options;

  const [state, setState] = useState<StatisticsDataState>({
    bookingStats: null,
    occupancy: [],
    cancellations: null,
    guestSummary: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [bookingRes, occupancyRes, cancellationRes, guestRes] = await Promise.all([
        getBookingStatistics(from, to),
        getOccupancyByProperty(from, to),
        getCancellationAnalysis(from, to),
        getGuestSummary(),
      ]);

      setState({
        bookingStats: bookingRes.statistics,
        occupancy: occupancyRes.occupancy,
        cancellations: cancellationRes.cancellations,
        guestSummary: guestRes,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching statistics data:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch statistics data',
      }));
    }
  }, [from, to]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    ...state,
    refetch: fetchData,
  };
}

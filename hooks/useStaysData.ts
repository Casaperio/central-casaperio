/**
 * useStaysData Hook
 * Fetches and caches booking data from stays-api using React Query
 * Optimized to use single unified endpoint for all data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  getAllData,
  UnifiedResponse,
  DashboardResponse,
  CalendarResponse,
  SyncStatus,
} from '../services/staysApiService';
import {
  mapDashboardToAgendaGroups,
  mapCalendarToReservations,
  AgendaGroup,
  ReservationWithDailyStatus,
} from '../services/staysDataMapper';

interface UseStaysDataReturn {
  // Raw API data
  dashboardData: DashboardResponse | null;
  calendarData: CalendarResponse | null;
  syncStatus: SyncStatus | null;

  // Transformed data ready to use
  agendaGroups: AgendaGroup[];
  reservations: ReservationWithDailyStatus[];

  // State
  loading: boolean;
  isFetching: boolean; // Added to track background updates
  error: string | null;
  lastFetch: number;

  // Actions
  refresh: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshCalendar: () => Promise<void>;

  // Performance info
  meta: UnifiedResponse['meta'] | null;
}

// Cache configuration
const STALE_TIME = 5 * 60 * 1000;     // 5 minutes - data considered fresh
const REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes - auto-refresh interval

/**
 * Returns current date as YYYY-MM-DD string
 */
function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useStaysData(): UseStaysDataReturn {
  const queryClient = useQueryClient();

  // Track current date to detect day changes (midnight crossing)
  const [currentDateStr, setCurrentDateStr] = useState(getTodayStr);
  const lastDateCheckRef = useRef(getTodayStr());

  // Single query for all data using the unified endpoint
  const {
    data,
    isLoading,
    isFetching, // Destructure isFetching
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ['stays-all-data'],
    queryFn: () => getAllData(),
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Check for day change (midnight crossing)
  useEffect(() => {
    const interval = setInterval(() => {
      const nowDateStr = getTodayStr();
      if (nowDateStr !== lastDateCheckRef.current) {
        console.log(`[useStaysData] Day changed: ${lastDateCheckRef.current} -> ${nowDateStr}`);
        lastDateCheckRef.current = nowDateStr;
        setCurrentDateStr(nowDateStr);
        // Force refetch on day change to recompute daily statuses
        refetch();
      }
    }, 60_000); // Check every minute

    return () => clearInterval(interval);
  }, [refetch]);

  // Transform dashboard data to agenda groups
  // Depends on currentDateStr to force re-compute when day changes
  const agendaGroups = useMemo<AgendaGroup[]>(() => {
    if (!data?.dashboard) return [];
    // console.log(`[useStaysData] Computing agendaGroups for date: ${currentDateStr}`);
    return mapDashboardToAgendaGroups(data.dashboard);
  }, [data?.dashboard, currentDateStr]);

  // Transform calendar data to reservations array
  const reservations = useMemo<ReservationWithDailyStatus[]>(() => {
    if (!data?.calendar) return [];
    return mapCalendarToReservations(data.calendar);
  }, [data?.calendar]);

  // Convert sync info to SyncStatus type for backward compatibility
  const syncStatus = useMemo<SyncStatus | null>(() => {
    if (!data?.sync) return null;
    return {
      lastSyncAt: data.sync.lastSyncAt,
      status: data.sync.status as 'success' | 'error' | 'running' | 'never',
      lastError: null,
      bookingsCount: data.sync.bookingsCount,
      listingsCount: data.sync.listingsCount,
      durationMs: data.sync.durationMs,
    };
  }, [data?.sync]);

  // Refresh function that returns a Promise
  const refresh = async () => {
    await refetch();
  };

  return {
    // Raw API data
    dashboardData: data?.dashboard ?? null,
    calendarData: data?.calendar ?? null,
    syncStatus,

    // Transformed data
    agendaGroups,
    reservations,

    // State
    loading: isLoading,
    isFetching: isFetching, // Return isFetching
    error: error instanceof Error ? error.message : (error ? String(error) : null),
    lastFetch: dataUpdatedAt,

    // Actions - all use the same unified refetch
    refresh,
    refreshDashboard: refresh,
    refreshCalendar: refresh,

    // Performance info
    meta: data?.meta ?? null,
  };
}
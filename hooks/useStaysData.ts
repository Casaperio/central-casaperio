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
import { perfMonitor } from '../utils/performanceUtils';
import { usePageVisibility } from './usePageVisibility';
import {
  getRefetchInterval,
  shouldRefetchInBackground,
  shouldRefetchOnWindowFocus,
  generateDataFingerprint,
  AUTO_REFRESH_CONFIG,
} from '../utils/refetchPolicy';

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
const STALE_TIME = 10 * 60 * 1000;     // 10 minutes - data considered fresh
// Auto-refresh inteligente: intervalos por rota, pausa quando aba oculta

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

/**
 * Formats a Date object to YYYY-MM-DD string
 */
function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface UseStaysDataOptions {
  /**
   * Start date for filtering data (YYYY-MM-DD)
   * REQUIRED - prevents loading unnecessary data
   */
  from: string;
  
  /**
   * End date for filtering data (YYYY-MM-DD)
   * REQUIRED - prevents loading unnecessary data
   */
  to: string;
  
  /**
   * Route identifier for determining refetch interval
   * Different routes have different update frequencies
   */
  routeIdentifier?: string;
}

export function useStaysData(options: UseStaysDataOptions): UseStaysDataReturn {
  const queryClient = useQueryClient();
  const { from, to, routeIdentifier = 'default' } = options;
  
  // 🔄 Auto-refresh inteligente
  const isPageVisible = usePageVisibility();
  const lastFingerprintRef = useRef<string>('');

  // Validation: from/to são obrigatórios
  if (!from || !to) {
    throw new Error(
      '[useStaysData] from/to são obrigatórios. Use getDefaultPeriodForRoute() para obter período padrão.'
    );
  }
  
  // Determinar intervalo de refetch baseado na rota
  const refetchInterval = AUTO_REFRESH_CONFIG.enabled 
    ? getRefetchInterval(routeIdentifier)
    : false;

  // Track current date to detect day changes (midnight crossing)
  const [currentDateStr, setCurrentDateStr] = useState(getTodayStr);
  const lastDateCheckRef = useRef(getTodayStr());

  // Single query for all data using the unified endpoint
  // Include from/to in queryKey so cache is invalidated when date range changes
  const {
    data,
    isLoading,
    isFetching,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ['stays-all-data', from, to, routeIdentifier],
    queryFn: async () => {
      const fetchStart = performance.now();
      
      perfMonitor.start('API fetch');
      const result = await getAllData(from, to);
      const fetchEnd = performance.now();
      perfMonitor.end('API fetch');
      
      // 📊 DIAGNÓSTICO DETALHADO (apenas DEV)
      if (import.meta.env.DEV) {
        const ttfb = fetchEnd - fetchStart;
        const payloadSize = JSON.stringify(result).length;
        const payloadSizeMB = (payloadSize / 1024 / 1024).toFixed(2);
        
        console.group(`📡 [Fetch Diagnostic] ${routeIdentifier}`);
        console.log(`⏱️  TTFB (server response): ${ttfb.toFixed(0)}ms`);
        console.log(`📦 Payload size: ${payloadSizeMB}MB (${payloadSize.toLocaleString()} bytes)`);
        console.log(`📅 Period: ${from} → ${to}`);
        console.log(`🔑 QueryKey: ['stays-all-data', '${from}', '${to}', '${routeIdentifier}']`);
        console.log(`📊 Calendar units: ${result.calendar?.units?.length || 0}`);
        console.log(`📊 Dashboard week data: ${result.dashboard?.weekData?.length || 0} days`);
        console.groupEnd();
      }
      // 🎯 Fingerprinting: evita reprocessamento se dados não mudaram
      const newFingerprint = generateDataFingerprint(result);
      
      if (lastFingerprintRef.current === newFingerprint) {
        console.log('🔄 [Auto-refresh] Dados não mudaram, mantendo referências');
      } else {
        console.log('✨ [Auto-refresh] Dados atualizados:', newFingerprint);
        lastFingerprintRef.current = newFingerprint;
      }
      
      return result;
    },
    staleTime: STALE_TIME,
    
    // 🔄 Auto-refresh inteligente
    refetchInterval: refetchInterval,
    refetchIntervalInBackground: shouldRefetchInBackground(routeIdentifier),
    refetchOnWindowFocus: shouldRefetchOnWindowFocus(routeIdentifier),
    
    // ⏸️ Pausar quando aba oculta
    enabled: AUTO_REFRESH_CONFIG.pauseWhenHidden ? isPageVisible : true,
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
    const startTime = performance.now();
    perfMonitor.start('mapDashboardToAgendaGroups');
    const result = mapDashboardToAgendaGroups(data.dashboard);
    perfMonitor.end('mapDashboardToAgendaGroups');
    
    if (import.meta.env.DEV) {
      const duration = performance.now() - startTime;
      console.log(`🔄 [Transform] mapDashboardToAgendaGroups: ${duration.toFixed(0)}ms → ${result.length} groups`);
    }
    return result;
  }, [data?.dashboard, currentDateStr]);

  // Transform calendar data to reservations array
  const reservations = useMemo<ReservationWithDailyStatus[]>(() => {
    if (!data?.calendar) return [];
    const startTime = performance.now();
    perfMonitor.start('mapCalendarToReservations');
    const result = mapCalendarToReservations(data.calendar);
    perfMonitor.end('mapCalendarToReservations');
    
    if (import.meta.env.DEV) {
      const duration = performance.now() - startTime;
      console.log(`🔄 [Transform] mapCalendarToReservations: ${duration.toFixed(0)}ms → ${result.length} reservations`);
      console.log(perfMonitor.getSummary());
    }
    return result;
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
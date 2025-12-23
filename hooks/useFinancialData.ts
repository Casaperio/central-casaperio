/**
 * Hook for fetching and caching financial data from the Stays API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getFinancialSummary,
  getFinancialsByProperty,
  getFinancialsByChannel,
  getRevenueTrend,
  getFinancialPanel,
  refreshFinancialPanel,
  FinancialSummary,
  PropertyFinancials,
  ChannelFinancials,
  RevenueTrendPoint,
  FinancialPanelData,
} from '../services/staysApiService';

interface UseFinancialDataOptions {
  from?: string;
  to?: string;
  autoFetch?: boolean;
  autoRefreshInterval?: number; // in milliseconds, default 5 minutes
}

interface FinancialDataState {
  summary: FinancialSummary | null;
  byProperty: PropertyFinancials[];
  byChannel: ChannelFinancials[];
  trend: RevenueTrendPoint[];
  panel: FinancialPanelData | null;
  loading: boolean;
  panelLoading: boolean;
  error: string | null;
}

const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useFinancialData(options: UseFinancialDataOptions = {}) {
  const { from, to, autoFetch = true, autoRefreshInterval = DEFAULT_REFRESH_INTERVAL } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<FinancialDataState>({
    summary: null,
    byProperty: [],
    byChannel: [],
    trend: [],
    panel: null,
    loading: false,
    panelLoading: false,
    error: null,
  });

  // Fetch all data
  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [summaryRes, propertyRes, channelRes, trendRes, panelRes] = await Promise.all([
        getFinancialSummary(from, to),
        getFinancialsByProperty(from, to),
        getFinancialsByChannel(from, to),
        getRevenueTrend(),
        getFinancialPanel(),
      ]);

      setState({
        summary: summaryRes,
        byProperty: propertyRes.properties,
        byChannel: channelRes.channels,
        trend: trendRes.trend,
        panel: panelRes,
        loading: false,
        panelLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        panelLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch financial data',
      }));
    }
  }, [from, to]);

  // Fetch only panel data (lighter refresh)
  const fetchPanelData = useCallback(async () => {
    setState((prev) => ({ ...prev, panelLoading: true }));

    try {
      const panelRes = await getFinancialPanel();
      setState((prev) => ({
        ...prev,
        panel: panelRes,
        panelLoading: false,
      }));
    } catch (err) {
      console.error('Error fetching panel data:', err);
      setState((prev) => ({
        ...prev,
        panelLoading: false,
      }));
    }
  }, []);

  // Force refresh panel data
  const refreshPanel = useCallback(async () => {
    setState((prev) => ({ ...prev, panelLoading: true }));

    try {
      const panelRes = await refreshFinancialPanel();
      setState((prev) => ({
        ...prev,
        panel: panelRes,
        panelLoading: false,
      }));
      return panelRes;
    } catch (err) {
      console.error('Error refreshing panel data:', err);
      setState((prev) => ({
        ...prev,
        panelLoading: false,
        error: err instanceof Error ? err.message : 'Failed to refresh panel data',
      }));
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  // Auto-refresh panel data every 5 minutes
  useEffect(() => {
    if (autoFetch && autoRefreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchPanelData();
      }, autoRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoFetch, autoRefreshInterval, fetchPanelData]);

  return {
    ...state,
    refetch: fetchData,
    refetchPanel: fetchPanelData,
    refreshPanel,
  };
}

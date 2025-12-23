import { useState, useEffect } from 'react';

interface TicketStatistics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  doneTickets: number;
  cancelledTickets: number;
  averageResolutionTime: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byAssignee: Record<string, { count: number; avgTime: number }>;
  byProperty: Record<string, number>;
  byMonth: Record<string, number>;
}

interface OperationalData {
  ticketStats: TicketStatistics;
}

export function useOperationalData(from: string, to: string) {
  const [data, setData] = useState<OperationalData | null>(null);
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

        const headers = {
          'X-API-Key': API_KEY,
        };

        const response = await fetch(
          `${API_BASE_URL}/api/v1/tickets/statistics?from=${from}&to=${to}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ticket statistics: ${response.statusText}`);
        }

        const ticketStats = await response.json();
        setData({ ticketStats });
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

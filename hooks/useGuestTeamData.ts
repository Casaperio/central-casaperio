import { useState, useEffect } from 'react';

interface TeamMemberPerformance {
  userId: string;
  userName: string;
  totalReservations: number;
  currentMonthReservations: number;
  futureReservations: number;
  averageRating: number;
  ratingsCount: number;
  totalRevenue: number;
}

interface TeamStatistics {
  members: TeamMemberPerformance[];
  distribution: Record<string, number>;
  monthlyComparison: {
    currentMonth: Record<string, number>;
    previousMonth: Record<string, number>;
  };
}

export function useGuestTeamData() {
  const [data, setData] = useState<TeamStatistics | null>(null);
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
          `${API_BASE_URL}/api/v1/team/statistics`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch team statistics: ${response.statusText}`);
        }

        const stats = await response.json();
        setData(stats);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []); // No dependencies - team data doesn't depend on date range

  return { data, loading, error, lastUpdated };
}

/**
 * 🔔 FEED FIXO DE NOTIFICAÇÕES (Desacoplado da rota)
 * 
 * Este hook fornece um feed consistente e independente de notificações de reservas,
 * usando um range FIXO que não muda conforme o usuário navega entre módulos.
 * 
 * Solução para Bug #1: Popup gigante com reservas antigas ao navegar entre módulos
 * 
 * Range fixo: hoje - 1 dia → hoje + 90 dias
 * Polling: 60 segundos (consistente)
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getCalendar, CalendarResponse } from '../services/staysApiService';
import { mapCalendarToReservations, ReservationWithDailyStatus } from '../services/staysDataMapper';
import { generateDataFingerprint } from '../utils/refetchPolicy';
import { feedLogger } from '../utils/logger';

const NOTIFICATIONS_RANGE_DAYS_PAST = 1;  // 1 dia no passado
const NOTIFICATIONS_RANGE_DAYS_FUTURE = 90; // 90 dias no futuro
const POLLING_INTERVAL_MS = 60000; // 60 segundos

interface UseStaysNotificationsFeedReturn {
  reservations: ReservationWithDailyStatus[];
  isLoading: boolean;
  isFetched: boolean;
  isSuccess: boolean;
  error: string | null;
  fingerprint: string;
}

export function useStaysNotificationsFeed(): UseStaysNotificationsFeedReturn {
  // Range fixo: não muda conforme a rota
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - NOTIFICATIONS_RANGE_DAYS_PAST);
    
    const end = new Date(today);
    end.setDate(today.getDate() + NOTIFICATIONS_RANGE_DAYS_FUTURE);
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, []); // Dependência vazia: range é fixo durante toda a sessão

  // Query para buscar reservas do feed de notificações
  const {
    data: calendarData,
    isLoading,
    isFetched,
    isSuccess,
    error,
  } = useQuery<CalendarResponse>({
    queryKey: ['stays-notifications-feed', startDate, endDate],
    queryFn: async () => {
      try {
        const data = await getCalendar(startDate, endDate);
        return data;
      } catch (err) {
        feedLogger.error('Erro ao buscar feed de notificações', err);
        throw err;
      }
    },
    refetchInterval: POLLING_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false, // Evitar refetch ao voltar pra aba
    staleTime: 30000, // 30s
    enabled: true, // Sempre ativo após login
  });

  // Transformar dados da API em reservas
  const reservations = useMemo(() => {
    if (!calendarData) {
      return [];
    }
    
    return mapCalendarToReservations(calendarData);
  }, [calendarData]);

  // Gerar fingerprint estável (IDs ordenados)
  const fingerprint = useMemo(() => {
    if (reservations.length === 0) return '';
    
    return reservations
      .map(r => r.id)
      .sort()
      .join('|');
  }, [reservations]);

  return {
    reservations,
    isLoading,
    isFetched,
    isSuccess,
    error: error ? String(error) : null,
    fingerprint,
  };
}

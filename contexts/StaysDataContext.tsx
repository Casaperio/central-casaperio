/**
 * StaysDataContext
 * Context provider para compartilhar dados do stays-api entre módulos Guest & CRM e Reservas
 */

import { createContext, useContext, ReactNode } from 'react';
import { useStaysData } from '../hooks/useStaysData';
import type { AgendaGroup, ReservationWithDailyStatus } from '../services/staysDataMapper';
import type { CalendarUnit, SyncStatus } from '../services/staysApiService';

interface StaysDataContextType {
  // Dados transformados para Guest & CRM
  agendaGroups: AgendaGroup[];
  reservations: ReservationWithDailyStatus[];

  // Dados do Calendar (units) para Reservas
  calendarUnits: CalendarUnit[];

  // Estado
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus | null;

  // Ações
  refresh: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshCalendar: () => Promise<void>;
}

const StaysDataContext = createContext<StaysDataContextType | null>(null);

export function StaysDataProvider({ children }: { children: ReactNode }) {
  const staysData = useStaysData();

  const value: StaysDataContextType = {
    // Dados transformados
    agendaGroups: staysData.agendaGroups,
    reservations: staysData.reservations,

    // Dados do Calendar (units)
    calendarUnits: staysData.calendarData?.units || [],

    // Estado
    loading: staysData.loading,
    error: staysData.error,
    syncStatus: staysData.syncStatus,

    // Ações
    refresh: staysData.refresh,
    refreshDashboard: staysData.refreshDashboard,
    refreshCalendar: staysData.refreshCalendar,
  };

  return (
    <StaysDataContext.Provider value={value}>
      {children}
    </StaysDataContext.Provider>
  );
}

export function useStaysDataContext() {
  const context = useContext(StaysDataContext);
  if (!context) {
    throw new Error('useStaysDataContext must be used within StaysDataProvider');
  }
  return context;
}

// Export for use in components that need optional access
export { StaysDataContext };

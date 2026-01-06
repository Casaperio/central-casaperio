import { useMemo } from 'react';
import { Reservation } from '../../types';
import { ReservationWithDailyStatus, AgendaGroup, DailyStatus } from '../../services/staysDataMapper';

export type PeriodPreset = 'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'custom';

interface UseGuestPeriodFilterProps {
  staysReservations: Reservation[];
  staysAgendaGroups: AgendaGroup[];
  periodPreset?: PeriodPreset;
  customStartDate?: string;
  customEndDate?: string;
  searchTerm?: string;
}

/**
 * Retorna prioridade de ordenação por status
 * CHECKOUT é mais urgente (0), depois CHECKIN (1), depois INHOUSE (2)
 */
function getStatusPriority(status?: DailyStatus): number {
  switch (status) {
    case 'CHECKOUT':
      return 0;
    case 'CHECKIN':
      return 1;
    case 'INHOUSE':
      return 2;
    default:
      return 3;
  }
}

/**
 * Ordena items dentro de um grupo por:
 * 1. Status (CHECKOUT > CHECKIN > INHOUSE)
 * 2. PropertyCode
 * 3. GuestName
 */
function sortGroupItems(items: ReservationWithDailyStatus[]): ReservationWithDailyStatus[] {
  return [...items].sort((a, b) => {
    // 1. Por status
    const priorityA = getStatusPriority(a.dailyStatus);
    const priorityB = getStatusPriority(b.dailyStatus);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 2. Por propertyCode
    if (a.propertyCode !== b.propertyCode) {
      return a.propertyCode.localeCompare(b.propertyCode);
    }

    // 3. Por guestName
    return a.guestName.localeCompare(b.guestName);
  });
}

/**
 * Hook para filtrar e agrupar reservas por período
 * Similar ao useMaintenanceFilters, mas focado em reservas
 */
export function useGuestPeriodFilter({
  staysReservations,
  staysAgendaGroups,
  periodPreset = 'all',
  customStartDate = '',
  customEndDate = '',
  searchTerm = '',
}: UseGuestPeriodFilterProps) {

  // Calcular intervalo de datas baseado no preset
  // Usa intervalo inclusivo: [startDate, endDate] (ambos inclusos)
  const { periodStartDate, periodEndDate, shouldFilterByPeriod } = useMemo(() => {
    // Se for 'all', não filtrar por período
    if (periodPreset === 'all') {
      return {
        periodStartDate: null,
        periodEndDate: null,
        shouldFilterByPeriod: false
      };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate: Date;

    switch (periodPreset) {
      case 'today':
        // Hoje: apenas hoje
        startDate = new Date(now);
        endDate = new Date(now);
        break;
      case '7days':
        // Próximos 7 dias: [hoje, hoje+6]
        startDate = new Date(now);
        endDate = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        // Próximos 30 dias: [hoje, hoje+29]
        startDate = new Date(now);
        endDate = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        // Este mês: [início do mês, último dia do mês]
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'custom':
        // Personalizado: usar exatamente as datas fornecidas (ACEITA PASSADO)
        if (!customStartDate || !customEndDate) {
          // Se não tem datas customizadas válidas, não filtrar
          return {
            periodStartDate: null,
            periodEndDate: null,
            shouldFilterByPeriod: false
          };
        }
        startDate = new Date(customStartDate + 'T00:00:00');
        endDate = new Date(customEndDate + 'T00:00:00');
        break;
      default:
        startDate = new Date(now);
        endDate = new Date(now);
    }

    // Normalizar para início do dia
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return {
      periodStartDate: startDate,
      periodEndDate: endDate,
      shouldFilterByPeriod: true
    };
  }, [periodPreset, customStartDate, customEndDate]);

  // Filtrar AgendaGroups (ÚNICA FONTE DE VERDADE para Cards e Lista)
  const filteredAgendaGroups = useMemo(() => {
    let groups = staysAgendaGroups;

    // 1. Aplicar filtro de período nos grupos por data
    if (shouldFilterByPeriod && periodStartDate && periodEndDate) {
      groups = groups.filter(group => {
        const groupDate = new Date(group.date + 'T00:00:00');
        groupDate.setHours(0, 0, 0, 0);

        // Intervalo inclusivo: [startDate, endDate]
        return groupDate >= periodStartDate && groupDate <= periodEndDate;
      });
    }

    // 2. Aplicar busca (filtrar items dentro dos grupos)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      groups = groups.map(group => ({
        ...group,
        items: group.items.filter(r =>
          r.guestName.toLowerCase().includes(term) ||
          r.propertyCode.toLowerCase().includes(term) ||
          r.channel?.toLowerCase().includes(term)
        )
      })).filter(group => group.items.length > 0);
    }

    // 3. Ordenar items dentro de cada grupo por status
    // CHECKOUT > CHECKIN > INHOUSE, depois por propertyCode, depois por guestName
    groups = groups.map(group => ({
      ...group,
      items: sortGroupItems(group.items)
    }));

    return groups;
  }, [staysAgendaGroups, shouldFilterByPeriod, periodStartDate, periodEndDate, searchTerm]);

  return {
    filteredAgendaGroups,
    shouldFilterByPeriod,
  };
}

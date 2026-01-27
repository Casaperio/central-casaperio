import { useMemo } from 'react';
import { Ticket, TicketStatus, Reservation, ReservationStatus } from '../../types';
import { getMaintenanceItemKey } from '../../utils';

export type MaintenanceItem = Ticket | { type: 'checkout'; reservation: Reservation };

export interface MaintenanceGroup {
  id: string;
  label: string;
  date?: string;
  items: MaintenanceItem[];
  isBacklog?: boolean;
}

export type PeriodPreset = 'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'custom';

/**
 * Ordena grupos de manutenção de forma inteligente
 * @param dateGroups - Grupos com data (sem o grupo "Aguardando")
 * @param backlogGroup - Grupo "Aguardando Agendamento" (sempre primeiro)
 * @param periodPreset - Preset selecionado
 * @param shouldFilterByPeriod - Se está aplicando filtro de período
 */
function orderMaintenanceGroups({
  dateGroups,
  backlogGroup,
  periodPreset,
  shouldFilterByPeriod,
}: {
  dateGroups: MaintenanceGroup[];
  backlogGroup: MaintenanceGroup[];
  periodPreset: PeriodPreset;
  shouldFilterByPeriod: boolean;
}): MaintenanceGroup[] {
  // Se não há grupos com data, retornar apenas backlog
  if (dateGroups.length === 0) {
    return backlogGroup;
  }

  // Parse de data consistente (evitar problemas de timezone)
  const parseDate = (dateStr: string): number => {
    return new Date(dateStr + 'T00:00:00').getTime();
  };

  // Modo A: preset "Todos" (sem filtro) - janela de relevância
  if (periodPreset === 'all' && !shouldFilterByPeriod) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayTime = now.getTime();

    // Janela de relevância: hoje a (hoje + 7 dias) - sem dias passados
    const windowStart = todayTime; // Começa exatamente hoje (00:00)
    const windowEnd = todayTime + (7 * 24 * 60 * 60 * 1000);

    // Grupos dentro da janela de relevância
    const windowGroups = dateGroups
      .filter(g => {
        const groupTime = parseDate(g.date!);
        return groupTime >= windowStart && groupTime <= windowEnd;
      })
      .sort((a, b) => parseDate(a.date!) - parseDate(b.date!)); // ASC

    // Grupos futuros além da janela
    const futureBeyondWindow = dateGroups
      .filter(g => parseDate(g.date!) > windowEnd)
      .sort((a, b) => parseDate(a.date!) - parseDate(b.date!)); // ASC

    // Grupos passados antes da janela
    const pastBeforeWindow = dateGroups
      .filter(g => parseDate(g.date!) < windowStart)
      .sort((a, b) => parseDate(b.date!) - parseDate(a.date!)); // DESC

    return [...backlogGroup, ...windowGroups, ...futureBeyondWindow, ...pastBeforeWindow];
  }

  // Modo B: com filtro de período (Hoje / 7 dias / 30 dias / Este mês / Personalizado)
  // Ordenação estritamente cronológica ASC
  const sortedDateGroups = [...dateGroups].sort((a, b) => {
    return parseDate(a.date!) - parseDate(b.date!); // ASC
  });

  return [...backlogGroup, ...sortedDateGroups];
}

interface UseMaintenanceFiltersProps {
  tickets: Ticket[];
  staysReservations: Reservation[];
  searchTerm: string;
  filterStatus: string;
  filterMaintenanceAssignee: string | string[]; // Agora aceita string ou array
  filterMaintenanceProperty: string;
  filterMaintenanceType: string[];
  maintenanceStatusFilter?: 'all' | 'in_progress'; // NOVO: Filtro de status
  activeModule: string | null;
  periodPreset?: PeriodPreset;
  customStartDate?: string;
  customEndDate?: string;
  maintenanceOverrides?: Record<string, { hidden: boolean; updatedAt: number }>;
}

export function useMaintenanceFilters({
  tickets,
  staysReservations,
  searchTerm,
  filterStatus,
  filterMaintenanceAssignee,
  filterMaintenanceProperty,
  filterMaintenanceType,
  maintenanceStatusFilter = 'all',
  activeModule,
  periodPreset = 'all',
  customStartDate = '',
  customEndDate = '',
  maintenanceOverrides = {},
}: UseMaintenanceFiltersProps) {

  // Calcular intervalo de datas baseado no preset
  // Usa intervalo half-open: [startInclusive, endExclusive)
  const { periodStartDate, periodEndDate, shouldFilterByPeriod } = useMemo(() => {
    // Log do filtro de status recebido
    console.log('🎯 MaintenanceFilters - Filtro Status:', maintenanceStatusFilter);
    
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

    let startDate = new Date(now);
    let endExclusive = new Date(now);

    switch (periodPreset) {
      case 'today':
        // Hoje: [início de hoje, início de amanhã)
        endExclusive = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case '7days':
        // Próximos 7 dias: [hoje, hoje+7)
        endExclusive = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        // Próximos 30 dias: [hoje, hoje+30)
        endExclusive = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        // Este mês: [início do mês, início do próximo mês)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'custom':
        // Personalizado: incluir customEndDate inteiro
        if (customStartDate) {
          startDate = new Date(customStartDate + 'T00:00:00');
        }
        if (customEndDate) {
          const endDate = new Date(customEndDate + 'T00:00:00');
          endExclusive = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
        }
        break;
    }

    startDate.setHours(0, 0, 0, 0);
    endExclusive.setHours(0, 0, 0, 0);

    return {
      periodStartDate: startDate,
      periodEndDate: endExclusive,
      shouldFilterByPeriod: true
    };
  }, [periodPreset, customStartDate, customEndDate]);

  const filteredTickets = useMemo(() => {
    if (activeModule !== 'maintenance' && activeModule !== 'concierge') return [];

    const targetCategory = activeModule === 'concierge' ? 'concierge' : 'maintenance';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list = tickets.filter(t => {
      const ticketCat = t.category || 'maintenance';
      if (ticketCat !== targetCategory) return false;

      // Filtrar items ocultos (dispensados pelo usuário)
      const itemKey = getMaintenanceItemKey(t);
      if (maintenanceOverrides[itemKey]?.hidden) {
        return false;
      }

      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assignee?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      
      // Filtro por responsável - suporta string ou array
      let matchesAssignee = true;
      if (Array.isArray(filterMaintenanceAssignee)) {
        // Multi-select: filtra se o assignee está na lista OU se lista está vazia
        matchesAssignee = filterMaintenanceAssignee.length === 0 || 
                          (t.assignee ? filterMaintenanceAssignee.includes(t.assignee) : false);
        
        // Debug log
        if (filterMaintenanceAssignee.length > 0) {
          console.log('🔍 Filtro Assignee:', {
            ticketId: t.id,
            ticketAssignee: t.assignee,
            filterList: filterMaintenanceAssignee,
            matches: matchesAssignee
          });
        }
      } else {
        // Backward compatibility: string simples
        matchesAssignee = filterMaintenanceAssignee === 'all' || t.assignee === filterMaintenanceAssignee;
      }
      
      const matchesProperty = filterMaintenanceProperty === 'all' || t.propertyCode === filterMaintenanceProperty;

      // Filtro por tipo (multi-seleção)
      let matchesType = true;
      if (filterMaintenanceType.length > 0) {
        matchesType = filterMaintenanceType.some(selectedType => {
          switch (selectedType) {
            case 'checkout':
              return t.isCheckoutTicket === true;
            case 'preventive':
              return t.isPreventive === true;
            case 'guest':
              return t.isGuestRequest === true;
            case 'regular':
              return !t.isCheckoutTicket && !t.isPreventive && !t.isGuestRequest;
            default:
              return false;
          }
        });
      }

      // Filtro por status "Em andamento" (não concluídos)
      const matchesStatusFilter = maintenanceStatusFilter === 'all' || 
                                   (maintenanceStatusFilter === 'in_progress' && t.status !== TicketStatus.DONE);
      
      // Debug log detalhado para o filtro de status
      if (maintenanceStatusFilter === 'in_progress') {
        console.log('🔍 Status Filter DEBUG:', {
          ticketId: t.id,
          propertyCode: t.propertyCode,
          status: t.status,
          statusEnum: TicketStatus.DONE,
          isDone: t.status === TicketStatus.DONE,
          matchesStatusFilter,
          filterMode: maintenanceStatusFilter
        });
      }

      // Filtrar por período de data (apenas se shouldFilterByPeriod = true)
      if (shouldFilterByPeriod && periodStartDate && periodEndDate) {
        // Tickets sem scheduledDate e não-concluídos vão para "Aguardando Agendamento"
        // Esses devem SEMPRE passar (não aplicar filtro de período)
        const hasScheduledDate = t.scheduledDate || (t.status === TicketStatus.DONE && t.completedDate);

        if (hasScheduledDate) {
          // Tem data: aplicar filtro de período
          const ticketDate = new Date(t.completedDate || t.scheduledDate || t.desiredDate || t.createdAt);
          ticketDate.setHours(0, 0, 0, 0);

          // Intervalo half-open: [start, endExclusive)
          if (ticketDate < periodStartDate || ticketDate >= periodEndDate) {
            return false;
          }
        }
        // Sem data agendada: sempre passa (vai para "Aguardando Agendamento")
      }

      return matchesSearch && matchesStatus && matchesAssignee && matchesProperty && matchesType && matchesStatusFilter;
    });

    return list.sort((a, b) => {
      const isADone = a.status === TicketStatus.DONE;
      const isBDone = b.status === TicketStatus.DONE;
      if (isADone && !isBDone) return 1;
      if (!isADone && isBDone) return -1;

      if (!isADone && !isBDone) {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : new Date(a.desiredDate).getTime();
        const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : new Date(b.desiredDate).getTime();
        return dateA - dateB;
      }

      if (isADone && isBDone) {
        const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
        const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [tickets, searchTerm, filterStatus, filterMaintenanceAssignee, filterMaintenanceProperty, filterMaintenanceType, activeModule, periodStartDate, periodEndDate, shouldFilterByPeriod, maintenanceOverrides, maintenanceStatusFilter]);

  const maintenanceGroups = useMemo(() => {
    if (activeModule !== 'maintenance' && activeModule !== 'concierge') return [];

    const groups: MaintenanceGroup[] = [];
    const unscheduled: MaintenanceItem[] = [];
    const scheduledMap: Record<string, MaintenanceItem[]> = {};

    // Verificar se deve mostrar checkouts (se array vazio ou contém 'checkout')
    const shouldShowCheckouts = filterMaintenanceType.length === 0 || filterMaintenanceType.includes('checkout');
    const shouldShowTickets = filterMaintenanceType.length === 0 || filterMaintenanceType.some(t => t !== 'checkout');

    // CORREÇÃO CRÍTICA: Mapear reservationIds de todos os tickets de checkout reais
    // Isso evita duplicação - items virtuais serão criados APENAS para reservas sem ticket
    const checkoutTicketReservationIds = new Set<string>();
    filteredTickets.forEach(t => {
      if (t.isCheckoutTicket && t.reservationId) {
        checkoutTicketReservationIds.add(t.reservationId);
      }
    });

    // Adicionar tickets aos grupos (incluindo tickets de checkout reais)
    if (shouldShowTickets) {
      filteredTickets.forEach(t => {
        // Incluir TODOS os tickets, inclusive checkouts reais
        if (t.scheduledDate || (t.status === TicketStatus.DONE && t.completedDate)) {
          const dateStr = t.scheduledDate || t.completedDate;
          const dateKey = dateStr!.split('T')[0];
          if (!scheduledMap[dateKey]) scheduledMap[dateKey] = [];
          scheduledMap[dateKey].push(t);
        } else {
          unscheduled.push(t);
        }
      });
    }

    // Adicionar checkouts VIRTUAIS aos grupos (APENAS para reservas sem ticket real)
    if (activeModule === 'maintenance' && shouldShowCheckouts) {
      staysReservations.forEach(r => {
        if (r.status === ReservationStatus.CANCELED) return;
        
        // Parse da data de checkout de forma consistente
        const checkoutDateStr = r.checkOutDate.split('T')[0]; // YYYY-MM-DD
        const checkoutDate = new Date(checkoutDateStr + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
        checkoutDate.setHours(0, 0, 0, 0);

        // Filtrar checkouts por período (se aplicável)
        let passesDateFilter = true;
        if (shouldFilterByPeriod && periodStartDate && periodEndDate) {
          // Intervalo half-open: [start, endExclusive)
          passesDateFilter = checkoutDate >= periodStartDate && checkoutDate < periodEndDate;
        }

        if (passesDateFilter) {
          // REGRA DE UNICIDADE: Criar item virtual APENAS se não existir ticket real
          if (checkoutTicketReservationIds.has(r.id)) {
            return; // JÁ existe ticket real - não criar item virtual
          }

          // Filtrar checkouts ocultos (dispensados pelo usuário)
          const checkoutItem = { type: 'checkout' as const, reservation: r };
          const itemKey = getMaintenanceItemKey(checkoutItem);
          const isHidden = maintenanceOverrides[itemKey]?.hidden;

          if (isHidden) {
            return; // Skip este checkout
          }

          // Aplicar filtros aos checkouts
          const matchesSearch =
            searchTerm === '' ||
            r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.propertyCode.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesProperty = filterMaintenanceProperty === 'all' || r.propertyCode === filterMaintenanceProperty;

          // Filtro por responsável: checkouts virtuais NÃO têm assignee
          // Se filtro de assignee está ativo (array não vazio), excluir checkouts virtuais
          let matchesAssignee = true;
          if (Array.isArray(filterMaintenanceAssignee) && filterMaintenanceAssignee.length > 0) {
            matchesAssignee = false; // Checkouts virtuais não têm assignee, então não passam no filtro
          } else if (typeof filterMaintenanceAssignee === 'string' && filterMaintenanceAssignee !== 'all') {
            matchesAssignee = false; // Backward compatibility
          }

          if (matchesSearch && matchesProperty && matchesAssignee) {
            const dateKey = r.checkOutDate.split('T')[0];
            if (!scheduledMap[dateKey]) scheduledMap[dateKey] = [];
            scheduledMap[dateKey].push(checkoutItem);
          }
        }
      });
    }

    // Preparar grupo "Aguardando Agendamento" (se houver)
    const backlogGroup: MaintenanceGroup[] = [];
    if (unscheduled.length > 0) {
      const sortedUnscheduled = unscheduled.sort((a, b) => {
        if ('createdAt' in a && 'createdAt' in b) {
          return a.createdAt - b.createdAt;
        }
        return 0;
      });
      backlogGroup.push({
        id: 'backlog',
        label: 'Aguardando Agendamento / Em Aberto',
        items: sortedUnscheduled,
        isBacklog: true
      });
    }

    // Preparar grupos por data
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const dateGroups: MaintenanceGroup[] = [];
    Object.keys(scheduledMap).forEach(key => {
      const dateObj = new Date(key + 'T12:00:00');
      let label = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (key === today) label = `Hoje • ${label}`;
      else if (key === tomorrow) label = `Amanhã • ${label}`;

      dateGroups.push({ id: key, label: label, date: key, items: scheduledMap[key] });
    });

    // Aplicar ordenação inteligente
    return orderMaintenanceGroups({
      dateGroups,
      backlogGroup,
      periodPreset,
      shouldFilterByPeriod,
    });
  }, [filteredTickets, staysReservations, activeModule, filterMaintenanceType, searchTerm, filterMaintenanceProperty, periodStartDate, periodEndDate, shouldFilterByPeriod, periodPreset, maintenanceOverrides, maintenanceStatusFilter]);

  const upcomingCheckouts = useMemo(() => {
    if (activeModule !== 'maintenance') return [];

    return staysReservations
      .filter(r => {
        if (r.status === ReservationStatus.CANCELED) return false;
        
        // Parse da data de checkout de forma consistente
        const checkoutDateStr = r.checkOutDate.split('T')[0]; // YYYY-MM-DD
        const checkoutDate = new Date(checkoutDateStr + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
        checkoutDate.setHours(0, 0, 0, 0);

        // Se tiver filtro de período, aplicar
        if (shouldFilterByPeriod && periodStartDate && periodEndDate) {
          // Intervalo half-open: [start, endExclusive)
          return checkoutDate >= periodStartDate && checkoutDate < periodEndDate;
        }

        // Sem filtro de período, retornar todos os checkouts futuros
        return true;
      })
      .sort((a, b) => new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime());
  }, [staysReservations, activeModule, periodStartDate, periodEndDate, shouldFilterByPeriod]);

  return {
    filteredTickets,
    maintenanceGroups,
    upcomingCheckouts,
  };
}

import { useMemo } from 'react';
import { Ticket, TicketStatus, Reservation, ReservationStatus } from '../../types';

export type MaintenanceItem = Ticket | { type: 'checkout'; reservation: Reservation };

export interface MaintenanceGroup {
  id: string;
  label: string;
  date?: string;
  items: MaintenanceItem[];
  isBacklog?: boolean;
}

interface UseMaintenanceFiltersProps {
  tickets: Ticket[];
  staysReservations: Reservation[];
  searchTerm: string;
  filterStatus: string;
  filterMaintenanceAssignee: string;
  filterMaintenanceProperty: string;
  filterMaintenanceType: string;
  activeModule: string | null;
}

export function useMaintenanceFilters({
  tickets,
  staysReservations,
  searchTerm,
  filterStatus,
  filterMaintenanceAssignee,
  filterMaintenanceProperty,
  filterMaintenanceType,
  activeModule,
}: UseMaintenanceFiltersProps) {

  const filteredTickets = useMemo(() => {
    if (activeModule !== 'maintenance' && activeModule !== 'concierge') return [];

    const targetCategory = activeModule === 'concierge' ? 'concierge' : 'maintenance';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list = tickets.filter(t => {
      const ticketCat = t.category || 'maintenance';
      if (ticketCat !== targetCategory) return false;

      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assignee?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesAssignee = filterMaintenanceAssignee === 'all' || t.assignee === filterMaintenanceAssignee;
      const matchesProperty = filterMaintenanceProperty === 'all' || t.propertyCode === filterMaintenanceProperty;

      // Filtro por tipo
      let matchesType = true;
      if (filterMaintenanceType !== 'all') {
        switch (filterMaintenanceType) {
          case 'checkout':
            matchesType = t.isCheckoutTicket === true;
            break;
          case 'preventive':
            matchesType = t.isPreventive === true;
            break;
          case 'guest':
            matchesType = t.isGuestRequest === true;
            break;
          case 'regular':
            matchesType = !t.isCheckoutTicket && !t.isPreventive && !t.isGuestRequest;
            break;
          default:
            matchesType = true;
        }
      }

      // Filtrar tickets concluídos que são anteriores a hoje
      if (t.status === TicketStatus.DONE) {
        const dateStr = t.completedDate || t.scheduledDate || t.desiredDate;
        const tDate = new Date(dateStr);
        tDate.setHours(0,0,0,0);
        if (tDate.getTime() < today.getTime()) {
          return false;
        }
      }

      return matchesSearch && matchesStatus && matchesAssignee && matchesProperty && matchesType;
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
  }, [tickets, searchTerm, filterStatus, filterMaintenanceAssignee, filterMaintenanceProperty, filterMaintenanceType, activeModule]);

  const maintenanceGroups = useMemo(() => {
    if (activeModule !== 'maintenance' && activeModule !== 'concierge') return [];

    const groups: MaintenanceGroup[] = [];
    const unscheduled: MaintenanceItem[] = [];
    const scheduledMap: Record<string, MaintenanceItem[]> = {};

    // Verificar se deve mostrar checkouts
    const shouldShowCheckouts = filterMaintenanceType === 'all' || filterMaintenanceType === 'checkout';
    const shouldShowTickets = filterMaintenanceType !== 'checkout';

    // Adicionar tickets aos grupos (se não estiver filtrando apenas checkouts)
    if (shouldShowTickets) {
      filteredTickets.forEach(t => {
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

    // Adicionar checkouts aos grupos (próximos 15 dias)
    if (activeModule === 'maintenance' && shouldShowCheckouts) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const fifteenDaysLater = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

      staysReservations.forEach(r => {
        if (r.status === ReservationStatus.CANCELED) return;
        const checkoutDate = new Date(r.checkOutDate);
        checkoutDate.setHours(0, 0, 0, 0);

        // Filtrar checkouts dos próximos 15 dias
        if (checkoutDate >= today && checkoutDate <= fifteenDaysLater) {
          // Aplicar filtros aos checkouts
          const matchesSearch =
            searchTerm === '' ||
            r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.propertyCode.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesProperty = filterMaintenanceProperty === 'all' || r.propertyCode === filterMaintenanceProperty;

          if (matchesSearch && matchesProperty) {
            const dateKey = r.checkOutDate.split('T')[0];
            if (!scheduledMap[dateKey]) scheduledMap[dateKey] = [];
            scheduledMap[dateKey].push({ type: 'checkout', reservation: r });
          }
        }
      });
    }

    if (unscheduled.length > 0) {
      const sortedUnscheduled = unscheduled.sort((a, b) => {
        if ('createdAt' in a && 'createdAt' in b) {
          return a.createdAt - b.createdAt;
        }
        return 0;
      });
      groups.push({ id: 'backlog', label: 'Aguardando Agendamento / Em Aberto', items: sortedUnscheduled, isBacklog: true });
    }

    const sortedKeys = Object.keys(scheduledMap).sort();

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    sortedKeys.forEach(key => {
      const dateObj = new Date(key + 'T12:00:00');
      let label = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (key === today) label = `Hoje • ${label}`;
      else if (key === tomorrow) label = `Amanhã • ${label}`;

      groups.push({ id: key, label: label, date: key, items: scheduledMap[key] });
    });

    return groups;
  }, [filteredTickets, staysReservations, activeModule, filterMaintenanceType, searchTerm, filterMaintenanceProperty]);

  const upcomingCheckouts = useMemo(() => {
    if (activeModule !== 'maintenance') return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fifteenDaysLater = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

    return staysReservations
      .filter(r => {
        if (r.status === ReservationStatus.CANCELED) return false;
        const checkoutDate = new Date(r.checkOutDate);
        checkoutDate.setHours(0, 0, 0, 0);
        return checkoutDate >= today && checkoutDate <= fifteenDaysLater;
      })
      .sort((a, b) => new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime());
  }, [staysReservations, activeModule]);

  return {
    filteredTickets,
    maintenanceGroups,
    upcomingCheckouts,
  };
}

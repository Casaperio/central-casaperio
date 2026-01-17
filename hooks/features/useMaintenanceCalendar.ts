import { useMemo } from 'react';
import { Ticket, TicketStatus, Reservation, ReservationStatus } from '../../types';
import { getMaintenanceItemKey } from '../../utils';

interface UseMaintenanceCalendarProps {
  tickets: Ticket[];
  staysReservations: Reservation[];
  currentMonth: Date; // Mês sendo visualizado no calendário
  searchTerm: string;
  filterMaintenanceProperty: string;
  filterMaintenanceType: string[];
  activeModule: string | null;
  maintenanceOverrides?: Record<string, { hidden: boolean; updatedAt: number }>;
}

/**
 * Hook dedicado para o modo Calendário do módulo Manutenção
 * 
 * Diferenças do useMaintenanceFilters:
 * - NÃO respeita paginação
 * - NÃO respeita filtros de período globais (Hoje/7dias/30dias)
 * - Carrega dados apenas do mês sendo visualizado
 * - Mostra apenas eventos a partir de HOJE
 */
export function useMaintenanceCalendar({
  tickets,
  staysReservations,
  currentMonth,
  searchTerm,
  filterMaintenanceProperty,
  filterMaintenanceType,
  activeModule,
  maintenanceOverrides = {}
}: UseMaintenanceCalendarProps) {
  
  const calendarTickets = useMemo(() => {
    if (activeModule !== 'maintenance' && activeModule !== 'concierge') return [];

    const targetCategory = activeModule === 'concierge' ? 'concierge' : 'maintenance';
    
    // Definir range do mês atual sendo visualizado
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Hoje (para filtrar apenas eventos a partir de hoje)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se deve mostrar checkouts (se array vazio ou contém 'checkout')
    const shouldShowCheckouts = filterMaintenanceType.length === 0 || filterMaintenanceType.includes('checkout');
    const shouldShowTickets = filterMaintenanceType.length === 0 || filterMaintenanceType.some(t => t !== 'checkout');

    const allTickets: Ticket[] = [];

    // Adicionar tickets normais
    if (shouldShowTickets) {
      tickets.forEach(t => {
        const ticketCat = t.category || 'maintenance';
        if (ticketCat !== targetCategory) return;

        // Filtrar items ocultos
        const itemKey = getMaintenanceItemKey(t);
        if (maintenanceOverrides[itemKey]?.hidden) return;

        // Buscar data do ticket
        const ticketDateStr = t.scheduledDate || t.desiredDate || t.completedDate;
        if (!ticketDateStr) return; // Sem data, não exibir no calendário

        const ticketDate = new Date(ticketDateStr.split('T')[0] + 'T12:00:00');
        ticketDate.setHours(0, 0, 0, 0);

        // Filtrar: apenas a partir de hoje E dentro do mês visualizado
        if (ticketDate < today) return;
        if (ticketDate < monthStart || ticketDate > monthEnd) return;

        // Aplicar filtros de busca e propriedade
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.assignee?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesProperty = filterMaintenanceProperty === 'all' || t.propertyCode === filterMaintenanceProperty;

        // Filtro de tipo (multi-seleção)
        let matchesType = filterMaintenanceType.length === 0; // Se vazio, mostrar todos
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

        if (matchesSearch && matchesProperty && matchesType) {
          allTickets.push(t);
        }
      });
    }

    // Adicionar checkouts como tickets virtuais
    if (activeModule === 'maintenance' && shouldShowCheckouts) {
      staysReservations.forEach(r => {
        if (r.status === ReservationStatus.CANCELED) return;

        // Parse da data de checkout
        const checkoutDateStr = r.checkOutDate.split('T')[0];
        const checkoutDate = new Date(checkoutDateStr + 'T12:00:00');
        checkoutDate.setHours(0, 0, 0, 0);

        // Filtrar: apenas a partir de hoje E dentro do mês visualizado
        if (checkoutDate < today) return;
        if (checkoutDate < monthStart || checkoutDate > monthEnd) return;

        // Verificar se está oculto
        const checkoutItem = { type: 'checkout' as const, reservation: r };
        const itemKey = getMaintenanceItemKey(checkoutItem);
        if (maintenanceOverrides[itemKey]?.hidden) return;

        // Aplicar filtros de busca e propriedade
        const matchesSearch =
          searchTerm === '' ||
          r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.propertyCode.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesProperty = filterMaintenanceProperty === 'all' || r.propertyCode === filterMaintenanceProperty;

        if (matchesSearch && matchesProperty) {
          // Criar ticket virtual para checkout
          const virtualTicket: Ticket = {
            id: `checkout-${r.id}`,
            propertyCode: r.propertyCode,
            propertyName: r.propertyName || r.propertyCode,
            description: `Limpeza de check-out - ${r.guestName}`,
            scheduledDate: r.checkOutDate,
            desiredDate: r.checkOutDate,
            status: 'Aberto' as TicketStatus,
            priority: 'Alta',
            serviceType: 'Limpeza de Check-out',
            isCheckoutTicket: true,
            category: 'maintenance' as const,
            createdBy: 'Sistema',
            createdByName: 'Automação',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            guestAuth: false,
            expenses: []
          };

          allTickets.push(virtualTicket);
        }
      });
    }

    return allTickets;
  }, [tickets, staysReservations, currentMonth, searchTerm, filterMaintenanceProperty, filterMaintenanceType, activeModule, maintenanceOverrides]);

  return {
    calendarTickets
  };
}

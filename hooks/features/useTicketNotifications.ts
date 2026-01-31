import { useEffect, useRef } from 'react';
import { Ticket, User, TicketStatus } from '../../types';
import { ToastNotification } from '../../utils/notificationToastHelpers';
import { playSuccessSound } from '../../utils/soundUtils';

const TICKETS_STORAGE_KEY = 'casape_seen_ticket_ids';

interface UseTicketNotificationsProps {
  currentUser: User | null;
  tickets: Ticket[];
  addNotification: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addLog: (action: string, details: string) => void;
  addToast?: (notification: ToastNotification) => void;
}

/**
 * Hook que detecta novos tickets e mudanças de status/atribuição
 * Extraído do App.tsx (linhas 458-593) - 135 linhas
 */
export function useTicketNotifications({
  currentUser,
  tickets,
  addNotification,
  addLog,
  addToast
}: UseTicketNotificationsProps) {
  const previousTicketsRef = useRef<Ticket[]>([]);

  useEffect(() => {
    // Skip if no user logged in or no tickets
    if (!currentUser || tickets.length === 0) return;

    // Check if user has access to maintenance module
    const hasMaintenanceAccess = currentUser.role === 'Admin' ||
      currentUser.role === 'Maintenance' ||
      currentUser.role === 'Limpeza' ||
      currentUser.allowedModules?.includes('maintenance');

    const hasGuestAccess = currentUser.role === 'Admin' ||
      currentUser.role === 'Guest Relations' ||
      currentUser.allowedModules?.includes('guest');

    // First run - initialize from localStorage
    if (previousTicketsRef.current.length === 0) {
      try {
        const storedIds = localStorage.getItem(TICKETS_STORAGE_KEY);
        if (storedIds) {
          const seenIds = new Set(JSON.parse(storedIds));

          // Detect new tickets created while user was away
          const newTickets = tickets.filter(t => !seenIds.has(t.id) && t.category === 'maintenance');

          if (newTickets.length > 0 && hasMaintenanceAccess) {
            // Don't show notification for checkout tickets or tickets created by current user
            const relevantNew = newTickets.filter(t =>
              !t.isCheckoutTicket && t.createdBy !== currentUser.id
            );

            if (relevantNew.length > 0) {
              const msg = relevantNew.length === 1
                ? `${relevantNew[0].serviceType} em ${relevantNew[0].propertyCode}`
                : `${relevantNew.length} novos chamados`;
              addNotification('Novo Chamado', msg, 'info');
            }
          }

          // Check for tickets assigned to current user while away
          const assignedToMe = tickets.filter(t =>
            !seenIds.has(t.id) &&
            t.assignee === currentUser.name &&
            t.status !== TicketStatus.DONE
          );

          if (assignedToMe.length > 0) {
            const msg = assignedToMe.length === 1
              ? `${assignedToMe[0].serviceType} em ${assignedToMe[0].propertyCode}`
              : `${assignedToMe.length} chamados atribuídos a você`;
            addNotification('Chamado Atribuído', msg, 'warning');
          }
        }
      } catch (error) {
        console.error('Error loading ticket IDs from localStorage:', error);
      }

      // Save current state
      previousTicketsRef.current = tickets;
      const currentTicketIds = tickets.map(t => t.id);
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(currentTicketIds));
      return;
    }

    // Compare with previous state for live updates
    const previousMap = new Map<string, Ticket>(
      previousTicketsRef.current.map(t => [t.id, t])
    );

    // Detect new tickets
    const newTickets = tickets.filter(t => !previousMap.has(t.id) && t.category === 'maintenance');

    if (newTickets.length > 0 && hasMaintenanceAccess) {
      // Task 4: Limpeza NÃO recebe notificação de novos tickets, apenas quando for atribuído
      const shouldNotifyNewTickets = currentUser.role !== 'Limpeza';
      
      if (shouldNotifyNewTickets) {
        const relevantNew = newTickets.filter(t =>
          !t.isCheckoutTicket && t.createdBy !== currentUser.id
        );

        if (relevantNew.length > 0) {
          const msg = relevantNew.length === 1
            ? `${relevantNew[0].serviceType} em ${relevantNew[0].propertyCode}`
            : `${relevantNew.length} novos chamados`;
          addNotification('Novo Chamado', msg, 'info');
        }
      }
    }

    // Detect ticket assignments to current user
    for (const ticket of tickets) {
      const prev = previousMap.get(ticket.id);
      if (prev) {
        // Task 1: Suporte a múltiplos responsáveis
        const currentAssignees = ticket.assignees || (ticket.assignee ? [ticket.assignee] : []);
        const prevAssignees = prev.assignees || (prev.assignee ? [prev.assignee] : []);
        
        // Check if newly assigned to current user
        const wasAssigned = prevAssignees.includes(currentUser.name);
        const isNowAssigned = currentAssignees.includes(currentUser.name);
        
        if (isNowAssigned && !wasAssigned) {
          // Adicionar no histórico do NotificationCenter
          addNotification(
            'Chamado Atribuído',
            `${ticket.serviceType} em ${ticket.propertyCode}`,
            'warning'
          );
          
          // Disparar toast visual com som
          if (addToast) {
            const toastNotification: ToastNotification = {
              id: `assignment-${ticket.id}-${Date.now()}`,
              type: 'maintenance',
              title: `🔧 Chamado Atribuído`,
              message: `${ticket.serviceType}\n${ticket.propertyCode}\n${ticket.description || 'Sem descrição'}`,
              data: ticket,
              timestamp: new Date().toISOString(),
            };
            addToast(toastNotification);
            playSuccessSound();
          }
        }

        // Check for status changes on tickets assigned to current user
        if (ticket.assignee === currentUser.name && ticket.status !== prev.status) {
          if (ticket.status === TicketStatus.DONE && prev.status !== TicketStatus.DONE) {
            addNotification(
              'Chamado Concluído',
              `${ticket.serviceType} em ${ticket.propertyCode}`,
              'success'
            );
          }
        }
      }
    }

    // Detect concierge requests (for guest team)
    if (hasGuestAccess) {
      const newConciergeRequests = tickets.filter(t =>
        !previousMap.has(t.id) &&
        t.category === 'concierge' &&
        t.createdBy !== currentUser.id
      );

      if (newConciergeRequests.length > 0) {
        const msg = newConciergeRequests.length === 1
          ? `${newConciergeRequests[0].serviceType} de ${newConciergeRequests[0].propertyCode}`
          : `${newConciergeRequests.length} novas solicitações`;
        addNotification('Nova Solicitação', msg, 'info');
      }
    }

    // Update reference and localStorage
    previousTicketsRef.current = tickets;
    const currentTicketIds = tickets.map(t => t.id);
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(currentTicketIds));
  }, [tickets, currentUser, addNotification, addLog]);
}

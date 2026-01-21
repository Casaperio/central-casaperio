/**
 * 🔧 NEW MAINTENANCE TICKET DETECTOR
 * 
 * Detecta novos chamados de manutenção
 * Apenas para usuários com permissão (admin/maintenance)
 */

import { useEffect, useRef } from 'react';
import { Ticket, User } from '../../types';
import { notificationSessionManager } from '../../services/notificationSessionManager';
import { playSuccessSound } from '../../utils/soundUtils';

interface NewMaintenanceTicketDetectorProps {
  tickets: Ticket[];
  currentUser: User | null;
  hasPermission: (perm: string) => boolean;
  onNewTickets: (tickets: Ticket[]) => void;
}

export function useNewMaintenanceTicketDetector({
  tickets,
  currentUser,
  hasPermission,
  onNewTickets,
}: NewMaintenanceTicketDetectorProps) {
  const hasInitializedBaseline = useRef(false);

  useEffect(() => {
    // Guard: não rodar sem usuário logado
    if (!currentUser) return;

    // Guard: apenas admin e maintenance
    if (!hasPermission('maintenance') && !hasPermission('admin')) {
      return;
    }

    // Guard: não rodar sem dados
    if (!tickets || tickets.length === 0) return;

    // Inicializar sessão se necessário
    notificationSessionManager.initialize();
    const sessionStartedAt = notificationSessionManager.getSessionStartedAt();

    // 🎯 PRIMEIRA EXECUÇÃO: apenas estabelecer baseline
    if (!hasInitializedBaseline.current) {
      const allIds = tickets.map(t => t.id);
      notificationSessionManager.markTicketsAsSeen(allIds);
      hasInitializedBaseline.current = true;
      
      console.log('✅ [New Ticket Detector] Baseline estabelecido:', {
        total: allIds.length,
        sessionStartedAt: sessionStartedAt.toISOString(),
      });
      
      return; // NÃO notificar na primeira execução
    }

    // 🔍 EXECUÇÕES SEGUINTES: detectar novos tickets
    const newTickets = tickets.filter(ticket => {
      // 1. Já foi visto?
      if (notificationSessionManager.hasSeenTicket(ticket.id)) {
        return false;
      }

      // 2. Foi criado após o login?
      const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;
      if (!createdAt || createdAt < sessionStartedAt) {
        // Ticket antigo, marcar como visto mas não notificar
        notificationSessionManager.markTicketAsSeen(ticket.id);
        return false;
      }

      // 3. É realmente novo!
      return true;
    });

    // Se encontrou novos tickets
    if (newTickets.length > 0) {
      console.log('🔧 [New Ticket Detector] Novos chamados detectados:', {
        quantidade: newTickets.length,
        detalhes: newTickets.map(t => ({
          id: t.id,
          description: t.description,
          property: t.propertyCode,
          createdAt: t.createdAt,
        })),
      });

      // Marcar como vistos
      newTickets.forEach(t => {
        notificationSessionManager.markTicketAsSeen(t.id);
      });

      // 🔊 SOM: apenas se online + aba visível + foco
      const shouldPlaySound = 
        navigator.onLine && 
        document.visibilityState === 'visible' && 
        document.hasFocus();

      if (shouldPlaySound) {
        playSuccessSound();
      } else {
        console.log('🔇 [New Ticket Detector] Som desabilitado (aba não visível ou sem foco)');
      }

      // 🔔 NOTIFICAR via callback
      onNewTickets(newTickets);
    }

  }, [tickets, currentUser, hasPermission, onNewTickets]);
}

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
    const lastNotifiedMs = notificationSessionManager.getLastNotifiedTicketCreatedAtMs();
    const sessionStartMs = notificationSessionManager.getSessionStartedAtMs();
    
    // Instrumentação DEV
    if (import.meta.env.DEV) {
      console.group('[Detector] 🔧 Análise de Novos Tickets');
      console.log('📊 Total de tickets:', tickets.length);
      console.log('🕐 Sessão iniciada em:', new Date(sessionStartMs).toLocaleString('pt-BR'));
      console.log('🕐 Última notificação:', lastNotifiedMs ? new Date(lastNotifiedMs).toLocaleString('pt-BR') : 'nunca');
      console.log('🌐 Online:', navigator.onLine);
      console.log('👁️ Visível:', document.visibilityState === 'visible');
    }
    
    const newTickets = tickets.filter(ticket => {
      // 1. Já foi visto?
      if (notificationSessionManager.hasSeenTicket(ticket.id)) {
        return false;
      }

      // 2. Tem createdAt válido?
      if (!ticket.createdAt) {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ [Detector] Ticket ${ticket.id} sem createdAt, ignorando`);
        }
        notificationSessionManager.markTicketAsSeen(ticket.id);
        return false;
      }

      // 3. Foi criado após o login?
      const createdAtMs = new Date(ticket.createdAt).getTime();
      if (createdAtMs < sessionStartMs) {
        if (import.meta.env.DEV) {
          console.log(`⏮️ [Detector] Ticket ${ticket.id} é anterior à sessão, ignorando`);
        }
        notificationSessionManager.markTicketAsSeen(ticket.id);
        return false;
      }

      // 4. Foi criado depois da última notificação?
      if (lastNotifiedMs > 0 && createdAtMs <= lastNotifiedMs) {
        if (import.meta.env.DEV) {
          console.log(`⏮️ [Detector] Ticket ${ticket.id} já foi notificado anteriormente, ignorando`);
        }
        notificationSessionManager.markTicketAsSeen(ticket.id);
        return false;
      }

      // 5. É realmente novo!
      if (import.meta.env.DEV) {
        console.log(`✅ [Detector] Ticket ${ticket.id} é NOVO:`, {
          description: ticket.description,
          property: ticket.propertyCode,
          createdAt: new Date(createdAtMs).toLocaleString('pt-BR'),
        });
      }
      return true;
    });
    
    if (import.meta.env.DEV) {
      console.log(`🎯 [Detector] Resultado: ${newTickets.length} novos tickets`);
      console.groupEnd();
    }

    // Se encontrou novos tickets
    if (newTickets.length > 0) {
      // Marcar como vistos
      newTickets.forEach(t => {
        notificationSessionManager.markTicketAsSeen(t.id);
      });

      // Atualizar cursor de última notificação
      const latestCreatedAt = newTickets
        .map(t => t.createdAt)
        .filter(Boolean)
        .sort()
        .reverse()[0];
      
      if (latestCreatedAt) {
        notificationSessionManager.updateLastNotifiedTicket(String(latestCreatedAt));
      }

      // 🔊 SOM E TOAST: apenas se online + aba visível
      const isOnline = navigator.onLine;
      const isVisible = document.visibilityState === 'visible';
      const shouldShowToastAndSound = isOnline && isVisible;

      if (import.meta.env.DEV) {
        console.log(`🔧 [Detector] ${newTickets.length} novos tickets detectados:`, {
          mostrarToast: shouldShowToastAndSound,
          motivo: !shouldShowToastAndSound 
            ? (!isOnline ? 'offline' : 'aba oculta') 
            : 'ok',
          tickets: newTickets.map(t => ({
            id: t.id,
            description: t.description,
            property: t.propertyCode,
            createdAt: t.createdAt,
          })),
        });
      }

      if (shouldShowToastAndSound) {
        playSuccessSound();
      } else {
        console.log('🔇 [Detector] Som/Toast desabilitados (offline ou aba oculta)');
      }

      // 🔔 SEMPRE notificar via callback (que adiciona ao NotificationCenter)
      onNewTickets(newTickets);
    }

  }, [tickets, currentUser, hasPermission, onNewTickets]);
}

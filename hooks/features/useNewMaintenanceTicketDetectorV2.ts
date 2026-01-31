/**
 * 🔧 NEW MAINTENANCE TICKET DETECTOR (VERSÃO 2.0 - DOCCHANGES)
 * 
 * Detecta novos chamados de manutenção usando Firestore docChanges
 * 
 * ✅ Correções implementadas:
 * - Bug #2: Detectar apenas eventos "added" (nunca "modified")
 * - Bug #3: Filtrar tickets de checkout automático
 * - Fingerprint estável (evita triggers por reordenação)
 * - Debug controlado por flag VITE_DEBUG_NOTIFICATIONS
 * 
 * IMPORTANTE: Precisa que storage.ts exponha docChanges no subscribe
 */

import { useEffect, useRef, useMemo } from 'react';
import { Ticket, User } from '../../types';
import { notificationSessionManager } from '../../services/notificationSessionManager';
import { isAutomaticCheckoutTicket } from '../../utils/ticketFilters';
import { ticketsDetectorLogger } from '../../utils/logger';

interface NewMaintenanceTicketDetectorProps {
  tickets: Ticket[];
  newlyAddedTickets?: Ticket[]; // Opcional: se storage.ts expor apenas os "added"
  currentUser: User | null;
  hasPermission: (perm: string) => boolean;
  onNewTickets: (tickets: Ticket[]) => void;
}


export function useNewMaintenanceTicketDetector({
  tickets,
  newlyAddedTickets,
  currentUser,
  hasPermission,
  onNewTickets,
}: NewMaintenanceTicketDetectorProps) {
  const hasInitializedBaseline = useRef(false);
  const previousTicketIds = useRef<Set<string>>(new Set());

  // Fingerprint estável (IDs ordenados)
  const ticketIdsFingerprint = useMemo(() => {
    if (!tickets || tickets.length === 0) return '';
    return tickets
      .map(t => t.id)
      .sort()
      .join('|');
  }, [tickets]);

  useEffect(() => {
    // Guard: não rodar sem usuário logado
    if (!currentUser) {
      return;
    }

    // Guard: apenas admin e maintenance
    if (!hasPermission('maintenance') && !hasPermission('admin')) {
      return;
    }

    // Guard: aguardar dados
    if (!tickets) {
      return;
    }

    // Inicializar sessão se necessário
    notificationSessionManager.initialize();
    const sessionStartedAt = notificationSessionManager.getSessionStartedAt();
    const sessionStartMs = notificationSessionManager.getSessionStartedAtMs();

    // 🎯 BASELINE: marcar tudo como visto na primeira execução
    if (!hasInitializedBaseline.current) {
      const currentIds = new Set(tickets.map(t => t.id));
      previousTicketIds.current = currentIds;
      
      // Marcar todos como vistos no session manager
      notificationSessionManager.markTicketsAsSeen(Array.from(currentIds));
      hasInitializedBaseline.current = true;
      
      return; // NÃO notificar na primeira execução
    }

    // 🔍 DETECÇÃO: usar newlyAddedTickets se disponível, senão comparar IDs
    let candidateNewTickets: Ticket[] = [];

    if (newlyAddedTickets && newlyAddedTickets.length > 0) {
      // Caminho ideal: storage.ts passou apenas os "added"
      candidateNewTickets = newlyAddedTickets;
    } else {
      // Fallback: detectar novos IDs comparando com execução anterior
      const currentIds = new Set(tickets.map(t => t.id));
      const newIds = Array.from(currentIds).filter(id => !previousTicketIds.current.has(id));
      
      if (newIds.length > 0) {
        candidateNewTickets = tickets.filter(t => newIds.includes(t.id));
      }
      
      // Atualizar set de IDs anteriores
      previousTicketIds.current = currentIds;
    }

    // Se não há candidatos, sair
    if (candidateNewTickets.length === 0) {
      return;
    }

    const lastNotifiedMs = notificationSessionManager.getLastNotifiedTicketCreatedAtMs();
    
    const newTickets = candidateNewTickets.filter(ticket => {
      // 🆕 FILTRO #0: Ignorar checkouts automáticos
      if (isAutomaticCheckoutTicket(ticket)) {
        notificationSessionManager.markTicketAsSeen(ticket.id);
        return false;
      }

      // 1. Já foi visto?
      if (notificationSessionManager.hasSeenTicket(ticket.id)) {
        return false;
      }

      // 2. Tem createdAt válido?
      if (!ticket.createdAt) {
        ticketsDetectorLogger.warn(`Ticket ${ticket.id} sem createdAt, ignorando`);
        notificationSessionManager.markTicketAsSeen(ticket.id);
        return false;
      }

      // 3. Foi criado após o login?
      const createdAtMs = new Date(ticket.createdAt).getTime();
      if (createdAtMs < sessionStartMs) {
        notificationSessionManager.markTicketAsSeen(ticket.id);
        return false;
      }

      // 4. Foi criado depois da última notificação?
      if (lastNotifiedMs > 0 && createdAtMs <= lastNotifiedMs) {
        notificationSessionManager.markTicketAsSeen(ticket.id);
        return false;
      }

      // 5. É realmente novo!
      return true;
    });


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

      ticketsDetectorLogger.info(
        `${newTickets.length} novo(s) ticket(s) detectado(s)`
      );
      
      // Debug: detalhes apenas com flag ativa
      ticketsDetectorLogger.debug(
        'Detalhes dos tickets',
        newTickets.map(t => `${t.serviceType || t.id} - ${t.propertyCode}`).join(', ')
      );

      // 🔔 Notificar via callback
      onNewTickets(newTickets);
    }

  }, [
    ticketIdsFingerprint, // ← Usar fingerprint ao invés do array completo
    newlyAddedTickets,
    currentUser,
    hasPermission,
    onNewTickets,
    tickets,
  ]);
}

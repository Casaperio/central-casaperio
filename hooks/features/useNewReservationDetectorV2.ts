/**
 * 🔔 NEW RESERVATION DETECTOR (VERSÃO 2.0 - FEED FIXO)
 * 
 * Detecta APENAS reservas realmente novas desde o login
 * USA FEED FIXO independente da rota para evitar falsos positivos
 * 
 * ✅ Correções implementadas:
 * - Bug #1: Feed fixo (não muda com navegação entre módulos)
 * - Bug #2: Baseline correto (inicializa apenas após primeiro fetch)
 * - Fingerprint estável (evita triggers por reordenação)
 * - Debug controlado por flag VITE_DEBUG_NOTIFICATIONS
 */

import { useEffect, useRef, useMemo } from 'react';
import { User } from '../../types';
import { notificationSessionManager } from '../../services/notificationSessionManager';
import { useStaysNotificationsFeed } from '../useStaysNotificationsFeed';
import { ReservationWithDailyStatus } from '../../services/staysDataMapper';
import { reservationsDetectorLogger } from '../../utils/logger';

interface NewReservationDetectorProps {
  currentUser: User | null;
  hasPermission: (perm: string) => boolean;
  onNewReservations: (reservations: ReservationWithDailyStatus[]) => void;
}

export function useNewReservationDetector({
  currentUser,
  hasPermission,
  onNewReservations,
}: NewReservationDetectorProps) {
  const hasInitializedBaseline = useRef(false);
  const previousFingerprintRef = useRef<string>('');

  // 🎯 FEED FIXO de notificações (não muda com navegação)
  const notificationsFeed = useStaysNotificationsFeed();
  
  const {
    reservations: feedReservations,
    isFetched,
    isSuccess,
    fingerprint,
  } = notificationsFeed;

  // Usar fingerprint estável ao invés do array completo
  const stableFingerprint = useMemo(() => {
    return fingerprint || '';
  }, [fingerprint]);

  useEffect(() => {
    // Guard: não rodar sem usuário logado
    if (!currentUser) return;

    // Guard: aguardar primeiro fetch completar
    if (!isFetched || !isSuccess) return;

    // Guard: feed vazio é válido (pode ter 0 reservas)
    if (feedReservations.length === 0 && !hasInitializedBaseline.current) {
      hasInitializedBaseline.current = true;
      notificationSessionManager.initialize();
      return;
    }

    // Inicializar sessão se necessário
    notificationSessionManager.initialize();
    const sessionStartMs = notificationSessionManager.getSessionStartedAtMs();

    // 🎯 BASELINE: marcar tudo como visto na primeira execução
    if (!hasInitializedBaseline.current) {
      const allIds = feedReservations.map(r => r.id);
      notificationSessionManager.markReservationsAsSeen(allIds);
      hasInitializedBaseline.current = true;
      previousFingerprintRef.current = stableFingerprint;
      
      reservationsDetectorLogger.infoOnce('baseline', `Baseline estabelecido: ${allIds.length} reservas`);
      
      return; // NÃO notificar na primeira execução
    }

    // Otimização: se fingerprint não mudou, não precisa processar
    if (stableFingerprint === previousFingerprintRef.current) {
      return;
    }

    // Atualizar fingerprint anterior
    previousFingerprintRef.current = stableFingerprint;

    // 🔍 DETECÇÃO: filtrar apenas reservas verdadeiramente novas
    const lastNotifiedMs = notificationSessionManager.getLastNotifiedReservationCreatedAtMs();
    
    const newReservations = feedReservations.filter(reservation => {
      // 1. Já foi vista?
      if (notificationSessionManager.hasSeenReservation(reservation.id)) {
        return false;
      }

      // 2. Tem createdAt válido?
      if (!reservation.createdAt) {
        reservationsDetectorLogger.warn(`Reserva ${reservation.id} sem createdAt, ignorando`);
        notificationSessionManager.markReservationAsSeen(reservation.id);
        return false;
      }

      // 3. Foi criada após o login?
      const createdAtMs = new Date(reservation.createdAt).getTime();
      if (createdAtMs < sessionStartMs) {
        notificationSessionManager.markReservationAsSeen(reservation.id);
        return false;
      }

      // 4. Foi criada depois da última notificação?
      if (lastNotifiedMs > 0 && createdAtMs <= lastNotifiedMs) {
        notificationSessionManager.markReservationAsSeen(reservation.id);
        return false;
      }

      // 5. É realmente nova!
      return true;
    });

    // Se encontrou novas reservas
    if (newReservations.length > 0) {
      // Marcar como vistas
      newReservations.forEach(r => {
        notificationSessionManager.markReservationAsSeen(r.id);
      });

      // Atualizar cursor de última notificação
      const latestCreatedAt = newReservations
        .map(r => r.createdAt)
        .filter(Boolean)
        .sort()
        .reverse()[0];
      
      if (latestCreatedAt) {
        notificationSessionManager.updateLastNotifiedReservation(String(latestCreatedAt));
      }

      reservationsDetectorLogger.info(
        `${newReservations.length} nova(s) reserva(s) detectada(s)`
      );
      
      // Debug: detalhes apenas com flag ativa
      reservationsDetectorLogger.debug(
        'Detalhes das reservas',
        newReservations.map(r => `${r.guestName} - ${r.propertyCode}`).join(', ')
      );

      // 🔔 Notificar via callback
      // O callback irá:
      // - Adicionar ao NotificationCenter (sempre)
      // - Mostrar toast + som apenas se online + visível
      onNewReservations(newReservations);
    }

  }, [
    stableFingerprint, // ← Usar fingerprint ao invés do array completo
    currentUser,
    hasPermission,
    onNewReservations,
    isFetched,
    isSuccess,
    feedReservations,
  ]);
}

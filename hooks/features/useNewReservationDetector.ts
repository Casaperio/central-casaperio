/**
 * 🔔 NEW RESERVATION DETECTOR (Reescrito)
 * 
 * Detecta APENAS reservas realmente novas desde o login
 * Usa sessão persistida para evitar notificações falsas ao trocar de módulo
 */

import { useEffect, useRef } from 'react';
import { Reservation, User } from '../../types';
import { notificationSessionManager } from '../../services/notificationSessionManager';
import { playSuccessSound } from '../../utils/soundUtils';

interface NewReservationDetectorProps {
  staysReservations: Reservation[];
  currentUser: User | null;
  hasPermission: (perm: string) => boolean;
  onNewReservations: (reservations: Reservation[]) => void;
}

export function useNewReservationDetector({
  staysReservations,
  currentUser,
  hasPermission,
  onNewReservations,
}: NewReservationDetectorProps) {
  const isFirstRun = useRef(true);
  const hasInitializedBaseline = useRef(false);

  useEffect(() => {
    // Guard: não rodar sem usuário logado
    if (!currentUser) return;

    // Guard: não rodar sem dados
    if (!staysReservations || staysReservations.length === 0) return;

    // Inicializar sessão se necessário
    notificationSessionManager.initialize();
    const sessionStartedAt = notificationSessionManager.getSessionStartedAt();

    // 🎯 PRIMEIRA EXECUÇÃO: apenas estabelecer baseline
    if (!hasInitializedBaseline.current) {
      const allIds = staysReservations.map(r => r.id);
      notificationSessionManager.markReservationsAsSeen(allIds);
      hasInitializedBaseline.current = true;
      
      console.log('✅ [New Reservation Detector] Baseline estabelecido:', {
        total: allIds.length,
        sessionStartedAt: sessionStartedAt.toISOString(),
      });
      
      return; // NÃO notificar na primeira execução
    }

    // 🔍 EXECUÇÕES SEGUINTES: detectar novas reservas
    const newReservations = staysReservations.filter(reservation => {
      // 1. Já foi vista?
      if (notificationSessionManager.hasSeenReservation(reservation.id)) {
        return false;
      }

      // 2. Foi criada após o login?
      const createdAt = reservation.createdAt ? new Date(reservation.createdAt) : null;
      if (!createdAt || createdAt < sessionStartedAt) {
        // Reserva antiga, marcar como vista mas não notificar
        notificationSessionManager.markReservationAsSeen(reservation.id);
        return false;
      }

      // 3. É realmente nova!
      return true;
    });

    // Se encontrou novas reservas
    if (newReservations.length > 0) {
      console.log('🎉 [New Reservation Detector] Novas reservas detectadas:', {
        quantidade: newReservations.length,
        detalhes: newReservations.map(r => ({
          id: r.id,
          guest: r.guestName,
          property: r.propertyCode,
          createdAt: r.createdAt,
        })),
      });

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

      // 🔊 SOM: apenas se online + aba visível + foco
      const shouldPlaySound = 
        navigator.onLine && 
        document.visibilityState === 'visible' && 
        document.hasFocus();

      if (shouldPlaySound) {
        playSuccessSound();
      } else {
        console.log('🔇 [New Reservation Detector] Som desabilitado (aba não visível ou sem foco)');
      }

      // 🔔 NOTIFICAR via callback
      onNewReservations(newReservations);
    }

  }, [staysReservations, currentUser, hasPermission, onNewReservations]);
}

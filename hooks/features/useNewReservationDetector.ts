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
    const lastNotifiedMs = notificationSessionManager.getLastNotifiedReservationCreatedAtMs();
    const sessionStartMs = notificationSessionManager.getSessionStartedAtMs();
    
    // Instrumentação DEV
    if (import.meta.env.DEV) {
      console.group('[Detector] 🔍 Análise de Novas Reservas');
      console.log('📊 Total de reservas:', staysReservations.length);
      console.log('🕐 Sessão iniciada em:', new Date(sessionStartMs).toLocaleString('pt-BR'));
      console.log('🕐 Última notificação:', lastNotifiedMs ? new Date(lastNotifiedMs).toLocaleString('pt-BR') : 'nunca');
      console.log('🌐 Online:', navigator.onLine);
      console.log('👁️ Visível:', document.visibilityState === 'visible');
      console.log('🎯 Foco:', document.hasFocus());
    }
    
    const newReservations = staysReservations.filter(reservation => {
      // 1. Já foi vista?
      if (notificationSessionManager.hasSeenReservation(reservation.id)) {
        return false;
      }

      // 2. Tem createdAt válido?
      if (!reservation.createdAt) {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ [Detector] Reserva ${reservation.id} sem createdAt, ignorando`);
        }
        notificationSessionManager.markReservationAsSeen(reservation.id);
        return false;
      }

      // 3. Foi criada após o login?
      const createdAtMs = new Date(reservation.createdAt).getTime();
      if (createdAtMs < sessionStartMs) {
        if (import.meta.env.DEV) {
          console.log(`⏮️ [Detector] Reserva ${reservation.id} é anterior à sessão, ignorando`);
        }
        notificationSessionManager.markReservationAsSeen(reservation.id);
        return false;
      }

      // 4. Foi criada depois da última notificação?
      if (lastNotifiedMs > 0 && createdAtMs <= lastNotifiedMs) {
        if (import.meta.env.DEV) {
          console.log(`⏮️ [Detector] Reserva ${reservation.id} já foi notificada anteriormente, ignorando`);
        }
        notificationSessionManager.markReservationAsSeen(reservation.id);
        return false;
      }

      // 5. É realmente nova!
      if (import.meta.env.DEV) {
        console.log(`✅ [Detector] Reserva ${reservation.id} é NOVA:`, {
          guest: reservation.guestName,
          property: reservation.propertyCode,
          createdAt: new Date(createdAtMs).toLocaleString('pt-BR'),
        });
      }
      return true;
    });
    
    if (import.meta.env.DEV) {
      console.log(`🎯 [Detector] Resultado: ${newReservations.length} novas reservas`);
      console.groupEnd();
    }

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

      // 🔊 SOM E TOAST: apenas se online + aba visível
      const isOnline = navigator.onLine;
      const isVisible = document.visibilityState === 'visible';
      const shouldShowToastAndSound = isOnline && isVisible;

      if (import.meta.env.DEV) {
        console.log(`🎉 [Detector] ${newReservations.length} novas reservas detectadas:`, {
          mostrarToast: shouldShowToastAndSound,
          motivo: !shouldShowToastAndSound 
            ? (!isOnline ? 'offline' : 'aba oculta') 
            : 'ok',
          reservas: newReservations.map(r => ({
            id: r.id,
            guest: r.guestName,
            property: r.propertyCode,
            createdAt: r.createdAt,
          })),
        });
      }

      if (shouldShowToastAndSound) {
        playSuccessSound();
      } else {
        console.log('🔇 [Detector] Som/Toast desabilitados (offline ou aba oculta)');
      }

      // 🔔 SEMPRE notificar via callback (que adiciona ao NotificationCenter)
      // O callback irá decidir se mostra ou não o toast baseado em shouldShowToastAndSound
      onNewReservations(newReservations);
    }

  }, [staysReservations, currentUser, hasPermission, onNewReservations]);
}

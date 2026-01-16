import { useEffect, useRef } from 'react';
import { Reservation, User } from '../../types';
import { playSuccessSound } from '../../utils/soundUtils';

const STORAGE_KEY = 'casape_seen_reservation_ids';

/**
 * Verifica se o usuário deve receber notificações de novas reservas
 * Regra: Admin OU Guest Relations OU Financeiro OU módulos (reservations/management/guest)
 */
function shouldReceiveNewReservationNotification(user: User | null): boolean {
  if (!user) return false;

  // Admin recebe tudo
  if (user.role === 'Admin') return true;

  // Guest Relations recebe
  if (user.role === 'Guest Relations') return true;

  // Financeiro recebe (se existir role específico, ajustar aqui)
  // Por ora, verificamos se tem acesso ao módulo management
  if (user.allowedModules?.includes('management')) return true;

  // Usuários com acesso aos módulos de reservas, guest ou management
  if (user.allowedModules?.includes('reservations')) return true;
  if (user.allowedModules?.includes('guest')) return true;

  return false;
}

interface UseNewReservationDetectorProps {
  staysReservations: Reservation[];
  currentUser: User | null;
  onNewReservation: (reservations: Reservation[]) => void;
  addLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  /**
   * Filter state signature to detect when user changes filters
   * When this changes, we reset the detector to avoid false "new reservation" alerts
   */
  filterSignature?: string;
}

/**
 * Hook que detecta novas reservas comparando com estado anterior
 * Extraído do App.tsx (linhas 322-455) - 133 linhas
 */
export function useNewReservationDetector({
  staysReservations,
  currentUser,
  onNewReservation,
  addLog,
  addNotification,
  filterSignature
}: UseNewReservationDetectorProps) {
  const previousReservationsRef = useRef<Reservation[]>([]);
  const previousFilterSignatureRef = useRef<string | undefined>(filterSignature);

  // Verificar se usuário tem permissão para receber notificações
  const hasPermission = shouldReceiveNewReservationNotification(currentUser);

  useEffect(() => {
    // Detectar mudança de filtro - resetar previousRef para evitar falsos positivos
    if (filterSignature !== previousFilterSignatureRef.current) {
      console.log('🔄 [NEW RESERVATION DETECTOR] Filtro mudou - resetando detector');
      console.log('  Filtro anterior:', previousFilterSignatureRef.current);
      console.log('  Filtro novo:', filterSignature);
      previousFilterSignatureRef.current = filterSignature;
      previousReservationsRef.current = staysReservations;
      
      // Salvar IDs atuais no localStorage para evitar duplicatas no reload
      const currentIds = staysReservations.map(r => r.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentIds));
      return;
    }
    console.log('🔍 [NEW RESERVATION DETECTOR] useEffect executou');
    console.log('  📊 Total atual:', staysReservations.length, 'reservas');
    console.log('  📚 Total anterior:', previousReservationsRef.current.length, 'reservas');

    // Se não há reservas atuais, skip comparação
    if (staysReservations.length === 0) {
      console.log('  ⏭️ Sem reservas atuais - skipping');
      return;
    }

    // Primeira inicialização - carregar IDs vistos do localStorage
    if (previousReservationsRef.current.length === 0) {
      console.log('  🔄 Primeira inicialização - carregando IDs do localStorage');

      try {
        const storedIds = localStorage.getItem(STORAGE_KEY);
        if (storedIds) {
          const seenIds = new Set(JSON.parse(storedIds));
          console.log('  📦 IDs carregados do localStorage:', seenIds.size, 'reservas');

          // Comparar com IDs vistos anteriormente
          const newOnes = staysReservations.filter(r => !seenIds.has(r.id));

          if (newOnes.length > 0) {
            console.log('🎉 ========================================');
            console.log('🎉 NOVAS RESERVAS DETECTADAS (após reload)!');
            console.log('🎉 ========================================');
            console.log('  Quantidade:', newOnes.length);
            console.log('  Detalhes:', newOnes.map(r => ({
              nome: r.guestName,
              propriedade: r.propertyCode,
              checkIn: r.checkInDate
            })));

            // VERIFICAR PERMISSÃO antes de disparar notificações
            if (hasPermission) {
              console.log('  ✅ Usuário tem permissão - disparando notificações');

              // Trigger callback
              onNewReservation(newOnes);
              playSuccessSound();
              addLog('Nova Reserva', `Detectadas ${newOnes.length} nova(s) reserva(s)`);

              // Notificação
              const firstName = newOnes[0].guestName;
              const msg = newOnes.length === 1
                ? `${firstName} - ${newOnes[0].propertyCode}`
                : `${firstName} e mais ${newOnes.length - 1}`;
              addNotification('Nova Reserva!', msg, 'success');

              console.log('  ✅ Callbacks executados, som tocado');
            } else {
              console.log('  ⛔ Usuário SEM permissão - notificações suprimidas');
            }
          }
        } else {
          console.log('  📝 Nenhum histórico encontrado - primeira execução do app');
        }
      } catch (error) {
        console.error('  ❌ Erro ao carregar IDs do localStorage:', error);
      }

      // Salvar estado atual
      previousReservationsRef.current = staysReservations;
      const currentIds = staysReservations.map(r => r.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentIds));
      console.log('  💾 IDs salvos no localStorage:', currentIds.length, 'reservas');
      return;
    }

    // Comparar IDs - encontrar novas reservas (durante a sessão)
    const previousIds = new Set(previousReservationsRef.current.map(r => r.id));
    const newOnes = staysReservations.filter(r => !previousIds.has(r.id));

    console.log('  🔎 Comparação:', newOnes.length, 'nova(s) reserva(s) detectada(s)');

    // Se encontrou novas reservas
    if (newOnes.length > 0) {
      console.log('🎉 ========================================');
      console.log('🎉 NOVAS RESERVAS DETECTADAS!');
      console.log('🎉 ========================================');
      console.log('  Quantidade:', newOnes.length);
      console.log('  Detalhes:', newOnes.map(r => ({
        nome: r.guestName,
        propriedade: r.propertyCode,
        checkIn: r.checkInDate
      })));

      // VERIFICAR PERMISSÃO antes de disparar notificações
      if (hasPermission) {
        console.log('  ✅ Usuário tem permissão - disparando notificações');

        // Trigger callback
        onNewReservation(newOnes);
        playSuccessSound();
        addLog('Nova Reserva', `Detectadas ${newOnes.length} nova(s) reserva(s)`);

        // Notificação
        const firstName = newOnes[0].guestName;
        const msg = newOnes.length === 1
          ? `${firstName} - ${newOnes[0].propertyCode}`
          : `${firstName} e mais ${newOnes.length - 1}`;
        addNotification('Nova Reserva!', msg, 'success');

        console.log('  ✅ Callbacks executados, som tocado');
      } else {
        console.log('  ⛔ Usuário SEM permissão - notificações suprimidas');
      }
    } else {
      console.log('  ℹ️ Nenhuma reserva nova - estado inalterado');
    }

    // Atualizar referência e localStorage
    previousReservationsRef.current = staysReservations;
    const currentIds = staysReservations.map(r => r.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentIds));
    console.log('  💾 Referência atualizada + localStorage sincronizado');
  }, [staysReservations, currentUser, hasPermission, onNewReservation, addLog, addNotification]);
}

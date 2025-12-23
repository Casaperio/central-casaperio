import { Reservation, Ticket, TicketStatus, ServiceType, ReservationStatus } from '../types';
import { storageService } from './storage';
import { generateId } from '../utils';

/**
 * Serviço de Automação de Tickets de Check-out
 *
 * Este serviço monitora as reservas e automaticamente cria chamados de manutenção
 * para limpeza de check-out quando uma reserva atinge o status de checkout.
 */

class CheckoutAutomationService {
  private reservationsUnsubscribe: (() => void) | null = null;
  private ticketsUnsubscribe: (() => void) | null = null;
  private existingTickets: Ticket[] = [];
  private processedReservations = new Set<string>();

  /**
   * Inicia o monitoramento automático de check-outs
   */
  start() {
    console.log('[CheckoutAutomation] Iniciando monitoramento de check-outs...');

    // Primeiro, carrega todos os tickets existentes para evitar duplicações
    this.ticketsUnsubscribe = storageService.tickets.subscribe((tickets) => {
      this.existingTickets = tickets.filter(t => t.isCheckoutTicket);
      console.log(`[CheckoutAutomation] ${this.existingTickets.length} tickets de check-out existentes`);
    });

    // Monitora reservas e cria tickets quando necessário
    this.reservationsUnsubscribe = storageService.reservations.subscribe((reservations) => {
      this.processReservations(reservations);
    });
  }

  /**
   * Para o monitoramento
   */
  stop() {
    if (this.reservationsUnsubscribe) {
      this.reservationsUnsubscribe();
      this.reservationsUnsubscribe = null;
    }
    if (this.ticketsUnsubscribe) {
      this.ticketsUnsubscribe();
      this.ticketsUnsubscribe = null;
    }
    this.processedReservations.clear();
    console.log('[CheckoutAutomation] Monitoramento pausado');
  }

  /**
   * Processa a lista de reservas e cria tickets de check-out quando necessário
   */
  private async processReservations(reservations: Reservation[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const reservation of reservations) {
      // Verifica se a reserva necessita de ticket de check-out
      if (this.shouldCreateCheckoutTicket(reservation, today)) {
        // Evita processar a mesma reserva múltiplas vezes
        if (this.processedReservations.has(reservation.id)) {
          continue;
        }

        // Verifica se já existe um ticket de check-out para esta reserva
        const existingTicket = this.existingTickets.find(
          t => t.reservationId === reservation.id && t.isCheckoutTicket
        );

        if (!existingTicket) {
          await this.createCheckoutTicket(reservation);
          this.processedReservations.add(reservation.id);
        }
      }
    }
  }

  /**
   * Determina se uma reserva deve gerar um ticket de check-out
   */
  private shouldCreateCheckoutTicket(reservation: Reservation, today: Date): boolean {
    // Ignora reservas canceladas
    if (reservation.status === ReservationStatus.CANCELED) {
      return false;
    }

    const checkOutDate = new Date(reservation.checkOutDate);
    checkOutDate.setHours(0, 0, 0, 0);

    // Cria ticket se:
    // 1. Reserva está com status de CHECK-OUT
    // 2. OU a data de check-out é hoje ou já passou
    return (
      reservation.status === ReservationStatus.CHECKOUT ||
      checkOutDate <= today
    );
  }

  /**
   * Cria um ticket de manutenção para check-out
   */
  private async createCheckoutTicket(reservation: Reservation) {
    const checkOutDate = new Date(reservation.checkOutDate);
    const ticketDate = checkOutDate.toISOString().split('T')[0];

    const ticket: Ticket = {
      id: generateId(),
      propertyCode: reservation.propertyCode,
      propertyName: reservation.propertyName || reservation.propertyCode,
      priority: 'Alta',
      serviceType: ServiceType.CHECKOUT_CLEANING,
      description: `Limpeza de check-out automática - Hóspede: ${reservation.guestName}`,
      desiredDate: ticketDate,
      guestAuth: false,
      status: TicketStatus.OPEN,
      createdBy: 'Sistema',
      createdByName: 'Automação de Check-out',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reservationId: reservation.id,
      isCheckoutTicket: true,
      category: 'maintenance'
    };

    try {
      await storageService.tickets.add(ticket);
      console.log(
        `[CheckoutAutomation] ✅ Ticket criado para check-out: ${reservation.propertyCode} - ${reservation.guestName}`
      );
    } catch (error) {
      console.error('[CheckoutAutomation] ❌ Erro ao criar ticket:', error);
    }
  }

  /**
   * Cria tickets manualmente para todos os check-outs existentes (execução única)
   */
  async createTicketsForAllCheckouts() {
    console.log('[CheckoutAutomation] Criando tickets para todos os check-outs existentes...');

    return new Promise<void>((resolve) => {
      const unsubscribe = storageService.reservations.subscribe(async (reservations) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let created = 0;
        let skipped = 0;

        for (const reservation of reservations) {
          if (this.shouldCreateCheckoutTicket(reservation, today)) {
            const existingTicket = this.existingTickets.find(
              t => t.reservationId === reservation.id && t.isCheckoutTicket
            );

            if (!existingTicket) {
              await this.createCheckoutTicket(reservation);
              created++;
            } else {
              skipped++;
            }
          }
        }

        console.log(
          `[CheckoutAutomation] ✅ Processo concluído: ${created} criados, ${skipped} já existiam`
        );

        unsubscribe();
        resolve();
      });
    });
  }
}

// Exporta uma instância singleton
export const checkoutAutomationService = new CheckoutAutomationService();

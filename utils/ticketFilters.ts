/**
 * 🔧 Filtros centralizados para tickets de manutenção
 * 
 * Garante consistência em TODOS os lugares que lidam com tickets:
 * - Notificações
 * - Guest & CRM
 * - Histórico
 * - Listagens
 */

import { Ticket } from '../types';

/**
 * Identifica se um ticket é de checkout automático
 * 
 * Regras:
 * - ticket.isCheckoutTicket === true
 * - OU contém "checkout automát" na descrição (case-insensitive)
 * - OU categoria contém "Checkout Automático"
 */
export function isAutomaticCheckoutTicket(ticket: Ticket): boolean {
  // 1. Flag direta
  if (ticket.isCheckoutTicket === true) {
    return true;
  }

  // 2. Descrição contém "checkout automát"
  if (ticket.description && 
      ticket.description.toLowerCase().includes('checkout automát')) {
    return true;
  }

  // 3. Service type contém "checkout automát"
  if (ticket.serviceType && 
      ticket.serviceType.toLowerCase().includes('checkout automát')) {
    return true;
  }

  return false;
}

/**
 * Filtra lista de tickets removendo checkouts automáticos
 */
export function filterOutAutomaticCheckouts(tickets: Ticket[]): Ticket[] {
  return tickets.filter(ticket => !isAutomaticCheckoutTicket(ticket));
}

/**
 * Conta tickets excluindo checkouts automáticos
 */
export function countNonAutomaticTickets(tickets: Ticket[]): number {
  return filterOutAutomaticCheckouts(tickets).length;
}

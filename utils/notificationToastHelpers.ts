/**
 * 🔔 NOTIFICATION TOAST HELPERS
 * 
 * Helpers para disparar toasts de notificação
 * Toast aparece por 7s e depois fica registrado no NotificationCenter
 */

import { Reservation, Ticket } from '../types';
import { formatCurrency, formatDatePtBR } from '../utils';

export interface ToastNotification {
  id: string;
  type: 'reservation' | 'maintenance';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

// Callback global para adicionar no NotificationCenter
let addToNotificationCenter: ((title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void) | null = null;

export function setNotificationCenterCallback(callback: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void) {
  addToNotificationCenter = callback;
}

/**
 * Formata detalhes de 1 reserva para toast
 */
function formatReservationDetails(reservation: Reservation): string {
  const checkIn = reservation.checkInDate ? formatDatePtBR(new Date(reservation.checkInDate)) : 'N/A';
  const checkOut = reservation.checkOutDate ? formatDatePtBR(new Date(reservation.checkOutDate)) : 'N/A';
  const nights = reservation.nights || 'N/A';
  const guests = reservation.guestCount || 1;
  const platform = reservation.channel || reservation.source || 'Direto';
  const totalValue = reservation.totalValue ? formatCurrency(reservation.totalValue) : 'N/A';

  return `
🏠 ${reservation.propertyCode}
📅 ${checkIn} → ${checkOut} (${nights} noites)
👥 ${guests} hóspede${guests > 1 ? 's' : ''}
🌐 ${platform}
💰 ${totalValue}
  `.trim();
}

/**
 * Toast para 1 nova reserva (com detalhes completos)
 */
export function notifyReservationToast(reservation: Reservation): ToastNotification {
  const guest = reservation.guestName || 'Hóspede sem nome';
  const details = formatReservationDetails(reservation);
  
  const notification: ToastNotification = {
    id: `reservation-${reservation.id}`,
    type: 'reservation',
    title: `🎉 Nova Reserva: ${guest}`,
    message: details,
    data: reservation,
    timestamp: new Date().toISOString(),
  };

  // Registrar no NotificationCenter
  if (addToNotificationCenter) {
    addToNotificationCenter(notification.title, notification.message, 'success');
  }

  return notification;
}

/**
 * Toast para múltiplas novas reservas
 */
export function notifyReservationsToastMany(reservations: Reservation[]): ToastNotification {
  const count = reservations.length;
  
  const notification: ToastNotification = {
    id: `reservations-${Date.now()}`,
    type: 'reservation',
    title: `🎉 ${count} Novas Reservas!`,
    message: `${count} nova${count > 1 ? 's' : ''} reserva${count > 1 ? 's' : ''} chegou${count > 1 ? 'aram' : 'ou'}!`,
    data: reservations,
    timestamp: new Date().toISOString(),
  };

  // Registrar no NotificationCenter
  if (addToNotificationCenter) {
    addToNotificationCenter(notification.title, notification.message, 'success');
    
    // Registrar cada reserva individualmente no histórico
    reservations.forEach(r => {
      const guest = r.guestName || 'Hóspede sem nome';
      const property = r.propertyCode || 'Propriedade';
      addToNotificationCenter!(
        `Nova Reserva: ${guest}`,
        `${property} - ${formatDatePtBR(new Date(r.checkInDate || ''))}`,
        'info'
      );
    });
  }

  return notification;
}

/**
 * Toast para 1 novo ticket de manutenção
 */
export function notifyMaintenanceTicketToast(ticket: Ticket): ToastNotification {
  const property = ticket.propertyCode || 'Propriedade';
  const category = ticket.category || 'Manutenção';
  
  const notification: ToastNotification = {
    id: `ticket-${ticket.id}`,
    type: 'maintenance',
    title: `🔧 Novo Chamado: ${property}`,
    message: `${category}\n${ticket.description || 'Sem descrição'}`,
    data: ticket,
    timestamp: new Date().toISOString(),
  };

  // Registrar no NotificationCenter
  if (addToNotificationCenter) {
    addToNotificationCenter(notification.title, notification.message, 'warning');
  }

  return notification;
}

/**
 * Toast para múltiplos tickets
 */
export function notifyMaintenanceTicketsToastMany(tickets: Ticket[]): ToastNotification {
  const count = tickets.length;
  
  const notification: ToastNotification = {
    id: `tickets-${Date.now()}`,
    type: 'maintenance',
    title: `🔧 ${count} Novos Chamados!`,
    message: `${count} novo${count > 1 ? 's' : ''} chamado${count > 1 ? 's' : ''} de manutenção!`,
    data: tickets,
    timestamp: new Date().toISOString(),
  };

  // Registrar no NotificationCenter
  if (addToNotificationCenter) {
    addToNotificationCenter(notification.title, notification.message, 'warning');
    
    // Registrar cada ticket individualmente no histórico
    tickets.forEach(t => {
      const property = t.propertyCode || 'Propriedade';
      addToNotificationCenter!(
        `Novo Chamado: ${property}`,
        t.description || 'Sem descrição',
        'warning'
      );
    });
  }

  return notification;
}

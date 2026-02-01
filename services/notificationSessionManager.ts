/**
 * 🔔 NOTIFICATION SESSION MANAGER
 * 
 * Gerencia sessão de notificações para evitar alertas falsos
 * Persiste no localStorage para manter estado entre reloads
 */

import { sessionManagerLogger } from '../utils/logger';

interface NotificationSession {
  sessionStartedAt: string; // ISO timestamp do login
  seenReservationIds: string[]; // IDs já conhecidos
  seenMaintenanceTicketIds: string[]; // Tickets já conhecidos
  lastNotifiedReservationCreatedAt: string | null; // Cursor de timestamp
  lastNotifiedTicketCreatedAt: string | null;
}

const STORAGE_KEY = 'casape_notification_session';
const MAX_SEEN_IDS = 5000; // Limite para evitar explodir localStorage

class NotificationSessionManager {
  private session: NotificationSession | null = null;

  /**
   * Inicializa ou recupera sessão do localStorage
   */
  initialize(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        this.session = JSON.parse(stored);
      } catch (e) {
        sessionManagerLogger.error('Erro ao parsear sessão, criando nova', e);
        this.createNewSession();
      }
    } else {
      this.createNewSession();
    }
  }

  /**
   * Cria nova sessão (ao fazer login)
   */
  createNewSession(): void {
    this.session = {
      sessionStartedAt: new Date().toISOString(),
      seenReservationIds: [],
      seenMaintenanceTicketIds: [],
      lastNotifiedReservationCreatedAt: null,
      lastNotifiedTicketCreatedAt: null,
    };
    
    this.persist();
    sessionManagerLogger.info('Nova sessão criada');
  }

  /**
   * Persiste sessão no localStorage
   */
  private persist(): void {
    if (!this.session) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
  }

  /**
   * Retorna timestamp de início da sessão
   */
  getSessionStartedAt(): Date {
    if (!this.session) this.initialize();
    return new Date(this.session!.sessionStartedAt);
  }

  /**
   * Retorna timestamp de início da sessão em milissegundos
   */
  getSessionStartedAtMs(): number {
    return this.getSessionStartedAt().getTime();
  }

  /**
   * Retorna último createdAt notificado de reserva em ms (ou 0 se null)
   */
  getLastNotifiedReservationCreatedAtMs(): number {
    if (!this.session) this.initialize();
    const lastCreatedAt = this.session!.lastNotifiedReservationCreatedAt;
    return lastCreatedAt ? new Date(lastCreatedAt).getTime() : 0;
  }

  /**
   * Retorna último createdAt notificado de ticket em ms (ou 0 se null)
   */
  getLastNotifiedTicketCreatedAtMs(): number {
    if (!this.session) this.initialize();
    const lastCreatedAt = this.session!.lastNotifiedTicketCreatedAt;
    return lastCreatedAt ? new Date(lastCreatedAt).getTime() : 0;
  }

  /**
   * Verifica se reserva já foi vista
   */
  hasSeenReservation(id: string): boolean {
    if (!this.session) this.initialize();
    return this.session!.seenReservationIds.includes(id);
  }

  /**
   * Marca reserva como vista
   */
  markReservationAsSeen(id: string): void {
    if (!this.session) this.initialize();
    
    if (!this.session!.seenReservationIds.includes(id)) {
      this.session!.seenReservationIds.push(id);
      
      // Limitar tamanho do array (manter apenas os últimos N)
      if (this.session!.seenReservationIds.length > MAX_SEEN_IDS) {
        this.session!.seenReservationIds = this.session!.seenReservationIds.slice(-MAX_SEEN_IDS);
        console.log(`⚠️ [Notification Session] Limite de IDs atingido, mantendo últimos ${MAX_SEEN_IDS}`);
      }
      
      this.persist();
    }
  }

  /**
   * Marca múltiplas reservas como vistas (baseline inicial)
   */
  markReservationsAsSeen(ids: string[]): void {
    if (!this.session) this.initialize();
    
    const newIds = ids.filter(id => !this.session!.seenReservationIds.includes(id));
    if (newIds.length > 0) {
      this.session!.seenReservationIds.push(...newIds);      
      // Limitar tamanho do array
      if (this.session!.seenReservationIds.length > MAX_SEEN_IDS) {
        this.session!.seenReservationIds = this.session!.seenReservationIds.slice(-MAX_SEEN_IDS);
        console.log(`⚠️ [Notification Session] Limite de IDs atingido após baseline, mantendo últimos ${MAX_SEEN_IDS}`);
      }
            this.persist();
      console.log(`📝 [Notification Session] ${newIds.length} reservas marcadas como vistas (baseline)`);
    }
  }

  /**
   * Atualiza cursor de última notificação de reserva
   */
  updateLastNotifiedReservation(createdAt: string): void {
    if (!this.session) this.initialize();
    
    this.session!.lastNotifiedReservationCreatedAt = createdAt;
    this.persist();
  }

  /**
   * Verifica se ticket já foi visto
   */
  hasSeenTicket(id: string): boolean {
    if (!this.session) this.initialize();
    return this.session!.seenMaintenanceTicketIds.includes(id);
  }

  /**
   * Marca ticket como visto
   */
  markTicketAsSeen(id: string): void {
    if (!this.session) this.initialize();
    
    if (!this.session!.seenMaintenanceTicketIds.includes(id)) {
      this.session!.seenMaintenanceTicketIds.push(id);
      
      // Limitar tamanho do array
      if (this.session!.seenMaintenanceTicketIds.length > MAX_SEEN_IDS) {
        this.session!.seenMaintenanceTicketIds = this.session!.seenMaintenanceTicketIds.slice(-MAX_SEEN_IDS);
        console.log(`⚠️ [Notification Session] Limite de ticket IDs atingido, mantendo últimos ${MAX_SEEN_IDS}`);
      }
      
      this.persist();
    }
  }

  /**
   * Marca múltiplos tickets como vistos (baseline inicial)
   */
  markTicketsAsSeen(ids: string[]): void {
    if (!this.session) this.initialize();
    
    const newIds = ids.filter(id => !this.session!.seenMaintenanceTicketIds.includes(id));
    if (newIds.length > 0) {
      this.session!.seenMaintenanceTicketIds.push(...newIds);      
      // Limitar tamanho do array
      if (this.session!.seenMaintenanceTicketIds.length > MAX_SEEN_IDS) {
        this.session!.seenMaintenanceTicketIds = this.session!.seenMaintenanceTicketIds.slice(-MAX_SEEN_IDS);
        console.log(`⚠️ [Notification Session] Limite de ticket IDs atingido após baseline, mantendo últimos ${MAX_SEEN_IDS}`);
      }
            this.persist();
      console.log(`📝 [Notification Session] ${newIds.length} tickets marcados como vistos (baseline)`);
    }
  }

  /**
   * Atualiza cursor de última notificação de ticket
   */
  updateLastNotifiedTicket(createdAt: string): void {
    if (!this.session) this.initialize();
    
    this.session!.lastNotifiedTicketCreatedAt = createdAt;
    this.persist();
  }

  /**
   * Limpa sessão (ao fazer logout)
   */
  clear(): void {
    this.session = null;
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ [Notification Session] Sessão limpa');
  }

  /**
   * Retorna sessão atual (para debug)
   */
  getSession(): NotificationSession | null {
    if (!this.session) this.initialize();
    return this.session;
  }
}

// Singleton
export const notificationSessionManager = new NotificationSessionManager();

/**
 * 🔔 NOTIFICATION SESSION MANAGER
 * 
 * Gerencia sessão de notificações para evitar alertas falsos
 * Persiste no localStorage para manter estado entre reloads
 */

interface NotificationSession {
  sessionStartedAt: string; // ISO timestamp do login
  seenReservationIds: string[]; // IDs já conhecidos
  seenMaintenanceTicketIds: string[]; // Tickets já conhecidos
  lastNotifiedReservationCreatedAt: string | null; // Cursor de timestamp
  lastNotifiedTicketCreatedAt: string | null;
}

const STORAGE_KEY = 'casape_notification_session';

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
        console.log('📋 [Notification Session] Recuperada do localStorage:', this.session?.sessionStartedAt);
      } catch (e) {
        console.error('[Notification Session] Erro ao parsear sessão, criando nova:', e);
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
    console.log('✨ [Notification Session] Nova sessão criada:', this.session.sessionStartedAt);
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
      this.persist();
      console.log(`📝 [Notification Session] ${newIds.length} tickets marcados como vistos (baseline)`);
    }
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

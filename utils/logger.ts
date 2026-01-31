/**
 * 🔍 Sistema de Logging Profissional
 * 
 * Camada centralizada para controlar logs de debug
 * 
 * Níveis:
 * - debug: Apenas com VITE_DEBUG_NOTIFICATIONS=true
 * - info: Eventos importantes (usado com parcimônia)
 * - warn: Situações anormais porém recuperáveis
 * - error: Erros reais (sempre exibido)
 */

const isDebugEnabled = () => {
  return import.meta.env.DEV && import.meta.env.VITE_DEBUG_NOTIFICATIONS === 'true';
};

// Armazena se já logou o baseline para evitar repetição
const loggedOnce = new Set<string>();

class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  /**
   * Log de debug - apenas quando flag ativa
   */
  debug(message: string, data?: any) {
    if (!isDebugEnabled()) return;
    
    if (data) {
      console.log(`🔍 [${this.prefix}] ${message}`, data);
    } else {
      console.log(`🔍 [${this.prefix}] ${message}`);
    }
  }

  /**
   * Log de debug agrupado - apenas quando flag ativa
   */
  debugGroup(title: string, callback: () => void) {
    if (!isDebugEnabled()) return;
    
    console.group(`🔍 [${this.prefix}] ${title}`);
    callback();
    console.groupEnd();
  }

  /**
   * Log de informação - eventos importantes
   */
  info(message: string, data?: any) {
    if (data) {
      console.log(`ℹ️ [${this.prefix}] ${message}`, data);
    } else {
      console.log(`ℹ️ [${this.prefix}] ${message}`);
    }
  }

  /**
   * Log de informação que só aparece uma vez por sessão
   */
  infoOnce(key: string, message: string, data?: any) {
    const fullKey = `${this.prefix}:${key}`;
    if (loggedOnce.has(fullKey)) return;
    
    loggedOnce.add(fullKey);
    this.info(message, data);
  }

  /**
   * Log de warning - situações anormais
   */
  warn(message: string, data?: any) {
    if (data) {
      console.warn(`⚠️ [${this.prefix}] ${message}`, data);
    } else {
      console.warn(`⚠️ [${this.prefix}] ${message}`);
    }
  }

  /**
   * Log de erro - sempre exibido
   */
  error(message: string, error?: any) {
    if (error) {
      console.error(`❌ [${this.prefix}] ${message}`, error);
    } else {
      console.error(`❌ [${this.prefix}] ${message}`);
    }
  }
}

/**
 * Factory para criar loggers com prefixos específicos
 */
export const createLogger = (prefix: string) => new Logger(prefix);

/**
 * Loggers pré-configurados para o sistema de notificações
 */
export const notificationsLogger = createLogger('Notifications');
export const reservationsDetectorLogger = createLogger('Reservations Detector V2');
export const ticketsDetectorLogger = createLogger('Tickets Detector V2');
export const sessionManagerLogger = createLogger('Session Manager');
export const feedLogger = createLogger('Notifications Feed');

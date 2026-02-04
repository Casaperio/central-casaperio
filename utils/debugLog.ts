/**
 * 🐛 Debug Log Utility
 * 
 * Sistema de debug controlado via localStorage flag.
 * Logs só aparecem se:
 * - Ambiente DEV
 * - localStorage.DEBUG_GUEST_CONTACT === "1"
 * 
 * Uso:
 * ```typescript
 * import { debugLog } from '../utils/debugLog';
 * 
 * debugLog.mapper('Dados de contato extraídos:', { email, phone });
 * debugLog.modal('Modal aberto:', { guestName, hasContact });
 * debugLog.hook('guestContactMap criado:', { size: map.size });
 * ```
 */

const DEBUG_FLAG = 'DEBUG_GUEST_CONTACT';

/**
 * Verifica se o debug está habilitado
 */
function isDebugEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  
  try {
    return localStorage.getItem(DEBUG_FLAG) === '1';
  } catch {
    return false;
  }
}

/**
 * Formata prefixo do log
 */
function formatPrefix(category: string): string {
  return `[Task 6 Debug - ${category}]`;
}

/**
 * Objeto de debug com métodos categorizados
 */
export const debugLog = {
  /**
   * Logs do staysDataMapper.ts (extração de dados)
   */
  mapper(message: string, data?: any) {
    if (!isDebugEnabled()) return;
    if (data) {
      console.log(formatPrefix('Mapper'), message, data);
    } else {
      console.log(formatPrefix('Mapper'), message);
    }
  },
  
  /**
   * Logs do ReservationDetailModal.tsx (exibição)
   */
  modal(message: string, data?: any) {
    if (!isDebugEnabled()) return;
    if (data) {
      console.log(formatPrefix('Modal'), message, data);
    } else {
      console.log(formatPrefix('Modal'), message);
    }
  },
  
  /**
   * Logs do useStaysData.ts (hook de dados)
   */
  hook(message: string, data?: any) {
    if (!isDebugEnabled()) return;
    if (data) {
      console.log(formatPrefix('Hook'), message, data);
    } else {
      console.log(formatPrefix('Hook'), message);
    }
  },
  
  /**
   * Logs do GuestCRM.tsx
   */
  crm(message: string, data?: any) {
    if (!isDebugEnabled()) return;
    if (data) {
      console.log(formatPrefix('GuestCRM'), message, data);
    } else {
      console.log(formatPrefix('GuestCRM'), message);
    }
  },
  
  /**
   * Enable debug no console
   */
  enable() {
    try {
      localStorage.setItem(DEBUG_FLAG, '1');
      console.log('✅ Debug de contatos habilitado. Recarregue a página.');
    } catch (e) {
      console.error('❌ Não foi possível habilitar debug:', e);
    }
  },
  
  /**
   * Disable debug no console
   */
  disable() {
    try {
      localStorage.removeItem(DEBUG_FLAG);
      console.log('❌ Debug de contatos desabilitado. Recarregue a página.');
    } catch (e) {
      console.error('❌ Não foi possível desabilitar debug:', e);
    }
  },
  
  /**
   * Verifica se está habilitado
   */
  isEnabled(): boolean {
    return isDebugEnabled();
  }
};

// Export funções helper para console
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).enableGuestContactDebug = debugLog.enable;
  (window as any).disableGuestContactDebug = debugLog.disable;
  
  console.log('💡 Debug de contatos disponível:');
  console.log('   enableGuestContactDebug()  - Habilitar logs');
  console.log('   disableGuestContactDebug() - Desabilitar logs');
}

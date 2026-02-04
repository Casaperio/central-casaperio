/**
 * 📧📞 Guest Contact Extractors
 * 
 * Utilitários robustos para extrair email e telefone de objetos de reserva
 * vindos da Stays API, com fallback por múltiplos caminhos + busca profunda restrita.
 * 
 * Task: Resolver problema de email/telefone não aparecendo no modal Guest & CRM
 */

// ==================== EMAIL EXTRACTION ====================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Lista de caminhos comuns para email (ordenados por prioridade)
 */
const EMAIL_PATHS = [
  'guestEmail',
  'email',
  'guest.email',
  'guest.contact.email',
  'guest.contactInfo.email',
  'booking.guest.email',
  'booking.guestEmail',
  'channelData.guestEmail',
  'channelData.email',
  'guestsDetails.email',
  'guestsDetails.guestEmail',
  'guestsDetails.list[0].email',
  'contact.email',
  'contactInfo.email',
];

/**
 * Extrai email de um objeto, tentando múltiplos caminhos e deep search
 */
export function extractGuestEmail(raw: any): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  // 1. Tentar paths comuns primeiro (mais rápido)
  for (const path of EMAIL_PATHS) {
    const value = getValueByPath(raw, path);
    if (value && typeof value === 'string' && EMAIL_REGEX.test(value)) {
      return value;
    }
  }

  // 2. Deep search restrito (apenas chaves relacionadas a email)
  const emailValue = deepSearchForKey(raw, ['email', 'e-mail', 'mail'], 3);
  if (emailValue && typeof emailValue === 'string' && EMAIL_REGEX.test(emailValue)) {
    return emailValue;
  }

  return undefined;
}

// ==================== PHONE EXTRACTION ====================

/**
 * Lista de caminhos comuns para telefone (ordenados por prioridade)
 */
const PHONE_PATHS = [
  'guestPhone',
  'phone',
  'mobile',
  'guest.phone',
  'guest.mobile',
  'guest.contact.phone',
  'guest.contactInfo.phone',
  'booking.guest.phone',
  'booking.guestPhone',
  'channelData.guestPhone',
  'channelData.phone',
  'guestsDetails.phone',
  'guestsDetails.phoneNumber',
  'guestsDetails.telephone',
  'guestsDetails.contactPhone',
  'guestsDetails.mobile',
  'guestsDetails.list[0].phone',
  'guestsDetails.list[0].mobile',
  'contact.phone',
  'contactInfo.phone',
  'whatsapp',
  'cell',
  'telephone',
];

/**
 * Valida se uma string parece ser um telefone
 * - Entre 8 e 15 dígitos
 * - Pode ter + no início (internacional)
 * - Pode ter espaços, parênteses, hífens
 */
function isValidPhone(value: string): boolean {
  // Remove tudo exceto dígitos e +
  const digits = value.replace(/[^\d+]/g, '');
  
  // Deve ter entre 8 e 15 dígitos (internacional)
  const digitCount = digits.replace('+', '').length;
  
  return digitCount >= 8 && digitCount <= 15;
}

/**
 * Formata telefone de objeto { countryCode, number } para string
 */
function formatPhoneFromObject(obj: any): string | undefined {
  if (obj.countryCode && obj.number) {
    const cc = String(obj.countryCode).replace(/[^\d]/g, '');
    const num = String(obj.number).replace(/[^\d]/g, '');
    return `+${cc} ${num}`;
  }
  if (obj.number) {
    return String(obj.number);
  }
  return undefined;
}

/**
 * Extrai telefone de um objeto, tentando múltiplos caminhos e deep search
 */
export function extractGuestPhone(raw: any): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  // 1. Tentar paths comuns primeiro
  for (const path of PHONE_PATHS) {
    const value = getValueByPath(raw, path);
    
    // Se for objeto com countryCode/number
    if (value && typeof value === 'object') {
      const formatted = formatPhoneFromObject(value);
      if (formatted && isValidPhone(formatted)) {
        return formatted;
      }
    }
    
    // Se for string direta
    if (value && typeof value === 'string' && isValidPhone(value)) {
      return value;
    }
  }

  // 2. Deep search restrito (apenas chaves relacionadas a telefone)
  const phoneValue = deepSearchForKey(
    raw, 
    ['phone', 'tel', 'mobile', 'whats', 'cell', 'telephone', 'celular'], 
    3
  );
  
  if (phoneValue) {
    // Se for objeto
    if (typeof phoneValue === 'object') {
      const formatted = formatPhoneFromObject(phoneValue);
      if (formatted && isValidPhone(formatted)) {
        return formatted;
      }
    }
    
    // Se for string
    if (typeof phoneValue === 'string' && isValidPhone(phoneValue)) {
      return phoneValue;
    }
  }

  return undefined;
}

// ==================== COMBINED EXTRACTION ====================

export interface GuestContactInfo {
  email?: string;
  phone?: string;
}

/**
 * Extrai email e telefone de uma vez
 */
export function extractGuestContact(raw: any): GuestContactInfo {
  return {
    email: extractGuestEmail(raw),
    phone: extractGuestPhone(raw),
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Obtém valor de um objeto por path (ex: 'guest.contact.email')
 * Suporta arrays com [0]
 */
function getValueByPath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    // Suporte para arrays: guest.list[0].email
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current[key];
      if (!Array.isArray(current)) return undefined;
      current = current[parseInt(index, 10)];
    } else {
      current = current[part];
    }

    if (current === undefined || current === null) return undefined;
  }

  return current;
}

/**
 * Busca profunda (DFS) por chaves específicas em um objeto
 * @param obj - Objeto para buscar
 * @param keys - Array de chaves para procurar (case-insensitive)
 * @param maxDepth - Profundidade máxima para evitar loops infinitos
 */
function deepSearchForKey(obj: any, keys: string[], maxDepth: number): any {
  if (!obj || typeof obj !== 'object' || maxDepth <= 0) return undefined;

  const keysLower = keys.map(k => k.toLowerCase());
  const visited = new WeakSet();

  function search(current: any, depth: number): any {
    if (depth > maxDepth || !current || typeof current !== 'object') {
      return undefined;
    }

    // Evitar ciclos
    if (visited.has(current)) return undefined;
    visited.add(current);

    // Verificar chaves do objeto atual
    for (const key of Object.keys(current)) {
      const keyLower = key.toLowerCase();
      
      // Se a chave bate, retornar o valor
      if (keysLower.some(k => keyLower.includes(k))) {
        const value = current[key];
        // Se for primitivo e não vazio, retornar
        if (value && (typeof value === 'string' || typeof value === 'number')) {
          return value;
        }
        // Se for objeto com propriedades úteis, retornar
        if (value && typeof value === 'object') {
          return value;
        }
      }
    }

    // Buscar recursivamente
    for (const key of Object.keys(current)) {
      const value = current[key];
      
      if (value && typeof value === 'object') {
        const result = search(value, depth + 1);
        if (result !== undefined) return result;
      }
    }

    return undefined;
  }

  return search(obj, 0);
}

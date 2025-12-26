/**
 * Generate a random ID string (9 characters, alphanumeric)
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

/**
 * Format date to pt-BR locale string
 */
export const formatDatePtBR = (date: Date | number | string, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', options);
};

/**
 * Format currency to BRL with thousands separator
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Get current datetime-local value for input fields
 */
export const getCurrentDateTimeLocal = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

/**
 * Convert date string to YYYY-MM-DD format
 */
export const toDateKey = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
};

/**
 * Sanitiza string para uso como document ID no Firestore
 * Remove caracteres que causam problemas: / | espaços
 */
function sanitizeFirestoreKey(str: string): string {
  return str
    .replace(/\//g, '-')  // Substitui / por -
    .replace(/\|/g, '-')  // Substitui | por -
    .replace(/\s+/g, '_') // Substitui espaços por _
    .trim();
}

/**
 * Gera uma chave estável para um item de manutenção
 * Usa apenas campos estáveis e determinísticos
 */
export const getMaintenanceItemKey = (item: any): string => {
  // 1. Se é um ticket com ID, usar o ID do ticket
  if (item.id && !('type' in item)) {
    const key = `ticket_${sanitizeFirestoreKey(item.id)}`;
    return key;
  }

  // 2. Se é um checkout automático com reservation
  if ('type' in item && item.type === 'checkout' && item.reservation) {
    const res = item.reservation;

    // SEMPRE usar propertyCode + checkOutDate (campos estáveis)
    // Não depender de id/externalId pois podem não estar sempre presentes
    const checkoutDate = res.checkOutDate.split('T')[0]; // Normalizar para YYYY-MM-DD
    const sanitizedPropertyCode = sanitizeFirestoreKey(res.propertyCode);
    const key = `checkout_${sanitizedPropertyCode}_${checkoutDate}`;

    return key;
  }

  // Fallback genérico (não deveria chegar aqui)
  const hash = simpleHash(JSON.stringify(item));
  return `item_${hash}`;
};

/**
 * Cria hash simples de uma string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

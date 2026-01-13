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
export function sanitizeFirestoreKey(str: string): string {
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
  // 1. Se é um ticket virtual de checkout, retornar o próprio id (já é a key correta)
  if (item._isVirtual && item.isCheckoutTicket && item.id) {
    return item.id;
  }

  // 2. Se é um ticket com ID, usar o ID do ticket
  if (item.id && !('type' in item)) {
    const key = `ticket_${sanitizeFirestoreKey(item.id)}`;
    return key;
  }

  // 3. Se é um checkout automático com reservation
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

/**
 * Mapeia uma reserva de checkout automático para um Ticket virtual
 * (não salva no banco, apenas para exibição no modal de Manutenção)
 */
export const mapReservationToVirtualTicket = (reservation: any): any => {
  const checkoutDate = reservation.checkOutDate.split('T')[0]; // YYYY-MM-DD
  const sanitizedPropertyCode = sanitizeFirestoreKey(reservation.propertyCode);
  const virtualId = `checkout_${sanitizedPropertyCode}_${checkoutDate}`;

  return {
    id: virtualId,
    propertyCode: reservation.propertyCode,
    propertyName: reservation.propertyName || '',
    priority: 'Alta',
    serviceType: 'Limpeza de Check-out',
    description: `Limpeza de check-out automática - Hóspede: ${reservation.guestName || '-'}`,
    desiredDate: checkoutDate,
    scheduledDate: undefined,
    completedDate: undefined,
    guestAuth: false,
    status: 'Aberto',
    assignee: undefined,
    createdBy: 'Automação de Check-out',
    createdByName: 'Automação de Check-out',
    createdAt: reservation.createdAt || Date.now(),
    updatedAt: Date.now(),
    expenses: [],
    reservationId: reservation.id || reservation.externalId,
    isCheckoutTicket: true,
    isPreventive: false,
    isGuestRequest: false,
    category: 'maintenance',
    _isVirtual: true, // Flag interna para identificar que é virtual
    _originalReservation: reservation // Guardar referência à reserva original
  };
};

/**
 * Normaliza um código de propriedade para matching
 * Remove tudo depois do " | " e faz trim
 */
export const normalizePropertyCode = (code: string): string => {
  if (!code) return '';
  // Se tiver " | ", usar somente antes do pipe
  const beforePipe = code.split(' | ')[0];
  return beforePipe.trim();
};

/**
 * Converte qualquer valor de data para formato YYYY-MM-DD no timezone local
 * IMPORTANTE: Usa timezone local para evitar bugs de conversão UTC
 */
export const toDateOnly = (value: any): string => {
  if (!value) return '';

  // Se for string exatamente no formato YYYY-MM-DD, retornar como está
  if (typeof value === 'string') {
    // Regex para YYYY-MM-DD
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnlyRegex.test(value)) {
      return value;
    }

    // Se tiver 'T' (ISO string), converter para Date e formatar no timezone LOCAL
    if (value.includes('T')) {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // String em outro formato: tentar parsear
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  }

  // Se for Date ou timestamp, formatar YYYY-MM-DD no timezone LOCAL
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else {
    return '';
  }

  // Formatar YYYY-MM-DD usando timezone local (NÃO usar toISOString!)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Retorna a chave única para acessar os overrides de uma reserva no Firestore
 * CRÍTICO: Para reservas da API Stays (source === 'Stays'), SEMPRE usar externalId (bookingId)
 * porque o id é gerado dinamicamente e não é estável entre carregamentos
 * IMPORTANTE: Esta função DEVE ser usada em todos os lugares que acessam overrides
 */
export const getReservationOverrideKey = (reservation: any): string => {
  // REGRA CRÍTICA: Para reservas da API Stays, SEMPRE usar externalId (bookingId)
  // porque é o único identificador estável
  if (reservation.source === 'Stays' && reservation.externalId) {
    return sanitizeFirestoreKey(reservation.externalId);
  }

  // Para outras fontes: Prioridade 1: usar reservation.id (preferencial)
  if (reservation.id && reservation.source !== 'Stays') {
    return sanitizeFirestoreKey(reservation.id);
  }

  // Fallback: usar externalId se id não existir
  if (reservation.externalId) {
    return sanitizeFirestoreKey(reservation.externalId);
  }

  // Último fallback: usar id mesmo se for de Stays (não deveria chegar aqui)
  if (reservation.id) {
    return sanitizeFirestoreKey(reservation.id);
  }

  // Se nenhum dos dois existe, lançar erro (não deveria acontecer)
  throw new Error('Reserva sem id ou externalId - impossível gerar chave de override');
};

/**
 * Resolve a reserva correspondente a um ticket de checkout automático
 * Tenta por reservationId primeiro, depois por propertyCode + checkoutDate
 */
export const resolveReservationForCheckoutTicket = (
  ticket: any,
  staysReservations: any[]
): { reservation: any | null; logs: any } => {
  const logs: any = {
    ticketId: ticket.id,
    isCheckoutTicket: ticket.isCheckoutTicket,
    hasReservationId: !!ticket.reservationId,
  };

  // Tentativa 1: por reservationId (se existir)
  // Verificar tanto reservation.id quanto reservation.externalId
  if (ticket.reservationId) {
    const byId = staysReservations.find(r =>
      r.id === ticket.reservationId || r.externalId === ticket.reservationId
    );
    if (byId) {
      logs.method = 'reservationId';
      logs.foundReservationId = byId.id;
      logs.matchedField = byId.id === ticket.reservationId ? 'id' : 'externalId';
      return { reservation: byId, logs };
    }
  }

  // Tentativa 2: por propertyCode + checkoutDate
  // Extrair propertyCode do ticket (pode vir de .propertyCode ou .title)
  const rawPropertyCode = ticket.propertyCode || ticket.title || '';
  const normalizedPropertyCode = normalizePropertyCode(rawPropertyCode);

  // Extrair checkoutDate do ticket (campo "Data Desejada")
  const rawDate = ticket.desiredDate || ticket.scheduledDate || '';
  const normalizedDate = toDateOnly(rawDate);

  logs.rawPropertyCode = rawPropertyCode;
  logs.normalizedPropertyCode = normalizedPropertyCode;
  logs.rawDate = rawDate;
  logs.normalizedDate = normalizedDate;

  if (!normalizedPropertyCode || !normalizedDate) {
    logs.method = 'match_failed_missing_data';
    return { reservation: null, logs };
  }

  // Buscar reserva que tenha o mesmo propertyCode normalizado e checkoutDate
  // Adicionar logs detalhados para debugging
  const candidates: any[] = [];

  staysReservations.forEach(r => {
    const resPropertyCode = normalizePropertyCode(r.propertyCode || '');
    const resCheckoutDate = toDateOnly(r.checkOutDate || '');

    candidates.push({
      id: r.id,
      propertyCode: r.propertyCode,
      normalizedPropertyCode: resPropertyCode,
      checkOutDate: r.checkOutDate,
      normalizedCheckoutDate: resCheckoutDate,
      matchesPropertyCode: resPropertyCode === normalizedPropertyCode,
      matchesDate: resCheckoutDate === normalizedDate,
      isMatch: resPropertyCode === normalizedPropertyCode && resCheckoutDate === normalizedDate
    });
  });

  logs.candidatesCount = staysReservations.length;
  logs.matchingCandidates = candidates.filter(c => c.isMatch);

  const byMatch = staysReservations.find(r => {
    const resPropertyCode = normalizePropertyCode(r.propertyCode || '');
    const resCheckoutDate = toDateOnly(r.checkOutDate || '');
    return resPropertyCode === normalizedPropertyCode && resCheckoutDate === normalizedDate;
  });

  if (byMatch) {
    logs.method = 'propertyCode_and_date';
    logs.foundReservationId = byMatch.id;
    logs.foundReservationExternalId = byMatch.externalId;
    return { reservation: byMatch, logs };
  }

  logs.method = 'not_found';
  logs.debugCandidates = candidates.slice(0, 5); // Primeiros 5 para debugging
  return { reservation: null, logs };
};

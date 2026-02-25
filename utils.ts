import { Reservation, ReservationStatus } from './types';

/**
 * Generate a random ID string (9 characters, alphanumeric)
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

/**
 * TIMEZONE DO BRASIL para todas as operações de data
 */
const BRAZIL_TZ = 'America/Sao_Paulo';

/**
 * Converte string de data YYYY-MM-DD para Date no timezone do Brasil (meio-dia)
 * Evita problemas de timezone ao interpretar datas como strings
 */
export const parseLocalDate = (dateStr: string): Date => {
  // Força interpretação como meio-dia no timezone do Brasil
  // Evita que "2026-01-14" seja interpretado como UTC 00:00
  return new Date(dateStr + 'T12:00:00-03:00');
};

/**
 * Retorna a data de HOJE no timezone do Brasil (sem hora)
 */
export const getTodayBrazil = (): Date => {
  const now = new Date();
  // Converte para string no formato YYYY-MM-DD e depois para Date do Brasil
  const dateStr = now.toLocaleDateString('en-CA'); // 'en-CA' retorna YYYY-MM-DD
  return parseLocalDate(dateStr);
};

/**
 * Retorna a data de AMANHÃ no timezone do Brasil (sem hora)
 */
export const getTomorrowBrazil = (): Date => {
  const today = getTodayBrazil();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

/**
 * Verifica se uma data (string ou Date) é HOJE no timezone do Brasil
 */
export const isToday = (date: string | Date): boolean => {
  const dateToCheck = typeof date === 'string' ? parseLocalDate(date) : date;
  const today = getTodayBrazil();
  return dateToCheck.toDateString() === today.toDateString();
};

/**
 * Retorna o baseline (marco temporal) para detecção de tickets atrasados.
 * Task 3: Baseline fixo em 01/02/2026 (go-live) para evitar backlog antigo
 * mas considerar todos os chamados do mês corrente.
 * 
 * @returns Date objeto representando 2026-02-01 00:00:00 (timezone do Brasil)
 */
export const getMaintenanceOverdueBaseline = (): Date => {
  return new Date('2026-02-01T00:00:00-03:00');
};

/**
 * Task 6: Normaliza nome de hóspede para agrupamento consistente
 * Remove acentos, converte para lowercase, normaliza espaços
 * Garante que variações do mesmo nome sejam tratadas como único hóspede
 */
export const normalizeGuestName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' '); // Normaliza múltiplos espaços em um só
};

/**
 * Verifica se uma data (string ou Date) é AMANHÃ no timezone do Brasil
 */
export const isTomorrow = (date: string | Date): boolean => {
  const dateToCheck = typeof date === 'string' ? parseLocalDate(date) : date;
  const tomorrow = getTomorrowBrazil();
  return dateToCheck.toDateString() === tomorrow.toDateString();
};

/**
 * Format date to pt-BR locale string (com timezone correto)
 */
export const formatDatePtBR = (date: Date | number | string, options?: Intl.DateTimeFormatOptions): string => {
  let d: Date;
  
  if (typeof date === 'string') {
    // Se for string no formato YYYY-MM-DD, usa parseLocalDate
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      d = parseLocalDate(date);
    } else {
      d = new Date(date);
    }
  } else if (typeof date === 'number') {
    d = new Date(date);
  } else {
    d = date;
  }
  
  return d.toLocaleDateString('pt-BR', options);
};

/**
 * Format time to HH:mm format in Brazil timezone
 * Usado para exibir check-in/check-out times
 */
export const formatTimeBrazil = (time?: string | null): string => {
  if (!time) return '--:--';

  // Se já está no formato HH:mm, retornar direto
  if (/^\d{2}:\d{2}/.test(time)) {
    return time.slice(0, 5);
  }

  // Se for ISO string ou timestamp, parsear e formatar
  const parsed = new Date(time);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('pt-BR', {
      timeZone: BRAZIL_TZ,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return time;
};

/**
 * Format date and time together: dd/mm/yyyy HH:mm
 * Usado para exibir check-in/check-out completo nos cards de Manutenção
 */
export const formatDateTimeCheckIn = (date: string, time?: string): string => {
  const dateFormatted = formatDatePtBR(date);
  const timeFormatted = formatTimeBrazil(time);
  return `${dateFormatted} ${timeFormatted}`;
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

/**
 * Determina as classes de cor do card de reserva baseado em prioridade:
 * 1. Problema (vermelho) - maior prioridade
 * 2. Atenção (roxo) - média prioridade
 * 3. Status padrão (verde/laranja/azul) - menor prioridade
 * 
 * Retorna objeto com classes CSS para background, texto e borda
 */
export interface CardColorClasses {
  bg: string;
  text: string;
  border: string;
  bgHover: string;
}

export const getReservationCardColors = (
  hasProblema: boolean,
  hasAtencao: boolean,
  status: 'checkin' | 'checkout' | 'inhouse' | 'default'
): CardColorClasses => {
  // Prioridade 1: Problema
  if (hasProblema) {
    return {
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-200',
      bgHover: 'hover:bg-red-100'
    };
  }

  // Prioridade 2: Atenção
  if (hasAtencao) {
    return {
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      border: 'border-purple-200',
      bgHover: 'hover:bg-purple-100'
    };
  }

  // Prioridade 3: Status padrão
  switch (status) {
    case 'checkin':
      return {
        bg: 'bg-green-50',
        text: 'text-green-900',
        border: 'border-green-200',
        bgHover: 'hover:bg-green-100'
      };
    case 'checkout':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-900',
        border: 'border-orange-200',
        bgHover: 'hover:bg-orange-100'
      };
    case 'inhouse':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        border: 'border-blue-200',
        bgHover: 'hover:bg-blue-100'
      };
    default:
      return {
        bg: 'bg-white',
        text: 'text-gray-900',
        border: 'border-gray-200',
        bgHover: 'hover:bg-gray-50'
      };
  }
};

// ==================== TICKET STATUS HELPERS ====================

/**
 * Task 7: Filtra responsáveis válidos (remove 'Não atribuído' e valores vazios)
 */
export const getValidAssignees = (ticket: { assignees?: string[]; assignee?: string }): string[] => {
  const assignees = ticket.assignees || (ticket.assignee ? [ticket.assignee] : []);
  return assignees.filter(a => a && a.trim() !== '' && a !== 'Não atribuído');
};

/**
 * Task 7: Calcula o status global do ticket baseado nas regras de negócio
 * 
 * Regras:
 * - OPEN: sem assignees válidos
 * - ASSIGNED: tem assignees E scheduledDate (ETA)
 * - ON_THE_WAY: status explícito "A caminho"
 * - IN_PROGRESS: status explícito "Em Andamento"
 * - DONE: status explícito "Concluído"
 * 
 * Compatibilidade: mantém status explícito se já estiver definido como ON_THE_WAY, IN_PROGRESS ou DONE
 */
export const computeTicketGlobalStatus = (ticket: {
  status: any;
  assignees?: string[];
  assignee?: string;
  scheduledDate?: string;
}): any => {
  const TicketStatus = {
    OPEN: 'Aberto',
    ASSIGNED: 'Atribuído',
    ON_THE_WAY: 'A caminho',
    IN_PROGRESS: 'Em Andamento',
    DONE: 'Concluído'
  };

  // Se já está em status final/intermediário explícito, manter
  if (ticket.status === TicketStatus.ON_THE_WAY) return TicketStatus.ON_THE_WAY;
  if (ticket.status === TicketStatus.IN_PROGRESS) return TicketStatus.IN_PROGRESS;
  if (ticket.status === TicketStatus.DONE) return TicketStatus.DONE;

  // Verificar se tem assignees válidos
  const validAssignees = getValidAssignees(ticket);
  
  // Se não tem assignees válidos, é OPEN
  if (validAssignees.length === 0) {
    return TicketStatus.OPEN;
  }
  
  // Se tem assignees E scheduledDate, é ASSIGNED (se ainda não iniciou)
  if (validAssignees.length > 0 && ticket.scheduledDate) {
    return ticket.status === TicketStatus.ASSIGNED || ticket.status === TicketStatus.OPEN
      ? TicketStatus.ASSIGNED
      : ticket.status;
  }
  
  // Fallback: manter status atual ou OPEN
  return ticket.status || TicketStatus.OPEN;
};

/**
 * Task 7: Valida se pode transicionar entre status
 */
export const canTransitionStatus = (from: string, to: string): { valid: boolean; reason?: string } => {
  const TicketStatus = {
    OPEN: 'Aberto',
    ASSIGNED: 'Atribuído',
    ON_THE_WAY: 'A caminho',
    IN_PROGRESS: 'Em Andamento',
    DONE: 'Concluído'
  };

  // OPEN → ASSIGNED (quando atribuir responsável)
  if (from === TicketStatus.OPEN && to === TicketStatus.ASSIGNED) {
    return { valid: true };
  }

  // ASSIGNED → ON_THE_WAY
  if (from === TicketStatus.ASSIGNED && to === TicketStatus.ON_THE_WAY) {
    return { valid: true };
  }

  // ON_THE_WAY → IN_PROGRESS
  if (from === TicketStatus.ON_THE_WAY && to === TicketStatus.IN_PROGRESS) {
    return { valid: true };
  }

  // ASSIGNED → IN_PROGRESS (permite pular "A caminho" para compatibilidade)
  if (from === TicketStatus.ASSIGNED && to === TicketStatus.IN_PROGRESS) {
    return { valid: true };
  }

  // OPEN → IN_PROGRESS (compatibilidade com fluxo antigo)
  if (from === TicketStatus.OPEN && to === TicketStatus.IN_PROGRESS) {
    return { valid: true };
  }

  // IN_PROGRESS → DONE
  if (from === TicketStatus.IN_PROGRESS && to === TicketStatus.DONE) {
    return { valid: true };
  }

  // Qualquer status pode voltar para DONE
  if (to === TicketStatus.DONE) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Transição inválida de "${from}" para "${to}"`
  };
};

/**
 * Task 7: Retorna classes CSS para badge de status
 */
export const getStatusBadgeClass = (status: string): string => {
  const TicketStatus = {
    OPEN: 'Aberto',
    ASSIGNED: 'Atribuído',
    ON_THE_WAY: 'A caminho',
    IN_PROGRESS: 'Em Andamento',
    DONE: 'Concluído'
  };

  switch (status) {
    case TicketStatus.OPEN:
      return 'bg-red-50 text-red-700 border-red-100';
    case TicketStatus.ASSIGNED:
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case TicketStatus.ON_THE_WAY:
      return 'bg-purple-50 text-purple-700 border-purple-100';
    case TicketStatus.IN_PROGRESS:
      return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    case TicketStatus.DONE:
      return 'bg-green-50 text-green-700 border-green-100';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

/**
 * 🗺️ Sprint 3 - Task 5: Helper unificado para cálculo de ocupação "AGORA"
 * 
 * Garante consistência entre Mapa e Guest & CRM ao calcular:
 * - Check-in de HOJE
 * - Check-out de HOJE
 * - In-house AGORA
 * - Ocupados (união sem duplicação)
 * - Vazios (imóveis sem ocupação)
 * 
 * Usa timezone do Brasil e mesma lógica de data/hora em todos os módulos.
 * 
 * @param reservations Lista de reservas (Stays API)
 * @param propertyCode Código do imóvel (opcional, para filtrar)
 * @returns Objeto com Sets de IDs de reservas por categoria
 */
export interface OccupancyNow {
  checkinToday: Set<string>;      // Reservas com check-in hoje
  checkoutToday: Set<string>;     // Reservas com check-out hoje
  inhouseNow: Set<string>;        // Reservas in-house agora
  occupied: Set<string>;          // União de todas acima (sem duplicação)
  vacant: Set<string>;            // Imóveis sem ocupação (requer lista de properties)
  
  // Metadata para debug
  todayTime: number;
  now: number;
}

export const computeOccupancyNow = (
  reservations: Reservation[],
  propertyCode?: string
): OccupancyNow => {
  // Usar timezone do Brasil (consistente com Guest & CRM)
  const today = getTodayBrazil();
  const todayTime = today.getTime();
  const now = Date.now();

  const checkinToday = new Set<string>();
  const checkoutToday = new Set<string>();
  const inhouseNow = new Set<string>();

  // Filtrar reservas canceladas
  const validReservations = reservations.filter(r => 
    r.status !== ReservationStatus.CANCELED &&
    (!propertyCode || r.propertyCode === propertyCode)
  );

  validReservations.forEach(r => {
    // Usar parseLocalDate para garantir timezone correto
    const cin = parseLocalDate(r.checkInDate);
    const cout = parseLocalDate(r.checkOutDate);
    const cinTime = cin.getTime();
    const coutTime = cout.getTime();

    // Check-in HOJE = checkInDate é hoje
    if (cinTime === todayTime) {
      checkinToday.add(r.id);
    }

    // Check-out HOJE = checkOutDate é hoje
    if (coutTime === todayTime) {
      checkoutToday.add(r.id);
    }

    // In-house AGORA = checkIn <= hoje < checkOut
    // Nota: Usamos todayTime (não now) porque estamos trabalhando com datas sem hora
    if (cinTime <= todayTime && coutTime >= todayTime) {
      inhouseNow.add(r.id);
    }
  });

  // Ocupados = união de todos (sem duplicação graças ao Set)
  const occupied = new Set([
    ...checkinToday,
    ...checkoutToday,
    ...inhouseNow
  ]);

  // Vazios será calculado no componente que tem acesso à lista de properties
  const vacant = new Set<string>();

  return {
    checkinToday,
    checkoutToday,
    inhouseNow,
    occupied,
    vacant,
    todayTime,
    now
  };
};

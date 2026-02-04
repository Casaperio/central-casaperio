/**
 * Data Mapper for Stays API
 * Converts stays-api response types to centralcasape Reservation type
 */

import { Reservation, ReservationStatus } from '../types';
import {
  GuestData,
  DayData,
  CalendarReservation,
  CalendarUnit,
  CalendarResponse,
  DashboardResponse,
} from './staysApiService';
import { extractGuestContact } from '../utils/guestContactExtractors';
import { debugLog } from '../utils/debugLog';

// Daily status type used internally
export type DailyStatus = 'CHECKIN' | 'CHECKOUT' | 'INHOUSE' | 'FUTURE' | 'PAST';

// Extended Reservation type with computed dailyStatus and nights from Stays API
export interface ReservationWithDailyStatus extends Reservation {
  dailyStatus?: DailyStatus;
  currentStatus?: DailyStatus;
  nights?: number;
  platformImage?: string;
}

// Agenda group structure used in Guest module
export interface AgendaGroup {
  date: string;
  label: string;
  isToday: boolean;
  items: ReservationWithDailyStatus[];
}

/**
 * Maps API guest status to dailyStatus
 */
export function mapApiStatusToDailyStatus(status: 'checkin' | 'checkout' | 'staying'): DailyStatus {
  switch (status) {
    case 'checkin':
      return 'CHECKIN';
    case 'checkout':
      return 'CHECKOUT';
    case 'staying':
      return 'INHOUSE';
    default:
      return 'FUTURE';
  }
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Maps dashboard GuestData to Reservation
 */
export function mapGuestToReservation(guest: GuestData): ReservationWithDailyStatus {
  // Task 6: Extração robusta de email e telefone
  const contactInfo = extractGuestContact(guest);
  
  // Task 6 Debug: Log dados de contato da API
  if (contactInfo.email || contactInfo.phone) {
    console.log('📞 [MAPPER-DASHBOARD] Contato extraído:', {
      guestName: guest.guestName,
      email: contactInfo.email,
      phone: contactInfo.phone,
      rawHadEmail: !!guest.guestEmail,
      rawHadPhone: !!guest.guestPhone
    });
  }

  return {
    id: `stays-${guest.id}`,
    externalId: guest.bookingId,
    source: 'Stays',
    channel: guest.platform || 'Direto',
    propertyCode: guest.apartmentCode,
    propertyName: undefined,
    guestName: guest.guestName,
    guestEmail: contactInfo.email, // Task 6: Usando extrator robusto
    guestPhone: contactInfo.phone, // Task 6: Usando extrator robusto
    language: undefined,
    checkInDate: guest.checkInDate,
    checkOutDate: guest.checkOutDate,
    earlyCheckIn: undefined,
    lateCheckOut: undefined,
    guestCount: guest.guestCount,
    hasBabies: false,
    flightInfo: undefined,
    flightData: undefined,
    totalValue: undefined,
    currency: undefined,
    roomConfig: undefined,
    notes: undefined,
    specialAttention: false,
    problemReported: false,
    expenses: [],
    docsSent: false,
    docsSentToBuilding: false,
    status: ReservationStatus.CONFIRMED,
    maintenanceAck: { seen: false },
    channelRating: undefined,
    channelReview: undefined,
    responsibleName: undefined,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // Computed daily status from API
    dailyStatus: mapApiStatusToDailyStatus(guest.status),
    // Stays API data
    nights: guest.nights,
    platformImage: guest.platformImage,
  };
}

/**
 * Maps calendar CalendarReservation to Reservation
 */
export function mapCalendarReservationToReservation(
  calRes: CalendarReservation,
  unitCode: string
): ReservationWithDailyStatus {
  // Task 6: Extração robusta de email e telefone
  const contactInfo = extractGuestContact(calRes);
  
  // Task 6 Debug: Log dados de contato da API
  if (contactInfo.email || contactInfo.phone) {
    console.log('📞 [MAPPER-CALENDAR] Contato extraído:', {
      guestName: calRes.guestName,
      email: contactInfo.email,
      phone: contactInfo.phone,
      rawHadEmail: !!calRes.guestEmail,
      rawHadPhone: !!calRes.guestPhone
    });
  }

  return {
    id: `stays-${calRes.id}`,
    externalId: calRes.bookingId,
    source: 'Stays',
    channel: calRes.platform || 'Direto',
    propertyCode: unitCode,
    propertyName: undefined,
    guestName: calRes.guestName,
    guestEmail: contactInfo.email, // Task 6: Usando extrator robusto
    guestPhone: contactInfo.phone, // Task 6: Usando extrator robusto
    language: undefined,
    checkInDate: calRes.startDate,
    checkOutDate: calRes.endDate,
    earlyCheckIn: undefined,
    lateCheckOut: undefined,
    guestCount: calRes.guestCount,
    hasBabies: calRes.babies > 0,
    flightInfo: undefined,
    flightData: undefined,
    totalValue: calRes.priceValue ?? undefined,
    currency: calRes.priceCurrency ?? undefined,
    roomConfig: undefined,
    notes: undefined,
    specialAttention: false,
    problemReported: false,
    expenses: [],
    docsSent: false,
    docsSentToBuilding: false,
    status: ReservationStatus.CONFIRMED,
    maintenanceAck: { seen: false },
    channelRating: undefined,
    channelReview: undefined,
    responsibleName: undefined,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // Daily status will be computed based on dates
    dailyStatus: undefined,
    // Stays API data
    nights: calRes.nights,
    platformImage: calRes.platformImage,
  };
}

/**
 * Formats date label for agenda groups
 */
function formatDateLabel(dateStr: string, isToday: boolean, isTomorrow: boolean): string {
  if (isToday) return 'Hoje';
  if (isTomorrow) return 'Amanhã';

  const date = new Date(dateStr + 'T12:00:00');
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
}

/**
 * Converts DayData to AgendaGroup format
 */
export function mapDayDataToAgendaGroup(dayData: DayData, index: number): AgendaGroup {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayDate = new Date(dayData.date + 'T12:00:00');
  dayDate.setHours(0, 0, 0, 0);

  const isTomorrow = dayDate.getTime() === tomorrow.getTime();

  return {
    date: dayData.date,
    label: formatDateLabel(dayData.date, dayData.isToday, isTomorrow),
    isToday: dayData.isToday,
    items: dayData.guests.map(guest => mapGuestToReservation(guest)),
  };
}

/**
 * Generates array of date strings for the next 7 days starting from today
 */
function generateSevenDays(): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }

  return days;
}

/**
 * Status priority for sorting: CHECKOUT first (most urgent), then CHECKIN, then INHOUSE
 */
function getStatusPriority(status: DailyStatus | undefined): number {
  switch (status) {
    case 'CHECKOUT':
      return 0; // Highest priority - appears first
    case 'CHECKIN':
      return 1;
    case 'INHOUSE':
      return 2;
    default:
      return 3;
  }
}

/**
 * Sorts reservations by status: CHECKOUT first, then CHECKIN, then INHOUSE
 */
function sortByStatus(items: ReservationWithDailyStatus[]): ReservationWithDailyStatus[] {
  return [...items].sort((a, b) => {
    const priorityA = getStatusPriority(a.dailyStatus);
    const priorityB = getStatusPriority(b.dailyStatus);
    return priorityA - priorityB;
  });
}

/**
 * Converts full dashboard weekData to agenda groups
 * Returns ALL days from backend weekData (typically ±365 days = 731 days)
 * Items are sorted by status: CHECKOUT first, then CHECKIN, then INHOUSE
 */
export function mapDashboardToAgendaGroups(dashboard: DashboardResponse): AgendaGroup[] {
  console.log('🔄 [MAPPER] Criando agenda groups de weekData');
  console.log('  📊 Total de dias no weekData:', dashboard.weekData.length);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateStr(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrow);

  // Map ALL days from backend weekData to agenda groups
  const groups = dashboard.weekData.map((dayData) => {
    const dateStr = dayData.date;
    const isToday = dateStr === todayStr;
    const isTomorrow = dateStr === tomorrowStr;

    // Map guests to reservations, sorted by status (CHECKOUT first)
    const mappedItems = dayData.guests.map(guest => mapGuestToReservation(guest));

    return {
      date: dateStr,
      label: formatDateLabel(dateStr, isToday, isTomorrow),
      isToday,
      items: sortByStatus(mappedItems),
    };
  });

  console.log('  ✅ Grupos criados:', groups.length);
  console.log('  📅 Primeiro grupo:', groups[0]?.date);
  console.log('  📅 Último grupo:', groups[groups.length - 1]?.date);

  return groups;
}

/**
 * Converts calendar response to flat array of reservations
 */
export function mapCalendarToReservations(calendar: CalendarResponse): ReservationWithDailyStatus[] {
  return calendar.units.flatMap(unit =>
    unit.reservations.map(res => mapCalendarReservationToReservation(res, unit.code))
  );
}

/**
 * Helper to compute daily status from dates (for calendar reservations)
 */
export function computeDailyStatus(checkInDate: string, checkOutDate: string): DailyStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(checkInDate + 'T12:00:00');
  checkIn.setHours(0, 0, 0, 0);

  const checkOut = new Date(checkOutDate + 'T12:00:00');
  checkOut.setHours(0, 0, 0, 0);

  if (checkIn.getTime() === today.getTime()) {
    return 'CHECKIN';
  }
  if (checkOut.getTime() === today.getTime()) {
    return 'CHECKOUT';
  }
  if (checkIn < today && checkOut > today) {
    return 'INHOUSE';
  }
  if (checkOut < today) {
    return 'PAST';
  }
  return 'FUTURE';
}

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
 * Maps dashboard GuestData to Reservation
 */
export function mapGuestToReservation(guest: GuestData): ReservationWithDailyStatus {
  return {
    id: `stays-${guest.id}`,
    externalId: guest.bookingId,
    source: 'Stays',
    channel: guest.platform || 'Direto',
    propertyCode: guest.apartmentCode,
    propertyName: undefined,
    guestName: guest.guestName,
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
  return {
    id: `stays-${calRes.id}`,
    externalId: calRes.bookingId,
    source: 'Stays',
    channel: calRes.platform || 'Direto',
    propertyCode: unitCode,
    propertyName: undefined,
    guestName: calRes.guestName,
    language: undefined,
    checkInDate: calRes.startDate,
    checkOutDate: calRes.endDate,
    earlyCheckIn: undefined,
    lateCheckOut: undefined,
    guestCount: calRes.guestCount,
    hasBabies: calRes.babies > 0,
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
 * ALWAYS returns exactly 7 days starting from today
 * Items are sorted by status: CHECKOUT first, then CHECKIN, then INHOUSE
 */
export function mapDashboardToAgendaGroups(dashboard: DashboardResponse): AgendaGroup[] {
  const sevenDays = generateSevenDays();

  // Create a map of API data by date for quick lookup
  const apiDataByDate = new Map<string, DayData>();
  dashboard.weekData.forEach(day => {
    apiDataByDate.set(day.date, day);
  });

  // Generate agenda groups for exactly 7 days starting from today
  return sevenDays.map((dateStr, index) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayDate = new Date(dateStr + 'T12:00:00');
    dayDate.setHours(0, 0, 0, 0);

    const isToday = index === 0;
    const isTomorrow = index === 1;

    // Check if we have API data for this day
    const apiDay = apiDataByDate.get(dateStr);

    if (apiDay) {
      // Use API data, sorted by status (CHECKOUT first)
      const mappedItems = apiDay.guests.map(guest => mapGuestToReservation(guest));
      return {
        date: dateStr,
        label: formatDateLabel(dateStr, isToday, isTomorrow),
        isToday,
        items: sortByStatus(mappedItems),
      };
    } else {
      // Create empty day
      return {
        date: dateStr,
        label: formatDateLabel(dateStr, isToday, isTomorrow),
        isToday,
        items: [],
      };
    }
  });
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

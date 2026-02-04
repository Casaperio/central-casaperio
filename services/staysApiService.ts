/**
 * Stays API Service
 * Communicates with the stays-api backend for booking data
 * Adapted from stays-observator/src/services/api/backendApi.ts
 */

import { env } from '../env';

// In development, use Vite proxy; in production, use env variable
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '' : (env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
const API_KEY = env.VITE_API_KEY || '';

/**
 * Makes an authenticated request to the backend API
 */
async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  let url: string;

  if (isDev) {
    // Use relative URL for Vite proxy
    url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
  } else {
    // Use full URL in production
    const fullUrl = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        fullUrl.searchParams.append(key, value);
      });
    }
    url = fullUrl.toString();
  }

  console.log('🌐 Fetching from:', url, '| isDev:', isDev);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => null);
    throw new Error(
      `API Error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
    );
  }

  const data = await response.json() as T;

  // Debug: log calendar responses
  if (endpoint.includes('/calendar')) {
    console.log('🌐 Calendar response received, first unit:', (data as any).units?.[0]);
  }

  return data;
}

// ============ Dashboard Types ============

export interface GuestData {
  id: string;
  bookingId: string;
  guestName: string;
  guestEmail: string | null; // Task 6
  guestPhone: string | null; // Task 6
  apartmentCode: string;
  status: 'checkin' | 'checkout' | 'staying';
  checkInDate: string;
  checkInTime: string | null;
  checkOutDate: string;
  checkOutTime: string | null;
  guestCount: number;
  nights: number;
  platform: string | null;
  platformImage: string;
}

export interface DayData {
  date: string;
  dayOfWeek: string;
  isToday: boolean;
  guests: GuestData[];
}

export interface OccupancyStats {
  available: number;
  occupied: number;
  total: number;
}

export interface ReservationOrigin {
  name: string;
  count: number;
  color: string;
}

export interface OccupancyTrendPoint {
  date: string;
  rate: number;
}

export interface DashboardResponse {
  weekData: DayData[];
  occupancyStats: OccupancyStats;
  occupancyNext30Days: OccupancyStats;
  reservationOrigins: ReservationOrigin[];
  occupancyTrend: OccupancyTrendPoint[];
  availableUnits: string[];
  lastSyncAt: string | null;
  syncStatus: string;
}

// ============ Calendar Types ============

export interface CalendarReservation {
  id: string;
  bookingId: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  type: 'reserved' | 'blocked' | 'provisional';
  startDate: string;
  endDate: string;
  platform: string | null;
  platformImage: string;
  nights: number;
  guestCount: number;
  adults: number;
  children: number;
  babies: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  priceValue: number | null;
  priceCurrency: string | null;
}

export interface CalendarUnit {
  id: string;
  code: string;
  name: string | null;
  reservations: CalendarReservation[];
}

export interface CalendarResponse {
  units: CalendarUnit[];
  lastSyncAt: string | null;
  syncStatus: string;
}

// ============ Sync Types ============

export interface SyncStatus {
  lastSyncAt: string | null;
  status: 'success' | 'error' | 'running' | 'never';
  lastError: string | null;
  bookingsCount: number;
  listingsCount: number;
  durationMs: number;
}

// ============ Financial Types ============

export interface FinancialSummary {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  averageDailyRate: number;
  revPAR: number;
  totalNights: number;
  availableNights: number;
  occupancyRate: number;
  reservationsCount: number;
  extraServicesRevenue: number;
  period: {
    from: string;
    to: string;
  };
}

export interface PropertyFinancials {
  propertyCode: string;
  propertyName: string | null;
  revenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  bookingsCount: number;
  nights: number;
  averageDailyRate: number;
  occupancyRate: number;
}

export interface ChannelFinancials {
  channel: string;
  revenue: number;
  bookingsCount: number;
  averageValue: number;
  percentage: number;
}

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
  bookings: number;
}

export interface FinancialPanelData {
  // Receita Mês Atual
  currentMonthRevenue: number;
  currentMonthReservations: number;
  previousMonthRevenue: number;
  monthGrowthPercent: number;

  // Receita YTD
  ytdRevenue: number;
  previousYearYtdRevenue: number;
  ytdGrowthPercent: number;

  // Ticket Médio (ADR)
  averageTicket: number;

  // Projeção Próximo Mês
  nextMonthProjection: number;
  projectionMethod: string;

  // Metadata
  calculatedAt: string;
  period: {
    currentMonth: string;
    previousMonth: string;
    ytdStart: string;
    ytdEnd: string;
  };
}

/**
 * Detailed financial data for a single reservation
 */
export interface ReservationFinancialDetails {
  // Identification
  reservationId: string;
  bookingCode: string;
  propertyCode: string;
  propertyName: string | null;
  guestName: string;

  // Dates
  checkInDate: string;
  checkOutDate: string;
  nights: number;

  // Channel
  channel: string;
  platform: string | null;

  // Financial Data
  pricePerNight: number;           // Valor por noite
  reserveTotal: number;            // Total da reserva
  baseAmountForwarding: number;    // Base de cálculo do Imp
  sellPriceCorrected: number;      // Preço de venda corrigido
  companyCommission: number;       // Comissão da empresa
  buyPrice: number;                // Preço de compra
  totalForwardFee: number;         // Total de taxas

  // Fees breakdown
  cleaningFee: number;             // Taxa de Limpeza
  ownerFees: Array<{               // Taxas do proprietário
    name: string;
    value: number;
  }>;
  otherFees: Array<{               // Outras taxas
    name: string;
    value: number;
  }>;

  // Currency
  currency: string;
}

// ============ Statistics Types ============

export interface BookingStatistics {
  totalBookings: number;
  confirmedBookings: number;
  canceledBookings: number;
  blockedDates: number;
  cancellationRate: number;
  averageLeadTime: number;
  averageStayLength: number;
  totalGuests: number;
  averageGuestsPerBooking: number;
  bySource: Record<string, number>;
  byMonth: Record<string, number>;
  byDayOfWeek: Record<string, number>;
}

export interface OccupancyData {
  propertyCode: string;
  propertyName: string | null;
  totalNights: number;
  occupiedNights: number;
  blockedNights: number;
  availableNights: number;
  occupancyRate: number;
  blockRate: number;
}

export interface CancellationData {
  totalCancellations: number;
  cancellationRate: number;
  averageAdvanceNotice: number;
  byChannel: Record<string, number>;
  byMonth: Record<string, number>;
  revenueImpact: number;
}

// ============ Guest Types ============

export interface ReturningGuest {
  clientId: string;
  name: string;
  email?: string;
  country?: string;
  language?: string;
  totalStays: number;
  totalNights: number;
  totalRevenue: number;
  firstStay: string;
  lastStay: string;
  properties: string[];
}

export interface GuestDemographics {
  byCountry: Record<string, number>;
  byLanguage: Record<string, number>;
  returningGuestsRate: number;
  averageGroupSize: number;
  withChildren: number;
  withBabies: number;
}

export interface GuestSummary {
  totalUniqueGuests: number;
  totalBookings: number;
  returningGuests: number;
  returningGuestsRate: number;
  topGuests: Array<{ name: string; stays: number; revenue: number }>;
}

// ============ API Functions ============

/**
 * Fetches dashboard data from the backend
 * Data comes pre-transformed and ready to display
 */
export async function getDashboard(): Promise<DashboardResponse> {
  return fetchApi<DashboardResponse>('/api/v1/dashboard');
}

/**
 * Fetches calendar data from the backend
 * @param from Start date (YYYY-MM-DD) - defaults to 1 month ago
 * @param to End date (YYYY-MM-DD) - defaults to 3 months from now
 */
export async function getCalendar(from?: string, to?: string): Promise<CalendarResponse> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;

  return fetchApi<CalendarResponse>('/api/v1/calendar', params);
}

/**
 * Gets the current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  return fetchApi<SyncStatus>('/api/v1/sync/status');
}

/**
 * Triggers a manual sync
 */
export async function triggerSync(): Promise<{ message: string; timestamp: string }> {
  const url = isDev ? '/api/v1/sync/trigger' : `${API_BASE_URL}/api/v1/sync/trigger`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => null);
    throw new Error(
      `API Error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
    );
  }

  return response.json();
}

/**
 * Checks if the backend API is available
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const url = isDev ? '/health' : `${API_BASE_URL}/health`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

// ============ Financial API Functions ============

/**
 * Gets financial summary for a period
 */
export async function getFinancialSummary(from?: string, to?: string): Promise<FinancialSummary> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fetchApi<FinancialSummary>('/api/v1/financials/summary', params);
}

/**
 * Gets financial data by property
 */
export async function getFinancialsByProperty(from?: string, to?: string): Promise<{
  properties: PropertyFinancials[];
  period: { from: string; to: string };
}> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fetchApi('/api/v1/financials/by-property', params);
}

/**
 * Gets financial data by channel
 */
export async function getFinancialsByChannel(from?: string, to?: string): Promise<{
  channels: ChannelFinancials[];
  period: { from: string; to: string };
}> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fetchApi('/api/v1/financials/by-channel', params);
}

/**
 * Gets monthly revenue trend
 */
export async function getRevenueTrend(): Promise<{ trend: RevenueTrendPoint[] }> {
  return fetchApi('/api/v1/financials/trend');
}

/**
 * Gets consolidated financial panel data for KPIs
 * Returns: currentMonthRevenue, previousMonthRevenue, YTD, comparisons, projections
 */
export async function getFinancialPanel(): Promise<FinancialPanelData> {
  return fetchApi<FinancialPanelData>('/api/v1/financials/panel');
}

/**
 * Force refresh financial panel data
 */
export async function refreshFinancialPanel(): Promise<FinancialPanelData & { refreshedAt: string }> {
  const url = isDev ? '/api/v1/financials/panel/refresh' : `${API_BASE_URL}/api/v1/financials/panel/refresh`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => null);
    throw new Error(
      `API Error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
    );
  }

  return response.json();
}

/**
 * Gets detailed financial data for reservations
 * Returns complete price breakdown including fees, commissions, and owner payments
 */
export async function getDetailedFinancials(from?: string, to?: string): Promise<{
  reservations: ReservationFinancialDetails[];
  period: { from: string; to: string };
  count: number;
}> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fetchApi('/api/v1/financials/detailed', params);
}

// ============ Statistics API Functions ============

/**
 * Gets booking statistics for a period
 */
export async function getBookingStatistics(from?: string, to?: string): Promise<{
  statistics: BookingStatistics;
  period: { from: string; to: string };
}> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fetchApi('/api/v1/statistics/bookings', params);
}

/**
 * Gets occupancy data by property
 */
export async function getOccupancyByProperty(from?: string, to?: string): Promise<{
  occupancy: OccupancyData[];
  period: { from: string; to: string };
}> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fetchApi('/api/v1/statistics/occupancy', params);
}

/**
 * Gets cancellation analysis
 */
export async function getCancellationAnalysis(from?: string, to?: string): Promise<{
  cancellations: CancellationData;
  period: { from: string; to: string };
}> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fetchApi('/api/v1/statistics/cancellations', params);
}

// ============ Guest API Functions ============

/**
 * Gets guest summary
 */
export async function getGuestSummary(): Promise<GuestSummary> {
  return fetchApi<GuestSummary>('/api/v1/guests/summary');
}

/**
 * Gets returning guests
 */
export async function getReturningGuests(): Promise<{
  returningGuests: ReturningGuest[];
  total: number;
}> {
  return fetchApi('/api/v1/guests/returning');
}

/**
 * Gets guest demographics
 */
export async function getGuestDemographics(): Promise<GuestDemographics> {
  return fetchApi<GuestDemographics>('/api/v1/guests/demographics');
}

// ============ Unified Types ============

export interface UnifiedSyncInfo {
  lastSyncAt: string | null;
  status: string;
  bookingsCount: number;
  listingsCount: number;
  durationMs: number;
}

export interface UnifiedMeta {
  generatedAt: string;
  queryTimeMs: number;
  bookingsCount: number;
}

export interface UnifiedResponse {
  dashboard: DashboardResponse;
  calendar: CalendarResponse;
  sync: UnifiedSyncInfo;
  meta: UnifiedMeta;
}

// ============ Unified API Function ============

/**
 * Fetches all data from the backend in a single call (dashboard + calendar + sync)
 * This is the optimized endpoint that reduces network round-trips
 */
export async function getAllData(from?: string, to?: string): Promise<UnifiedResponse> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;

  return fetchApi<UnifiedResponse>('/api/v1/all-data', params);
}

// ============ Ticket Types ============

export interface TicketStatistics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  doneTickets: number;
  cancelledTickets: number;
  averageResolutionTime: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byAssignee: Record<string, { count: number; avgTime: number }>;
  byProperty: Record<string, number>;
  byMonth: Record<string, number>;
}

// ============ Team Types ============

export interface TeamMemberPerformance {
  userId: string;
  userName: string;
  totalReservations: number;
  currentMonthReservations: number;
  futureReservations: number;
  averageRating: number;
  ratingsCount: number;
  totalRevenue: number;
}

export interface TeamStatistics {
  members: TeamMemberPerformance[];
  distribution: Record<string, number>;
  monthlyComparison: {
    currentMonth: Record<string, number>;
    previousMonth: Record<string, number>;
  };
}

// ============ Ticket API Functions ============

/**
 * Gets ticket statistics for a period
 */
export async function getTicketStatistics(from?: string, to?: string): Promise<TicketStatistics> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fetchApi<TicketStatistics>('/api/v1/tickets/statistics', params);
}

// ============ Team API Functions ============

/**
 * Gets team performance statistics
 */
export async function getTeamStatistics(): Promise<TeamStatistics> {
  return fetchApi<TeamStatistics>('/api/v1/team/statistics');
}

/**
 * Assigns a team member to a reservation
 */
export async function assignResponsible(
  reservationId: string,
  userId: string,
  userName: string
): Promise<{ success: boolean }> {
  const url = isDev ? '/api/v1/team/assign' : `${API_BASE_URL}/api/v1/team/assign`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reservationId, userId, userName }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => null);
    throw new Error(
      `API Error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
    );
  }

  return response.json();
}

/**
 * Adds feedback to a reservation
 */
export async function addFeedback(
  reservationId: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean }> {
  const url = isDev ? '/api/v1/team/feedback' : `${API_BASE_URL}/api/v1/team/feedback`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reservationId, rating, comment }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => null);
    throw new Error(
      `API Error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`
    );
  }

  return response.json();
}

// Export singleton-like API object for convenience
export const staysApiService = {
  getDashboard,
  getCalendar,
  getSyncStatus,
  triggerSync,
  checkHealth,
  // Unified (optimized)
  getAllData,
  // Financials
  getFinancialSummary,
  getFinancialsByProperty,
  getFinancialsByChannel,
  getRevenueTrend,
  getFinancialPanel,
  refreshFinancialPanel,
  getDetailedFinancials,
  // Statistics
  getBookingStatistics,
  getOccupancyByProperty,
  getCancellationAnalysis,
  // Guests
  getGuestSummary,
  getReturningGuests,
  getGuestDemographics,
  // Tickets
  getTicketStatistics,
  // Team
  getTeamStatistics,
  assignResponsible,
  addFeedback,
};

export interface LogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export type ViewMode = 'landing' | 'cards' | 'list' | 'calendar' | 'general-calendar' | 'weekly-planning' | 'admin' | 'stats' | 'settings' | 'profile' | 'logs' | 'reports' | 'history' | 'cms' | 'feedbacks' | 'flights' | 'inventory' | 'office' | 'properties' | 'financial' | 'concierge-cms' | 'guest-crm' | 'map' | 'boards' | 'field-app' | 'messages';

export type AppModule = 'maintenance' | 'concierge' | 'guest' | 'reservations' | 'inventory' | 'office' | 'management' | 'kiosk' | 'boards' | 'field_app';

export enum TicketStatus {
  OPEN = 'Aberto',
  ASSIGNED = 'Atribuído',
  ON_THE_WAY = 'A caminho',
  IN_PROGRESS = 'Em Andamento',
  DONE = 'Concluído'
}

export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  URGENT = 'Urgente'
}

export enum ServiceType {
  MAINTENANCE = 'Manutenção Geral',
  CLEANING = 'Limpeza',
  CHECKOUT_CLEANING = 'Limpeza de Check-out',
  ELECTRICITY = 'Elétrica',
  PLUMBING = 'Hidráulica',
  AIR_CONDITIONING = 'Ar Condicionado',
  INTERNET = 'Wi-Fi / Internet',
  TV = 'TV / Cabo',
  OTHER = 'Outros'
}

export type TicketCategory = 'maintenance' | 'concierge';

export interface ServiceTypeDefinition {
  name: string;
  defaultPrice?: number;
}

export interface AfterHoursRule {
  id: string;
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface AfterHoursConfig {
  enabled: boolean;
  message: string;
  rules: AfterHoursRule[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paymentMethod: string;
  createdAt: number;
  createdBy: string;
}

export interface GuestFeedback {
  id: string;
  propertyCode: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface GuestNote {
  id: string;
  guestKey: string; // Nome normalizado usado como chave
  guestName: string; // Nome original do hóspede
  note: string; // Observações/comentários sobre o hóspede
  updatedAt: number;
  updatedBy: string; // Nome do usuário que atualizou
}

export interface ReservationOverrides {
  id: string; // reservationId ou externalId
  reservationId?: string; // ID da reserva (preferencial)
  externalId?: string; // ID externo (fallback)
  source?: string; // Fonte da reserva ('Stays', 'Manual', etc) - usado para gerar chave correta
  propertyCode: string;
  guestName: string;
  language?: string;
  docsSent?: boolean;
  docsSentToBuilding?: boolean;
  hasChildren?: boolean;
  wantsBedSplit?: boolean;
  earlyCheckIn?: { requested: boolean; time: string; granted: boolean };
  lateCheckOut?: { requested: boolean; time: string; granted: boolean };
  flightInfo?: string;
  roomConfig?: string;
  notes?: string;
  specialAttention?: boolean;
  problemReported?: boolean;
  // Task 41: Maintenance seen status
  maintenanceSeenBy?: string;
  maintenanceSeenAt?: number;
  // Task 40: Assigned guest user (responsável)
  assignedGuestUserId?: string;
  updatedAt: number;
  updatedBy: string;
}

export interface Ticket {
  id: string;
  propertyCode: string;
  propertyName: string;
  priority: string;
  serviceType: string;
  description: string;
  desiredDate: string;
  scheduledDate?: string;
  completedDate?: string;
  guestAuth: boolean;
  status: TicketStatus;
  // Mantém retrocompatibilidade
  assignee?: string;
  // Task 1: Suporte para múltiplos responsáveis (máximo 2)
  assignees?: string[];
  createdBy?: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
  expenses?: Expense[];
  reservationId?: string;
  isCheckoutTicket?: boolean;
  isPreventive?: boolean;
  isGuestRequest?: boolean;
  recurrence?: string;
  category?: TicketCategory;
  guestFeedback?: {
    rating: number;
    comment: string;
    createdAt: number;
  };
  rating?: number;
  ratedAt?: number;
  ratingComment?: string;
  startedAt?: number;
  completionReport?: {
    condition: 'perfect' | 'issues';
    notes?: string;
    photos?: string[]; // base64 strings
  };
  problemReport?: {
    text: string;
    images: string[]; // base64 strings
    createdAt: number;
    createdBy: string;
    createdByName?: string;
  };
  observations?: {
    id: string;
    text: string;
    createdAt: number;
    createdBy: string;
    createdByName?: string;
  }[];
}

export enum ReservationStatus {
  PENDING = 'Pendente',
  CONFIRMED = 'Confirmada',
  CHECKIN = 'Check-in',
  CHECKOUT = 'Check-out',
  CANCELED = 'Cancelada'
}

export interface FlightData {
  number: string;
  status: string;
  estimatedArrival: string;
  airline?: string;
  lastUpdated: number;
}

export interface Reservation {
  id: string;
  externalId?: string;
  source?: string;
  channel?: string;
  propertyCode: string;
  propertyName?: string;
  guestName: string;
  language?: string;
  checkInDate: string;
  checkInTime?: string; // HH:MM format (ex: "15:00")
  checkOutDate: string;
  checkOutTime?: string; // HH:MM format (ex: "11:00")
  earlyCheckIn?: { requested: boolean; time: string; granted: boolean };
  lateCheckOut?: { requested: boolean; time: string; granted: boolean };
  guestCount: number;
  hasBabies: boolean;
  flightInfo?: string;
  flightData?: FlightData;
  totalValue?: number;
  currency?: string;
  roomConfig?: string;
  hasChildren?: boolean;
  wantsBedSplit?: boolean; // Queen/King -> 2 solteiro
  notes?: string;
  specialAttention?: boolean;
  problemReported?: boolean;
  expenses?: Expense[];
  docsSent?: boolean;
  docsSentToBuilding?: boolean;
  status: ReservationStatus;
  maintenanceAck?: { seen: boolean; seenBy?: string; seenAt?: number };
  channelRating?: number;
  channelReview?: string;
  responsibleName?: string;
  history?: { id: string; timestamp: number; user: string; action: string }[];
  createdAt: number;
  updatedAt: number;
  nights?: number;
  platformImage?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  // Roles do sistema (Faxineira removida)
  role: 'Guest Relations' | 'Maintenance' | 'Admin' | 'Administrativo' | 'Limpeza';
  avatar?: string;
  notificationPreferences?: { newTicket: boolean; assignment: boolean };
  allowedModules?: AppModule[];
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: number;
  };
}

export interface UserWithPassword extends User {
  password: string;
}

export interface PropertyRoom {
  id: string;
  name: string;
  type: string;
  bedType: string;
  bedCount: number;
  canSplit: boolean;
}

export interface Property {
  code: string;
  address: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
  wifiNetwork?: string;
  wifiPassword?: string;
  doorCode?: string;
  conciergeHours?: string;
  sizeM2?: number;
  cleaningFee?: number;
  position?: string;
  viewType?: string;
  hasAntiNoiseWindow?: boolean;
  bathrooms?: number;
  rooms?: PropertyRoom[];
  staysListingId?: string;
  amenities?: string[];
  maxGuests?: number;
  bedroomCount?: number;
  bedCount?: number;
}

// New types for property characteristics from stays-api
export interface PropertyLocation {
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface PropertyCharacteristics {
  propertyId: string;
  staysListingId: string;
  internalName: string;
  name: string;
  address: string;
  basicInfo: {
    rooms: number;
    beds: number;
    bathrooms: number;
    squareFeet: number | null;
    maxGuests: number;
  };
  amenities: PropertyAmenity[];
  descriptions: Record<string, string>;
  images: ListingImage[];
  mainImage: ListingImage | null;
  customFieldsFromStays: Record<string, any>;
  location: PropertyLocation | null;
  manualOverrides: ManualOverrides;
  syncedAt: string;
  lastManualUpdateAt: string | null;
}

export interface PropertyAmenity {
  staysAmenityId: string;
  name: string;
  namePtBr: string;
  category: string;
  icon: string | null;
}

export interface ListingImage {
  url: string;
  order: number;
}

export interface ManualOverrides {
  wifi: {
    network: string | null;
    password: string | null;
    updatedAt: string | null;
    updatedBy: string | null;
  };
  access: {
    doorCode: string | null;
    conciergeHours: string | null;
    checkInInstructions: string | null;
    checkOutInstructions: string | null;
    parkingInfo: string | null;
    updatedAt: string | null;
    updatedBy: string | null;
  };
  specifications: {
    position: string | null;
    viewType: string | null;
    hasAntiNoiseWindow: boolean | null;
    cleaningFee: number | null;
    updatedAt: string | null;
    updatedBy: string | null;
  };
  maintenance: {
    specialNotes: string | null;
    maintenanceContacts: string | null;
    emergencyProcedures: string | null;
    updatedAt: string | null;
    updatedBy: string | null;
  };
}

export interface MonitoredFlight {
  id: string;
  code: string;
  description: string;
  flightData: FlightData;
  createdAt: number;
}

export interface GuestTip {
  id: string;
  title: string;
  category: string;
  content: string;
  imageUrl?: string;
  createdAt: number;
}

export enum InventoryCategory {
  LINEN = 'Enxoval',
  ELECTRONICS = 'Eletrônicos',
  FURNITURE = 'Mobiliário',
  AMENITY = 'Amenidades',
  UTENSIL = 'Utensílios',
  OTHER = 'Outros'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  brand?: string;
  model?: string;
  dimensions?: string;
  minStock: number;
  description?: string;
  stock: Record<string, number>;
  updatedAt: number;
}

export enum TransactionType {
  PURCHASE = 'Compra',
  TRANSFER = 'Transferência',
  CONSUMPTION = 'Consumo',
  BREAKAGE = 'Quebra',
  LOSS = 'Perda',
  ADJUSTMENT = 'Ajuste'
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  source: string;
  destination: string;
  user: string;
  notes?: string;
  timestamp: number;
}

export enum DeliveryStatus {
  PENDING = 'Pendente',
  RECEIVED = 'Recebido',
  DELIVERED = 'Entregue'
}

export interface Delivery {
  id: string;
  description: string;
  courier?: string;
  keyword?: string;
  propertyCode?: string;
  notes?: string;
  status: DeliveryStatus;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
  recipient?: string;
  receivedBy?: string;
  receivedAt?: number;
}

export interface OfficeSupply {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  category: string;
}

export interface CompanyAsset {
  id: string;
  name: string;
  serialNumber?: string;
  assignedTo?: string;
  condition: string;
}

export interface WorkShift {
  id: string;
  userId: string;
  userName: string;
  date: string;
  shift: string;
}

export interface ConciergeOffer {
  id: string;
  title: string;
  description: string;
  price: number;
  priceDescription?: string;
  supplier?: string;
  date?: string;
  maxQuantity?: number;
  imageUrl?: string;
  category: 'Eventos' | 'Gastronomia' | 'Tours' | 'Serviços' | 'Transporte';
  bookings: {
    id: string;
    guestName: string;
    propertyCode: string;
    quantity: number;
    totalPrice: number;
    status: 'pending' | 'paid' | 'canceled';
    bookedAt: number;
  }[];
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  category?: string;
  phone?: string;
  email?: string;
  notes?: string;
  active: boolean;
}

// --- BOARDS (PAINÉIS) ---

export interface BoardChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
  assigneeId?: string;
  dueDate?: string;
}

export interface BoardCardAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'spreadsheet' | 'other';
  mimeType: string;
  size: number; // bytes
  url: string; // Firebase Storage URL
  thumbnailUrl?: string; // for images/videos
  uploadedAt: number;
  uploadedBy: string;
}

export interface BoardCard {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  assigneeId?: string; // User ID
  dueDate?: string; // ISO Date
  checklist: BoardChecklistItem[];
  attachments?: BoardCardAttachment[];
  order: number;
  createdAt: number;
}

export interface BoardColumn {
  id: string;
  boardId: string;
  title: string;
  order: number;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  ownerId: string; // Creator
  sharedWith: string[]; // List of User IDs
  allowedUsers?: string[]; // Specific users allowed to access private board
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

// --- COMMUNICATION (CHAT & VOIP) ---

export interface ChatMessage {
  id: string;
  propertyCode: string;
  text: string;
  sender: 'guest' | 'staff'; // 'guest' (Tablet) or 'staff' (Casape)
  senderName?: string;
  timestamp: number;
  read: boolean;
  scheduledFor?: number; // Optional timestamp for scheduled delivery
}

export type CallStatus = 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy';

export interface CallSession {
  id: string;
  propertyCode: string;
  propertyName?: string;
  status: CallStatus;
  startedAt: number;
  endedAt?: number;
  
  // WebRTC Signaling Fields
  offer?: any; // SDP
  answer?: any; // SDP
  callerCandidates?: any[];
  calleeCandidates?: any[];
}

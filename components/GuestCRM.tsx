
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Reservation, Ticket, GuestFeedback, ReservationStatus } from '../types';
import {
 User, Search, Calendar, Moon, DollarSign, Star,
 History, TrendingUp, MapPin, Wrench, MessageSquare,
 Crown, Clock, ChevronRight, Phone, Mail, Filter, ArrowUpDown,
 LogIn, LogOut, Home, X, FileCheck, CheckCircle2, Baby, AlertCircle
} from 'lucide-react';
import { formatCurrency, parseLocalDate, formatDatePtBR, getTodayBrazil, isToday as checkIsToday, getMaintenanceItemKey, getReservationCardColors, normalizeGuestName } from '../utils';
import { getDetailedFinancials, getCalendar } from '../services/staysApiService';
import { mapCalendarToReservations } from '../services/staysDataMapper';
import { storageService } from '../services/storage';
import { isAutomaticCheckoutTicket } from '../utils/ticketFilters';
import ReservationDetailModal from './ReservationDetailModal';

interface GuestCRMProps {
 reservations: Reservation[];
 tickets: Ticket[];
 feedbacks: GuestFeedback[];
 currentUser?: { role: string; name: string }; // Add currentUser for role-based visibility
 maintenanceOverrides?: Record<string, { hidden: boolean; updatedAt: number }>; // Para filtrar dispensados
}

interface ConsolidatedGuest {
 name: string;
 email?: string;
 phone?: string;
 firstSeen: number;
 lastSeen: number;
 totalStays: number;
 totalNights: number;
 totalSpend: number;
 avgRating: number;
 reservations: Reservation[];
 tickets: Ticket[];
 reviews: { source: 'internal' | 'channel', rating: number, comment: string, date: number, property: string }[];
 status: 'active' | 'churned' | 'new';
}

/**
 * Formata telefone para padrão brasileiro (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
 * Se não conseguir formatar, retorna o valor original
 */
const formatPhoneBR = (phone: string): string => {
  if (!phone) return '—';

  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');

  // Se não tem números, retorna original
  if (!cleaned) return phone;

  // Formato brasileiro com DDD
  // Celular: (XX) 9XXXX-XXXX (11 dígitos)
  // Fixo: (XX) XXXX-XXXX (10 dígitos)
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 9) {
    // Sem DDD, celular
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 8) {
    // Sem DDD, fixo
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }

  // Se não se encaixa em nenhum padrão, retorna original
  return phone;
};

const GuestCRM: React.FC<GuestCRMProps> = ({ reservations, tickets, feedbacks, currentUser = { role: '', name: '' }, maintenanceOverrides = {} }) => {
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState('');  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]); const [selectedGuestName, setSelectedGuestName] = useState<string | null>(null);
 const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

 // Filter States
 const [filterStatus, setFilterStatus] = useState<'all' | 'checkin' | 'checkout' | 'inhouse'>('all');
 const [sortBy, setSortBy] = useState<'spend' | 'recent' | 'oldest' | 'nights' | 'bookings'>('spend');
 const [dateFrom, setDateFrom] = useState('');
 const [dateTo, setDateTo] = useState('');
 
 // Force refetch overrides (used to refresh after changes)
 const [refetchTrigger, setRefetchTrigger] = useState(0);

 // Bugfix: CRM & Ciclo precisa de query própria com período amplo independente
 // Para não depender de staysReservations que muda conforme navegação entre módulos
 const [isModuleActive, setIsModuleActive] = useState(false);
 
 useEffect(() => {
   // Marca como ativo ao montar, inativo ao desmontar
   setIsModuleActive(true);
   return () => setIsModuleActive(false);
 }, []);

 // Query própria para reservations com período fixo (-2 anos / +1 ano)
 const { data: ownCalendarData, isLoading: isLoadingOwnReservations } = useQuery({
  queryKey: ['guest-crm-own-calendar-data'],
  queryFn: async () => {
    const today = new Date();
    const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    const oneYearAhead = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const from = twoYearsAgo.toISOString().split('T')[0];
    const to = oneYearAhead.toISOString().split('T')[0];
    return getCalendar(from, to);
  },
  enabled: isModuleActive, // Só carrega quando módulo está ativo
  staleTime: 10 * 60 * 1000, // 10 minutes
 });

 // Converter calendar para reservations
 const ownReservations = useMemo(() => {
   if (!ownCalendarData) return [];
   return mapCalendarToReservations(ownCalendarData);
 }, [ownCalendarData]);

 // Usar ownReservations se disponível, senão fallback para prop (backwards compatibility)
 const effectiveReservations = ownReservations.length > 0 ? ownReservations : reservations;

 // Filtrar reservas dispensadas (hidden)
 const filteredReservations = useMemo(() => {
   return effectiveReservations.filter(res => {
     const checkoutItem = { type: 'checkout' as const, reservation: res };
     const itemKey = getMaintenanceItemKey(checkoutItem);
     const isHidden = maintenanceOverrides[itemKey]?.hidden;
     return !isHidden; // Não mostrar se estiver hidden
   });
 }, [effectiveReservations, maintenanceOverrides]);

 // Fetch financial data from Stays API
 // Task 6: Passar período amplo (-2 anos até +1 ano) para ter histórico completo de LTV
 // Bugfix: Só carrega quando módulo está ativo
 const { data: financialData } = useQuery({
  queryKey: ['guest-crm-financial-data'],
  queryFn: () => {
    const today = new Date();
    const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    const oneYearAhead = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const from = twoYearsAgo.toISOString().split('T')[0];
    const to = oneYearAhead.toISOString().split('T')[0];
    return getDetailedFinancials(from, to);
  },
  enabled: isModuleActive,
  staleTime: 10 * 60 * 1000, // 10 minutes
 });

 // Fetch calendar data to get guest email and phone
 // Bugfix: Reutilizar ownCalendarData em vez de query duplicada
 const calendarData = ownCalendarData;
 
 // Fetch overrides for all reservations to show indicators
 const { data: reservationOverrides = {}, refetch: refetchOverrides } = useQuery({
  queryKey: ['reservation-overrides', filteredReservations.map(r => r.id || r.externalId).join(','), refetchTrigger],
  queryFn: async () => {
    const overridesMap: Record<string, any> = {};
    for (const res of filteredReservations) {
      const resId = res.id || res.externalId;
      if (resId) {
        try {
          console.log('Fetching override for resId:', resId);
          const override = await storageService.reservationOverrides.get(resId);
          console.log('Override result:', override);
          if (override) {
            overridesMap[resId] = override;
          }
        } catch (error) {
          console.error(`Error loading override for ${resId}:`, error);
        }
      }
    }
    console.log('Final overridesMap:', overridesMap);
    return overridesMap;
  },
  staleTime: 30 * 1000, // 30 seconds (reduced for faster updates)
 });

 // Create map of bookingId -> reserveTotal for quick lookup
 const financialMap = useMemo(() => {
  const map: Record<string, number> = {};
  if (financialData?.reservations) {
   financialData.reservations.forEach(fin => {
    map[fin.bookingCode] = fin.reserveTotal;
   });
  }
  return map;
 }, [financialData]);

 // Create map of guestName -> {email, phone} for contact info
 // Task 6: Usar normalizeGuestName para garantir match correto
 const guestContactMap = useMemo(() => {
  const map: Record<string, { email?: string; phone?: string }> = {};
  if (calendarData?.units) {
    calendarData.units.forEach(unit => {
      unit.reservations.forEach(res => {
        const name = normalizeGuestName(res.guestName);
        // Só adiciona se ainda não existe ou se tem mais informação
        if (!map[name] || (res.guestEmail && !map[name].email) || (res.guestPhone && !map[name].phone)) {
          map[name] = {
            email: res.guestEmail || map[name]?.email,
            phone: res.guestPhone || map[name]?.phone,
          };
        }
      });
    });
  }
  return map;
 }, [calendarData]);

 // --- DATA PROCESSING CORE ---
 const guests = useMemo(() => {
  const guestMap: Record<string, ConsolidatedGuest> = {};
  const now = Date.now();

  // 1. Process Reservations
  filteredReservations.forEach(res => {
   // Task 6: Normalize name usando função centralizada
   const normalizedName = normalizeGuestName(res.guestName);
   if (!normalizedName || normalizedName === 'hospede (stays)' || normalizedName === 'bloqueio') return;

   if (!guestMap[normalizedName]) {
    // Buscar email/phone do mapa de contatos da API
    const contactInfo = guestContactMap[normalizedName] || {};

    guestMap[normalizedName] = {
     name: res.guestName.trim(), // Manter nome original para exibição
     email: contactInfo.email,
     phone: contactInfo.phone,
     firstSeen: Infinity,
     lastSeen: 0,
     totalStays: 0,
     totalNights: 0,
     totalSpend: 0,
     avgRating: 0,
     reservations: [],
     tickets: [],
     reviews: [],
     status: 'new'
    };
   }

   const g = guestMap[normalizedName];
   g.reservations.push(res);

   // Timestamps
   const checkInTime = new Date(res.checkInDate).getTime();
   const checkOutTime = new Date(res.checkOutDate).getTime();
   if (checkInTime < g.firstSeen) g.firstSeen = checkInTime;
   if (checkOutTime > g.lastSeen) g.lastSeen = checkOutTime;

   // Stats (Only for valid bookings)
   if (res.status !== ReservationStatus.CANCELED) {
    g.totalStays++;
    // Calculate nights roughly if not provided
    const nights = res.nights || Math.max(1, Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24)));
    g.totalNights += nights;
    // Include reservation value from Stays API AND expenses in total spend
    const financialValue = res.externalId ? (financialMap[res.externalId] || 0) : 0;
    g.totalSpend += financialValue + (res.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0);
   }

   // Add Channel Review
   if (res.channelRating) {
    g.reviews.push({
     source: 'channel',
     rating: res.channelRating,
     comment: res.channelReview || 'Sem comentário',
     date: checkOutTime, // approx
     property: res.propertyCode
    });
   }
  });

  // 2. Process Internal Feedbacks
  // Task 6: Usar nome normalizado como chave
  feedbacks.forEach(fb => {
   const normalizedName = normalizeGuestName(fb.guestName);
   if (guestMap[normalizedName]) {
    guestMap[normalizedName].reviews.push({
     source: 'internal',
     rating: fb.rating,
     comment: fb.comment,
     date: fb.createdAt,
     property: fb.propertyCode
    });
   }
  });

  // 3. Process Tickets (Link by reservation ID or fuzzy name/date match)
  // Task 79: Excluir chamados de checkout automático do GuestCRM (filtro centralizado)
  tickets.forEach(t => {
    // Task 79: CRÍTICO - Ignorar chamados de checkout automático
    if (isAutomaticCheckoutTicket(t)) return;
    
    // Find guest by Reservation ID
    if (t.reservationId) {
      const res = filteredReservations.find(r => r.id === t.reservationId);
      if (res) {
        const normalizedName = normalizeGuestName(res.guestName);
        if (guestMap[normalizedName]) {
          guestMap[normalizedName].tickets.push(t);
          return;
        }
      }
    }
    // Fallback: Check if description contains guest name (common practice)
    const possibleGuest = Object.values(guestMap).find(g => 
      t.description.toLowerCase().includes(normalizeGuestName(g.name))
    );
    if (possibleGuest) {
      possibleGuest.tickets.push(t);
    }
  });

  // 4. Final Calculations
  const result = Object.values(guestMap).map(g => {
   // Avg Rating
   if (g.reviews.length > 0) {
    g.avgRating = g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length;
   }

   // Status
   const daysSinceLast = (now - g.lastSeen) / (1000 * 60 * 60 * 24);
   if (g.lastSeen > now) g.status = 'active'; // Future booking or currently in house
   else if (daysSinceLast > 365) g.status = 'churned';
   else g.status = 'active'; // Active in last year

   // Sort lists
   g.reservations.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
   g.reviews.sort((a, b) => b.date - a.date);
   g.tickets.sort((a, b) => b.createdAt - a.createdAt);

   return g;
  });

 // 🔍 Bugfix: Logs de diagnóstico em DEV (com info de fonte)
  if (import.meta.env.DEV) {
    const canceledCount = filteredReservations.filter(r => r.status === ReservationStatus.CANCELED).length;
    const validCount = filteredReservations.length - canceledCount;
    const top5ByLTV = [...result].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);
    
    console.group('[GuestCRM] 📊 Diagnóstico de Dados (CRM & Ciclo)');
    console.log('🔗 Fonte de reservations:', ownReservations.length > 0 ? 'OWN QUERY (isolada)' : 'PROP (compartilhada)');
    console.log('📦 Total de reservas carregadas:', filteredReservations.length);
    console.log('  ├─ Canceladas:', canceledCount);
    console.log('  └─ Válidas:', validCount);
    console.log('👥 Hóspedes consolidados:', result.length);
    console.log('💰 Dados financeiros:', financialData ? `${financialData.count} registros` : 'CARREGANDO...');
    console.log('🏆 Top 5 por LTV:', top5ByLTV.map(g => ({
      name: g.name,
      totalStays: g.totalStays,
      totalNights: g.totalNights,
      totalSpend: `R$ ${g.totalSpend.toFixed(2)}`,
    })));
    console.groupEnd();
  }

  return result;
 }, [filteredReservations, tickets, feedbacks, financialMap, guestContactMap]);

 const filteredGuests = useMemo(() => {
  // 1. Search Filter (com debounce)
  // Task 6: Usar normalização para busca case-insensitive e sem acentos
  const normalizedSearch = normalizeGuestName(debouncedSearchTerm);
  let list = guests.filter(g => normalizeGuestName(g.name).includes(normalizedSearch));

  // 2. Status Filter
  if (filterStatus !== 'all') {
    const today = getTodayBrazil();
    const todayTime = today.getTime();

    list = list.filter(g => {
      return g.reservations.some(r => {
        if (r.status === ReservationStatus.CANCELED) return false;
        const cin = parseLocalDate(r.checkInDate);
        const cout = parseLocalDate(r.checkOutDate);
        const cinTime = cin.getTime();
        const coutTime = cout.getTime();

        if (filterStatus === 'checkin') return cinTime === todayTime;
        if (filterStatus === 'checkout') return coutTime === todayTime;
        // In-house: checked in today or before, AND checkout is today or later
        if (filterStatus === 'inhouse') return cinTime <= todayTime && coutTime >= todayTime;
        return false;
      });
    });
  }

  // 3. Date Range Filter
  if (dateFrom || dateTo) {
    const fromTime = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : 0;
    const toTime = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : Infinity;

    list = list.filter(g => {
      return g.reservations.some(r => {
        if (r.status === ReservationStatus.CANCELED) return false;
        const cinTime = new Date(r.checkInDate).getTime();
        return cinTime >= fromTime && cinTime <= toTime;
      });
    });
  }

  // 4. Sorting
  list.sort((a, b) => {
    switch (sortBy) {
      case 'spend': return b.totalSpend - a.totalSpend;
      case 'recent': return b.lastSeen - a.lastSeen;
      case 'oldest': return a.firstSeen - b.firstSeen;
      case 'nights': return b.totalNights - a.totalNights;
      case 'bookings': return b.totalStays - a.totalStays;
      default: return 0;
    }
  });

  return list;
 }, [guests, debouncedSearchTerm, filterStatus, sortBy, dateFrom, dateTo]);

 const activeGuest = useMemo(() => {
  return selectedGuestName ? guests.find(g => g.name === selectedGuestName) : null;
 }, [selectedGuestName, guests]);

 const getRecencyLabel = (lastSeen: number) => {
   if (lastSeen > Date.now()) return "Hóspede Futuro / In-House";
   const days = Math.floor((Date.now() - lastSeen) / (1000 * 60 * 60 * 24));
   if (days === 0) return "Hoje";
   if (days < 30) return `${days} dias atrás`;
   if (days < 365) return `${Math.floor(days/30)} meses atrás`;
   return `${Math.floor(days/365)} anos atrás`;
 };

 return (
  <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 -m-4 md:-m-6">
   
   {/* Sidebar List */}
   <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col ${activeGuest ? 'hidden md:flex' : 'flex'}`}>
    <div className="z-10 p-4 space-y-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2 mb-2">
       <div className="p-2 text-blue-700 bg-blue-100 rounded-lg">
         <User size={20} />
       </div>
       <div>
         <h2 className="font-bold text-gray-900">Base de Hóspedes</h2>
         <p className="text-xs text-gray-500">{filteredGuests.length} encontrados</p>
       </div>
      </div>
      
      <div className="relative">
       <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
       <input 
        type="text" 
        placeholder="Buscar por nome..." 
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full py-2 pr-4 text-sm border border-gray-200 rounded-lg pl-9 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
       />
      </div>

      {/* Bugfix: Filtros responsivos com layout flexível */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-[140px]">
            <Filter className="absolute text-gray-400 left-2 top-2.5" size={14} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full py-2 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="all">Todos Status</option>
              <option value="checkin">Check-in Hoje</option>
              <option value="checkout">Check-out Hoje</option>
              <option value="inhouse">In-House</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <ArrowUpDown className="absolute text-gray-400 left-2 top-2.5" size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="spend">Maior Valor (LTV)</option>
              <option value="recent">Mais Recente</option>
              <option value="oldest">Mais Antigo</option>
              <option value="nights">Total de Noites</option>
              <option value="bookings">Total de Reservas</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-[120px]">
            <Calendar className="absolute text-gray-400 left-2 top-2.5" size={14} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Data inicial"
              className="w-full px-3 py-2 pl-8 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="relative flex-1 min-w-[120px]">
            <Calendar className="absolute text-gray-400 left-2 top-2.5" size={14} />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Data final"
              className="w-full px-3 py-2 pl-8 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Limpar datas"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
    
    <div className="flex-1 overflow-y-auto">
      {filteredGuests.length === 0 ? (
        <div className="p-8 text-sm text-center text-gray-400">
          Nenhum hóspede encontrado com os filtros atuais.
        </div>
      ) : (
        filteredGuests.map(guest => (
        <div 
          key={guest.name}
          onClick={() => setSelectedGuestName(guest.name)}
          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all ${selectedGuestName === guest.name ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
        >
          <div className="flex items-start justify-between mb-1">
          <h3 className={`font-bold text-sm ${selectedGuestName === guest.name ? 'text-blue-900' : 'text-gray-900'}`}>{guest.name}</h3>
          {guest.totalSpend > 10000 && <Crown size={14} className="text-yellow-500 fill-yellow-500" />}
          </div>
          <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500">{guest.totalStays} estadias • {guest.totalNights} noites</p>
            <p className="text-xs font-medium text-green-600 mt-0.5">{formatCurrency(guest.totalSpend)}</p>
          </div>
          {/* Status Badge based on Today */}
          {(() => {
            const today = new Date().setHours(0,0,0,0);
            const isInHouse = guest.reservations.some(r => {
              if (r.status === ReservationStatus.CANCELED) return false;
              const cin = new Date(r.checkInDate).setHours(0,0,0,0);
              const cout = new Date(r.checkOutDate).setHours(0,0,0,0);
              return cin < today && cout > today;
            });
            const isCheckIn = guest.reservations.some(r => r.status !== 'Cancelada' && new Date(r.checkInDate).setHours(0,0,0,0) === today);
            const isCheckOut = guest.reservations.some(r => r.status !== 'Cancelada' && new Date(r.checkOutDate).setHours(0,0,0,0) === today);

            if (isCheckIn) return (
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold flex items-center gap-1"><LogIn size={8}/> Check-in</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center gap-1"><Moon size={8}/> 1ª NOITE</span>
              </div>
            );
            if (isCheckOut) return <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold flex items-center gap-1"><LogOut size={8}/> Check-out</span>;
            if (isInHouse) return <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center gap-1"><Home size={8}/> In-House</span>;
            
            return <span className={`text-[10px] px-2 py-0.5 rounded-full ${guest.status === 'active' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>
              {guest.status === 'active' ? 'Recente' : 'Inativo'}
            </span>;
          })()}
          </div>
        </div>
        ))
      )}
    </div>
   </div>

   {/* Main Content */}
   <div className={`flex-1 flex flex-col h-full overflow-hidden bg-gray-50 ${!activeGuest ? 'hidden md:flex' : 'flex'}`}>
     {activeGuest ? (
      <div className="flex-1 overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-20 p-6 bg-white border-b border-gray-200 shadow-sm">
         <button onClick={() => setSelectedGuestName(null)} className="flex items-center mb-4 text-gray-500 md:hidden">
           <ChevronRight size={20} className="rotate-180" /> Voltar
         </button>

         <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
           <div className="flex items-center gap-4">
             <div className="flex items-center justify-center w-16 h-16 text-2xl font-heading font-bold text-white rounded-full shadow-lg from-blue-500 to-indigo-600">
               {activeGuest.name.slice(0,2).toUpperCase()}
             </div>
             <div>
               <h1 className="flex items-center gap-2 text-2xl font-heading font-bold text-gray-900">
                 {activeGuest.name}
                 {activeGuest.totalSpend > 20000 && <span className="flex items-center gap-1 px-2 py-1 text-xs text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-full"><Crown size={12} /> VIP Ouro</span>}
               </h1>
               <p className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                 <Clock size={14} /> Última vez: {getRecencyLabel(activeGuest.lastSeen)}
               </p>
               {/* Informações de Contato */}
               <div className="flex flex-col gap-1 mt-2">
                 {activeGuest.email && (
                   <p className="flex items-center gap-2 text-xs text-gray-600">
                     <Mail size={12} className="text-gray-400" />
                     <span>{activeGuest.email}</span>
                   </p>
                 )}
                 {activeGuest.phone && (
                   <p className="flex items-center gap-2 text-xs text-gray-600">
                     <Phone size={12} className="text-gray-400" />
                     <span>{formatPhoneBR(activeGuest.phone)}</span>
                   </p>
                 )}
               </div>
             </div>
           </div>
           <div className="flex gap-2">
             <button className="p-2 text-gray-400 bg-white border border-gray-200 rounded-lg hover:text-blue-600" title="Email"><Mail size={18} /></button>
             <button className="p-2 text-gray-400 bg-white border border-gray-200 rounded-lg hover:text-green-600" title="WhatsApp"><Phone size={18} /></button>
           </div>
         </div>
        </div>

        <div className="max-w-6xl p-6 mx-auto space-y-6">
          
          {/* KPI Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg">
              <p className="mb-1 text-xs font-bold text-gray-400 uppercase">Total Gasto (LTV)</p>
              <p className="text-2xl font-heading font-bold text-gray-900">{formatCurrency(activeGuest.totalSpend)}</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg">
              <p className="mb-1 text-xs font-bold text-gray-400 uppercase">Total Noites</p>
              <p className="flex items-center gap-2 text-2xl font-heading font-bold text-indigo-600">
                <Moon size={20} /> {activeGuest.totalNights}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg">
              <p className="mb-1 text-xs font-bold text-gray-400 uppercase">Estadias</p>
              <p className="flex items-center gap-2 text-2xl font-heading font-bold text-blue-600">
                <History size={20} /> {activeGuest.totalStays}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg">
              <p className="mb-1 text-xs font-bold text-gray-400 uppercase">Nota Média</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-heading font-bold text-gray-900">{activeGuest.avgRating ? activeGuest.avgRating.toFixed(1) : '-'}</span>
                {activeGuest.avgRating > 0 && (
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= Math.round(activeGuest.avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Left Column: Timeline & History */}
            <div className="space-y-6 lg:col-span-2">

              {/* Reservations Timeline */}
              <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="flex items-center gap-2 font-bold text-gray-800"><Calendar size={18} /> Histórico de Reservas</h3>
                  <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">{activeGuest.reservations.length} total</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {activeGuest.reservations.map(res => {
                    const today = getTodayBrazil();
                    const checkIn = parseLocalDate(res.checkInDate);
                    const checkOut = parseLocalDate(res.checkOutDate);
                    const isFuture = checkIn.getTime() > today.getTime();
                    const isCurrent = checkIn.getTime() <= today.getTime() && checkOut.getTime() >= today.getTime();
                    
                    // Get overrides for this reservation
                    const resId = res.id || res.externalId || '';
                    const override = reservationOverrides[resId];
                    
                    // DEBUG
                    console.log('=== RESERVATION CARD DEBUG ===');
                    console.log('resId:', resId);
                    console.log('override:', override);
                    console.log('all overrides:', reservationOverrides);
                    
                    // Task 40: Check if docs are complete
                    const docsSent = override?.docsSent ?? res.docsSent ?? false;
                    const docsSentToBuilding = override?.docsSentToBuilding ?? res.docsSentToBuilding ?? false;
                    const docsComplete = docsSent && docsSentToBuilding;
                    
                    console.log('docsSent:', docsSent, 'docsSentToBuilding:', docsSentToBuilding, 'docsComplete:', docsComplete);
                    
                    // Task 41: Check maintenance status
                    const maintenanceSeen = override?.maintenanceSeenAt || res.maintenanceAck?.seenAt;
                    
                    // Task 42: Check Early/Late Check-in/out
                    const earlyCheckIn = override?.earlyCheckIn ?? res.earlyCheckIn;
                    const lateCheckOut = override?.lateCheckOut ?? res.lateCheckOut;
                    
                    // Task 43: Check if has children
                    const hasChildren = override?.hasChildren ?? res.hasChildren ?? false;
                    
                    console.log('hasChildren:', hasChildren);
                    console.log('==============================');
                    
                    // Task 59: Get Atenção and Problema states
                    const hasProblema = override?.problemReported ?? res.problemReported ?? false;
                    const hasAtencao = override?.specialAttention ?? res.specialAttention ?? false;
                    
                    // Determine card status for color
                    let cardStatus: 'checkin' | 'checkout' | 'inhouse' | 'default' = 'default';
                    if (checkIsToday(res.checkInDate)) {
                      cardStatus = 'checkin';
                    } else if (checkIsToday(res.checkOutDate)) {
                      cardStatus = 'checkout';
                    } else if (isCurrent) {
                      cardStatus = 'inhouse';
                    }
                    
                    // Get dynamic colors based on priority: Problema > Atenção > Status
                    const colors = getReservationCardColors(hasProblema, hasAtencao, cardStatus);
                    
                    return (
                      <div 
                        key={res.id} 
                        onClick={() => setSelectedReservation(res)}
                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between transition-colors cursor-pointer border-l-4 ${colors.bg} ${colors.border} ${colors.bgHover}`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-1 w-2 h-2 rounded-full ${isFuture ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-gray-900">{res.propertyCode}</p>
                              
                              {/* Task 59: Atenção and Problema indicators */}
                              {hasProblema && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-red-600 text-white rounded uppercase font-bold">
                                  PROBLEMA
                                </span>
                              )}
                              {hasAtencao && !hasProblema && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-purple-600 text-white rounded uppercase font-bold">
                                  ATENÇÃO
                                </span>
                              )}
                              
                              {/* Task 40: Docs indicator */}
                              {!docsComplete && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded uppercase font-bold">
                                  DOCS
                                </span>
                              )}
                              {docsComplete && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded uppercase font-bold flex items-center gap-0.5">
                                  <FileCheck size={10} /> Docs OK
                                </span>
                              )}
                              
                              {/* Task 41: Maintenance seen indicator */}
                              {!maintenanceSeen && currentUser.role !== 'Guest Relations' && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded uppercase font-bold flex items-center gap-0.5">
                                  <AlertCircle size={10} /> NÃO VISTO
                                </span>
                              )}
                              {maintenanceSeen && currentUser.role !== 'Guest Relations' && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded uppercase font-bold flex items-center gap-0.5">
                                  <CheckCircle2 size={10} /> Ciente
                                </span>
                              )}
                              
                              {/* Task 43: Has children indicator */}
                              {hasChildren && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded flex items-center gap-0.5" title="Possui Criança">
                                  <Baby size={10} />
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDatePtBR(res.checkInDate)} - {formatDatePtBR(res.checkOutDate)}
                            </p>
                            
                            {/* Task 42: Early Check-in / Late Check-out indicators */}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {earlyCheckIn?.requested && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                  earlyCheckIn.granted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  <LogIn size={10} className="inline mr-0.5" />
                                  Early {earlyCheckIn.time}
                                </span>
                              )}
                              {lateCheckOut?.requested && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                  lateCheckOut.granted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  <LogOut size={10} className="inline mr-0.5" />
                                  Late {lateCheckOut.time}
                                </span>
                              )}
                              
                              <p className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin size={10} /> {res.propertyName || 'Imóvel Casapē'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-right md:mt-0">
                          <p className="text-sm font-bold text-gray-800">
                            {formatCurrency((res.externalId ? (financialMap[res.externalId] || 0) : 0) + (res.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0))}
                          </p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded uppercase">{res.channel || 'Direto'}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                              res.status === 'Confirmada' ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'
                            }`}>{res.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tickets / Issues */}
              <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="flex items-center gap-2 font-bold text-gray-800"><Wrench size={18} /> Histórico de Suporte</h3>
                  <span className="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded-full">{activeGuest.tickets.length} chamados</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {activeGuest.tickets.length === 0 ? (
                    <div className="p-6 text-sm text-center text-gray-400">Nenhum chamado registrado.</div>
                  ) : (
                    activeGuest.tickets.map(t => (
                      <div key={t.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            t.category === 'concierge' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                          }`}>{t.category || 'Manutenção'}</span>
                          <span className="text-xs text-gray-400">{formatDatePtBR(t.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">{t.description}</p>
                        <p className="mt-1 text-xs text-gray-500">Imóvel: {t.propertyCode} • Status: {t.status}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Insights & Reviews */}
            <div className="space-y-6">

              {/* Reviews Card */}
              <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-lg">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="flex items-center gap-2 font-bold text-gray-800"><MessageSquare size={18} /> Avaliações</h3>
                </div>
                <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                  {activeGuest.reviews.length === 0 ? (
                    <div className="py-4 text-sm text-center text-gray-400">Sem avaliações.</div>
                  ) : (
                    activeGuest.reviews.map((rev, i) => (
                      <div key={i} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={10} className={s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">{formatDatePtBR(rev.date)}</span>
                        </div>
                        <p className="text-xs italic text-gray-700">"{rev.comment}"</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${rev.source === 'internal' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {rev.source === 'internal' ? 'App Casapē' : 'OTA / Canal'}
                          </span>
                          <span className="text-[10px] text-gray-400">{rev.property}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Insights / Pattern */}
              <div className="p-5 border border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50 to-white rounded-lg">
                <h3 className="flex items-center gap-2 mb-4 font-bold text-indigo-900"><TrendingUp size={18} /> Insights</h3>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 min-w-[4px] h-[4px] rounded-full bg-indigo-400"></div>
                    <span className="text-gray-700">
                      Média de <strong>{formatCurrency(activeGuest.totalSpend / (activeGuest.totalNights || 1))}</strong> por diária.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 min-w-[4px] h-[4px] rounded-full bg-indigo-400"></div>
                    <span className="text-gray-700">
                      Costuma abrir <strong>{(activeGuest.tickets.length / (activeGuest.totalStays || 1)).toFixed(1)}</strong> chamados por estadia.
                    </span>
                  </li>
                  {activeGuest.reservations.length > 1 && (
                    <li className="flex items-start gap-2">
                      <div className="mt-1 min-w-[4px] h-[4px] rounded-full bg-indigo-400"></div>
                      <span className="text-gray-700">
                        Já ficou em <strong>{new Set(activeGuest.reservations.map(r => r.propertyCode)).size}</strong> imóveis diferentes.
                      </span>
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </div>

        </div>
      </div>
     ) : (
      <div className="flex flex-col items-center justify-center flex-1 text-gray-300">
        <User size={64} className="mb-4 text-gray-200" />
        <p className="text-lg font-medium text-gray-400">Selecione um hóspede para ver o perfil 360°</p>
      </div>
     )}
   </div>
   
   {/* Reservation Detail Modal */}
   {selectedReservation && (
     <ReservationDetailModal
       reservation={selectedReservation}
       currentUser={currentUser as any}
       tickets={tickets.filter(t => t.reservationId === selectedReservation.id || t.propertyCode === selectedReservation.propertyCode)}
       staysReservations={reservations}
       onCreateTicket={() => {}}
       onClose={() => {
         setSelectedReservation(null);
         // Force invalidate and refetch overrides after modal closes
         queryClient.invalidateQueries({ queryKey: ['reservation-overrides'] });
         setRefetchTrigger(prev => prev + 1);
       }}
       onUpdateDetails={() => {}}
       onDelete={async (id: string) => {
         // Para reservas da API Stays, não podemos deletar - apenas dispensar
         if (selectedReservation.externalId) {
           console.log('[GuestCRM] Não é possível deletar reserva da API Stays:', id);
           alert('Esta é uma reserva da API Stays e não pode ser deletada. Use "Dispensar" para escondê-la da visualização.');
         }
       }}
       onDismissCheckout={selectedReservation.externalId ? async (reservation: Reservation) => {
         const checkoutItem = { type: 'checkout' as const, reservation };
         const itemKey = getMaintenanceItemKey(checkoutItem);
         
         try {
           await storageService.maintenanceOverrides.hide(itemKey);
           console.log('[GuestCRM] Reserva dispensada:', itemKey);
           setSelectedReservation(null);
           // Refetch para atualizar a lista
           queryClient.invalidateQueries({ queryKey: ['reservation-overrides'] });
           setRefetchTrigger(prev => prev + 1);
         } catch (error) {
           console.error('[GuestCRM] Erro ao dispensar:', error);
           alert('Erro ao dispensar checkout. Tente novamente.');
         }
       } : undefined}
       onAddExpense={() => {}}
       onDeleteExpense={() => {}}
     />
   )}
  </div>
 );
};

export default GuestCRM;

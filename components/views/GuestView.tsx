import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock, CalendarRange, LogIn, LogOut as LogOutIcon, Home, Languages,
  FileX, EyeOff, DollarSign, Wrench, Repeat, FileCheck, CheckCircle2, AlertCircle, Baby, Flag
} from 'lucide-react';
import { Reservation, Ticket } from '../../types';
import { AgendaGroup } from '../../services/staysDataMapper';
import { SkeletonAgenda, SkeletonList } from '../SkeletonLoading';
import CalendarView from '../CalendarView';
import PeriodFilter, { PeriodPreset } from './PeriodFilter';
import StatusFilter, { ReservationStatus } from './StatusFilter';
import { useGuestPeriodFilter } from '../../hooks/features/useGuestPeriodFilter';
import { usePagination } from '../../hooks/features/usePagination';
import { PaginationBar } from '../ui/PaginationBar';
import { storageService } from '../../services/storage';
import { getReservationOverrideKey, parseLocalDate, formatDatePtBR, getReservationCardColors } from '../../utils';
import { isAutomaticCheckoutTicket } from '../../utils/ticketFilters';

interface GuestViewProps {
  staysReservations: Reservation[];
  staysAgendaGroups: AgendaGroup[];
  viewMode: string;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  setSelectedReservation: (reservation: Reservation) => void;
  searchTerm: string;
  tickets: Ticket[];
  staysLoading: boolean;
  gridColumns: number;
  guestPeriodPreset: PeriodPreset;
  guestCustomStartDate: string;
  guestCustomEndDate: string;
  guestSelectedStatuses: string[];
  onGuestPeriodPresetChange: (preset: PeriodPreset) => void;
  onGuestCustomDateChange: (startDate: string, endDate: string) => void;
  onGuestStatusChange: (statuses: string[]) => void;
}

// Normaliza o nome do hóspede para consistência na contagem
const normalizeGuestName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' '); // Colapsa múltiplos espaços
};

export const GuestView: React.FC<GuestViewProps> = ({
  staysReservations,
  staysAgendaGroups,
  viewMode,
  currentMonth,
  setCurrentMonth,
  setSelectedReservation,
  searchTerm,
  tickets,
  staysLoading,
  gridColumns,
  guestPeriodPreset,
  guestCustomStartDate,
  guestCustomEndDate,
  guestSelectedStatuses,
  onGuestPeriodPresetChange,
  onGuestCustomDateChange,
  onGuestStatusChange
}) => {
  const getGridClass = () => {
    if (gridColumns === 2) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (gridColumns === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  // Hook para filtrar e agrupar reservas por período e status
  const { filteredAgendaGroups } = useGuestPeriodFilter({
    staysReservations,
    staysAgendaGroups,
    periodPreset: guestPeriodPreset,
    customStartDate: guestCustomStartDate,
    customEndDate: guestCustomEndDate,
    selectedStatuses: guestSelectedStatuses,
    searchTerm,
  });

  // Paginação: reset quando filtros mudarem
  const resetTrigger = `${guestPeriodPreset}-${guestCustomStartDate}-${guestCustomEndDate}-${guestSelectedStatuses.join(',')}-${searchTerm}`;
  const { paginatedItems: paginatedAgendaGroups, pagination } = usePagination({
    items: filteredAgendaGroups,
    initialItemsPerPage: 10,
    resetTrigger,
  });

  // Task 40-43: Carregar overrides em lote para mostrar tags nos cards
  const reservationKeys = useMemo(() => {
    return staysReservations.map(res => {
      try {
        return getReservationOverrideKey(res);
      } catch (error) {
        console.error('[GuestView] Erro ao gerar override key:', res, error);
        return null;
      }
    }).filter(Boolean) as string[];
  }, [staysReservations]);

  const { data: overridesMap = new Map() } = useQuery({
    queryKey: ['guest-view-overrides', reservationKeys.join(',')],
    queryFn: async () => {
      if (reservationKeys.length === 0) return new Map();

      console.log('[GuestView] Carregando overrides em lote:', reservationKeys.length, 'reservas');
      const map = await storageService.reservationOverrides.getMultiple(reservationKeys);
      console.log('[GuestView] Overrides carregados:', map.size, 'encontrados');
      return map;
    },
    staleTime: 30 * 1000, // 30 segundos
    enabled: reservationKeys.length > 0,
  });

  // Helper: Merge reservation + override
  const getMergedReservation = (reservation: Reservation) => {
    const overrideKey = getReservationOverrideKey(reservation);
    const override = overridesMap.get(overrideKey);

    if (!override) return reservation;

    // Merge: overrides têm prioridade
    return {
      ...reservation,
      docsSent: override.docsSent ?? reservation.docsSent,
      docsSentToBuilding: override.docsSentToBuilding ?? reservation.docsSentToBuilding,
      hasChildren: override.hasChildren ?? reservation.hasBabies,
      earlyCheckIn: override.earlyCheckIn ?? reservation.earlyCheckIn,
      lateCheckOut: override.lateCheckOut ?? reservation.lateCheckOut,
      specialAttention: override.specialAttention ?? reservation.specialAttention,
      problemReported: override.problemReported ?? reservation.problemReported,
      maintenanceAck: {
        seen: !!override.maintenanceSeenAt,
        seenAt: override.maintenanceSeenAt,
        seenBy: override.maintenanceSeenBy,
      },
    };
  };

  // Calcula quantas reservas cada hóspede já fez
  const guestReservationCount = React.useMemo(() => {
    const countMap = new Map<string, number>();

    staysReservations.forEach(reservation => {
      // Ignora reservas canceladas na contagem
      if (reservation.status === 'Cancelada') return;

      const normalizedName = normalizeGuestName(reservation.guestName);
      countMap.set(normalizedName, (countMap.get(normalizedName) || 0) + 1);
    });

    return countMap;
  }, [staysReservations]);

  if (viewMode !== 'cards' && viewMode !== 'list' && viewMode !== 'calendar') {
    return null;
  }

  return (
    <div className={viewMode === 'cards' ? "space-y-8" : "space-y-4"}>
      {/* Filtro de Período + Status - Somente para modos Cards e Lista */}
      {(viewMode === 'cards' || viewMode === 'list') && (
        <>
          <PeriodFilter
            selectedPreset={guestPeriodPreset}
            customStartDate={guestCustomStartDate}
            customEndDate={guestCustomEndDate}
            onPresetChange={onGuestPeriodPresetChange}
            onCustomDateChange={onGuestCustomDateChange}
          />
          <StatusFilter
            selectedStatuses={guestSelectedStatuses as ReservationStatus[]}
            onStatusChange={(statuses) => onGuestStatusChange(statuses as string[])}
          />
        </>
      )}

      {staysLoading ? (
        viewMode === 'cards' ? (
          <SkeletonAgenda />
        ) : viewMode === 'list' ? (
          <SkeletonList count={10} />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : viewMode === 'calendar' ? (
        <CalendarView
          mode="guest"
          reservations={staysReservations}
          currentDate={currentMonth}
          onDateChange={setCurrentMonth}
          onItemClick={setSelectedReservation}
        />
      ) : viewMode === 'cards' ? (
        <>
          {filteredAgendaGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 border-dashed rounded-lg">
              Nenhuma reserva encontrada.
            </div>
          ) : (
            paginatedAgendaGroups.map(group => (
            <div key={group.date} className="animate-fade-in">
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${group.isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                <CalendarClock size={16}/>
                {group.label}
                <span className="ml-2 text-xs font-normal text-gray-400">{formatDatePtBR(group.date)}</span>
              </h3>
              {group.items.length === 0 ? (
                <div className="p-4 text-sm text-center text-gray-300 bg-white border border-gray-100 border-dashed rounded-lg">
                  Nenhuma reserva neste dia
                </div>
              ) : (
                <div className={`grid gap-4 ${getGridClass()}`}>
                  {group.items.map((reservation, idx) => {
                    const dailyStatus = reservation.dailyStatus;
                    const reservationCount = guestReservationCount.get(normalizeGuestName(reservation.guestName)) || 0;

                    // Task 40-43: Merge com overrides do Firestore
                    const merged = getMergedReservation(reservation);

                    // Task 40: Check docs status
                    const docsSent = merged.docsSent ?? false;
                    const docsSentToBuilding = merged.docsSentToBuilding ?? false;
                    const docsComplete = docsSent && docsSentToBuilding;

                    // Task 41: Check maintenance status
                    const maintenanceSeen = merged.maintenanceAck?.seen ?? false;

                    // Task 42: Check Early/Late Check-in/out
                    const earlyCheckIn = merged.earlyCheckIn;
                    const lateCheckOut = merged.lateCheckOut;

                    // Task 43: Check if has children
                    const hasChildren = merged.hasChildren ?? false;

                    // Task 59: Get Atenção and Problema states
                    const hasProblema = merged.problemReported ?? false;
                    const hasAtencao = merged.specialAttention ?? false;
                    
                    // Determine card status for color
                    let cardStatus: 'checkin' | 'checkout' | 'inhouse' | 'default' = 'default';
                    if (dailyStatus === 'CHECKIN') {
                      cardStatus = 'checkin';
                    } else if (dailyStatus === 'CHECKOUT') {
                      cardStatus = 'checkout';
                    } else if (dailyStatus === 'INHOUSE') {
                      cardStatus = 'inhouse';
                    }
                    
                    // Get dynamic colors based on priority: Problema > Atenção > Status
                    const colors = getReservationCardColors(hasProblema, hasAtencao, cardStatus);

                    return (
                      <div
                        key={`${group.date}-${reservation.id}-${idx}`}
                        onClick={() => setSelectedReservation(reservation)}
                        className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col min-w-0 ${colors.bg} ${colors.border} ${colors.bgHover}`}
                      >
                        {dailyStatus === 'CHECKIN' && <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1"><LogIn size={10} /> CHECK-IN</div>}
                        {dailyStatus === 'CHECKOUT' && <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1"><LogOutIcon size={10} /> CHECK-OUT</div>}
                        {dailyStatus === 'INHOUSE' && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1"><Home size={10} /> IN-HOUSE</div>}

                        <div className="flex items-start justify-between mt-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <img src={`${reservation.platformImage}`} alt={reservation.channel || 'Direto'} className='w-5 h-5'/>
                            <span className="text-[10px] font-semibold text-gray-600">
                              {reservation.channel || 'Direto'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-100 text-gray-500 bg-gray-50">
                              {reservation.guestCount} {reservation.guestCount === 1 ? 'hóspede' : 'hóspedes'}
                            </span>
                            {reservationCount > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-100 text-purple-700 bg-purple-50">
                                <Repeat size={10} /> {reservationCount} {reservationCount === 1 ? 'reserva' : 'reservas'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {/* Task 59: Atenção and Problema indicators */}
                          {hasProblema && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded uppercase">
                              PROBLEMA
                            </span>
                          )}
                          {hasAtencao && !hasProblema && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-600 text-white text-[9px] font-bold rounded uppercase">
                              ATENÇÃO
                            </span>
                          )}
                          
                          {/* Task 40: Docs indicator */}
                          {!docsComplete && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded uppercase">
                              <FileX size={10} /> DOCS
                            </span>
                          )}
                          {docsComplete && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase">
                              <FileCheck size={10} /> Docs OK
                            </span>
                          )}

                          {/* Task 41: Maintenance seen indicator */}
                          {!maintenanceSeen && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold rounded uppercase">
                              <EyeOff size={10} /> NÃO VISTO
                            </span>
                          )}
                          {maintenanceSeen && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase">
                              <CheckCircle2 size={10} /> Ciente
                            </span>
                          )}

                          {/* Task 42: Early Check-in / Late Check-out indicators */}
                          {earlyCheckIn?.requested && (
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                              earlyCheckIn.granted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              <LogIn size={10} /> Early {earlyCheckIn.time}
                            </span>
                          )}
                          {lateCheckOut?.requested && (
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                              lateCheckOut.granted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              <LogOutIcon size={10} /> Late {lateCheckOut.time}
                            </span>
                          )}

                          {/* Task 43: Has children indicator */}
                          {hasChildren && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-pink-100 text-pink-700 text-[9px] font-bold rounded" title="Possui Criança">
                              <Baby size={10} />
                            </span>
                          )}

                          {/* Existing indicators */}
                          {reservation.expenses && reservation.expenses.length > 0 && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold rounded">
                              <DollarSign size={10} /> R$ {reservation.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(0)}
                            </span>
                          )}
                          {(() => {
                            // Task 79: Excluir chamados de checkout automático (filtro centralizado)
                            const relatedTickets = tickets.filter(t =>
                              !isAutomaticCheckoutTicket(t) &&
                              t.propertyCode === reservation.propertyCode &&
                              ((t.scheduledDate && new Date(t.scheduledDate) >= new Date(reservation.checkInDate) && new Date(t.scheduledDate) <= new Date(reservation.checkOutDate)) ||
                               (t.desiredDate && new Date(t.desiredDate) >= new Date(reservation.checkInDate) && new Date(t.desiredDate) <= new Date(reservation.checkOutDate)))
                            );
                            return relatedTickets.length > 0 && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">
                                <Wrench size={10} /> {relatedTickets.length} {relatedTickets.length === 1 ? 'chamado' : 'chamados'}
                              </span>
                            );
                          })()}
                        </div>

                        <h3 className="mb-1 text-base font-bold text-gray-900 truncate">{reservation.propertyCode}</h3>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-700 truncate">{reservation.guestName}</p>
                          {reservation.language && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase">
                              <Languages size={10} /> {reservation.language}
                            </span>
                          )}
                        </div>
                        <p className="h-10 mb-3 text-xs text-gray-500 line-clamp-2">
                          {formatDatePtBR(reservation.checkInDate)} - {formatDatePtBR(reservation.checkOutDate)}
                        </p>

                        <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <CalendarRange size={12} />
                            <span>{reservation.nights || Math.ceil((new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} noites</span>
                          </div>
                          {reservation.totalValue && (
                            <span className="text-sm font-bold text-gray-900">
                              R$ {reservation.totalValue.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}

        {/* Barra de paginação inferior */}
        <PaginationBar pagination={pagination} />
        </>
      ) : (
        // Modo Lista - Usa a mesma fonte dos Cards com paginação
        <>
          {filteredAgendaGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 border-dashed rounded-lg">
              Nenhuma reserva encontrada.
            </div>
          ) : (
            paginatedAgendaGroups.map(group => (
            <div key={group.date} className="space-y-2 animate-fade-in">
              {/* Header do grupo de data - igual aos Cards */}
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${group.isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                <CalendarClock size={16}/>
                {group.label}
                <span className="ml-2 text-xs font-normal text-gray-400">{formatDatePtBR(group.date)}</span>
              </h3>

              {/* Lista de reservas do grupo - mesma ordem dos Cards */}
              {group.items.map((reservation, idx) => {
                const dailyStatus = reservation.dailyStatus;
                const reservationCount = guestReservationCount.get(normalizeGuestName(reservation.guestName)) || 0;

                // Task 40-43: Merge com overrides do Firestore
                const merged = getMergedReservation(reservation);
                const docsSent = merged.docsSent ?? false;
                const docsSentToBuilding = merged.docsSentToBuilding ?? false;
                const docsComplete = docsSent && docsSentToBuilding;
                const maintenanceSeen = merged.maintenanceAck?.seen ?? false;
                const earlyCheckIn = merged.earlyCheckIn;
                const lateCheckOut = merged.lateCheckOut;
                const hasChildren = merged.hasChildren ?? false;

                // Task 59: Get Atenção and Problema states
                const hasProblema = merged.problemReported ?? false;
                const hasAtencao = merged.specialAttention ?? false;
                
                // Determine card status for color
                let cardStatus: 'checkin' | 'checkout' | 'inhouse' | 'default' = 'default';
                if (dailyStatus === 'CHECKIN') {
                  cardStatus = 'checkin';
                } else if (dailyStatus === 'CHECKOUT') {
                  cardStatus = 'checkout';
                } else if (dailyStatus === 'INHOUSE') {
                  cardStatus = 'inhouse';
                }
                
                // Get dynamic colors based on priority: Problema > Atenção > Status
                const colors = getReservationCardColors(hasProblema, hasAtencao, cardStatus);

                return (
                  <div
                    key={`${group.date}-${reservation.id}-${idx}`}
                    onClick={() => setSelectedReservation(reservation)}
                    className={`flex items-center justify-between p-3 transition-colors border rounded-lg cursor-pointer relative ${colors.bg} ${colors.border} ${colors.bgHover}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Badge de tipo - igual aos Cards */}
                      {dailyStatus === 'CHECKOUT' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">
                          <LogOutIcon size={10} /> CHECK-OUT
                        </div>
                      )}
                      {dailyStatus === 'CHECKIN' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                          <LogIn size={10} /> CHECK-IN
                        </div>
                      )}
                      {dailyStatus === 'INHOUSE' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                          <Home size={10} /> IN-HOUSE
                        </div>
                      )}

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{reservation.propertyCode}</span>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{reservation.guestName}</p>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Task 59: Atenção and Problema indicators */}
                        {hasProblema && <div title="Problema reportado"><Flag size={12} className="text-red-600 fill-red-600" /></div>}
                        {hasAtencao && !hasProblema && <div title="Atenção especial"><Flag size={12} className="text-purple-600" /></div>}
                        
                        {/* Task 40: Docs indicator */}
                        {!docsComplete && <div title="Documentação pendente"><FileX size={12} className="text-red-500" /></div>}
                        {docsComplete && <div title="Documentos completos"><FileCheck size={12} className="text-green-500" /></div>}

                        {/* Task 41: Maintenance indicator */}
                        {!maintenanceSeen && <div title="Manutenção não vista"><AlertCircle size={12} className="text-yellow-500" /></div>}
                        {maintenanceSeen && <div title="Manutenção ciente"><CheckCircle2 size={12} className="text-green-500" /></div>}

                        {/* Task 42: Early/Late Check */}
                        {earlyCheckIn?.requested && (
                          <div title={`Early Check-in ${earlyCheckIn.time} ${earlyCheckIn.granted ? '(concedido)' : '(solicitado)'}`}>
                            <LogIn size={12} className={earlyCheckIn.granted ? 'text-green-500' : 'text-orange-500'} />
                          </div>
                        )}
                        {lateCheckOut?.requested && (
                          <div title={`Late Check-out ${lateCheckOut.time} ${lateCheckOut.granted ? '(concedido)' : '(solicitado)'}`}>
                            <LogOutIcon size={12} className={lateCheckOut.granted ? 'text-green-500' : 'text-orange-500'} />
                          </div>
                        )}

                        {/* Task 43: Has children */}
                        {hasChildren && <div title="Possui criança"><Baby size={12} className="text-pink-500" /></div>}

                        {/* Existing indicators */}
                        {reservation.expenses && reservation.expenses.length > 0 && <div title={`R$ ${reservation.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(0)} em despesas`}><DollarSign size={12} className="text-yellow-500" /></div>}
                        {reservation.language && <span className="text-[10px] text-blue-600 font-semibold uppercase" title={`Idioma: ${reservation.language}`}>{reservation.language}</span>}
                        {reservationCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-purple-100 text-purple-700 bg-purple-50 whitespace-nowrap">
                            <Repeat size={10} /> {reservationCount}
                          </span>
                        )}
                        {(() => {
                          // Task 79: Excluir chamados de checkout automático (filtro centralizado)
                          const relatedTickets = tickets.filter(t =>
                            !isAutomaticCheckoutTicket(t) &&
                            t.propertyCode === reservation.propertyCode &&
                            ((t.scheduledDate && new Date(t.scheduledDate) >= new Date(reservation.checkInDate) && new Date(t.scheduledDate) <= new Date(reservation.checkOutDate)) ||
                             (t.desiredDate && new Date(t.desiredDate) >= new Date(reservation.checkInDate) && new Date(t.desiredDate) <= new Date(reservation.checkOutDate)))
                          );
                          return relatedTickets.length > 0 && <div title={`${relatedTickets.length} chamado(s)`}><Wrench size={12} className="text-blue-500" /></div>;
                        })()}
                      </div>
                    </div>

                    <div className="text-right ml-2 whitespace-nowrap">
                      <p className="text-xs font-medium text-gray-900">
                        {formatDatePtBR(reservation.checkInDate)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
          )}

          {/* Barra de paginação inferior */}
          <PaginationBar pagination={pagination} />
        </>
      )}
    </div>
  );
};

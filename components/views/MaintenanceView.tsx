import React from 'react';
import { AlertCircle, CalendarClock, LogOut as LogOutIcon, ChevronDown, MessageSquare, User } from 'lucide-react';
import { Ticket, TicketStatus, AppModule, Reservation, UserWithPassword } from '../../types';
import { MaintenanceGroup, MaintenanceItem, PeriodPreset } from '../../hooks/features/useMaintenanceFilters';
import { useMaintenanceCalendar } from '../../hooks/features/useMaintenanceCalendar';
import { SkeletonCard, SkeletonList } from '../SkeletonLoading';
import CalendarView from '../CalendarView';
import { TypeFilter } from './TypeFilter';
import { AssigneeFilter } from './AssigneeFilter';
import PeriodFilter from './PeriodFilter';
import { parseLocalDate, formatDatePtBR, isToday, isTomorrow } from '../../utils';
import { useQueryClient } from '@tanstack/react-query';
import { storageService } from '../../services/storage';

interface MaintenanceViewProps {
  tickets: Ticket[];
  filteredTickets: Ticket[];
  maintenanceGroups: MaintenanceGroup[];
  viewMode: string;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  searchTerm: string;
  filterStatus: string;
  filterMaintenanceAssignee: string[];
  setFilterMaintenanceAssignee: (assignees: string[]) => void;
  filterMaintenanceProperty: string;
  filterMaintenanceType: string[];
  setFilterMaintenanceType: (types: string[]) => void;
  activeModule: AppModule;
  gridColumns: number;
  periodPreset: PeriodPreset;
  customStartDate: string;
  customEndDate: string;
  onPeriodPresetChange: (preset: PeriodPreset) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  hasMoreItems: boolean;
  onLoadMore: () => void;
  totalItems: number;
  displayCount: number;
  staysReservations?: Reservation[];
  maintenanceOverrides?: Record<string, { hidden: boolean; updatedAt: number }>;
  allUsers: UserWithPassword[];
  isLoading?: boolean;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  tickets,
  filteredTickets,
  maintenanceGroups,
  viewMode,
  currentMonth,
  setCurrentMonth,
  setSelectedTicket,
  searchTerm,
  filterStatus,
  filterMaintenanceAssignee,
  setFilterMaintenanceAssignee,
  filterMaintenanceProperty,
  filterMaintenanceType,
  setFilterMaintenanceType,
  activeModule,
  gridColumns,
  periodPreset,
  customStartDate,
  customEndDate,
  onPeriodPresetChange,
  onCustomDateChange,
  hasMoreItems,
  onLoadMore,
  totalItems,
  displayCount,
  staysReservations = [],
  maintenanceOverrides = {},
  allUsers,
  isLoading = false
}) => {
  const queryClient = useQueryClient();

  // Hook dedicado para o modo Calendário
  // NÃO respeita paginação nem filtros de período globais
  // Carrega apenas eventos a partir de hoje do mês visualizado
  const { calendarTickets } = useMaintenanceCalendar({
    tickets,
    staysReservations,
    currentMonth,
    searchTerm,
    filterMaintenanceProperty,
    filterMaintenanceType,
    activeModule,
    maintenanceOverrides
  });
  const getGridClass = () => {
    if (gridColumns === 2) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (gridColumns === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  const handleTicketClick = (ticket: Ticket) => {
    // Task 34: SEMPRE abrir o modal simples de manutenção (TicketDetailModal)
    // Nunca abrir ReservationDetailModal para tickets de manutenção
    // O modal de manutenção é operacional e não exibe dados de hóspedes
    setSelectedTicket(ticket);
  };

  const handleCheckoutCardClick = async (reservation: any) => {
    // Task 33 + 34: Ao clicar em card de checkout virtual, buscar ticket real existente primeiro
    // Se existir, abrir o ticket real; senão, criar ticket virtual temporário
    
    // Buscar ticket real existente
    const existingTicket = await storageService.tickets.findByReservation(reservation.id);
    
    if (existingTicket) {
      // Ticket já existe - abrir o ticket real
      setSelectedTicket(existingTicket);
    } else {
      // Criar ticket virtual temporário
      const virtualTicket: Ticket = {
        id: `virtual-checkout-${reservation.id}`,
        propertyCode: reservation.propertyCode,
        propertyName: reservation.propertyName || reservation.propertyCode,
        priority: 'Alta',
        serviceType: 'Limpeza de Check-out',
        description: `Limpeza de check-out automática - Hóspede: ${reservation.guestName}`,
        desiredDate: reservation.checkOutDate,
        guestAuth: false,
        status: 'Aberto' as TicketStatus,
        createdBy: 'Sistema',
        createdByName: 'Automação de Check-out',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        reservationId: reservation.id,
        isCheckoutTicket: true,
        category: 'maintenance' as const,
        expenses: [],
        _isVirtual: true, // Flag especial para indicar que é virtual
      } as any;

      setSelectedTicket(virtualTicket);
    }
  };

  if (viewMode === 'calendar') {
    // Modo Calendário: usa dados do hook dedicado (ignora paginação e filtros de período)
    return (
      <CalendarView
        mode="maintenance"
        tickets={calendarTickets}
        currentDate={currentMonth}
        onDateChange={setCurrentMonth}
        onItemClick={handleTicketClick}
      />
    );
  }

  if (viewMode !== 'cards' && viewMode !== 'list') {
    return null;
  }

  return (
    <div className={viewMode === 'cards' ? "space-y-8" : "space-y-4"}>
      {/* Filtro de Período - Para Manutenção e Concierge */}
      {(activeModule === 'maintenance' || activeModule === 'concierge') && (
        <div className="mb-4">
          <PeriodFilter
            selectedPreset={periodPreset}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onPresetChange={onPeriodPresetChange}
            onCustomDateChange={onCustomDateChange}
          />
        </div>
      )}

      {/* Filtro de Tipo - Somente para Manutenção */}
      {activeModule === 'maintenance' && (
        <div className="mb-4">
          <TypeFilter
            filterMaintenanceType={filterMaintenanceType}
            setFilterMaintenanceType={setFilterMaintenanceType}
          />
        </div>
      )}

      {/* Filtro por Responsável Técnico - Somente para Manutenção */}
      {activeModule === 'maintenance' && (
        <div className="mb-4">
          <AssigneeFilter
            selectedAssignees={filterMaintenanceAssignee}
            setSelectedAssignees={setFilterMaintenanceAssignee}
            allUsers={allUsers}
          />
        </div>
      )}

      {/* Skeleton Loader durante carregamento inicial */}
      {isLoading ? (
        viewMode === 'cards' ? (
          <div className="space-y-8">
            <div>
              <div className="h-4 bg-gray-200 rounded w-48 mb-3 animate-pulse"></div>
              <div className={`grid gap-4 ${getGridClass()}`}>
                <SkeletonCard count={6} />
              </div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-48 mb-3 animate-pulse"></div>
              <div className={`grid gap-4 ${getGridClass()}`}>
                <SkeletonCard count={6} />
              </div>
            </div>
          </div>
        ) : (
          <SkeletonList count={12} />
        )
      ) : tickets.length === 0 && !searchTerm ? (
        viewMode === 'cards' ? (
          <div className="space-y-8">
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
              <div className={`grid gap-4 ${getGridClass()}`}>
                <SkeletonCard count={3} />
              </div>
            </div>
          </div>
        ) : (
          <SkeletonList count={8} />
        )
      ) : viewMode === 'cards' ? (
        <>
          {maintenanceGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 border-dashed rounded-lg">
              {activeModule === 'concierge' ? 'Nenhuma solicitação de concierge ativa.' : 'Nenhum chamado encontrado.'}
            </div>
          ) : (
            maintenanceGroups.map((group) => (
              <div key={group.id} className="animate-fade-in">
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${group.isBacklog ? 'text-orange-600' : activeModule === 'concierge' ? 'text-purple-600' : 'text-brand-600'}`}>
                  {group.isBacklog ? <AlertCircle size={16}/> : <CalendarClock size={16}/>}
                  {group.label}
                  {group.date && <span className="ml-2 text-xs font-normal text-gray-400">{formatDatePtBR(group.date)}</span>}
                </h3>
                <div className={`grid gap-4 ${getGridClass()}`}>
                  {group.items.map((item, index) => {
                    // Task 33 + 34: Exibir cards de checkout e ao clicar abrir modal simples
                    if ('type' in item && item.type === 'checkout') {
                      const r = item.reservation;
                      const checkoutDate = parseLocalDate(r.checkOutDate);
                      const isTodayCheckout = isToday(r.checkOutDate);
                      const isTomorrowCheckout = isTomorrow(r.checkOutDate);

                      return (
                        <div
                          key={`checkout-${r.id}`}
                          onClick={() => handleCheckoutCardClick(r)}
                        className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col min-w-0 ${
                          isTodayCheckout ? 'ring-2 ring-red-500 bg-red-50' :
                          isTomorrowCheckout ? 'ring-2 ring-orange-500 bg-orange-50' :
                          'ring-2 ring-violet-500 bg-violet-50'
                          }`}
                        >
                          <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <LogOutIcon size={10} /> CHECKOUT
                          </div>

                          <div className="flex items-start justify-between mt-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700">
                              {isTodayCheckout ? 'HOJE' : isTomorrowCheckout ? 'AMANHÃ' : formatDatePtBR(r.checkOutDate)}
                            </span>
                          </div>

                          <h3 className="mb-1 text-base font-bold text-gray-900 truncate">{r.propertyCode}</h3>
                          <p className="h-10 mb-3 text-sm text-gray-500 line-clamp-2">
                            Limpeza de check-out automática
                          </p>
                          
                          {/* Responsável Técnico - Sempre "Não atribuído" para checkouts virtuais */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 italic">
                            <User size={12} />
                            <span>Não atribuído</span>
                          </div>
                        </div>
                      );
                    }

                    // É um ticket
                    const ticket = item as Ticket;
                    const isExpired = ticket.status !== TicketStatus.DONE && new Date(ticket.scheduledDate || ticket.desiredDate) < new Date();

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          console.log('[CLICK-AGUARDANDO]', ticket.id, ticket.propertyCode, ticket.isCheckoutTicket);
                          handleTicketClick(ticket);
                        }}
                        className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col min-w-0 ${
                          isExpired ? 'ring-2 ring-red-500 bg-red-50' :
                          ticket.isCheckoutTicket ? 'ring-2 ring-violet-500 bg-violet-50' :
                          ticket.isGuestRequest ? 'ring-2 ring-yellow-500 bg-yellow-50' :
                          ticket.isPreventive ? 'ring-1 ring-blue-300 bg-blue-50' :
                          (!ticket.scheduledDate && !ticket.assignee) ? 'ring-2 ring-orange-500 bg-orange-50' :
                          'border-gray-200 bg-white'
                        }`}
                      >
                        {ticket.isCheckoutTicket && <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1 shadow-sm"><LogOutIcon size={10} /> CHECKOUT</div>}
                        {ticket.isGuestRequest && !ticket.isCheckoutTicket && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">Hóspede</div>}
                        {ticket.isPreventive && !ticket.isCheckoutTicket && <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">PREVENTIVA</div>}

                        {/* Container de tags com dois grupos: esquerdo (Status/Prioridade) e direito (Problema/Observações) */}
                        <div className="flex items-start justify-between mt-2 mb-2 gap-2">
                          {/* Grupo ESQUERDO: Status + Prioridade */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                              ${ticket.status === TicketStatus.OPEN ? 'bg-red-50 text-red-700' :
                                ticket.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-50 text-yellow-700' :
                                'bg-green-50 text-green-700'}`}>
                              {ticket.status}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${ticket.priority === 'Urgente' ? 'border-red-100 text-red-600 bg-red-50' : 'border-gray-100 text-gray-500 bg-gray-50'}`}>
                              {ticket.priority}
                            </span>
                          </div>

                          {/* Grupo DIREITO: Problema + Observações (badge angular CHECKOUT já está no absolute top-right) */}
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {ticket.problemReport && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200" title="Problema relatado">
                                <AlertCircle size={10} /> PROBLEMA
                              </span>
                            )}
                            {ticket.observations && ticket.observations.length > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200" title={`${ticket.observations.length} observação(s)`}>
                                <MessageSquare size={10} /> {ticket.observations.length}
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="mb-1 text-base font-bold text-gray-900 truncate">{ticket.propertyCode}</h3>
                        <p className="h-10 mb-3 text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                        
                        {/* Responsável Técnico - Texto discreto sempre visível */}
                        <div className="flex items-center gap-1.5 text-xs mt-1">
                          <User size={12} className="text-gray-400" />
                          <span className={ticket.assignee ? "text-gray-600 font-medium" : "text-gray-400 italic"}>
                            {ticket.assignee || "Não atribuído"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Botão Ver Mais */}
          {hasMoreItems && maintenanceGroups.length > 0 && (
            <div className="flex justify-center pt-6">
              <button
                onClick={onLoadMore}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
              >
                <span>Ver mais</span>
                <ChevronDown size={18} />
                <span className="text-xs text-gray-500">
                  ({displayCount} de {totalItems})
                </span>
              </button>
            </div>
          )}
        </>
      ) : (
        // Modo Lista - Padronizado com GuestView
        <>
          {maintenanceGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 border-dashed rounded-lg">
              {activeModule === 'concierge' ? 'Nenhuma solicitação de concierge ativa.' : 'Nenhum chamado encontrado.'}
            </div>
          ) : (
            maintenanceGroups.map((group) => (
              <div key={group.id} className="space-y-2 animate-fade-in">
                {/* Header do grupo de data */}
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${group.isBacklog ? 'text-orange-600' : activeModule === 'concierge' ? 'text-purple-600' : 'text-brand-600'}`}>
                  {group.isBacklog ? <AlertCircle size={16}/> : <CalendarClock size={16}/>}
                  {group.label}
                  {group.date && <span className="ml-2 text-xs font-normal text-gray-400">{formatDatePtBR(group.date)}</span>}
                </h3>

                {/* Lista de tickets do grupo */}
                {group.items.map((item, index) => {
                  // Checkout card
                  if ('type' in item && item.type === 'checkout') {
                    const r = item.reservation;
                    const isTodayCheckout = isToday(r.checkOutDate);
                    const isTomorrowCheckout = isTomorrow(r.checkOutDate);

                    return (
                      <div
                        key={`checkout-${r.id}`}
                        onClick={() => handleCheckoutCardClick(r)}
                        className={`flex items-center justify-between p-3 transition-colors border rounded-lg cursor-pointer relative ${
                          isTodayCheckout ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                          isTomorrowCheckout ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
                          'bg-violet-50 border-violet-200 hover:bg-violet-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 text-[10px] font-bold rounded">
                            <LogOutIcon size={10} /> CHECKOUT
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{r.propertyCode}</span>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">Limpeza de check-out automática</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Responsável Técnico - Sempre "Não atribuído" para checkouts virtuais */}
                          <span className="flex items-center gap-1 text-xs text-gray-400 italic">
                            <User size={12} />
                            <span>Não atribuído</span>
                          </span>
                          <span className="text-xs text-gray-600">{formatDatePtBR(r.checkOutDate)}</span>
                        </div>
                      </div>
                    );
                  }

                  // Ticket normal
                  const ticket = item as Ticket;
                  const isExpired = ticket.status !== TicketStatus.DONE && new Date(ticket.scheduledDate || ticket.desiredDate) < new Date();

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => handleTicketClick(ticket)}
                      className={`flex items-center justify-between p-3 transition-colors border rounded-lg cursor-pointer relative ${
                        isExpired ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                        ticket.isCheckoutTicket ? 'bg-violet-50 border-violet-200 hover:bg-violet-100' :
                        ticket.isGuestRequest ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                        ticket.isPreventive ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                        (!ticket.scheduledDate && !ticket.assignee) ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
                        'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Badge de status */}
                        <div className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded ${
                          ticket.status === TicketStatus.OPEN ? 'bg-red-100 text-red-700' :
                          ticket.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {ticket.status}
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{ticket.propertyCode}</span>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{ticket.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          ticket.priority === 'Urgente' ? 'border-red-100 text-red-600 bg-red-50' : 'border-gray-100 text-gray-500 bg-gray-50'
                        }`}>
                          {ticket.priority}
                        </span>
                        {ticket.observations && ticket.observations.length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200" title={`${ticket.observations.length} observação(s)`}>
                            <MessageSquare size={10} /> {ticket.observations.length}
                          </span>
                        )}
                        {ticket.problemReport && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200" title="Problema relatado">
                            <AlertCircle size={10} /> PROBLEMA
                          </span>
                        )}
                        {/* Responsável Técnico - Texto discreto sempre visível */}
                        <span className="flex items-center gap-1 text-xs">
                          <User size={12} className="text-gray-400" />
                          <span className={ticket.assignee ? "text-gray-600 font-medium" : "text-gray-400 italic"}>
                            {ticket.assignee || "Não atribuído"}
                          </span>
                        </span>
                        {/* Data por último */}
                        <span className="text-xs text-gray-600">
                          {formatDatePtBR(ticket.scheduledDate || ticket.desiredDate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {/* Botão Ver Mais */}
          {hasMoreItems && maintenanceGroups.length > 0 && (
            <div className="flex justify-center pt-6">
              <button
                onClick={onLoadMore}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
              >
                <span>Ver mais</span>
                <ChevronDown size={18} />
                <span className="text-xs text-gray-500">
                  ({displayCount} de {totalItems})
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

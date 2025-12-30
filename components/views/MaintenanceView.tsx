import React from 'react';
import { AlertCircle, CalendarClock, LogOut as LogOutIcon, ChevronDown } from 'lucide-react';
import { Ticket, TicketStatus, Reservation, AppModule } from '../../types';
import { MaintenanceGroup, MaintenanceItem, PeriodPreset } from '../../hooks/features/useMaintenanceFilters';
import { SkeletonCard, SkeletonList } from '../SkeletonLoading';
import CalendarView from '../CalendarView';
import { TypeFilter } from './TypeFilter';
import PeriodFilter from './PeriodFilter';
import { resolveReservationForCheckoutTicket } from '../../utils';

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
  filterMaintenanceAssignee: string;
  filterMaintenanceProperty: string;
  filterMaintenanceType: string;
  setFilterMaintenanceType: (type: string) => void;
  setSelectedReservation: (reservation: Reservation | null) => void;
  staysReservations: Reservation[];
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
  addNotification?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
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
  filterMaintenanceProperty,
  filterMaintenanceType,
  setFilterMaintenanceType,
  setSelectedReservation,
  staysReservations,
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
  addNotification
}) => {
  const getGridClass = () => {
    if (gridColumns === 2) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (gridColumns === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  const handleTicketClick = (ticket: Ticket) => {
    // Se for ticket automático de checkout, tentar resolver a reserva
    if (ticket.isCheckoutTicket) {
      const { reservation, logs } = resolveReservationForCheckoutTicket(ticket, staysReservations);

      console.log('[handleTicketClick] Resolução de checkout:', logs);

      if (reservation) {
        // Encontrou a reserva -> abrir ReservationDetailModal APENAS
        // Limpar selectedTicket para garantir que não abre TicketDetailModal também
        setSelectedTicket(null);
        setSelectedReservation(reservation);
        return;
      } else {
        // Não encontrou a reserva -> mostrar toast e abrir TicketDetailModal como fallback
        if (addNotification) {
          addNotification(
            'Reserva não encontrada',
            'Não foi possível localizar a reserva correspondente. Exibindo ticket.',
            'warning'
          );
        }
        // Fallback: limpar reserva e abrir ticket
        setSelectedReservation(null);
      }
    }

    // Fallback: abrir modal de ticket normal
    setSelectedTicket(ticket);
  };

  if (viewMode === 'calendar') {
    return (
      <CalendarView
        mode="maintenance"
        tickets={filteredTickets}
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

      {tickets.length === 0 && !searchTerm ? (
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
                  {group.date && <span className="ml-2 text-xs font-normal text-gray-400">{new Date(group.date).toLocaleDateString()}</span>}
                </h3>
                <div className={`grid gap-4 ${getGridClass()}`}>
                  {group.items.map((item, index) => {
                    // Verificar se é um checkout
                    if ('type' in item && item.type === 'checkout') {
                      const r = item.reservation;
                      const checkoutDate = new Date(r.checkOutDate);
                      const isToday = checkoutDate.toDateString() === new Date().toDateString();
                      const isTomorrow = checkoutDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                      return (
                        <div
                          key={`checkout-${r.id}`}
                          onClick={() => setSelectedReservation(r)}
                          className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col min-w-0 ${
                            isToday ? 'ring-2 ring-red-400 bg-red-50/30' :
                            isTomorrow ? 'ring-2 ring-orange-400 bg-orange-50/30' :
                            'ring-2 ring-violet-400 bg-violet-50/30'
                          }`}
                        >
                          <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <LogOutIcon size={10} /> CHECKOUT
                          </div>

                          <div className="flex items-start justify-between mt-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700">
                              {isToday ? 'HOJE' : isTomorrow ? 'AMANHÃ' : checkoutDate.toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <h3 className="mb-1 text-base font-bold text-gray-900 truncate">{r.propertyCode}</h3>
                          <p className="h-10 mb-3 text-sm text-gray-500 line-clamp-2">{r.guestName}</p>
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
                        className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col min-w-0 ${
                          isExpired ? 'ring-2 ring-red-500 bg-red-50/20' :
                          ticket.isCheckoutTicket ? 'ring-2 ring-violet-400 bg-violet-50/30' :
                          ticket.isGuestRequest ? 'ring-2 ring-yellow-400 bg-yellow-50/30' :
                          ticket.isPreventive ? 'ring-1 ring-blue-300 bg-blue-50/30' :
                          (!ticket.scheduledDate && !ticket.assignee) ? 'ring-2 ring-orange-500 border-orange-500' :
                          'border-gray-200'
                        }`}
                      >
                        {ticket.isCheckoutTicket && <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1 shadow-sm"><LogOutIcon size={10} /> CHECKOUT</div>}
                        {ticket.isGuestRequest && !ticket.isCheckoutTicket && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">Hóspede</div>}
                        {ticket.isPreventive && !ticket.isCheckoutTicket && <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">PREVENTIVA</div>}

                        <div className="flex items-start justify-between mt-2 mb-2">
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

                        <h3 className="mb-1 text-base font-bold text-gray-900 truncate">{ticket.propertyCode}</h3>
                        <p className="h-10 mb-3 text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
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
        filteredTickets.map(ticket => (
          <div
            key={ticket.id}
            onClick={() => handleTicketClick(ticket)}
            className={`bg-white p-3 rounded-lg border flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${
              ticket.isCheckoutTicket ? 'border-violet-300 bg-violet-50/30' :
              ticket.isGuestRequest ? 'border-yellow-300 bg-yellow-50/30' :
              ticket.isPreventive ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{ticket.propertyCode}</span>
              </div>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{ticket.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900">{new Date(ticket.desiredDate).toLocaleDateString()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

import React from 'react';
import {
  CalendarClock, CalendarRange, LogIn, LogOut as LogOutIcon, Home, Languages,
  FileX, EyeOff, DollarSign, Wrench, Repeat
} from 'lucide-react';
import { Reservation, Ticket } from '../../types';
import { AgendaGroup } from '../../services/staysDataMapper';
import { SkeletonAgenda, SkeletonList } from '../SkeletonLoading';
import CalendarView from '../CalendarView';

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
  gridColumns
}) => {
  const getGridClass = () => {
    if (gridColumns === 2) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (gridColumns === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
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

  const filteredStaysAgendaGroups = React.useMemo(() => {
    if (!searchTerm) return staysAgendaGroups;

    return staysAgendaGroups.map(group => ({
      ...group,
      items: group.items.filter(r =>
        r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.channel?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.items.length > 0);
  }, [staysAgendaGroups, searchTerm]);

  if (viewMode !== 'cards' && viewMode !== 'list' && viewMode !== 'calendar') {
    return null;
  }

  return (
    <div className={viewMode === 'cards' ? "space-y-8" : "space-y-4"}>
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
        filteredStaysAgendaGroups.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 border-dashed rounded-lg">
            Nenhuma reserva encontrada.
          </div>
        ) : (
          filteredStaysAgendaGroups.map(group => (
            <div key={group.date} className="animate-fade-in">
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${group.isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                <CalendarClock size={16}/>
                {group.label}
                <span className="ml-2 text-xs font-normal text-gray-400">{new Date(group.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              </h3>
              {group.items.length === 0 ? (
                <div className="p-4 text-sm text-center text-gray-300 bg-white border border-gray-100 border-dashed rounded-lg">
                  Nenhuma reserva neste dia
                </div>
              ) : (
                <div className={`grid gap-4 ${getGridClass()}`}>
                  {group.items.map(reservation => {
                    const dailyStatus = reservation.dailyStatus;
                    const reservationCount = guestReservationCount.get(normalizeGuestName(reservation.guestName)) || 0;

                    return (
                      <div
                        key={reservation.id}
                        onClick={() => setSelectedReservation(reservation)}
                        className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col min-w-0 ${
                          dailyStatus === 'CHECKIN' ? 'ring-2 ring-green-500 bg-green-50/20' :
                          dailyStatus === 'CHECKOUT' ? 'ring-2 ring-orange-500 bg-orange-50/20' :
                          dailyStatus === 'INHOUSE' ? 'ring-1 ring-blue-300 bg-blue-50/20' : ''
                        }`}
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
                          {!reservation.docsSent && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                              <FileX size={10} /> DOCS
                            </span>
                          )}
                          {!reservation.maintenanceAck?.seen && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded">
                              <EyeOff size={10} /> NÃO VISTO
                            </span>
                          )}
                          {reservation.expenses && reservation.expenses.length > 0 && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold rounded">
                              <DollarSign size={10} /> R$ {reservation.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(0)}
                            </span>
                          )}
                          {(() => {
                            const relatedTickets = tickets.filter(t =>
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
                          {new Date(reservation.checkInDate).toLocaleDateString('pt-BR')} - {new Date(reservation.checkOutDate).toLocaleDateString('pt-BR')}
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
        )
      ) : (
        staysReservations
          .filter(reservation =>
            !searchTerm ||
            reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.channel?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(reservation => (
          <div
            key={reservation.id}
            onClick={() => setSelectedReservation(reservation)}
            className="flex items-center justify-between p-3 transition-colors bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{reservation.propertyCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{reservation.guestName}</p>
                {!reservation.docsSent && <div title="Documentação pendente"><FileX size={12} className="text-red-500" /></div>}
                {!reservation.maintenanceAck?.seen && <div title="Manutenção não vista"><EyeOff size={12} className="text-orange-500" /></div>}
                {reservation.expenses && reservation.expenses.length > 0 && <div title={`R$ ${reservation.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(0)} em despesas`}><DollarSign size={12} className="text-yellow-500" /></div>}
                {reservation.language && <span className="text-[10px] text-blue-600 font-semibold uppercase" title={`Idioma: ${reservation.language}`}>{reservation.language}</span>}
                {(() => {
                  const relatedTickets = tickets.filter(t =>
                    t.propertyCode === reservation.propertyCode &&
                    ((t.scheduledDate && new Date(t.scheduledDate) >= new Date(reservation.checkInDate) && new Date(t.scheduledDate) <= new Date(reservation.checkOutDate)) ||
                     (t.desiredDate && new Date(t.desiredDate) >= new Date(reservation.checkInDate) && new Date(t.desiredDate) <= new Date(reservation.checkOutDate)))
                  );
                  return relatedTickets.length > 0 && <div title={`${relatedTickets.length} chamado(s)`}><Wrench size={12} className="text-blue-500" /></div>;
                })()}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900">
                {new Date(reservation.checkInDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

import React, { useMemo } from 'react';
import { Ticket, Reservation, TicketStatus } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
 mode: 'maintenance' | 'guest';
 tickets?: Ticket[];
 reservations?: Reservation[];
 currentDate: Date;
 onDateChange: (date: Date) => void;
 onItemClick: (item: any) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
 mode, tickets = [], reservations = [], currentDate, onDateChange, onItemClick 
}) => {
 const year = currentDate.getFullYear();
 const month = currentDate.getMonth();

 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun

 const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

 const days = useMemo(() => {
  const daysArray = [];
  
  // Padding for prev month
  for (let i = 0; i < firstDayOfMonth; i++) {
   daysArray.push(null);
  }
  
  // Days
  for (let i = 1; i <= daysInMonth; i++) {
   daysArray.push(new Date(year, month, i));
  }

  // Add empty slots to complete the last row if needed
  while (daysArray.length % 7 !== 0) {
    daysArray.push(null);
  }

  return daysArray;
 }, [year, month, daysInMonth, firstDayOfMonth]);

 const changeMonth = (delta: number) => {
  const newDate = new Date(currentDate);
  newDate.setMonth(newDate.getMonth() + delta);
  onDateChange(newDate);
 };

 const getEventsForDay = (date: Date) => {
  if (!date) return [];
  const dateStr = date.toISOString().slice(0, 10);
  const events: any[] = [];

  if (mode === 'maintenance') {
   tickets.forEach(t => {
    const rawDate = t.scheduledDate || t.desiredDate;
    const tDate = rawDate ? rawDate.slice(0, 10) : '';
    if (tDate === dateStr) {
     events.push({ type: 'ticket', data: t });
    }
   });
  } else {
   reservations.forEach(r => {
    const checkIn = r.checkInDate.slice(0, 10);
    const checkOut = r.checkOutDate.slice(0, 10);
    
    if (checkIn === dateStr) {
     events.push({ type: 'checkin', data: r });
    } else if (checkOut === dateStr) {
     events.push({ type: 'checkout', data: r });
    } else if (dateStr > checkIn && dateStr < checkOut) {
     events.push({ type: 'stay', data: r });
    }
   });
  }
  return events;
 };

 const renderEvent = (event: any, index: number) => {
  if (mode === 'maintenance') {
   const t = event.data as Ticket;
   
   // Cores dinâmicas por tipo de serviço e status
   let colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
   
   // Prioridade 1: Checkouts sempre em laranja suave
   if (t.isCheckoutTicket) {
     colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
   }
   // Prioridade 2: Status do ticket
   else if (t.status === TicketStatus.DONE || t.status === TicketStatus.COMPLETED) {
     colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
   }
   else if (t.status === TicketStatus.IN_PROGRESS) {
     colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
   }
   // Prioridade 3: Tipo de serviço (apenas para tickets abertos)
   else if (t.status === TicketStatus.OPEN) {
     const serviceType = t.serviceType?.toLowerCase() || '';
     
     if (serviceType.includes('limpeza')) {
       colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
     } else if (serviceType.includes('manutenção') || serviceType.includes('manutencao')) {
       colorClass = 'bg-violet-50 text-violet-700 border-violet-200';
     } else if (serviceType.includes('problema') || t.priority === 'Crítica') {
       colorClass = 'bg-red-50 text-red-700 border-red-200';
     } else {
       colorClass = 'bg-slate-50 text-slate-700 border-slate-200';
     }
   }

   return (
    <div 
      key={`${t.id}-${index}`}
      onClick={(e) => { e.stopPropagation(); onItemClick(t); }}
      className={`text-[9px] md:text-[10px] p-1 rounded mb-1 cursor-pointer truncate font-medium border ${colorClass} hover:opacity-80 active:scale-95 transition-transform`}
      title={`${t.propertyCode} - ${t.description}`}
    >
     {t.propertyCode}
    </div>
   );
  } else {
   const r = event.data as Reservation;
   
   let badge = null;
   let borderClass = "border-gray-100";
   let bgClass = "bg-white"; 
   
   if (event.type === 'checkin') {
    badge = <span className="bg-green-500 text-white px-0.5 rounded text-[8px] mr-1 font-bold">IN</span>;
    borderClass = "border-green-100";
    bgClass = "bg-green-50";
   } else if (event.type === 'checkout') {
    badge = <span className="bg-red-500 text-white px-0.5 rounded text-[8px] mr-1 font-bold">OUT</span>;
    borderClass = "border-red-100";
    bgClass = "bg-red-50";
   } else if (event.type === 'stay') {
    badge = <span className="bg-blue-400 text-white px-0.5 rounded text-[8px] mr-1 font-bold">ON</span>;
    borderClass = "border-blue-100";
    bgClass = "bg-blue-50";
   }

   return (
    <div 
      key={`${r.id}-${event.type}-${index}`} 
      onClick={(e) => { e.stopPropagation(); onItemClick(r); }}
      className={`text-[9px] md:text-[10px] p-1 rounded mb-1 cursor-pointer truncate font-medium border ${borderClass} ${bgClass} hover:opacity-80 text-gray-700 flex items-center active:scale-95 transition-transform`}
      title={`${r.guestName} (${r.propertyCode}) - ${event.type === 'stay' ? 'Hospedado' : event.type}`}
    >
     {badge} {r.guestName.split(' ')[0]}
    </div>
   );
  }
 };

 return (
  <div className="bg-white rounded-none shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden animate-fade-in">
   {/* Header */}
   <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-100 flex-shrink-0">
    <h2 className="text-base md:text-lg font-bold text-gray-800 capitalize flex items-center gap-2">
      <CalendarIcon className="text-brand-600" size={20}/>
      {monthName}
    </h2>
    <div className="flex gap-2">
     <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200"><ChevronLeft size={20}/></button>
     <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200"><ChevronRight size={20}/></button>
    </div>
   </div>

   {/* Days Header */}
   <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 flex-shrink-0">
    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
      <div key={d} className="py-2 text-center text-[10px] md:text-xs font-semibold text-gray-500 uppercase">
        {d}
      </div>
    ))}
   </div>

   {/* Grid */}
   <div className="grid grid-cols-7 auto-rows-fr flex-1 overflow-y-auto min-h-0">
    {days.map((date, idx) => {
     if (!date) return <div key={idx} className="bg-gray-50/30 border-b border-r border-gray-100 min-h-[80px]"></div>;
     
     const isToday = date.toDateString() === new Date().toDateString();
     const events = getEventsForDay(date);

     return (
      <div key={idx} className={`border-b border-r border-gray-100 p-1 min-h-[80px] md:min-h-[100px] flex flex-col hover:bg-gray-50/50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
        <div className={`text-[10px] md:text-xs font-bold mb-1 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
          {date.getDate()}
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar">
          {events.map((ev, i) => renderEvent(ev, i))}
        </div>
      </div>
     );
    })}
   </div>
  </div>
 );
};

export default CalendarView;
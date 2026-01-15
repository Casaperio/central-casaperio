import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ZoomIn, ZoomOut, Users, Filter, XCircle } from 'lucide-react';
import MarqueeText from './MarqueeText';
import type { CalendarUnit, CalendarReservation } from '../services/staysApiService';
import { parseLocalDate, getTodayBrazil } from '../utils';

interface GeneralCalendarProps {
 units: CalendarUnit[];
 onReservationClick: (res: CalendarReservation) => void;
}

const GeneralCalendar: React.FC<GeneralCalendarProps> = ({ units, onReservationClick }) => {
 const [startDate, setStartDate] = useState(() => {
  const today = getTodayBrazil();
  today.setDate(today.getDate() - 2); // Start slightly before today
  return today;
 });
 
 // 1 = Out (3 Months), 2 = Mid (1 Month), 3 = In (2 Weeks)
 const [zoomLevel, setZoomLevel] = useState(2); 
 
 // Channel Filter State
 const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

 // Configuration based on Zoom Level
 const DAYS_TO_SHOW = zoomLevel === 1 ? 92 : zoomLevel === 2 ? 31 : 14; 
 const CELL_WIDTH = zoomLevel === 1 ? 24 : zoomLevel === 2 ? 48 : 120; 
 
 const CHANNELS = [
  { id: 'airbnb', label: 'Airbnb', color: 'bg-red-500' },
  { id: 'booking', label: 'Booking', color: 'bg-blue-600' },
  { id: 'expedia', label: 'Expedia', color: 'bg-yellow-400' },
  { id: 'vrbo', label: 'Vrbo', color: 'bg-gray-900' },
  { id: 'website', label: 'Website', color: 'bg-green-600' },
  { id: 'direto', label: 'Direto', color: 'bg-yellow-400' },
 ];

 // Generate Date Headers
 const dates = useMemo(() => {
  const arr = [];
  for (let i = 0; i < DAYS_TO_SHOW; i++) {
   const d = new Date(startDate);
   d.setDate(d.getDate() + i);
   arr.push(d);
  }
  return arr;
 }, [startDate, DAYS_TO_SHOW]);

 // Group dates by Month for the top header row
 const monthGroups = useMemo(() => {
   const groups: { name: string; count: number }[] = [];
   let currentMonth = '';
   let count = 0;

   dates.forEach((d) => {
     const mName = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
     if (mName !== currentMonth) {
       if (currentMonth) {
         groups.push({ name: currentMonth, count });
       }
       currentMonth = mName;
       count = 1;
     } else {
       count++;
     }
   });
   if (currentMonth) groups.push({ name: currentMonth, count });
   return groups;
 }, [dates]);

 const changeDate = (days: number) => {
  const newDate = new Date(startDate);
  newDate.setDate(newDate.getDate() + days);
  setStartDate(newDate);
 };

 const getPosition = (dateStr: string) => {
  const date = parseLocalDate(dateStr);
  const start = dates[0];
  
  const diffTime = date.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays * CELL_WIDTH;
 };

 const getWidth = (checkIn: string, checkOut: string) => {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(diffDays * CELL_WIDTH, CELL_WIDTH / 3);
 };

 const isVisible = (res: CalendarReservation) => {
  const viewStart = dates[0];
  const viewEnd = dates[dates.length - 1];
  const cin = parseLocalDate(res.startDate);
  const cout = parseLocalDate(res.endDate);
  // Standard intersection check
  return (cin < viewEnd && cout > viewStart);
 };

 const isChannelVisible = (res: CalendarReservation) => {
   if (selectedChannels.length === 0) return true;
   const ch = (res.platform || 'direto').toLowerCase();

   // Map fuzzy channel names to IDs
   let mappedId = 'direto';
   if (ch.includes('airbnb')) mappedId = 'airbnb';
   else if (ch.includes('booking')) mappedId = 'booking';
   else if (ch.includes('expedia')) mappedId = 'expedia';
   else if (ch.includes('vrbo')) mappedId = 'vrbo';
   else if (ch.includes('website') || ch.includes('site')) mappedId = 'website';
   else mappedId = 'direto';

   return selectedChannels.includes(mappedId);
 };

 const toggleChannel = (id: string) => {
   setSelectedChannels(prev =>
     prev.includes(id)
       ? prev.filter(c => c !== id)
       : [...prev, id]
   );
 };

 // Color Logic based on Channel (Origem)
 const getReservationColor = (res: CalendarReservation) => {
   const channel = res.platform?.toLowerCase() || '';

   if (channel.includes('airbnb')) return 'bg-red-500 border-red-600 text-white';
   if (channel.includes('booking')) return 'bg-blue-600 border-blue-700 text-white';
   if (channel.includes('expedia')) return 'bg-yellow-400 border-yellow-500 text-yellow-900';
   if (channel.includes('vrbo')) return 'bg-gray-900 border-black text-white';
   if (channel.includes('website') || channel.includes('site')) return 'bg-green-600 border-green-700 text-white';
   if (channel.includes('direto')) return 'bg-yellow-400 border-yellow-500 text-yellow-900';

   return 'bg-[#0F5B78] border-[#0d4d66] text-white'; // Fallback - teal like stays-observator
 };

 const todayPosition = useMemo(() => {
   const today = new Date();
   today.setHours(0,0,0,0);
   const start = new Date(dates[0]);
   start.setHours(0,0,0,0);
   if (today < start) return -1;
   const diffTime = today.getTime() - start.getTime();
   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
   if (diffDays >= DAYS_TO_SHOW) return -1;
   return (diffDays * CELL_WIDTH) + (CELL_WIDTH / 2);
 }, [dates, CELL_WIDTH, DAYS_TO_SHOW]);

 return (
  <div className="flex flex-col h-full bg-white border-t border-gray-200 animate-fade-in">
   
   {/* Controls Bar */}
   <div className="flex flex-col items-center justify-between flex-shrink-0 gap-3 p-3 bg-white border-b border-gray-200 md:flex-row">
     
     {/* Date Nav */}
     <div className="flex items-center gap-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
        <CalendarIcon className="text-brand-600" size={20} /> Mapa Geral
      </h2>
      <div className="flex items-center p-1 bg-gray-100 rounded-lg">
        <button onClick={() => changeDate(-7)} className="p-1 text-gray-600 rounded shadow-sm hover:bg-white"><ChevronLeft size={16}/></button>
        <span className="w-32 px-3 text-sm font-medium text-center text-gray-700 capitalize">
          {dates[0].toLocaleDateString('pt-BR', { month: 'short' })} - {dates[dates.length-1].toLocaleDateString('pt-BR', { month: 'short' })}
        </span>
        <button onClick={() => changeDate(7)} className="p-1 text-gray-600 rounded shadow-sm hover:bg-white"><ChevronRight size={16}/></button>
      </div>
      <button 
        onClick={() => { const d = getTodayBrazil(); d.setDate(d.getDate() - 2); setStartDate(d); }}
        className="text-xs font-medium text-brand-600 hover:underline"
      >
        Voltar pra Hoje
      </button>
     </div>
     
     {/* Zoom Control */}
     <div className="flex items-center gap-4">
       <div className="flex items-center gap-1 p-1 border border-gray-200 rounded-lg bg-gray-50">
         <button 
          onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))} 
          disabled={zoomLevel === 1}
          className="p-1 text-gray-600 rounded hover:bg-white disabled:opacity-30"
          title="Diminuir Zoom (Mais dias)"
         >
           <ZoomOut size={16} />
         </button>
         <span className="text-[10px] font-bold w-4 text-center">{zoomLevel}x</span>
         <button 
          onClick={() => setZoomLevel(Math.min(3, zoomLevel + 1))} 
          disabled={zoomLevel === 3}
          className="p-1 text-gray-600 rounded hover:bg-white disabled:opacity-30"
          title="Aumentar Zoom (Menos dias)"
         >
           <ZoomIn size={16} />
         </button>
       </div>
     </div>
   </div>

   {/* Origin Legend (Filter) */}
   <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 text-[10px] uppercase font-bold text-gray-500 justify-center md:justify-end items-center flex-shrink-0">
     <div className="flex items-center gap-2 pr-4 mr-2 border-r border-gray-300">
       <Filter size={12} /> Filtros:
     </div>
     
     {CHANNELS.map(ch => {
       const isSelected = selectedChannels.includes(ch.id);
       const isDimmed = selectedChannels.length > 0 && !isSelected;
       
       return (
         <button 
          key={ch.id}
          onClick={() => toggleChannel(ch.id)}
          className={`flex items-center gap-1 cursor-pointer transition-all ${isDimmed ? 'opacity-30 grayscale hover:opacity-70' : 'opacity-100 scale-105'}`}
         >
           <div className={`w-2.5 h-2.5 rounded-sm ${ch.color}`}></div> 
           <span className={isSelected ? 'text-gray-900 border-b border-gray-900' : ''}>{ch.label}</span>
         </button>
       );
     })}

     {selectedChannels.length > 0 && (
       <button 
        onClick={() => setSelectedChannels([])}
        className="ml-2 flex items-center gap-1 text-red-500 hover:text-red-700 bg-white px-2 py-0.5 rounded border border-red-200"
       >
         <XCircle size={12} /> Limpar
       </button>
     )}
   </div>

   {/* Main Scroll Container */}
   <div className="relative flex-1 overflow-auto custom-scrollbar">
     <div className="min-w-fit">
       
       {/* Sticky Headers Wrapper */}
       <div className="sticky top-0 z-30 bg-white shadow-sm">
         {/* Month Row */}
         <div className="flex border-b border-gray-100">
           <div className="w-40 min-w-[160px] sticky left-0 z-40 bg-gray-50 border-r border-gray-200"></div>
           {monthGroups.map((group, idx) => (
             <div 
              key={idx}
              className="flex items-center justify-center py-1 text-xs font-bold tracking-wider text-gray-600 uppercase border-r border-gray-200 bg-gray-50"
              style={{ width: group.count * CELL_WIDTH }}
             >
               {group.name}
             </div>
           ))}
         </div>

         {/* Days Row */}
         <div className="flex border-b border-gray-200">
           <div className="w-40 min-w-[160px] sticky left-0 z-40 bg-white border-r border-gray-200 p-2 flex items-center font-bold text-xs text-gray-500 uppercase tracking-wider shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
             Imóvel
           </div>
           <div className="flex">
             {dates.map((d, i) => {
               const isWeekend = d.getDay() === 0 || d.getDay() === 6;
               const today = getTodayBrazil();
               const isTodayDate = d.toDateString() === today.toDateString();
               return (
                 <div 
                  key={i} 
                  style={{ width: CELL_WIDTH }} 
                  className={`flex flex-col items-center justify-center border-r border-gray-200 py-1 ${isTodayDate ? 'bg-brand-50' : isWeekend ? 'bg-gray-100/50' : ''}`}
                 >
                   <span className={`text-[9px] uppercase ${isTodayDate ? 'text-brand-600 font-bold' : 'text-gray-400'}`}>
                     {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                   </span>
                   <span className={`text-xs font-bold ${isTodayDate ? 'text-brand-700' : 'text-gray-700'}`}>
                     {d.getDate()}
                   </span>
                 </div>
               );
             })}
           </div>
         </div>
       </div>

       {/* Calendar Body */}
       <div className="relative">
         
         {/* Today Indicator Line */}
         {todayPosition > 0 && (
           <div 
            className="absolute top-0 bottom-0 z-10 border-l-2 border-red-400 opacity-50 pointer-events-none"
            style={{ left: `calc(160px + ${todayPosition}px)` }} 
           ></div>
         )}

         {units.map((unit) => {
           const rowReservations = unit.reservations.filter(r => isVisible(r) && isChannelVisible(r));

           return (
             <div key={unit.id} className="flex h-12 transition-colors border-b border-gray-100 hover:bg-gray-50/50">
               {/* Property Column (Sticky Left) */}
               <div className="w-40 min-w-[160px] sticky left-0 z-20 bg-white border-r border-gray-200 flex items-center px-3 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                 <span className="text-xs font-bold text-gray-700 truncate" title={unit.name || unit.code}>{unit.code}</span>
               </div>

               {/* Row Timeline */}
               <div className="relative flex h-full">
                 {/* Background Grid Cells */}
                 {dates.map((d, i) => {
                   const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                   return (
                     <div
                      key={i}
                      style={{ width: CELL_WIDTH }}
                      className={`border-r border-gray-100 h-full ${isWeekend ? 'bg-gray-50/30' : ''}`}
                     ></div>
                   );
                 })}

                 {/* Reservation Bars */}
                 {rowReservations.map(res => {
                   const left = getPosition(res.startDate);
                   const width = getWidth(res.startDate, res.endDate);
                   const renderLeft = Math.max(left, -10);
                   const renderWidth = (left < 0) ? Math.max(width + left, 0) : width;
                   const isBlocked = res.type === 'blocked';

                   if (renderWidth <= 0) return null;

                   return (
                     <div
                      key={res.id}
                      onClick={() => onReservationClick(res)}
                      style={{
                        left: `${renderLeft}px`,
                        width: `${renderWidth - 2}px`
                      }}
                      className={`absolute top-1.5 bottom-1.5 rounded-full border shadow-sm cursor-pointer hover:brightness-95 hover:-translate-y-px transition-all flex items-center px-1 overflow-hidden z-10 ${isBlocked ? 'bg-[#E74C3C] border-[#c0392b] text-white' : getReservationColor(res)}`}
                      title={`${res.guestName} - ${res.guestCount} Pax\n${res.platform || 'Direto'}\n${parseLocalDate(res.startDate).toLocaleDateString('pt-BR')} -> ${parseLocalDate(res.endDate).toLocaleDateString('pt-BR')}`}
                     >
                       <MarqueeText className="flex items-center w-full h-full text-[10px]">
                         {/* Platform Icon */}
                         {res.platformImage && (
                           <img
                             src={res.platformImage}
                             alt={res.platform || 'Platform'}
                             title={res.platform || 'Platform'}
                             className="w-4 h-4 object-contain mx-0.5 shrink-0 rounded-sm"
                           />
                         )}
                         {/* Guest Name */}
                         <span className="mx-1 font-bold whitespace-nowrap">{res.guestName}</span>
                         {/* Guest Count */}
                         <span className="opacity-90 text-[12px] whitespace-nowrap mx-1 shrink-0 flex items-center gap-0.5">
                           <Users size={12} /> {res.guestCount}
                         </span>
                       </MarqueeText>
                     </div>
                   );
                 })}
               </div>
             </div>
           );
         })}
       </div>
     </div>
   </div>
  </div>
 );
};

export default GeneralCalendar;

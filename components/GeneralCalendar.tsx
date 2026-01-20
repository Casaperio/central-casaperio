import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ZoomIn, ZoomOut, Users, Filter, XCircle, Maximize2, Minimize2 } from 'lucide-react';
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
  today.setDate(today.getDate() - 2);
  return today;
 });
 
 // Channel Filter State
 const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

 // Fullscreen State
 const [isFullscreen, setIsFullscreen] = useState(false);

 // Zoom density (modo normal)
 const [normalZoomDensity, setNormalZoomDensity] = useState(1.0);
 
 // Zoom density (modo canvas/tela cheia) - MÍNIMO 1.0x
 const [canvasZoomDensity, setCanvasZoomDensity] = useState(1.0);

 // Container ref for canvas calculations
 const canvasContainerRef = useRef<HTMLDivElement>(null);
 const fullscreenWrapperRef = useRef<HTMLDivElement>(null);
 const [canvasViewport, setCanvasViewport] = useState({ width: 0, height: 0 });

 // === MODO NORMAL: CONFIGURAÇÃO COM ZOOM (0.5x - 2.0x) ===
 const calculateNormalLayout = () => {
  const baseDays = 31;
  const daysToShow = Math.round(baseDays / normalZoomDensity);
  const cellWidth = 48 * normalZoomDensity;
  const rowHeight = 48;
  
  return {
   DAYS: daysToShow,
   CELL_WIDTH: cellWidth,
   ROW_HEIGHT: rowHeight,
   PROPERTY_COLUMN_WIDTH: 160,
  };
 };

 const normalLayout = calculateNormalLayout();

 // === MODO CANVAS: COLUNA FIXA + GRID RESPONSÍVO (ZOOM 1.0x - 3.0x) ===
 const calculateCanvasLayout = () => {
  if (!isFullscreen || canvasViewport.width === 0) {
   return normalLayout;
  }

  const HEADER_HEIGHT = 140;
  const PADDING = 20;

  // Área útil total da viewport
  const totalWidth = canvasViewport.width - PADDING;
  const totalHeight = canvasViewport.height - HEADER_HEIGHT - PADDING;

  // COLUNA FIXA: Largura responsíva mas NÃO afetada pelo zoom
  const viewportWidth = canvasViewport.width;
  let fixedColumnWidth = 160; // Desktop padrão
  
  if (viewportWidth < 1024) {
   fixedColumnWidth = 120; // Tablets
  } else if (viewportWidth < 768) {
   fixedColumnWidth = 100; // Mobile
  } else if (viewportWidth >= 1920) {
   fixedColumnWidth = 200; // Telas grandes
  }

  // Canvas sempre mostra 6 MESES (180 dias)
  const canvasBaseDays = 180;
  
  // Largura disponível para o grid (descontando coluna fixa)
  const gridWidth = totalWidth - fixedColumnWidth;
  
  // Cálculo base: cabe exatamente sem zoom
  const baseCellWidth = gridWidth / canvasBaseDays;
  const baseRowHeight = totalHeight / Math.max(units.length, 1);

  // ZOOM afeta APENAS o grid (não a coluna)
  const cellWidth = baseCellWidth * canvasZoomDensity;
  const rowHeight = Math.max(24, baseRowHeight * canvasZoomDensity);

  return {
   DAYS: canvasBaseDays,
   CELL_WIDTH: cellWidth,
   ROW_HEIGHT: rowHeight,
   PROPERTY_COLUMN_WIDTH: fixedColumnWidth, // SEMPRE FIXA
  };
 };

 const canvasLayout = isFullscreen ? calculateCanvasLayout() : normalLayout;

 // Configuração ativa (condicional baseada no modo)
 const CONFIG = isFullscreen ? canvasLayout : normalLayout;

 const CHANNELS = [
  { id: 'airbnb', label: 'Airbnb', color: 'bg-red-500' },
  { id: 'booking', label: 'Booking', color: 'bg-blue-600' },
  { id: 'expedia', label: 'Expedia', color: 'bg-yellow-400' },
  { id: 'vrbo', label: 'Vrbo', color: 'bg-gray-900' },
  { id: 'website', label: 'Website', color: 'bg-green-600' },
  { id: 'direto', label: 'Direto', color: 'bg-yellow-400' },
 ];

 // Fullscreen API - ativar/desativar fullscreen real do navegador
 useEffect(() => {
  if (!fullscreenWrapperRef.current) return;

  const enterFullscreen = async () => {
   try {
    if (fullscreenWrapperRef.current && !document.fullscreenElement) {
     await fullscreenWrapperRef.current.requestFullscreen();
    }
   } catch (err) {
    console.warn('Fullscreen não disponível:', err);
   }
  };

  const exitFullscreen = async () => {
   try {
    if (document.fullscreenElement) {
     await document.exitFullscreen();
    }
   } catch (err) {
    console.warn('Erro ao sair do fullscreen:', err);
   }
  };

  if (isFullscreen) {
   enterFullscreen();
  } else {
   exitFullscreen();
  }

  // Listener para quando usuário sai do fullscreen com ESC
  const handleFullscreenChange = () => {
   if (!document.fullscreenElement && isFullscreen) {
    setIsFullscreen(false);
    setCanvasZoomDensity(1.0);
   }
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
 }, [isFullscreen]);
 // Track canvas dimensions
 useEffect(() => {
  if (!isFullscreen || !canvasContainerRef.current) return;

  const updateDimensions = () => {
   if (canvasContainerRef.current) {
    setCanvasViewport({
     width: canvasContainerRef.current.clientWidth,
     height: canvasContainerRef.current.clientHeight,
    });
   }
  };

  updateDimensions();
  window.addEventListener('resize', updateDimensions);
  return () => window.removeEventListener('resize', updateDimensions);
 }, [isFullscreen]);

 // Zoom com scroll do mouse no canvas (estilo Google Maps)
 useEffect(() => {
  if (!isFullscreen || !canvasContainerRef.current) return;

  const handleWheel = (e: WheelEvent) => {
   e.preventDefault();
   
   const zoomSpeed = 0.1;
   const delta = -Math.sign(e.deltaY) * zoomSpeed;
   
   setCanvasZoomDensity(prev => {
    const newZoom = prev + delta;
    // LIMITE: 1.0x (mínimo) a 3.0x (máximo)
    return Math.max(1.0, Math.min(3.0, newZoom));
   });
  };

  const container = canvasContainerRef.current;
  container.addEventListener('wheel', handleWheel, { passive: false });
  
  return () => {
   container.removeEventListener('wheel', handleWheel);
  };
 }, [isFullscreen]);

 // Generate Date Headers
 const dates = useMemo(() => {
  const arr = [];
  for (let i = 0; i < CONFIG.DAYS; i++) {
   const d = new Date(startDate);
   d.setDate(d.getDate() + i);
   arr.push(d);
  }
  return arr;
 }, [startDate, CONFIG.DAYS]);

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

 // Zoom controls (separados por modo)
 const handleZoomIn = () => {
  if (!isFullscreen) {
   setNormalZoomDensity(prev => Math.min(prev + 0.25, 2.0));
  } else {
   setCanvasZoomDensity(prev => Math.min(prev + 0.25, 3.0));
  }
 };

 const handleZoomOut = () => {
  if (!isFullscreen) {
   setNormalZoomDensity(prev => Math.max(prev - 0.25, 0.5));
  } else {
   // Canvas: MÍNIMO 1.0x
   setCanvasZoomDensity(prev => Math.max(prev - 0.25, 1.0));
  }
 };

 const handleResetZoom = () => {
  if (!isFullscreen) {
   setNormalZoomDensity(1.0);
  } else {
   setCanvasZoomDensity(1.0);
  }
 };

 const getPosition = (dateStr: string) => {
  const date = parseLocalDate(dateStr);
  const start = dates[0];
  
  const diffTime = date.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays * CONFIG.CELL_WIDTH;
 };

 const getWidth = (checkIn: string, checkOut: string) => {
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(diffDays * CONFIG.CELL_WIDTH, CONFIG.CELL_WIDTH / 3);
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
   if (diffDays >= CONFIG.DAYS) return -1;
   return (diffDays * CONFIG.CELL_WIDTH) + (CONFIG.CELL_WIDTH / 2);
 }, [dates, CONFIG.CELL_WIDTH, CONFIG.DAYS]);

 // Get zoom display text (formato multiplicador)
 const getZoomText = () => {
  const activeZoom = isFullscreen ? canvasZoomDensity : normalZoomDensity;
  return `${activeZoom.toFixed(1)}x`;
 };

 return (
  <div 
   ref={fullscreenWrapperRef}
   className={`flex flex-col bg-white border-t border-gray-200 animate-fade-in ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}
  >
   
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
     
     {/* Zoom Control + Fullscreen Button */}
     <div className="flex items-center gap-4">
       {/* Zoom Controls (ambos os modos) */}
       <div className="flex items-center gap-1 p-1 border border-gray-200 rounded-lg bg-gray-50">
         <button 
          onClick={handleZoomOut}
          disabled={isFullscreen ? canvasZoomDensity <= 1.0 : normalZoomDensity <= 0.5}
          className="p-1 text-gray-600 rounded hover:bg-white disabled:opacity-30"
          title="Zoom Out"
         >
           <ZoomOut size={16} />
         </button>
         <span className="text-[10px] font-bold px-2 text-center min-w-[50px]">{getZoomText()}</span>
         <button 
          onClick={handleZoomIn}
          disabled={isFullscreen ? canvasZoomDensity >= 3.0 : normalZoomDensity >= 2.0}
          className="p-1 text-gray-600 rounded hover:bg-white disabled:opacity-30"
          title="Zoom In"
         >
           <ZoomIn size={16} />
         </button>
         <button
          onClick={handleResetZoom}
          className="ml-1 px-2 py-1 text-[10px] font-medium text-brand-600 rounded hover:bg-white"
          title="Reset Zoom"
         >
           Reset
         </button>
       </div>

       {/* Fullscreen Toggle Button */}
       <button
         onClick={() => {
          setIsFullscreen(!isFullscreen);
          if (!isFullscreen) {
           setCanvasZoomDensity(1.0); // Reset canvas zoom when entering fullscreen
          }
         }}
         className="flex items-center gap-2 p-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-brand-300 hover:text-brand-600 transition-colors"
         title={isFullscreen ? "Sair do Modo Tela Cheia" : "Ativar Modo Tela Cheia"}
       >
         {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
         <span className="text-xs font-medium hidden md:inline">
           {isFullscreen ? "Sair" : "Tela Cheia"}
         </span>
       </button>
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
   <div 
     ref={canvasContainerRef}
     className="relative flex-1 custom-scrollbar"
     style={{
       overflow: isFullscreen && canvasZoomDensity === 1.0 ? 'hidden' : 'auto'
     }}
   >
     <div className="min-w-fit">
       
       {/* Sticky Headers Wrapper */}
       <div className="sticky top-0 z-30 bg-white shadow-sm">
         {/* Month Row */}
         <div className="flex border-b border-gray-100">
           <div 
            className="sticky left-0 z-40 bg-gray-50 border-r border-gray-200"
            style={{ width: CONFIG.PROPERTY_COLUMN_WIDTH, minWidth: CONFIG.PROPERTY_COLUMN_WIDTH }}
           ></div>
           {monthGroups.map((group, idx) => (
             <div 
              key={idx}
              className="flex items-center justify-center py-1 text-xs font-bold tracking-wider text-gray-600 uppercase border-r border-gray-200 bg-gray-50"
              style={{ width: group.count * CONFIG.CELL_WIDTH }}
             >
               {group.name}
             </div>
           ))}
         </div>

         {/* Days Row */}
         <div className="flex border-b border-gray-200">
           <div 
            className="sticky left-0 z-40 bg-white border-r border-gray-200 p-2 flex items-center font-bold uppercase tracking-wider shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]"
            style={{ 
             width: CONFIG.PROPERTY_COLUMN_WIDTH, 
             minWidth: CONFIG.PROPERTY_COLUMN_WIDTH,
             fontSize: isFullscreen && CONFIG.PROPERTY_COLUMN_WIDTH < 100 ? '9px' : '11px'
            }}
           >
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
                  style={{ width: CONFIG.CELL_WIDTH }} 
                  className={`flex flex-col items-center justify-center border-r border-gray-200 py-1 ${isTodayDate ? 'bg-brand-50' : isWeekend ? 'bg-gray-100/50' : ''}`}
                 >
                   {CONFIG.CELL_WIDTH >= 40 && (
                     <span 
                      className={`uppercase ${isTodayDate ? 'text-brand-600 font-bold' : 'text-gray-400'}`}
                      style={{ fontSize: Math.max(8, CONFIG.CELL_WIDTH / 6) }}
                     >
                       {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                     </span>
                   )}
                   <span 
                    className={`font-bold ${isTodayDate ? 'text-brand-700' : 'text-gray-700'}`}
                    style={{ fontSize: Math.max(10, CONFIG.CELL_WIDTH / 4) }}
                   >
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
            style={{ left: `calc(${CONFIG.PROPERTY_COLUMN_WIDTH}px + ${todayPosition}px)` }} 
           ></div>
         )}

         {units.map((unit) => {
           const rowReservations = unit.reservations.filter(r => isVisible(r) && isChannelVisible(r));

           return (
             <div 
              key={unit.id}
              className="flex border-b border-gray-200 transition-colors hover:bg-gray-50/50"
              style={{ height: CONFIG.ROW_HEIGHT }}
             >
               {/* Property Column (Sticky Left) */}
               <div 
                className="sticky left-0 z-20 bg-white border-r border-gray-200 flex items-center shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]"
                style={{ 
                 width: CONFIG.PROPERTY_COLUMN_WIDTH, 
                 minWidth: CONFIG.PROPERTY_COLUMN_WIDTH,
                 paddingLeft: Math.max(6, CONFIG.PROPERTY_COLUMN_WIDTH * 0.05),
                 paddingRight: Math.max(6, CONFIG.PROPERTY_COLUMN_WIDTH * 0.05)
                }}
               >
                 <span 
                  className="font-bold text-gray-700 truncate" 
                  title={unit.name || unit.code}
                  style={{ 
                   fontSize: CONFIG.PROPERTY_COLUMN_WIDTH < 120 ? '9px' : CONFIG.PROPERTY_COLUMN_WIDTH < 160 ? '10px' : '11px'
                  }}
                 >{unit.code}</span>
               </div>

               {/* Row Timeline */}
               <div className="relative flex h-full">
                 {/* Background Grid Cells */}
                 {dates.map((d, i) => {
                   const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                   return (
                     <div
                      key={i}
                      style={{ width: CONFIG.CELL_WIDTH }}
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

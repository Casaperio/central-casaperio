
import React, { useMemo, useState } from 'react';
import { GuestFeedback, Ticket, Reservation, UserWithPassword } from '../types';
import { MessageSquare, Star, Wrench, Home, Trophy, UserCircle, TrendingUp, TrendingDown, Calendar, Globe } from 'lucide-react';

interface FeedbackPanelProps {
 generalFeedbacks: GuestFeedback[]; // From "Avaliar Estadia"
 tickets: Ticket[]; // To extract ticket-specific feedback
 reservations: Reservation[]; // To link feedback to responsible person AND Channel reviews
 users?: UserWithPassword[];
}

interface UnifiedFeedbackItem {
 id: string;
 type: 'general' | 'ticket' | 'channel';
 property: string;
 guest: string;
 rating: number;
 comment: string;
 date: number;
 context: string;
 ticketDesc?: string;
 responsibleName?: string;
 channelName?: string;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ generalFeedbacks, tickets, reservations, users }) => {
 
 // Filter State
 const [dateFilter, setDateFilter] = useState<'month' | 'ytd'>('month');

 // Combine sources into a single list and link to responsible
 const allFeedbacks = useMemo(() => {
  const list: UnifiedFeedbackItem[] = [];
  
  // Dates for filtering
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Helper Filter Function
  const matchesFilter = (timestamp: number) => {
    const d = new Date(timestamp);
    if (dateFilter === 'ytd') {
      return d.getFullYear() === currentYear;
    } else {
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }
  };

  // Helper to find responsible
  const findResponsible = (prop: string, guest: string) => {
    // Fuzzy match: check if reservation matches property and guest name contains
    const res = reservations.find(r => 
      r.propertyCode === prop && 
      (r.guestName.toLowerCase().includes(guest.toLowerCase()) || guest.toLowerCase().includes(r.guestName.split(' ')[0].toLowerCase()))
    );
    return res?.responsibleName || 'Não atribuído';
  };

  // 1. General Feedbacks (Kiosk/Manual)
  generalFeedbacks.forEach(f => {
   if (matchesFilter(f.createdAt)) {
    list.push({
      id: f.id,
      type: 'general',
      property: f.propertyCode,
      guest: f.guestName,
      rating: f.rating,
      comment: f.comment,
      date: f.createdAt,
      context: 'Avaliação de Estadia',
      responsibleName: findResponsible(f.propertyCode, f.guestName)
    });
   }
  });

  // 2. Ticket Feedbacks (Maintenance)
  tickets.forEach(t => {
   if (t.guestFeedback && matchesFilter(t.guestFeedback.createdAt)) {
    list.push({
     id: `ticket-${t.id}`,
     type: 'ticket',
     property: t.propertyCode,
     guest: 'Hóspede', 
     rating: t.guestFeedback.rating,
     comment: t.guestFeedback.comment,
     date: t.guestFeedback.createdAt,
     context: `Chamado: ${t.serviceType}`,
     ticketDesc: t.description,
     responsibleName: t.assignee || 'Não atribuído' // For tickets, assignee is responsible
    });
   }
  });

  // 3. Channel Feedbacks (From Stays Reservations)
  reservations.forEach(r => {
    // Use Check-out date as the review date approx if created not available, 
    // usually reviews come after checkout.
    const reviewDate = new Date(r.checkOutDate).getTime();
    
    if (r.channelRating && matchesFilter(reviewDate)) {
      list.push({
        id: `res-channel-${r.id}`,
        type: 'channel',
        property: r.propertyCode,
        guest: r.guestName,
        rating: r.channelRating, // Assuming 1-5 or normalized
        comment: r.channelReview || 'Avaliação sem comentário.',
        date: reviewDate,
        context: `Via ${r.channel || 'Canal'}`,
        responsibleName: r.responsibleName || 'Não atribuído',
        channelName: r.channel || 'OTA'
      });
    }
  });

  return list.sort((a, b) => b.date - a.date);
 }, [generalFeedbacks, tickets, reservations, dateFilter]);

 // --- STATS LOGIC ---
 
 const stats = useMemo(() => {
   // 1. Guest Ranking
   const guestMap: Record<string, { total: number, count: number }> = {};
   
   // 2. Property Ranking (Current Month vs Prev Month vs YTD)
   const propMap: Record<string, { 
     currTotal: number, currCount: number, 
     prevTotal: number, prevCount: number,
     ytdTotal: number, ytdCount: number 
   }> = {};

   const now = new Date();
   const currMonth = now.getMonth();
   const currYear = now.getFullYear();
   const prevMonth = currMonth === 0 ? 11 : currMonth - 1;
   const prevMonthYear = currMonth === 0 ? currYear - 1 : currYear;

   // We re-iterate FULL data for stats to ensure comparisons (Prev Month/YTD) work 
   // regardless of the active visual filter
   const processItem = (rating: number, prop: string, responsible: string | undefined, type: string, dateTs: number) => {
     
     // Guest Relation Stats (Include General & Channel reviews)
     if (responsible && responsible !== 'Não atribuído' && (type === 'general' || type === 'channel')) {
       // Only apply if matches current active filter logic roughly? 
       // Actually for ranking, usually we show YTD or Month. Let's align with the dateFilter.
       
       const d = new Date(dateTs);
       const m = d.getMonth();
       const y = d.getFullYear();
       
       let includeInGuestRanking = false;
       if (dateFilter === 'ytd' && y === currYear) includeInGuestRanking = true;
       if (dateFilter === 'month' && y === currYear && m === currMonth) includeInGuestRanking = true;

       if (includeInGuestRanking) {
         if (!guestMap[responsible]) guestMap[responsible] = { total: 0, count: 0 };
         guestMap[responsible].total += rating;
         guestMap[responsible].count++;
       }
     }

     // Property Stats
     if (!propMap[prop]) propMap[prop] = { currTotal: 0, currCount: 0, prevTotal: 0, prevCount: 0, ytdTotal: 0, ytdCount: 0 };
     
     const d = new Date(dateTs);
     const m = d.getMonth();
     const y = d.getFullYear();

     // YTD
     if (y === currYear) {
       propMap[prop].ytdTotal += rating;
       propMap[prop].ytdCount++;
     }

     // Current Month
     if (y === currYear && m === currMonth) {
       propMap[prop].currTotal += rating;
       propMap[prop].currCount++;
     }

     // Prev Month
     if (y === prevMonthYear && m === prevMonth) {
       propMap[prop].prevTotal += rating;
       propMap[prop].prevCount++;
     }
   };

   // Loop All Sources again for Stats (without filter)
   generalFeedbacks.forEach(f => processItem(f.rating, f.propertyCode, 
    reservations.find(r => r.propertyCode === f.propertyCode && r.guestName.includes(f.guestName))?.responsibleName, 
    'general', f.createdAt));
   
   tickets.forEach(t => {
     if (t.guestFeedback) processItem(t.guestFeedback.rating, t.propertyCode, t.assignee || undefined, 'ticket', t.guestFeedback.createdAt);
   });

   reservations.forEach(r => {
     if (r.channelRating) processItem(r.channelRating, r.propertyCode, r.responsibleName, 'channel', new Date(r.checkOutDate).getTime());
   });

   const guestRanking = Object.keys(guestMap).map(name => ({
     name,
     avg: guestMap[name].total / guestMap[name].count,
     count: guestMap[name].count
   })).sort((a,b) => b.avg - a.avg);

   const propRanking = Object.keys(propMap).map(code => ({
     code,
     currAvg: propMap[code].currCount ? (propMap[code].currTotal / propMap[code].currCount) : 0,
     prevAvg: propMap[code].prevCount ? (propMap[code].prevTotal / propMap[code].prevCount) : 0,
     ytdAvg: propMap[code].ytdCount ? (propMap[code].ytdTotal / propMap[code].ytdCount) : 0,
     countYtd: propMap[code].ytdCount
   })).sort((a,b) => b.currAvg - a.currAvg); // Default sort by current month performance

   return { guestRanking, propRanking };
 }, [generalFeedbacks, tickets, reservations, dateFilter]);

 const renderStars = (rating: number) => {
  return (
   <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
     <Star 
      key={star} 
      size={14} 
      className={`${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
     />
    ))}
   </div>
  );
 };

 const getTypeBadge = (type: string, channelName?: string) => {
   if (type === 'general') return (
     <div className="px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 bg-green-50 text-green-700">
       <Home size={12}/> Estadia
     </div>
   );
   if (type === 'channel') return (
     <div className="px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 bg-purple-50 text-purple-700">
       <Globe size={12}/> {channelName || 'Canal'}
     </div>
   );
   return (
     <div className="px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 bg-brand-50 text-brand-700">
       <Wrench size={12}/> Manutenção
     </div>
   );
 };

 return (
  <div className="space-y-8 animate-fade-in pb-20">
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex items-center gap-3">
      <div className="bg-green-100 p-2 rounded-lg text-green-700">
      <MessageSquare size={24} />
      </div>
      <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900">Avaliações & Qualidade</h2>
      <p className="text-gray-500 text-sm">Feedback de Hóspedes (Tablet, Stays e Manutenção).</p>
      </div>
    </div>

    {/* DATE FILTER */}
    <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
      <button 
        onClick={() => setDateFilter('month')}
        className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all flex items-center gap-2 ${dateFilter === 'month' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <Calendar size={14} /> Mês Atual
      </button>
      <button 
        onClick={() => setDateFilter('ytd')}
        className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all flex items-center gap-2 ${dateFilter === 'ytd' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <TrendingUp size={14} /> Acumulado Ano
      </button>
    </div>
   </div>

   {/* STATISTICS SECTION */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     
     {/* Guest Relations Ranking */}
     <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
       <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
         <Trophy size={18} className="text-yellow-500" /> Top Guest Relations
       </h3>
       <p className="text-xs text-gray-400 mb-4">{dateFilter === 'month' ? 'Performance do Mês' : 'Performance do Ano'}</p>
       <div className="space-y-4">
         {stats.guestRanking.length === 0 ? (
           <p className="text-sm text-gray-400 italic">Sem dados suficientes neste período.</p>
         ) : (
           stats.guestRanking.slice(0, 5).map((g, idx) => (
             <div key={g.name} className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                   {idx + 1}
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-800">{g.name}</p>
                   <p className="text-xs text-gray-500">{g.count} avaliações</p>
                 </div>
               </div>
               <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded text-green-700 font-bold text-sm">
                 {g.avg.toFixed(1)} <Star size={12} fill="currentColor" />
               </div>
             </div>
           ))
         )}
       </div>
     </div>

     {/* Property Performance Table */}
     <div className="lg:col-span-2 bg-white p-6 rounded-none shadow-sm border border-gray-200 overflow-hidden flex flex-col">
       <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
         <Home size={18} className="text-blue-500" /> Ranking de Qualidade por Imóvel
       </h3>
       <div className="overflow-auto flex-1">
         <table className="w-full text-sm text-left">
           <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
             <tr>
               <th className="p-3 rounded-l-lg">Imóvel</th>
               <th className="p-3 text-center">Mês Atual</th>
               <th className="p-3 text-center">Mês Anterior</th>
               <th className="p-3 text-center rounded-r-lg">Acumulado Ano</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {stats.propRanking.slice(0, 5).map(p => (
               <tr key={p.code}>
                 <td className="p-3 font-medium text-gray-900">{p.code}</td>
                 <td className="p-3 text-center">
                   {p.currAvg > 0 ? (
                     <span className={`font-bold ${p.currAvg >= 4.5 ? 'text-green-600' : p.currAvg < 4 ? 'text-red-500' : 'text-yellow-600'}`}>
                       {p.currAvg.toFixed(1)}
                     </span>
                   ) : <span className="text-gray-300">-</span>}
                 </td>
                 <td className="p-3 text-center">
                   <div className="flex items-center justify-center gap-1">
                     <span className="text-gray-600">{p.prevAvg > 0 ? p.prevAvg.toFixed(1) : '-'}</span>
                     {p.currAvg > 0 && p.prevAvg > 0 && (
                       p.currAvg >= p.prevAvg 
                        ? <TrendingUp size={12} className="text-green-500" />
                        : <TrendingDown size={12} className="text-red-500" />
                     )}
                   </div>
                 </td>
                 <td className="p-3 text-center font-bold text-gray-700">
                   {p.ytdAvg > 0 ? p.ytdAvg.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-400">({p.countYtd})</span>
                 </td>
               </tr>
             ))}
             {stats.propRanking.length === 0 && (
               <tr><td colSpan={4} className="p-4 text-center text-gray-400">Sem dados de avaliações.</td></tr>
             )}
           </tbody>
         </table>
       </div>
     </div>
   </div>

   <div className="h-px bg-gray-200"></div>

   {/* FEEDBACK LIST */}
   <h3 className="text-lg font-bold text-gray-800">
     Últimos Feedbacks 
     <span className="ml-2 text-sm font-normal text-gray-500">
       ({dateFilter === 'month' ? 'Mês Atual' : 'Este Ano'})
     </span>
   </h3>
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {allFeedbacks.length === 0 ? (
     <div className="col-span-full text-center py-20 bg-white rounded-none border border-gray-200">
      <p className="text-gray-400">Nenhuma avaliação encontrada para este período.</p>
     </div>
    ) : (
     allFeedbacks.map(item => (
      <div key={item.id} className="bg-white p-6 rounded-none shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
         {getTypeBadge(item.type, item.channelName)}
         <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
        </div>

        <div className="mb-2">
         <h3 className="font-bold text-gray-900 text-lg">{item.property}</h3>
         <div className="flex justify-between items-start">
           <p className="text-sm text-gray-500">{item.guest}</p>
           {item.responsibleName && item.responsibleName !== 'Não atribuído' && (
             <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1" title="Responsável">
               <UserCircle size={10} /> {item.responsibleName.split(' ')[0]}
             </span>
           )}
         </div>
         {item.ticketDesc && (
          <p className="text-xs text-gray-400 italic mt-1 line-clamp-1">"{item.ticketDesc}"</p>
         )}
        </div>

        <div className="mb-4">
         {renderStars(item.rating)}
        </div>

        <div className="bg-gray-50 p-3 rounded-lg flex-1">
         <p className="text-gray-700 text-sm italic">"{item.comment || 'Sem comentário.'}"</p>
        </div>
      </div>
     ))
    )}
   </div>
  </div>
 );
};

export default FeedbackPanel;
import React, { useState, useEffect, useMemo } from 'react';
import { Reservation, Ticket, GuestTip, GuestFeedback, ServiceTypeDefinition, AfterHoursConfig, ConciergeOffer, TicketCategory, TicketStatus, UserWithPassword } from '../types';
import { generateId, formatCurrency, getValidAssignees, formatDatePtBR } from '../utils';
import RatingStars from './shared/RatingStars';
import { isAutomaticCheckoutTicket } from '../utils/ticketFilters';
import {
 Home, Wrench, MessageSquare, Star, Plus, X, Info,
 MapPin, Clock, Calendar, CheckCircle2, Tag,
 Wifi, Image as ImageIcon, Check, User, ChevronRight,
 Sun, Cloud, CloudRain, CloudLightning, Wind, CloudDrizzle, CloudSun,
 ArrowLeft
} from 'lucide-react';
import GuestCommunicator from './GuestCommunicator';
import TicketForm from './TicketForm';
import { getWeatherForecast, WeatherData } from '../services/geminiService';
import WeatherForecastCard from './tablet/WeatherForecastCard';

interface TabletAppProps {
 propertyCode: string;
 propertyName: string;
 currentReservation: Reservation | null;
 tips: GuestTip[];
 tickets: Ticket[];
 users: UserWithPassword[];
 serviceTypes: (string | ServiceTypeDefinition)[];
 afterHoursConfig?: AfterHoursConfig;
 conciergeOffers: ConciergeOffer[];
 onAddTicket: (ticket: any) => void;
 onAddFeedback: (feedback: GuestFeedback) => void;
 onTicketFeedback: (ticketId: string, rating: number, comment: string) => void;
 onUpdateOffer: (offer: ConciergeOffer) => void;
}

const normalizeGuestName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

const hasTicketRating = (ticket: Ticket): boolean => {
  return typeof ticket.rating === 'number' || typeof ticket.guestFeedback?.rating === 'number';
};

const TabletApp: React.FC<TabletAppProps> = ({
 propertyCode,
 propertyName,
 currentReservation,
 tips,
 tickets,
 users,
 serviceTypes,
 afterHoursConfig,
 conciergeOffers,
 onAddTicket,
 onAddFeedback,
 onTicketFeedback,
 onUpdateOffer
}) => {
 const [activeTab, setActiveTab] = useState<'home' | 'concierge' | 'services' | 'tips' | 'stay'>('home');
 const [showTicketModal, setShowTicketModal] = useState(false);
 const [ticketCategory, setTicketCategory] = useState<TicketCategory>('maintenance');
 
 // Weather State
 const [weather, setWeather] = useState<WeatherData | null>(null);
 
 // Concierge State
 const [selectedOffer, setSelectedOffer] = useState<ConciergeOffer | null>(null);
 const [customRequestMode, setCustomRequestMode] = useState(false);
 const [offerQuantity, setOfferQuantity] = useState(1);

 // Feedback State
 const [showFeedbackModal, setShowFeedbackModal] = useState(false);
 const [feedbackRating, setFeedbackRating] = useState(5);
 const [feedbackComment, setFeedbackComment] = useState('');

 // Ticket Rating State
 const [showTicketRatingModal, setShowTicketRatingModal] = useState(false);
 const [ratingTicket, setRatingTicket] = useState<Ticket | null>(null);
 const [ticketRating, setTicketRating] = useState(5);
 const [dismissedRatingTickets, setDismissedRatingTickets] = useState<string[]>([]);

 // Exit Kiosk State
 const [showExitModal, setShowExitModal] = useState(false);
 const [exitPassword, setExitPassword] = useState('');

 const guestName = currentReservation?.guestName || 'Hóspede';
 const normalizedGuestName = normalizeGuestName(currentReservation?.guestName || '');

 // Fetch Weather on Mount
 useEffect(() => {
   getWeatherForecast().then(data => {
     if (data) setWeather(data);
   });
 }, []);

 const guestTickets = useMemo(() => {
  if (!currentReservation) return [];

  return tickets
    .filter(t => t.propertyCode === propertyCode)
    .filter(t => !isAutomaticCheckoutTicket(t))
    .filter(t => {
      if (t.reservationId && t.reservationId === currentReservation.id) return true;

      const createdByGuest = t.createdBy === 'tablet' || t.isGuestRequest === true || t.guestAuth === true;
      if (!createdByGuest) return false;

      const nameMatch = normalizeGuestName(t.createdByName || '') === normalizedGuestName;
      return nameMatch;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
 }, [tickets, propertyCode, currentReservation, normalizedGuestName]);

 const guestMaintenanceTickets = useMemo(() => {
  return guestTickets.filter(t => t.category !== 'concierge');
 }, [guestTickets]);

 const handleTicketSubmit = (ticketData: any) => {
  onAddTicket({
   ...ticketData,
   propertyCode, // Ensure property is set
   guestAuth: true, // Default for tablet requests? Or taken from form
   isGuestRequest: true,
   createdBy: 'tablet',
   createdByName: guestName,
   reservationId: currentReservation?.id || ticketData.reservationId
  });
  setShowTicketModal(false);
 };

 const handleBookOffer = () => {
  if (!selectedOffer || !currentReservation) return;

  const totalPrice = selectedOffer.price * offerQuantity;
  const newBooking = {
    id: generateId(),
    guestName: currentReservation.guestName,
    propertyCode: propertyCode,
    quantity: offerQuantity,
    totalPrice: totalPrice,
    status: 'pending' as const,
    bookedAt: Date.now()
  };

  const updatedOffer = {
    ...selectedOffer,
    bookings: [...selectedOffer.bookings, newBooking]
  };

  onUpdateOffer(updatedOffer);
  
  // Also create a ticket for tracking
  onAddTicket({
    id: generateId(),
    propertyCode,
    propertyName,
    priority: 'Média',
    serviceType: 'Concierge',
    description: `Novo Pedido: ${selectedOffer.title} (x${offerQuantity}). Valor: ${formatCurrency(totalPrice)}.`,
    desiredDate: new Date().toISOString(),
    guestAuth: true,
    status: TicketStatus.OPEN,
    category: 'concierge',
    isGuestRequest: true,
    createdBy: 'tablet',
    createdByName: guestName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reservationId: currentReservation?.id
  });

  alert('Solicitação enviada com sucesso! Em breve entraremos em contato.');
  setSelectedOffer(null);
  setOfferQuantity(1);
 };

 const handleCustomRequest = (ticketData: any) => {
   handleTicketSubmit({ ...ticketData, category: 'concierge', serviceType: 'Pedido Personalizado' });
   setCustomRequestMode(false);
 };

 // Handler para voltar à home e limpar estados de navegação secundários
 const handleBackToHome = () => {
   setActiveTab('home');
   // Limpar estados de navegação secundários
   setSelectedOffer(null);
   setCustomRequestMode(false);
   setShowTicketModal(false);
   setShowFeedbackModal(false);
   setShowTicketRatingModal(false);
   setRatingTicket(null);
   setOfferQuantity(1);
 };

 const handleFeedbackSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   onAddFeedback({
     id: generateId(),
     propertyCode,
     guestName,
     rating: feedbackRating,
     comment: feedbackComment,
     createdAt: Date.now()
   });
   setShowFeedbackModal(false);
   setFeedbackComment('');
   setFeedbackRating(5);
   alert('Obrigado pelo seu feedback!');
 };

 const openTicketRatingModal = (ticket: Ticket) => {
  setRatingTicket(ticket);
  setTicketRating(5);
  setShowTicketRatingModal(true);
 };

 const handleTicketRatingSubmit = () => {
  if (ratingTicket) {
   onTicketFeedback(ratingTicket.id, ticketRating, '');
   setDismissedRatingTickets((prev) => (prev.includes(ratingTicket.id) ? prev : [...prev, ratingTicket.id]));
  }
  setShowTicketRatingModal(false);
  setRatingTicket(null);
 };

 const handleTicketRatingSkip = () => {
  if (ratingTicket) {
   setDismissedRatingTickets((prev) => (prev.includes(ratingTicket.id) ? prev : [...prev, ratingTicket.id]));
  }
  setShowTicketRatingModal(false);
  setRatingTicket(null);
 };

 useEffect(() => {
  setDismissedRatingTickets([]);
  setShowTicketRatingModal(false);
  setRatingTicket(null);
 }, [currentReservation?.id]);

 useEffect(() => {
  if (ratingTicket) return;

  const pendingRating = guestMaintenanceTickets.find(
    (t) =>
      t.status === TicketStatus.DONE &&
      !hasTicketRating(t) &&
      !dismissedRatingTickets.includes(t.id)
  );

  if (pendingRating) {
   openTicketRatingModal(pendingRating);
  }
 }, [guestMaintenanceTickets, dismissedRatingTickets, ratingTicket]);

 // Exit Kiosk Handler with Password Validation
 const handleExitKiosk = (e: React.FormEvent) => {
   e.preventDefault();

   // Validate password against any user in the system
   const validUser = users.find(u => u.password === exitPassword);

   if (validUser) {
     // Clear kiosk mode from localStorage
     localStorage.removeItem('casape_tablet_property');

     // Redirect to main application
     window.location.href = '/';
   } else {
     alert('Senha incorreta!');
     setExitPassword('');
   }
 };

 const activeTickets = guestMaintenanceTickets
  .filter(t => t.status !== TicketStatus.DONE)
  .sort((a, b) => b.createdAt - a.createdAt);

 const WeatherIcon = ({ icon, size }: { icon: string, size: number }) => {
   switch (icon) {
     case 'sun': return <Sun size={size} className="text-yellow-300" />;
     case 'cloud': return <Cloud size={size} className="text-gray-200" />;
     case 'cloud-sun': return <CloudSun size={size} className="text-yellow-100" />;
     case 'rain': return <CloudRain size={size} className="text-blue-200" />;
     case 'cloud-rain': return <CloudDrizzle size={size} className="text-blue-200" />;
     case 'cloud-lightning': return <CloudLightning size={size} className="text-purple-200" />;
     case 'wind': return <Wind size={size} className="text-gray-200" />;
     default: return <Sun size={size} />;
   }
 };

 return (
  <div className="h-screen w-full bg-gray-100 flex flex-col font-sans overflow-hidden">
   
   {/* Top Bar */}
   <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10">
     <div className="flex items-center gap-4">
       {/* Botão Voltar - aparece apenas quando não está na home */}
       {activeTab !== 'home' && (
         <button
           onClick={handleBackToHome}
           className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-brand-600 hover:bg-brand-50 rounded-lg transition-colors active:scale-95 transform touch-manipulation"
           aria-label="Voltar para início"
         >
           <ArrowLeft size={24} className="flex-shrink-0" />
           <span className="font-medium text-sm hidden sm:inline">Voltar</span>
         </button>
       )}
       <div>
         <h1 className="text-xl font-bold text-gray-800">Olá, {guestName.split(' ')[0]}</h1>
         <p className="text-sm text-gray-500">{propertyName}</p>
       </div>
     </div>
     <div className="flex items-center gap-4">
       {afterHoursConfig?.enabled && (
         <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 max-w-xs truncate border border-blue-100">
           <Info size={14} /> {afterHoursConfig.message}
         </div>
       )}
       <div className="text-right hidden md:block">
         <p className="text-2xl font-heading font-bold text-gray-900">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
         <p className="text-xs text-gray-500 capitalize">{new Date().toLocaleDateString(undefined, {weekday: 'long', day:'numeric', month:'long'})}</p>
       </div>
     </div>
   </header>

   {/* Main Content Area */}
   <main className="flex-1 overflow-y-auto p-6 relative">
     
     {/* HOME TAB */}
     {activeTab === 'home' && (
       <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
         
         {/* Welcome Banner */}
         <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
             <div className="flex-1">
               <h2 className="text-3xl font-bold mb-2">Bem-vindo, {guestName.split(' ')[0]}!</h2>
               <p className="opacity-90 max-w-lg text-lg">Estamos felizes em receber você. Explore nossos serviços e aproveite sua estadia ao máximo.</p>
               {/* Compact 3-Day Weather Preview */}
               {weather && (
                 <div className="flex gap-3 mt-6">
                   {/* Today */}
                   <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                     <WeatherIcon icon={weather.current.icon} size={28} />
                     <span className="text-lg font-bold mt-1">{weather.current.temp}</span>
                     <span className="text-xs opacity-80">Hoje</span>
                   </div>
                   {/* Next 2 days from forecast */}
                   {weather.forecast.slice(0, 2).map((day, idx) => (
                     <div key={idx} className="flex flex-col items-center bg-white/15 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                       <WeatherIcon icon={day.icon} size={28} />
                       <span className="text-lg font-bold mt-1">{day.temp}</span>
                       <span className="text-xs opacity-80">{day.day.slice(0,3)}</span>
                     </div>
                   ))}
                 </div>
               )}
               {/* Fallback button when no weather */}
               {!weather && (
                 <button
                   onClick={() => setActiveTab('concierge')}
                   className="mt-6 bg-white text-brand-700 px-6 py-3 rounded-none font-bold shadow-lg hover:bg-gray-50 transition-transform active:scale-95 flex items-center gap-2"
                 >
                   <Tag size={20} /> Ver Experiências
                 </button>
               )}
             </div>

             {/* Weather Widget */}
             {weather && (
               <div className="bg-white/10 backdrop-blur-md rounded-none p-5 text-white min-w-[260px] border border-white/20 shadow-lg">
                 <div className="flex items-center gap-4 mb-4 border-b border-white/20 pb-4">
                   <WeatherIcon icon={weather.current.icon} size={42} />
                   <div>
                     <p className="text-3xl font-bold">{weather.current.temp}</p>
                     <p className="text-sm font-medium opacity-90">{weather.current.condition}</p>
                   </div>
                 </div>
                 <div className="space-y-2.5">
                   {weather.forecast.map((day, idx) => (
                     <div key={idx} className="flex justify-between items-center text-sm">
                       <span className="w-10 font-medium">{day.day.slice(0,3)}</span>
                       <div className="flex items-center gap-2 flex-1 justify-center opacity-80">
                         <WeatherIcon icon={day.icon} size={14} />
                         <span className="text-xs truncate max-w-[80px]">{day.condition}</span>
                       </div>
                       <span className="font-bold">{day.temp}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
           
           {/* Decorative Background Icon */}
           {!weather && (
             <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-10 translate-x-10">
               <Home size={300} />
             </div>
           )}
         </div>

         {/* Weather Forecast Card - Rio de Janeiro (3 days) */}
         <WeatherForecastCard />

         {/* Quick Actions Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <button 
            onClick={() => setActiveTab('services')}
            className="bg-white p-6 rounded-none shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
           >
             <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
               <Wrench size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-1">Manutenção & Limpeza</h3>
             <p className="text-gray-500 text-sm">Precisa de algum reparo ou serviço de quarto?</p>
           </button>

           <button 
            onClick={() => setActiveTab('stay')}
            className="bg-white p-6 rounded-none shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
           >
             <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
               <Wifi size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-1">Dados da Estadia</h3>
             <p className="text-gray-500 text-sm">Senha do Wi-Fi, regras e informações do imóvel.</p>
           </button>

           <button 
            onClick={() => setActiveTab('tips')}
            className="bg-white p-6 rounded-none shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
           >
             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
               <MapPin size={24} />
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-1">Dicas Locais</h3>
             <p className="text-gray-500 text-sm">Restaurantes, passeios e segredos do bairro.</p>
           </button>
         </div>

         {/* Active Requests - Task 7: Mostrar responsável/ETA/avatar para status ASSIGNED/ON_THE_WAY/IN_PROGRESS */}
         {activeTickets.length > 0 && (
           <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <Clock size={20} className="text-brand-600" /> Suas Solicitações
             </h3>
             <div className="space-y-3">
               {activeTickets.map(t => {
                 // Task 7: Usar getValidAssignees para obter responsáveis válidos
                 const validAssignees = getValidAssignees(t);
                 const assigneeName = validAssignees.length > 0 ? validAssignees[0] : null;
                 const assignee = assigneeName ? users.find(u => u.name === assigneeName) : null;
                 
                 // Task 7: Mostrar info de responsável apenas para status ASSIGNED, ON_THE_WAY, IN_PROGRESS
                 const showAssigneeInfo = (
                   t.status === TicketStatus.ASSIGNED || 
                   t.status === TicketStatus.ON_THE_WAY || 
                   t.status === TicketStatus.IN_PROGRESS
                 ) && assignee;
                 
                 return (
                   <div key={t.id} className="p-4 bg-gray-50 rounded-none border border-gray-200">
                     <div className="flex justify-between items-start mb-3">
                       <div className="flex-1">
                         <p className="font-medium text-gray-900">{t.serviceType}</p>
                         <p className="text-sm text-gray-500">{t.description}</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap ml-2 ${
                         t.status === TicketStatus.OPEN ? 'bg-red-100 text-red-700' :
                         t.status === TicketStatus.ASSIGNED ? 'bg-blue-100 text-blue-700' :
                         t.status === TicketStatus.ON_THE_WAY ? 'bg-purple-100 text-purple-700' :
                         t.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-700' :
                         'bg-gray-200 text-gray-600'
                       }`}>
                         {t.status}
                       </span>
                     </div>
                     
                     {/* Task 7: Exibir responsável + ETA + avatar quando status ∈ {ASSIGNED, ON_THE_WAY, IN_PROGRESS} */}
                     {showAssigneeInfo && (
                       <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                         <div className="flex items-center gap-2">
                           {assignee.avatar ? (
                             <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                           ) : (
                             <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                               <User size={16} className="text-brand-600" />
                             </div>
                           )}
                           <div>
                             <p className="text-sm font-medium text-gray-900">{assignee.name.split(' ')[0]}</p>
                             <p className="text-xs text-gray-500">Responsável</p>
                           </div>
                         </div>
                         
                         {t.scheduledDate && (
                           <div className="text-right">
                             <p className="text-sm font-medium text-gray-900">
                               {new Date(t.scheduledDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                             </p>
                             <p className="text-xs text-gray-500">Previsão</p>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
         )}
       </div>
     )}

     {/* CONCIERGE TAB */}
     {activeTab === 'concierge' && (
       <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
         <div className="flex justify-between items-end mb-4">
           <div>
             <h2 className="text-2xl font-heading font-bold text-gray-900">Experiências Exclusivas</h2>
             <p className="text-gray-500">Curadoria especial para você aproveitar o melhor do Rio.</p>
           </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {conciergeOffers.filter(o => o.active).map(offer => (
             <div key={offer.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 flex flex-col h-full group cursor-pointer" onClick={() => setSelectedOffer(offer)}>
               <div className="h-48 bg-gray-200 relative overflow-hidden">
                 {offer.imageUrl ? (
                   <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                     <Tag size={40} />
                   </div>
                 )}
                 <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                   R$ {offer.price.toFixed(2)}
                 </div>
               </div>
               <div className="p-6 flex-1 flex flex-col">
                 <div className="mb-4">
                   <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-none">{offer.category}</span>
                   <h3 className="text-xl font-bold text-gray-800 mt-2 leading-tight">{offer.title}</h3>
                 </div>
                 <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">{offer.description}</p>
                 <button className="w-full py-3 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 font-bold rounded-none transition-colors mt-auto">
                   Ver Detalhes
                 </button>
               </div>
             </div>
           ))}

           {/* Generic Custom Request Card */}
           <button 
            onClick={() => { setCustomRequestMode(true); setSelectedOffer(null); }}
            className="bg-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-105 transition-all text-left group h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 hover:border-purple-300 hover:bg-purple-50"
           >
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">
               <Plus size={32} />
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-2">Pedido Personalizado</h3>
             <p className="text-gray-500 text-sm text-center">Precisa de algo diferente? Solicite ao nosso Concierge.</p>
           </button>
         </div>
       </div>
     )}

     {/* DETAIL / BOOKING MODAL */}
     {(selectedOffer || customRequestMode) && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
         <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
           {/* Modal Header Image (Only for Offers) */}
           {!customRequestMode && selectedOffer?.imageUrl && (
             <div className="h-48 w-full relative">
               <img src={selectedOffer.imageUrl} className="w-full h-full object-cover" />
               <button onClick={() => setSelectedOffer(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur transition-colors">
                 <X size={20} />
               </button>
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                 <h3 className="text-2xl font-heading font-bold text-white leading-tight">{selectedOffer.title}</h3>
               </div>
             </div>
           )}
           
           {/* Manual Header */}
           {customRequestMode && (
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-xl font-bold text-gray-800">Solicitação Especial</h3>
               <button onClick={() => { setCustomRequestMode(false); setSelectedOffer(null); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24}/></button>
             </div>
           )}

           {/* Content */}
           <div className="p-6 flex-1 overflow-y-auto">
             {!customRequestMode && selectedOffer ? (
               <div className="space-y-6">
                 {!selectedOffer.imageUrl && (
                   <div className="flex justify-between items-start">
                     <h3 className="text-2xl font-heading font-bold text-gray-900">{selectedOffer.title}</h3>
                     <button onClick={() => setSelectedOffer(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24}/></button>
                   </div>
                 )}
                 
                 <div>
                   <p className="text-gray-600 leading-relaxed text-lg">{selectedOffer.description}</p>
                   {selectedOffer.priceDescription && <p className="text-sm text-gray-400 mt-2 italic">{selectedOffer.priceDescription}</p>}
                 </div>

                 <div className="bg-gray-50 p-4 rounded-none border border-gray-100">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-gray-500 font-medium">Preço Unitário</span>
                     <span className="text-xl font-bold text-gray-900">R$ {selectedOffer.price.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-500 font-medium">Quantidade</span>
                     <div className="flex items-center gap-3">
                       <button 
                        onClick={() => setOfferQuantity(Math.max(1, offerQuantity - 1))}
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                       >
                         -
                       </button>
                       <span className="font-bold w-4 text-center">{offerQuantity}</span>
                       <button 
                        onClick={() => setOfferQuantity(Math.min(selectedOffer.maxQuantity || 99, offerQuantity + 1))}
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                       >
                         +
                       </button>
                     </div>
                   </div>
                   <div className="border-t border-gray-200 my-4"></div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-900 font-bold">Total Estimado</span>
                     <span className="text-2xl font-heading font-bold text-purple-600">R$ {(selectedOffer.price * offerQuantity).toFixed(2)}</span>
                   </div>
                 </div>

                 <button 
                  onClick={handleBookOffer}
                  className="w-full bg-purple-600 text-white font-bold py-4 rounded-none shadow-lg shadow-purple-600/30 hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   Solicitar Reserva
                 </button>
                 <p className="text-xs text-center text-gray-400 mt-2">O pagamento será coordenado pela nossa equipe após a confirmação.</p>
               </div>
             ) : (
               <TicketForm 
                 onClose={() => { setCustomRequestMode(false); setSelectedOffer(null); }}
                 onSubmit={handleCustomRequest}
                 properties={[{ code: propertyCode, address: propertyName }]}
                 priorities={['Baixa', 'Média', 'Alta']}
                 serviceTypes={['Transfer', 'Chef', 'Limpeza Extra', 'Compras', 'Outros']}
                 isPreventiveMode={false}
                 category="concierge"
                 initialData={{ propertyCode }}
               />
             )}
           </div>
         </div>
       </div>
     )}

     {/* SERVICES TAB */}
     {activeTab === 'services' && (
       <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
         <div className="text-center mb-8">
           <h2 className="text-2xl font-heading font-bold text-gray-900">Manutenção e Serviços</h2>
           <p className="text-gray-500">Como podemos tornar sua estadia mais confortável?</p>
         </div>

         <button 
          onClick={() => { setTicketCategory('maintenance'); setShowTicketModal(true); }}
          className="w-full bg-white p-6 rounded-none shadow-sm border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all text-left flex items-center gap-4 group"
         >
           <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
             <Plus size={32} />
           </div>
           <div>
             <h3 className="text-lg font-bold text-gray-900">Abrir Novo Chamado</h3>
             <p className="text-sm text-gray-500">Relatar problema, solicitar limpeza ou reparo.</p>
           </div>
           <ChevronRight className="ml-auto text-gray-300" />
         </button>

         {/* Existing Tickets List - Task 7: UI completa com avatar, nome, ETA */}
         {guestMaintenanceTickets.length > 0 && (
           <div className="mt-8">
             <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-2">Histórico de Solicitações</h3>
             <div className="space-y-3">
               {guestMaintenanceTickets.map(t => {
                 // Task 7: Usar getValidAssignees para obter responsáveis válidos
                 const validAssignees = getValidAssignees(t);
                 const assigneeName = validAssignees.length > 0 ? validAssignees[0] : null;
                 const assignee = assigneeName ? users.find(u => u.name === assigneeName) : null;
                 
                 // Task 7: Mostrar info de responsável apenas para status ASSIGNED, ON_THE_WAY, IN_PROGRESS
                 const showAssigneeInfo = (
                   t.status === TicketStatus.ASSIGNED || 
                   t.status === TicketStatus.ON_THE_WAY || 
                   t.status === TicketStatus.IN_PROGRESS
                 ) && assignee;
                 
                 return (
                   <div key={t.id} className="bg-white p-4 rounded-none border border-gray-200 shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                       <div className="flex-1">
                         <p className="font-bold text-gray-800">{t.serviceType}</p>
                         <p className="text-sm text-gray-500">{t.description}</p>
                         <p className="text-xs text-gray-400 mt-1">{new Date(t.createdAt).toLocaleDateString()}</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap ml-2 ${
                         t.status === TicketStatus.OPEN ? 'bg-red-100 text-red-700' :
                         t.status === TicketStatus.ASSIGNED ? 'bg-blue-100 text-blue-700' :
                         t.status === TicketStatus.ON_THE_WAY ? 'bg-purple-100 text-purple-700' :
                         t.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-700' :
                         'bg-green-100 text-green-700'
                       }`}>
                         {t.status}
                       </span>
                     </div>
                     
                     {/* Task 7: Exibir responsável + ETA + avatar quando status ∈ {ASSIGNED, ON_THE_WAY, IN_PROGRESS} */}
                     {showAssigneeInfo && (
                       <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                         <div className="flex items-center gap-2">
                           {assignee.avatar ? (
                             <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                           ) : (
                             <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                               <User size={16} className="text-brand-600" />
                             </div>
                           )}
                           <div>
                             <p className="text-sm font-medium text-gray-900">{assignee.name.split(' ')[0]}</p>
                             <p className="text-xs text-gray-500">Responsável</p>
                           </div>
                         </div>
                         
                         {t.scheduledDate && (
                           <div className="text-right">
                             <p className="text-sm font-medium text-gray-900">
                               {new Date(t.scheduledDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                             </p>
                             <p className="text-xs text-gray-500">Previsão</p>
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Botão de avaliação para chamados concluídos */}
                     {t.status === TicketStatus.DONE && !hasTicketRating(t) && (
                       <button 
                         onClick={() => openTicketRatingModal(t)}
                         className="w-full mt-3 py-2 bg-brand-50 text-brand-600 font-bold rounded-lg hover:bg-brand-100 transition-colors text-sm"
                       >
                         ⭐ Avaliar Atendimento
                       </button>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
         )}
       </div>
     )}

     {/* TIPS TAB */}
     {activeTab === 'tips' && (
       <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
         <div className="text-center mb-8">
           <h2 className="text-2xl font-heading font-bold text-gray-900">Dicas Locais</h2>
           <p className="text-gray-500">Nossa curadoria do melhor do Rio de Janeiro.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {tips.map(tip => (
             <div key={tip.id} className="bg-white rounded-none overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
               {tip.imageUrl ? (
                 <img src={tip.imageUrl} alt={tip.title} className="w-full h-48 object-cover" />
               ) : (
                 <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                   <ImageIcon size={40} />
                 </div>
               )}
               <div className="p-6 flex-1 flex flex-col">
                 <span className="text-xs font-bold text-brand-600 uppercase mb-2">{tip.category}</span>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">{tip.title}</h3>
                 <p className="text-gray-600 text-sm leading-relaxed flex-1">{tip.content}</p>
               </div>
             </div>
           ))}
           {tips.length === 0 && (
             <div className="col-span-full text-center py-12 text-gray-400">
               Nenhuma dica cadastrada no momento.
             </div>
           )}
         </div>
       </div>
     )}

     {/* STAY INFO TAB */}
     {activeTab === 'stay' && (
       <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
         <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
           <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
             <Wifi size={20} className="text-brand-600" /> Rede Wi-Fi
           </h3>
           <div className="space-y-4">
             <div className="flex justify-between items-center p-4 bg-gray-50 rounded-none">
               <span className="text-gray-600 font-medium">Nome da Rede</span>
               <span className="font-bold text-lg select-all">Casape_Guest</span>
             </div>
             <div className="flex justify-between items-center p-4 bg-gray-50 rounded-none">
               <span className="text-gray-600 font-medium">Senha</span>
               <span className="font-mono font-bold text-lg select-all">riodejaneiro2024</span>
             </div>
           </div>
         </div>

         <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
           <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
             <Info size={20} className="text-blue-600" /> Informações do Imóvel
           </h3>
           <p className="text-gray-600 leading-relaxed">
             Por favor, respeite a lei do silêncio entre 22h e 08h.
             Não é permitido festas ou eventos.
             Em caso de emergência, utilize o botão de chat para falar conosco imediatamente.
           </p>
         </div>

         <div className="flex flex-col items-center gap-3 mt-8">
           <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-none font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
           >
             <Star size={18} className="text-yellow-400 fill-yellow-400" /> Avaliar Estadia
           </button>

           <button
             onClick={() => setShowExitModal(true)}
             className="flex items-center gap-2 px-6 py-3 bg-gray-50 border border-gray-200 rounded-none font-medium text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
           >
             Sair do Modo Kiosk
           </button>
         </div>

         {/* Version Display */}
         <div className="mt-8 text-center">
           <p className="text-xs text-gray-400">
             Versão 1.0.0
           </p>
         </div>
       </div>
     )}

   </main>

   {/* Bottom Navigation */}
   <nav className="bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-20 pb-safe">
     <button onClick={handleBackToHome} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-brand-600' : 'text-gray-400'}`}>
       <Home size={24} />
       <span className="text-[10px] font-bold">Início</span>
     </button>
     <button onClick={() => setActiveTab('concierge')} className={`flex flex-col items-center gap-1 ${activeTab === 'concierge' ? 'text-purple-600' : 'text-gray-400'}`}>
       <Tag size={24} />
       <span className="text-[10px] font-bold">Concierge</span>
     </button>
     <button onClick={() => setActiveTab('services')} className={`flex flex-col items-center gap-1 ${activeTab === 'services' ? 'text-brand-600' : 'text-gray-400'}`}>
       <Wrench size={24} />
       <span className="text-[10px] font-bold">Serviços</span>
     </button>
     <button onClick={() => setActiveTab('tips')} className={`flex flex-col items-center gap-1 ${activeTab === 'tips' ? 'text-green-600' : 'text-gray-400'}`}>
       <MapPin size={24} />
       <span className="text-[10px] font-bold">Dicas</span>
     </button>
     <button onClick={() => setActiveTab('stay')} className={`flex flex-col items-center gap-1 ${activeTab === 'stay' ? 'text-blue-600' : 'text-gray-400'}`}>
       <Info size={24} />
       <span className="text-[10px] font-bold">Estadia</span>
     </button>
   </nav>

   {/* TICKET FORM MODAL */}
   {showTicketModal && (
     <TicketForm
       onClose={() => setShowTicketModal(false)}
       onSubmit={handleTicketSubmit}
       properties={[{ code: propertyCode, address: propertyName }]}
       priorities={['Baixa', 'Média', 'Alta']}
       serviceTypes={serviceTypes.map(s => typeof s === 'string' ? s : s.name)}
       isPreventiveMode={false}
       category={ticketCategory}
       hidePreventiveToggle={true}
       initialData={{ propertyCode, reservationId: currentReservation?.id }}
     />
   )}

   {/* TICKET RATING MODAL */}
   {showTicketRatingModal && ratingTicket && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
         <div className="text-center mb-6">
           <h3 className="text-xl font-bold text-gray-800">Como foi o atendimento?</h3>
           <p className="text-gray-500 text-sm mt-1">Avalie o chamado concluído. É opcional.</p>
           <p className="text-xs text-gray-400 mt-2">{ratingTicket.serviceType}</p>
         </div>

         <div className="flex justify-center mb-6">
           <RatingStars rating={ticketRating} onChange={setTicketRating} size={36} />
         </div>

         <div className="flex gap-3">
           <button 
             onClick={handleTicketRatingSkip}
             className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-none font-bold hover:bg-gray-200 transition-colors"
           >
             Agora não
           </button>
           <button 
             onClick={handleTicketRatingSubmit}
             className="flex-1 py-3 bg-brand-600 text-white rounded-none font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30"
           >
             Enviar Avaliação
           </button>
         </div>
       </div>
     </div>
   )}

   {/* FEEDBACK MODAL */}
   {showFeedbackModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
       <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-fade-in shadow-2xl">
         <div className="text-center mb-6">
           <h3 className="text-xl font-bold text-gray-800">Avalie sua Experiência</h3>
           <p className="text-gray-500 text-sm mt-1">Sua opinião é muito importante para nós.</p>
         </div>
         
         <div className="flex justify-center gap-2 mb-6">
           {[1, 2, 3, 4, 5].map((star) => (
             <button
               key={star}
               onClick={() => setFeedbackRating(star)}
               className="focus:outline-none transform transition-transform hover:scale-110"
             >
               <Star 
                 size={36} 
                 className={`${star <= feedbackRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
               />
             </button>
           ))}
         </div>

         <textarea 
           value={feedbackComment}
           onChange={(e) => setFeedbackComment(e.target.value)}
           placeholder="Conte-nos como foi sua estadia..."
           className="w-full p-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-brand-500 focus:outline-none mb-6 h-32 resize-none"
         />

         <div className="flex gap-3">
           <button 
             onClick={() => setShowFeedbackModal(false)}
             className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-none font-bold hover:bg-gray-200 transition-colors"
           >
             Cancelar
           </button>
           <button 
             onClick={handleFeedbackSubmit}
             className="flex-1 py-3 bg-brand-600 text-white rounded-none font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30"
           >
             Enviar Avaliação
           </button>
         </div>
       </div>
     </div>
   )}

   {/* EXIT KIOSK MODAL */}
   {showExitModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
       <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-fade-in shadow-2xl">
         <div className="text-center mb-6">
           <h3 className="text-xl font-bold text-gray-800">Sair do Modo Kiosk</h3>
           <p className="text-gray-500 text-sm mt-1">Digite a senha de administrador para continuar.</p>
         </div>

         <form onSubmit={handleExitKiosk}>
           <input
             type="password"
             value={exitPassword}
             onChange={(e) => setExitPassword(e.target.value)}
             placeholder="Digite a senha..."
             className="w-full p-4 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-brand-500 focus:outline-none mb-6"
             autoFocus
           />

           <div className="flex gap-3">
             <button
               type="button"
               onClick={() => {
                 setShowExitModal(false);
                 setExitPassword('');
               }}
               className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-none font-bold hover:bg-gray-200 transition-colors"
             >
               Cancelar
             </button>
             <button
               type="submit"
               className="flex-1 py-3 bg-brand-600 text-white rounded-none font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30"
             >
               Sair
             </button>
           </div>
         </form>
       </div>
     </div>
   )}

   {/* GUEST COMMUNICATOR */}
   <GuestCommunicator
     propertyCode={propertyCode}
     propertyName={propertyName}
     guestName={guestName}
   />

  </div>
 );
};

export default TabletApp;

import React, { useState, useEffect } from 'react';
import { Ticket, User, TicketStatus, Property } from '../types';
import { 
 MapPin, CheckCircle2, Navigation, AlertTriangle, Clock, 
 ChevronRight, Camera, LogOut, RefreshCw, Bell, ArrowRight, X, Image as ImageIcon, Trash2
} from 'lucide-react';
import { storageService } from '../services/storage';

interface FieldAppProps {
 currentUser: User;
 tickets: Ticket[];
 properties: Property[];
 onLogout: () => void;
 onUpdateTicket: (id: string, status: TicketStatus, date?: string, reportData?: any) => void;
}

const FieldApp: React.FC<FieldAppProps> = ({ 
 currentUser, tickets, properties, onLogout, onUpdateTicket 
}) => {
 const [activeTab, setActiveTab] = useState<'tasks' | 'profile'>('tasks');
 const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
 const [locationError, setLocationError] = useState<string | null>(null);
 const [isTracking, setIsTracking] = useState(false);
 const [lastLocation, setLastLocation] = useState<{lat: number, lng: number} | null>(null);

 // Finish Job Modal State
 const [showFinishModal, setShowFinishModal] = useState(false);
 const [finishCondition, setFinishCondition] = useState<'perfect' | 'issues'>('perfect');
 const [finishNotes, setFinishNotes] = useState('');
 const [finishPhotos, setFinishPhotos] = useState<string[]>([]); // Base64 strings

 // Filter my tickets
 const myTickets = tickets.filter(t =>
  t.assignee === currentUser.name &&
  t.status !== TicketStatus.DONE &&
  !t.isCheckoutTicket // Exclude checkout tickets from regular queue
 ).sort((a, b) => {
   // Urgent first
   if (a.priority === 'Urgente' && b.priority !== 'Urgente') return -1;
   if (a.priority !== 'Urgente' && b.priority === 'Urgente') return 1;
   // Then by date
   return new Date(a.scheduledDate || a.desiredDate).getTime() - new Date(b.scheduledDate || b.desiredDate).getTime();
 });

 // Filter checkout tickets assigned to me
 const myCheckoutTickets = tickets.filter(t =>
   t.assignee === currentUser.name &&
   t.status !== TicketStatus.DONE &&
   t.isCheckoutTicket === true
 ).sort((a, b) => new Date(a.scheduledDate || a.desiredDate).getTime() - new Date(b.scheduledDate || b.desiredDate).getTime());

 const completedToday = tickets.filter(t => 
  t.assignee === currentUser.name && 
  t.status === TicketStatus.DONE &&
  t.completedDate && new Date(t.completedDate).toDateString() === new Date().toDateString()
 ).length;

 // --- GEOLOCATION TRACKING ---
 useEffect(() => {
  let watchId: number;

  const startTracking = () => {
   if ('geolocation' in navigator) {
    setIsTracking(true);
    setLocationError(null);

    watchId = navigator.geolocation.watchPosition(
     (position) => {
      const { latitude, longitude } = position.coords;
      setLastLocation({ lat: latitude, lng: longitude });
      setLocationError(null);
      
      // Update to Firestore
      storageService.users.update({
        id: currentUser.id,
        name: currentUser.name, 
        email: currentUser.email, 
        role: currentUser.role, 
        lastLocation: {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now()
        }
      }).catch(err => console.error("Erro ao atualizar localização no banco:", err));
     },
     (error) => {
      console.error(`Erro GPS: ${error.code} - ${error.message}`);
      let msg = "GPS indisponível";
      switch(error.code) {
        case 1: msg = "Permissão de GPS negada. Habilite nas configurações."; break;
        case 2: msg = "Sinal de GPS indisponível."; break;
        case 3: msg = "Tempo limite do GPS esgotado."; break;
      }
      setLocationError(msg);
      setIsTracking(false);
     },
     { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    );
   } else {
    setLocationError("Navegador não suporta GPS");
   }
  };

  startTracking();

  return () => {
   if (watchId) navigator.geolocation.clearWatch(watchId);
  };
 }, [currentUser.id, currentUser.name, currentUser.email, currentUser.role]);

 // --- NOTIFICATIONS ---
 useEffect(() => {
   if (Notification.permission !== 'granted') {
     Notification.requestPermission();
   }
 }, []);

 const handleStartJob = () => {
   if (activeTicket) {
     onUpdateTicket(activeTicket.id, TicketStatus.IN_PROGRESS);
     alert("Iniciado! O administrador foi notificado do seu deslocamento.");
   }
 };

 const handleOpenFinishModal = () => {
   setFinishCondition('perfect');
   setFinishNotes('');
   setFinishPhotos([]);
   setShowFinishModal(true);
 };

 const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
   if (e.target.files && e.target.files[0]) {
     const file = e.target.files[0];
     const reader = new FileReader();
     reader.onloadend = () => {
       if (typeof reader.result === 'string') {
         setFinishPhotos(prev => [...prev, reader.result as string]);
       }
     };
     reader.readAsDataURL(file);
   }
 };

 const removePhoto = (index: number) => {
   setFinishPhotos(prev => prev.filter((_, i) => i !== index));
 };

 const handleConfirmFinish = () => {
   if (activeTicket) {
     const now = new Date();
     now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
     
     const completionReport = {
       condition: finishCondition,
       notes: finishNotes,
       photos: finishPhotos
     };

     onUpdateTicket(
       activeTicket.id, 
       TicketStatus.DONE, 
       now.toISOString().slice(0, 16),
       completionReport
     );
     
     setShowFinishModal(false);
     setActiveTicket(null);
     // Vibrate to confirm
     if (navigator.vibrate) navigator.vibrate(200);
   }
 };

 const openMaps = (address: string) => {
   window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
 };

 // --- VIEWS ---

 if (activeTicket) {
   // TICKET DETAIL / ACTION VIEW
   const prop = properties.find(p => p.code === activeTicket.propertyCode);
   
   return (
     <div className="h-full flex flex-col bg-white relative">
       <div className="bg-brand-600 text-white p-6 pt-safe">
         <button onClick={() => setActiveTicket(null)} className="flex items-center gap-1 text-sm opacity-80 mb-4">
           <ChevronRight size={16} className="rotate-180" /> Voltar
         </button>
         <h1 className="text-2xl font-heading font-bold">{activeTicket.propertyCode}</h1>
         <p className="opacity-90 text-sm flex items-center gap-1 mt-1">
           <MapPin size={14} /> {prop?.address || 'Endereço não carregado'}
         </p>
       </div>

       <div className="flex-1 p-6 overflow-y-auto">
         {/* Status Banner */}
         <div className={`p-4 rounded-none mb-6 flex items-center justify-between ${
           activeTicket.status === TicketStatus.OPEN ? 'bg-red-50 text-red-700 border border-red-100' : 
           activeTicket.status === TicketStatus.ASSIGNED ? 'bg-blue-50 text-blue-700 border border-blue-100' :
           activeTicket.status === TicketStatus.ON_THE_WAY ? 'bg-purple-50 text-purple-700 border border-purple-100' :
           'bg-yellow-50 text-yellow-700 border border-yellow-100'
         }`}>
           <div className="font-bold flex items-center gap-2">
             {activeTicket.status === TicketStatus.OPEN ? <AlertTriangle size={20}/> : <Clock size={20}/>}
             {activeTicket.status}
           </div>
           <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white/50 rounded">{activeTicket.priority}</span>
         </div>

         {/* Details */}
         <div className="space-y-6">
           <div>
             <label className="text-xs font-bold text-gray-400 uppercase">Serviço</label>
             <p className="text-lg font-medium text-gray-900">{activeTicket.serviceType}</p>
           </div>
           
           <div>
             <label className="text-xs font-bold text-gray-400 uppercase">Descrição</label>
             <p className="text-gray-700 bg-gray-50 p-4 rounded-none border border-gray-100 text-lg leading-relaxed">
               {activeTicket.description}
             </p>
           </div>

           {prop?.doorCode && (
             <div className="bg-blue-50 p-4 rounded-none border border-blue-100">
               <label className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1">
                 <Navigation size={12}/> Acesso
               </label>
               <div className="flex justify-between items-center mt-1">
                 <span className="text-gray-600">Senha Porta:</span>
                 <span className="text-2xl font-heading font-mono font-bold text-blue-700 tracking-widest">{prop.doorCode}</span>
               </div>
             </div>
           )}
         </div>
       </div>

       {/* ACTION BAR (Fixed Bottom) */}
       <div className="p-6 border-t border-gray-100 bg-white pb-safe">
         {activeTicket.status === TicketStatus.OPEN || activeTicket.status === TicketStatus.ASSIGNED || activeTicket.status === TicketStatus.ON_THE_WAY ? (
           <div className="grid grid-cols-2 gap-4">
             <button 
              onClick={() => openMaps(prop?.address || activeTicket.propertyCode)}
              className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-none text-gray-600 font-bold active:bg-gray-200 transition-colors"
             >
               <MapPin size={24} className="mb-1" />
               Mapa
             </button>
             <button 
              onClick={handleStartJob}
              className="flex flex-col items-center justify-center p-4 bg-brand-600 rounded-none text-white font-bold shadow-lg shadow-brand-600/30 active:scale-95 transition-transform"
             >
               <Navigation size={24} className="mb-1" />
               Iniciar
             </button>
           </div>
         ) : (
           <button 
            onClick={handleOpenFinishModal}
            className="w-full flex items-center justify-center gap-3 p-5 bg-green-600 rounded-none text-white font-bold text-xl shadow-lg shadow-green-600/30 active:scale-95 transition-transform"
           >
             <Camera size={28} /> Finalizar Serviço
           </button>
         )}
       </div>

       {/* FINISH MODAL OVERLAY */}
       {showFinishModal && (
         <div className="absolute inset-0 z-50 bg-white flex flex-col animate-fade-in">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-900">Relatório de Conclusão</h2>
             <button onClick={() => setShowFinishModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
               <X size={20} />
             </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
             {/* Condition Selector */}
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-3">Como você encontrou o imóvel?</label>
               <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => setFinishCondition('perfect')}
                  className={`p-4 rounded-none border-2 flex flex-col items-center gap-2 transition-all ${finishCondition === 'perfect' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}
                 >
                   <CheckCircle2 size={32} />
                   <span className="font-bold">Tudo Perfeito</span>
                 </button>
                 <button 
                  onClick={() => setFinishCondition('issues')}
                  className={`p-4 rounded-none border-2 flex flex-col items-center gap-2 transition-all ${finishCondition === 'issues' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}
                 >
                   <AlertTriangle size={32} />
                   <span className="font-bold">Com Problemas</span>
                 </button>
               </div>
             </div>

             {/* Problem Details (Conditional) */}
             {finishCondition === 'issues' && (
               <div className="space-y-4 animate-fade-in">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Descreva os problemas encontrados</label>
                   <textarea 
                     value={finishNotes}
                     onChange={e => setFinishNotes(e.target.value)}
                     className="w-full p-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-red-500 focus:outline-none"
                     rows={4}
                     placeholder="Ex: Torneira vazando, mancha no sofá..."
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Fotos do Problema</label>
                   <div className="grid grid-cols-3 gap-2">
                     {finishPhotos.map((photo, idx) => (
                       <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                         <img src={photo} className="w-full h-full object-cover" alt="Evidence" />
                         <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1">
                           <X size={12} />
                         </button>
                       </div>
                     ))}
                     <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
                       <Camera size={24} />
                       <span className="text-xs mt-1 font-medium">Adicionar</span>
                       <input 
                         type="file" 
                         accept="image/*" 
                         capture="environment" 
                         className="hidden" 
                         onChange={handlePhotoUpload}
                       />
                     </label>
                   </div>
                 </div>
               </div>
             )}
             
             {/* Optional notes even if perfect */}
             {finishCondition === 'perfect' && (
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Observações (Opcional)</label>
                 <textarea 
                   value={finishNotes}
                   onChange={e => setFinishNotes(e.target.value)}
                   className="w-full p-3 border border-gray-300 rounded-none focus:ring-2 focus:ring-brand-500 focus:outline-none"
                   rows={2}
                   placeholder="Alguma observação extra?"
                 />
               </div>
             )}
           </div>

           <div className="p-6 border-t border-gray-100 bg-white pb-safe">
             <button 
               onClick={handleConfirmFinish}
               className="w-full py-4 bg-brand-600 text-white rounded-none font-bold text-lg shadow-lg active:scale-95 transition-transform"
             >
               Confirmar e Finalizar
             </button>
           </div>
         </div>
       )}
     </div>
   );
 }

 // MAIN LIST VIEW
 return (
  <div className="h-full flex flex-col bg-gray-50">
   {/* Header */}
   <div className="bg-white px-6 pt-safe pb-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
     <div>
       <p className="text-xs text-gray-400 font-bold uppercase">Operação de Campo</p>
       <h1 className="text-xl font-bold text-gray-900">Olá, {currentUser.name.split(' ')[0]}</h1>
     </div>
     <div className="flex items-center gap-2">
       <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${isTracking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
         <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
         {isTracking ? 'GPS ON' : locationError ? 'GPS ERR' : 'GPS OFF'}
       </div>
       <div className="relative">
         <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
           <Bell size={20} className="text-gray-600" />
         </div>
         {myTickets.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
       </div>
     </div>
   </div>

   {/* Content */}
   {activeTab === 'tasks' ? (
     <div className="flex-1 overflow-y-auto p-4 space-y-4">
       {/* Summary Cards */}
       <div className="grid grid-cols-3 gap-3 mb-2">
         <div className="bg-blue-600 rounded-none p-4 text-white shadow-lg shadow-blue-600/20">
           <p className="text-3xl font-bold mb-1">{myTickets.length}</p>
           <p className="text-xs opacity-80 uppercase font-bold">Pendentes</p>
         </div>
         <div className="bg-violet-600 rounded-none p-4 text-white shadow-lg shadow-violet-600/20">
           <p className="text-3xl font-bold mb-1">{myCheckoutTickets.length}</p>
           <p className="text-xs opacity-80 uppercase font-bold">Checkouts</p>
         </div>
         <div className="bg-white rounded-none p-4 text-gray-800 border border-gray-100 shadow-sm">
           <p className="text-3xl font-bold mb-1 text-green-600">{completedToday}</p>
           <p className="text-xs text-gray-400 uppercase font-bold">Feitos Hoje</p>
         </div>
       </div>

       {locationError && (
         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none text-sm flex items-center gap-2">
           <AlertTriangle size={16} />
           {locationError}
         </div>
       )}

       {/* Checkout Tickets Section */}
       {myCheckoutTickets.length > 0 && (
         <>
           <h2 className="text-sm font-bold text-violet-600 uppercase ml-1 mt-6 mb-2 flex items-center gap-2">
             <LogOut size={14} /> Checkouts Atribuídos
           </h2>
           {myCheckoutTickets.map(ticket => (
             <div
               key={ticket.id}
               onClick={() => setActiveTicket(ticket)}
               className="bg-white p-5 rounded-none shadow-sm border-2 border-violet-300 active:scale-98 transition-transform cursor-pointer relative overflow-hidden mb-3 bg-violet-50/30"
             >
               <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                 <LogOut size={10} /> Checkout
               </div>

               <div className="flex justify-between items-start mb-2">
                 <div>
                   <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                     ticket.status === TicketStatus.OPEN ? 'bg-red-100 text-red-800' :
                     ticket.status === TicketStatus.ASSIGNED ? 'bg-blue-100 text-blue-800' :
                     ticket.status === TicketStatus.ON_THE_WAY ? 'bg-purple-100 text-purple-800' :
                     ticket.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                   }`}>
                     {ticket.status}
                   </span>
                   <h3 className="text-xl font-bold text-gray-900 mt-1">{ticket.propertyCode}</h3>
                 </div>
               </div>

               <p className="text-gray-600 text-sm mb-4 bg-violet-100/50 p-2 rounded-lg border border-violet-200">
                 {ticket.description}
               </p>

               <div className="flex items-center justify-between mt-auto">
                 <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                   <Clock size={12} /> {new Date(ticket.scheduledDate || ticket.desiredDate).toLocaleDateString([], {day:'2-digit', month:'2-digit'})}
                 </div>
                 <div className="flex items-center gap-1 text-violet-600 font-bold text-sm">
                   Ver detalhes <ArrowRight size={14} />
                 </div>
               </div>
             </div>
           ))}
         </>
       )}

       <h2 className="text-sm font-bold text-gray-500 uppercase ml-1 mt-6 mb-2">Sua Fila de Trabalho</h2>
       
       {myTickets.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-12 text-center">
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
             <CheckCircle2 size={40} />
           </div>
           <h3 className="text-lg font-bold text-gray-900">Tudo limpo!</h3>
           <p className="text-gray-500">Você não tem chamados pendentes.</p>
         </div>
       ) : (
         myTickets.map(ticket => (
           <div 
            key={ticket.id} 
            onClick={() => setActiveTicket(ticket)}
            className="bg-white p-5 rounded-none shadow-sm border border-gray-200 active:scale-98 transition-transform cursor-pointer relative overflow-hidden"
           >
             {ticket.priority === 'Urgente' && (
               <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                 Urgente
               </div>
             )}
             
             <div className="flex justify-between items-start mb-2">
               <div>
                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                   ticket.status === TicketStatus.OPEN ? 'bg-red-100 text-red-800' :
                   ticket.status === TicketStatus.ASSIGNED ? 'bg-blue-100 text-blue-800' :
                   ticket.status === TicketStatus.ON_THE_WAY ? 'bg-purple-100 text-purple-800' :
                   ticket.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                 }`}>
                   {ticket.status}
                 </span>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{ticket.propertyCode}</h3>
               </div>
             </div>
             
             <p className="text-gray-600 text-sm line-clamp-2 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
               {ticket.description}
             </p>

             <div className="flex items-center justify-between mt-auto">
               <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                 <Clock size={12} /> {new Date(ticket.desiredDate).toLocaleDateString([], {day:'2-digit', month:'2-digit'})} {new Date(ticket.desiredDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
               </div>
               <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
                 <ArrowRight size={16} />
               </div>
             </div>
           </div>
         ))
       )}
     </div>
   ) : (
     /* Profile / Map Tab */
     <div className="flex-1 p-6 flex flex-col items-center justify-center">
       <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-4 overflow-hidden">
         {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover"/> : <span className="text-2xl font-heading font-bold">{currentUser.name.slice(0,2)}</span>}
       </div>
       <h2 className="text-2xl font-heading font-bold text-gray-900">{currentUser.name}</h2>
       <p className="text-gray-500 mb-8">{currentUser.role}</p>

       <div className="w-full bg-white rounded-none border border-gray-200 p-4 mb-8">
         <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Status do Sistema</h3>
         <div className="flex justify-between items-center py-2 border-b border-gray-100">
           <span className="text-gray-700">GPS Tracking</span>
           <span className={isTracking ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{isTracking ? "Ativo" : "Inativo"}</span>
         </div>
         {lastLocation && (
           <div className="flex justify-between items-center py-2 border-b border-gray-100">
             <span className="text-gray-700">Última Localização</span>
             <span className="text-xs text-gray-500 font-mono">{lastLocation.lat.toFixed(4)}, {lastLocation.lng.toFixed(4)}</span>
           </div>
         )}
         <div className="flex justify-between items-center py-2">
           <span className="text-gray-700">Versão App</span>
           <span className="text-gray-500">v1.2.1 (Native)</span>
         </div>
       </div>

       <button 
        onClick={onLogout}
        className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-none flex items-center justify-center gap-2 active:bg-red-100"
       >
         <LogOut size={20} /> Sair do Sistema
       </button>
     </div>
   )}

   {/* Bottom Nav */}
   <div className="bg-white border-t border-gray-200 pb-safe">
     <div className="flex justify-around items-center h-16">
       <button 
        onClick={() => setActiveTab('tasks')}
        className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'tasks' ? 'text-brand-600' : 'text-gray-400'}`}
       >
         <div className={`p-1 rounded-lg ${activeTab === 'tasks' ? 'bg-brand-50' : ''}`}>
          <CheckCircle2 size={24} strokeWidth={activeTab === 'tasks' ? 2.5 : 2} />
         </div>
         <span className="text-[10px] font-bold">Tarefas</span>
       </button>
       <button 
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center gap-1 w-full h-full justify-center ${activeTab === 'profile' ? 'text-brand-600' : 'text-gray-400'}`}
       >
         <div className={`p-1 rounded-lg ${activeTab === 'profile' ? 'bg-brand-50' : ''}`}>
          <Navigation size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
         </div>
         <span className="text-[10px] font-bold">Perfil</span>
       </button>
     </div>
   </div>
  </div>
 );
};

export default FieldApp;
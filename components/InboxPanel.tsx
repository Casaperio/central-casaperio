import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, ChatMessage, Property, Reservation, ReservationStatus } from '../types';
import { storageService } from '../services/storage';
import { generateId } from '../utils';
import { Send, Search, User as UserIcon, MessageSquare, Clock, Check, CheckCheck, Edit, Plus, Users, Calendar, Phone, PhoneCall } from 'lucide-react';

interface InboxPanelProps {
 currentUser: User;
 reservations?: Reservation[];
 properties?: Property[];
}

const InboxPanel: React.FC<InboxPanelProps> = ({ currentUser, reservations = [], properties = [] }) => {
 const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
 const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
 const [propertyMessages, setPropertyMessages] = useState<ChatMessage[]>([]);
 const [newMessage, setNewMessage] = useState('');
 const [searchTerm, setSearchTerm] = useState('');
 
 // Compose / Broadcast State
 const [showComposeModal, setShowComposeModal] = useState(false);
 const [composeTarget, setComposeTarget] = useState<'single' | 'group'>('single');
 const [composeGroupFilter, setComposeGroupFilter] = useState<'inhouse' | 'checkin' | 'checkout'>('inhouse');
 const [selectedComposeProperty, setSelectedComposeProperty] = useState('');
 const [composeMessage, setComposeMessage] = useState('');
 const [isScheduled, setIsScheduled] = useState(false);
 const [scheduleDate, setScheduleDate] = useState('');
 const [isSending, setIsSending] = useState(false);

 const messagesEndRef = useRef<HTMLDivElement>(null);

 // Subscribe to ALL messages list (for the sidebar)
 useEffect(() => {
  const unsub = storageService.communication.subscribeAllMessages((msgs) => {
    setAllMessages(msgs);
  });
  return () => unsub();
 }, []);

 // Subscribe to SPECIFIC property chat (for the main view)
 // This ensures we have the full history, not just the recent ones from subscribeAllMessages
 useEffect(() => {
   if (selectedProperty) {
     const unsub = storageService.communication.subscribeMessages(selectedProperty, (msgs) => {
       setPropertyMessages(msgs);
       // Mark unread as read if sender is guest
       msgs.forEach(m => {
         if (m.sender === 'guest' && !m.read) {
           storageService.communication.markAsRead(m.id);
         }
       });
       // Scroll to bottom
       setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
     });
     return () => unsub();
   } else {
     setPropertyMessages([]);
   }
 }, [selectedProperty]);

 // Group messages by property for the sidebar
 const conversations = useMemo(() => {
   const groups: Record<string, { lastMessage: ChatMessage, unreadCount: number, guestName?: string }> = {};
   
   allMessages.forEach(msg => {
     if (!groups[msg.propertyCode]) {
       groups[msg.propertyCode] = { 
         lastMessage: msg, 
         unreadCount: 0,
         guestName: msg.senderName 
       };
     }
     
     // Update last message if newer (list comes desc, but just in case)
     if (msg.timestamp > groups[msg.propertyCode].lastMessage.timestamp) {
       groups[msg.propertyCode].lastMessage = msg;
     }
     
     // Count unread from guest
     if (msg.sender === 'guest' && !msg.read) {
       groups[msg.propertyCode].unreadCount++;
     }

     // Try to capture guest name if available
     if (msg.sender === 'guest' && msg.senderName) {
       groups[msg.propertyCode].guestName = msg.senderName;
     }
   });

   return Object.entries(groups)
    .map(([code, data]) => ({ code, ...data }))
    .sort((a,b) => b.lastMessage.timestamp - a.lastMessage.timestamp)
    .filter(c => 
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.guestName && c.guestName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
 }, [allMessages, searchTerm]);

 // Helper to filter reservations for broadcast
 const getTargetRecipients = () => {
   const today = new Date();
   today.setHours(0,0,0,0);
   const todayTime = today.getTime();

   if (composeTarget === 'single') {
     if (!selectedComposeProperty) return [];
     const res = reservations.find(r => 
       r.propertyCode === selectedComposeProperty && 
       r.status !== ReservationStatus.CANCELED &&
       new Date(r.checkInDate).getTime() <= Date.now() &&
       new Date(r.checkOutDate).getTime() >= Date.now()
     );
     // If no active res, we can still send to the property code, it will just wait for next guest
     return [{ propertyCode: selectedComposeProperty, guestName: res?.guestName }];
   }

   // Group Broadcast Logic
   return reservations.filter(r => {
     if (r.status === ReservationStatus.CANCELED) return false;
     const cin = new Date(r.checkInDate); cin.setHours(0,0,0,0);
     const cout = new Date(r.checkOutDate); cout.setHours(0,0,0,0);
     const cinTime = cin.getTime();
     const coutTime = cout.getTime();

     if (composeGroupFilter === 'checkin') return cinTime === todayTime;
     if (composeGroupFilter === 'checkout') return coutTime === todayTime;
     if (composeGroupFilter === 'inhouse') return cinTime < todayTime && coutTime > todayTime;
     return false;
   }).map(r => ({ propertyCode: r.propertyCode, guestName: r.guestName }));
 };

 const handleSendCompose = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!composeMessage.trim()) return;

   const recipients = getTargetRecipients();
   if (recipients.length === 0) {
     alert("Nenhum destinatário encontrado para os critérios selecionados.");
     return;
   }

   setIsSending(true);
   const scheduledTimestamp = isScheduled && scheduleDate ? new Date(scheduleDate).getTime() : undefined;

   try {
     // Send to all recipients
     const promises = recipients.map(recipient => {
       const msg: ChatMessage = {
         id: generateId(),
         propertyCode: recipient.propertyCode,
         text: composeMessage,
         sender: 'staff',
         senderName: currentUser.name,
         timestamp: Date.now(),
         read: false,
         scheduledFor: scheduledTimestamp
       };
       return storageService.communication.sendMessage(msg);
     });

     await Promise.all(promises);
     
     alert(`Mensagem enviada para ${recipients.length} destinatários!`);
     setShowComposeModal(false);
     setComposeMessage('');
     setSelectedComposeProperty('');
     setIsScheduled(false);
     setScheduleDate('');
   } catch (err) {
     console.error(err);
     alert("Erro ao enviar mensagens.");
   } finally {
     setIsSending(false);
   }
 };

 const handleSendMessage = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!newMessage.trim() || !selectedProperty) return;

   const msg: ChatMessage = {
     id: generateId(),
     propertyCode: selectedProperty,
     text: newMessage,
     sender: 'staff',
     senderName: currentUser.name,
     timestamp: Date.now(),
     read: false
   };

   await storageService.communication.sendMessage(msg);
   setNewMessage('');
 };

 // Mock Call function
 const handleRequestCall = () => {
   alert("Para realizar chamadas, o tablet do apartamento precisa estar ativo. Esta funcionalidade enviará um sinal de chamada em breve.");
   // In a full implementation, this would trigger storageService.communication.startCall(...)
 };

 return (
  <div className="flex h-[calc(100vh-64px)] bg-gray-100 -m-4 md:-m-6 overflow-hidden relative">
    
    {/* Sidebar */}
    <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col ${selectedProperty ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Mensagens</h2>
          <button 
            onClick={() => setShowComposeModal(true)}
            className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 transition-colors shadow-sm"
            title="Nova Mensagem"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar conversa..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhuma conversa encontrada.
          </div>
        ) : (
          conversations.map(conv => (
            <div 
              key={conv.code}
              onClick={() => setSelectedProperty(conv.code)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${selectedProperty === conv.code ? 'bg-blue-50' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm overflow-hidden">
                  {conv.code.substring(0, 2)}
                </div>
                {conv.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 text-sm truncate pr-2">{conv.code}</h3>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(conv.lastMessage.timestamp).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate font-medium">
                  {conv.guestName || 'Hóspede'}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                  {conv.lastMessage.scheduledFor && conv.lastMessage.scheduledFor > Date.now() && <Clock size={10} className="text-orange-400"/>}
                  {conv.lastMessage.sender === 'staff' && <span className="mr-1">Você:</span>}
                  {conv.lastMessage.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Chat Area */}
    <div className={`flex-1 flex flex-col bg-[#e5ddd5] ${!selectedProperty ? 'hidden md:flex' : 'flex'}`}>
      {selectedProperty ? (
        <>
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedProperty(null)} className="md:hidden p-2 -ml-2 text-gray-500">
                <ArrowLeftIcon />
              </button>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                {selectedProperty.substring(0, 2)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{selectedProperty}</h2>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  {conversations.find(c => c.code === selectedProperty)?.guestName || 'Hóspede'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleRequestCall}
                className="p-2 text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                title="Ligar para Apartamento"
              >
                <Phone size={20} />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-center">
            {propertyMessages.map(msg => {
              const isStaff = msg.sender === 'staff';
              const isScheduledFuture = msg.scheduledFor && msg.scheduledFor > Date.now();

              return (
                <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] md:max-w-[60%] rounded-lg p-3 shadow-sm relative text-sm ${
                    isStaff ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                  } ${isScheduledFuture ? 'opacity-70 border-2 border-dashed border-orange-300' : ''}`}>
                    
                    {isScheduledFuture && (
                      <div className="text-[10px] text-orange-600 font-bold mb-1 flex items-center gap-1">
                        <Clock size={10} /> Agendado para {new Date(msg.scheduledFor!).toLocaleString()}
                      </div>
                    )}

                    {!isStaff && msg.senderName && (
                      <p className="text-[10px] font-bold text-orange-600 mb-1">{msg.senderName}</p>
                    )}
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </span>
                      {isStaff && (
                        <span className={msg.read ? "text-blue-500" : "text-gray-400"}>
                          {msg.read ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-200 flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Digite uma mensagem..." 
              className="flex-1 p-3 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="p-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={48} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-600 mb-2">Suas Mensagens</h2>
          <p className="text-sm">Selecione uma conversa para iniciar o atendimento.</p>
        </div>
      )}
    </div>

    {/* COMPOSE MODAL */}
    {showComposeModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
        <div className="bg-white rounded-none shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Edit size={18} /> Nova Mensagem
            </h3>
            <button onClick={() => setShowComposeModal(false)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeftIcon />
            </button>
          </div>
          
          <form onSubmit={handleSendCompose} className="p-6 space-y-6 overflow-y-auto">
            
            {/* Target Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destinatário</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${composeTarget === 'single' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    name="target" 
                    checked={composeTarget === 'single'} 
                    onChange={() => setComposeTarget('single')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-medium text-sm">Apartamento Específico</span>
                </label>
                <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${composeTarget === 'group' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input 
                    type="radio" 
                    name="target" 
                    checked={composeTarget === 'group'} 
                    onChange={() => setComposeTarget('group')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-sm">Transmissão em Massa</span>
                </label>
              </div>
            </div>

            {/* Specific Selection */}
            {composeTarget === 'single' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selecione o Imóvel</label>
                <select 
                  value={selectedComposeProperty}
                  onChange={(e) => setSelectedComposeProperty(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                >
                  <option value="">Selecione...</option>
                  {properties.map(p => (
                    <option key={p.code} value={p.code}>{p.code} - {p.address}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Group Selection */}
            {composeTarget === 'group' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar Por</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => setComposeGroupFilter('inhouse')}
                    className={`p-2 text-xs font-bold rounded border ${composeGroupFilter === 'inhouse' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    Hospedados Agora
                  </button>
                  <button 
                    type="button"
                    onClick={() => setComposeGroupFilter('checkin')}
                    className={`p-2 text-xs font-bold rounded border ${composeGroupFilter === 'checkin' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    Check-in Hoje
                  </button>
                  <button 
                    type="button"
                    onClick={() => setComposeGroupFilter('checkout')}
                    className={`p-2 text-xs font-bold rounded border ${composeGroupFilter === 'checkout' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    Check-out Hoje
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Users size={12} />
                  Estimativa: {getTargetRecipients().length} destinatários
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea 
                rows={4}
                value={composeMessage}
                onChange={e => setComposeMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Digite sua mensagem..."
                required
              />
            </div>

            {/* Scheduling */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input 
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                  <Calendar size={14} /> Agendar Envio
                </span>
              </label>
              {isScheduled && (
                <input 
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm animate-in fade-in slide-in-from-top-1"
                  required={isScheduled}
                />
              )}
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isSending}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSending ? 'Enviando...' : (
                  <>
                    <Send size={18} /> {isScheduled ? 'Agendar Mensagem' : 'Enviar Agora'}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    )}
  </div>
 );
};

// Helper Icon
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

export default InboxPanel;
import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, TicketCategory } from '../types';
import { X, Check, Search, ChevronLeft, CalendarClock, AlertCircle, Gem } from 'lucide-react';

interface TicketFormProps {
 onClose: () => void;
 onSubmit: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
 properties: { code: string; address: string }[];
 priorities: string[];
 serviceTypes: string[];
 isPreventiveMode?: boolean; // Acts as initial state
 category?: TicketCategory; // Maintenance or Concierge
 hidePreventiveToggle?: boolean; // Hide preventive/recurring toggle (for kiosk mode)
 initialData?: {
  propertyCode?: string;
  description?: string;
  reservationId?: string;
  serviceType?: string; // Pre-fill service type
 };
}

const TicketForm: React.FC<TicketFormProps> = ({
 onClose,
 onSubmit,
 properties,
 priorities,
 serviceTypes,
 isPreventiveMode = false,
 category = 'maintenance',
 hidePreventiveToggle = false,
 initialData
}) => {
 // Local state to toggle mode inside the form
 const [isPreventive, setIsPreventive] = useState(isPreventiveMode);
 
 const [propertyCode, setPropertyCode] = useState(initialData?.propertyCode || '');
 const [propertyName, setPropertyName] = useState('');
 const [priority, setPriority] = useState<string>(priorities[0] || '');
 const [serviceType, setServiceType] = useState<string>(initialData?.serviceType || (serviceTypes.length > 0 ? serviceTypes[0] : ''));
 const [description, setDescription] = useState(initialData?.description || '');
 const [desiredDate, setDesiredDate] = useState('');
 const [guestAuth, setGuestAuth] = useState(false);
 const [recurrence, setRecurrence] = useState('Única');
 
 // Autocomplete state
 const [showSuggestions, setShowSuggestions] = useState(false);
 const [filteredProperties, setFilteredProperties] = useState(properties);

 const isConcierge = category === 'concierge';

 // Initialize property name if code provided
 useEffect(() => {
  if (initialData?.propertyCode) {
    const prop = properties.find(p => p.code === initialData.propertyCode);
    if (prop) setPropertyName(prop.address);
  }
 }, [initialData, properties]);

 useEffect(() => {
  // If initialData.serviceType is present, ensure it's selected
  if (initialData?.serviceType && serviceTypes.includes(initialData.serviceType)) {
    setServiceType(initialData.serviceType);
  } else if (!serviceType && serviceTypes.length > 0) {
    setServiceType(serviceTypes[0]);
  }
 }, [initialData, serviceTypes]);

 useEffect(() => {
  if (propertyCode) {
   const filtered = properties.filter(p => 
    p.code.toLowerCase().includes(propertyCode.toLowerCase()) || 
    p.address.toLowerCase().includes(propertyCode.toLowerCase())
   );
   setFilteredProperties(filtered);
  } else {
   setFilteredProperties(properties);
  }
 }, [propertyCode, properties]);

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!propertyCode || !description || !desiredDate) {
   alert("Por favor preencha os campos obrigatórios.");
   return;
  }

  onSubmit({
   propertyCode,
   propertyName,
   priority,
   serviceType,
   description,
   desiredDate,
   guestAuth: isPreventive ? false : guestAuth, 
   assignee: 'Não atribuído',
   isPreventive: isPreventive,
   recurrence: isPreventive ? recurrence : undefined,
   reservationId: initialData?.reservationId,
   category: category // 'maintenance' or 'concierge'
  });
  onClose();
 };

 const selectProperty = (p: typeof properties[0]) => {
  setPropertyCode(p.code);
  setPropertyName(p.address);
  setShowSuggestions(false);
 };

 const borderColor = isConcierge 
  ? 'border-purple-500' 
  : isPreventive 
    ? 'border-blue-500' 
    : 'border-brand-500';

 const buttonColor = isConcierge
  ? 'bg-purple-600 hover:bg-purple-700'
  : isPreventive
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-brand-600 hover:bg-brand-700';

 return (
  <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-in fade-in slide-in-from-bottom-5">
   <div className={`bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-none shadow-xl overflow-hidden flex flex-col transition-colors duration-300 border-t-4 ${borderColor}`}>
    
    {/* Header */}
    <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white z-10 sticky top-0">
     <div className="flex items-center gap-3">
       <button onClick={onClose} className="md:hidden p-1 -ml-2 text-gray-500">
        <ChevronLeft size={28} />
       </button>
       <div className="flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
         {isConcierge ? <Gem size={20} className="text-purple-600"/> : null}
         {isConcierge 
          ? 'Nova Solicitação Concierge' 
          : isPreventive ? 'Nova Manutenção Preventiva' : 'Novo Chamado'
         }
        </h2>
        {isPreventive && !isConcierge && <p className="text-xs text-blue-600 font-medium">Rotina Programada</p>}
       </div>
     </div>
     <button onClick={onClose} className="hidden md:block p-2 hover:bg-gray-100 rounded-full">
      <X size={20} className="text-gray-500" />
     </button>
    </div>

    <div className="flex-1 overflow-y-auto">
     <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      
      {/* Property Autocomplete */}
      <div className="relative">
       <label className="block text-sm font-medium text-gray-700 mb-1">Imóvel *</label>
       <div className="relative">
        <input 
         type="text" 
         placeholder="Busque por código ou endereço (ex: I-AC...)"
         className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none ${isConcierge ? 'focus:ring-purple-500' : 'focus:ring-brand-500'}`}
         value={propertyCode}
         onChange={(e) => {
          setPropertyCode(e.target.value);
          setShowSuggestions(true);
          if(e.target.value === '') setPropertyName('');
         }}
         onFocus={() => setShowSuggestions(true)}
        />
        <Search className="absolute right-3 top-3.5 text-gray-400" size={18} />
       </div>
       
       {showSuggestions && (
        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
         {filteredProperties.length > 0 ? (
          filteredProperties.map((p) => (
           <li 
            key={p.code} 
            onClick={() => selectProperty(p)}
            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
           >
            <div className="font-medium text-gray-900">{p.code}</div>
            <div className="text-sm text-gray-500">{p.address}</div>
           </li>
          ))
         ) : (
          <li className="p-3 text-gray-500 text-sm">Nenhum imóvel encontrado.</li>
         )}
        </ul>
       )}
       {propertyName && <p className={`text-sm mt-1 font-medium ${isConcierge ? 'text-purple-600' : 'text-brand-600'}`}>{propertyName}</p>}
      </div>

      {/* Mode Toggle Switch (Only for Maintenance, hidden in kiosk) */}
      {!isConcierge && !hidePreventiveToggle && (
       <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isPreventive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
         <div className="flex items-center gap-3">
           <div className={`p-2 rounded-full ${isPreventive ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
             <CalendarClock size={20} />
           </div>
           <div>
             <p className={`text-sm font-bold ${isPreventive ? 'text-blue-800' : 'text-gray-700'}`}>
               Manutenção Recorrente/Preventiva?
             </p>
             <p className="text-xs text-gray-500">Agendar repetição automática.</p>
           </div>
         </div>
         <label className="relative inline-flex items-center cursor-pointer">
           <input 
             type="checkbox" 
             checked={isPreventive} 
             onChange={(e) => setIsPreventive(e.target.checked)} 
             className="sr-only peer" 
           />
           <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
         </label>
       </div>
      )}

      {/* Recurrence (Only if Preventive is ON, hidden in kiosk) */}
      {isPreventive && !isConcierge && !hidePreventiveToggle && (
       <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
         <label className="block text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
          Periodicidade
         </label>
         <select 
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
         >
          <option value="Única">Única (Não recorrente)</option>
          <option value="Semanal">Semanal (Toda semana)</option>
          <option value="Quinzenal">Quinzenal (A cada 15 dias)</option>
          <option value="Mensal">Mensal (Todo mês)</option>
          <option value="Trimestral">Trimestral (A cada 3 meses)</option>
          <option value="Semestral">Semestral (A cada 6 meses)</option>
          <option value="Anual">Anual (Uma vez ao ano)</option>
         </select>
       </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {/* Priority */}
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
        <select 
         value={priority}
         onChange={(e) => setPriority(e.target.value)}
         className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none bg-white ${isConcierge ? 'focus:ring-purple-500' : 'focus:ring-brand-500'}`}
        >
         {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
       </div>

       {/* Service Type */}
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>
        <select 
         value={serviceType}
         onChange={(e) => setServiceType(e.target.value)}
         className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none bg-white ${isConcierge ? 'focus:ring-purple-500' : 'focus:ring-brand-500'}`}
        >
         {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
       </div>
      </div>

      {/* Description */}
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (Resumida) *</label>
       <textarea 
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none ${isConcierge ? 'focus:ring-purple-500' : 'focus:ring-brand-500'}`}
        placeholder={isConcierge ? "Ex: Carro executivo para 4 pessoas..." : isPreventive ? "Ex: Limpeza de ar condicionado, Verificação de boiler..." : "Descreva o problema em poucas palavras..."}
       />
      </div>

      {/* Date & Time */}
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        {isPreventive ? 'Data Programada (Início) *' : isConcierge ? 'Data do Serviço *' : 'Data e Horário Desejado *'}
       </label>
       <input 
        type="datetime-local"
        value={desiredDate}
        onChange={(e) => setDesiredDate(e.target.value)}
        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none ${isConcierge ? 'focus:ring-purple-500' : 'focus:ring-brand-500'}`}
       />
      </div>

      {/* Checkbox (Only Show for Corrective/Standard Maintenance Mode) */}
      {!isPreventive && !isConcierge && (
       <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <input 
         type="checkbox" 
         id="guestAuth" 
         checked={guestAuth}
         onChange={(e) => setGuestAuth(e.target.checked)}
         className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 border-gray-300"
        />
        <label htmlFor="guestAuth" className="ml-3 text-sm text-gray-700 font-medium cursor-pointer">
         Hóspede autoriza entrada sem estar presente?
        </label>
       </div>
      )}
     </form>
    </div>

    {/* Footer Actions - Sticky on Mobile */}
    <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white fixed md:static bottom-0 left-0 right-0 z-20 pb-safe">
       <button 
       type="button" 
       onClick={onClose}
       className="flex-1 md:flex-none px-6 py-3 md:py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 md:border-transparent"
      >
       Cancelar
      </button>
      <button 
       onClick={handleSubmit}
       className={`flex-[2] md:flex-none px-6 py-3 md:py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${buttonColor}`}
      >
       <Check size={18} /> 
       {isConcierge 
        ? 'Solicitar Serviço' 
        : isPreventive 
          ? 'Agendar Preventiva' 
          : 'Criar Chamado'}
      </button>
    </div>
   </div>
  </div>
 );
};

export default TicketForm;
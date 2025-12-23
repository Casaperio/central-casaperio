import React, { useState, useEffect } from 'react';
import { Reservation, ReservationStatus, Property } from '../types';
import { X, Check, Search, ChevronLeft, Users, Plane, BedDouble, FileCheck, Languages } from 'lucide-react';

interface ReservationFormProps {
 onClose: () => void;
 onSubmit: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
 properties: Property[];
}

const LANGUAGES = ['Português (Brasil)', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Outro'];

const ReservationForm: React.FC<ReservationFormProps> = ({ onClose, onSubmit, properties }) => {
 const [propertyCode, setPropertyCode] = useState('');
 const [propertyName, setPropertyName] = useState('');
 const [guestName, setGuestName] = useState('');
 const [language, setLanguage] = useState('');
 const [checkInDate, setCheckInDate] = useState('');
 const [checkOutDate, setCheckOutDate] = useState('');
 const [guestCount, setGuestCount] = useState<number>(1);
 const [hasBabies, setHasBabies] = useState(false);
 const [flightInfo, setFlightInfo] = useState('');
 const [roomConfig, setRoomConfig] = useState('');
 const [docsSent, setDocsSent] = useState(false);
 
 // Autocomplete state
 const [showSuggestions, setShowSuggestions] = useState(false);
 const [filteredProperties, setFilteredProperties] = useState(properties);
 const [showLangSuggestions, setShowLangSuggestions] = useState(false);

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
  if (!propertyCode || !guestName || !checkInDate || !checkOutDate) {
   alert("Por favor preencha os campos obrigatórios.");
   return;
  }

  onSubmit({
   propertyCode,
   propertyName,
   guestName,
   language,
   checkInDate,
   checkOutDate,
   guestCount: Number(guestCount),
   hasBabies,
   flightInfo,
   roomConfig,
   docsSent,
   maintenanceAck: { seen: false } // Initial state
  });
  onClose();
 };

 const selectProperty = (p: typeof properties[0]) => {
  setPropertyCode(p.code);
  setPropertyName(p.address);
  setShowSuggestions(false);
 };

 return (
  <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-in fade-in slide-in-from-bottom-5">
   <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-none shadow-xl overflow-hidden flex flex-col">
    
    {/* Header */}
    <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-white z-10 sticky top-0">
     <div className="flex items-center gap-3">
       <button onClick={onClose} className="md:hidden p-1 -ml-2 text-gray-500">
        <ChevronLeft size={28} />
       </button>
       <h2 className="text-xl font-bold text-gray-800">Nova Reserva</h2>
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
         placeholder="Busque por código ou endereço..."
         className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
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
       {propertyName && <p className="text-sm text-blue-600 mt-1 font-medium">{propertyName}</p>}
      </div>

      {/* Guest Name & Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Hóspede *</label>
          <input 
           type="text"
           value={guestName}
           onChange={(e) => setGuestName(e.target.value)}
           className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
           placeholder="Ex: John Doe"
           required
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
          <div className="relative">
           <input 
            type="text"
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setShowLangSuggestions(true); }}
            onFocus={() => setShowLangSuggestions(true)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Selecione..."
           />
           <Languages className="absolute right-3 top-3.5 text-gray-400" size={18} />
          </div>
          {showLangSuggestions && (
           <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
            {LANGUAGES.filter(l => l.toLowerCase().includes(language.toLowerCase())).map(lang => (
              <li 
              key={lang} 
              onClick={() => { setLanguage(lang); setShowLangSuggestions(false); }}
              className="p-3 hover:bg-blue-50 cursor-pointer"
              >
               {lang}
              </li>
            ))}
           </ul>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Check-in *</label>
         <input 
          type="datetime-local"
          value={checkInDate}
          onChange={(e) => setCheckInDate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
         />
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Check-out *</label>
         <input 
          type="datetime-local"
          value={checkOutDate}
          onChange={(e) => setCheckOutDate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
         />
        </div>
      </div>

      {/* Pax Info */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-none border border-gray-200">
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
           <Users size={16} /> Nº Hóspedes
         </label>
         <input 
          type="number"
          min="1"
          value={guestCount}
          onChange={(e) => setGuestCount(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
         />
        </div>
        <div className="flex items-center">
         <label className="flex items-center gap-3 cursor-pointer">
           <input 
            type="checkbox"
            checked={hasBabies}
            onChange={(e) => setHasBabies(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
           />
           <span className="text-sm font-medium text-gray-700">Tem Bebês?</span>
         </label>
        </div>
      </div>

      {/* Flight & Docs */}
      <div className="space-y-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
           <Plane size={16} /> Voo / Placa Carro
         </label>
         <input 
          type="text"
          value={flightInfo}
          onChange={(e) => setFlightInfo(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Ex: AA1234 (14:30) ou Placa RJ-1234"
         />
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
           <BedDouble size={16} /> Configuração dos Quartos
         </label>
         <textarea 
          rows={3}
          value={roomConfig}
          onChange={(e) => setRoomConfig(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Ex: Quarto 1: Cama Casal, Quarto 2: 2 Solteiros..."
         />
        </div>
        
        <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
         <input 
          type="checkbox" 
          id="docsSent" 
          checked={docsSent}
          onChange={(e) => setDocsSent(e.target.checked)}
          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
         />
         <label htmlFor="docsSent" className="ml-3 text-sm text-blue-800 font-bold cursor-pointer flex items-center gap-2">
          <FileCheck size={18} /> Documentos Enviados?
         </label>
        </div>
      </div>

     </form>
    </div>

    {/* Footer Actions */}
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
       className="flex-[2] md:flex-none px-6 py-3 md:py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
      >
       <Check size={18} /> Salvar Reserva
      </button>
    </div>
   </div>
  </div>
 );
};

export default ReservationForm;
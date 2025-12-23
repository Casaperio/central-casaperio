
import React, { useState, useEffect } from 'react';
import { Reservation, MonitoredFlight, FlightData } from '../types';
import { Plane, Search, Plus, RefreshCw, Trash2, ExternalLink, Calendar, Loader2 } from 'lucide-react';
import { checkFlightStatus } from '../services/geminiService';

interface FlightsPanelProps {
 reservations: Reservation[];
 monitoredFlights: MonitoredFlight[];
 onUpdateReservation: (id: string, data: Partial<Reservation>) => void;
 onAddMonitoredFlight: (flight: MonitoredFlight) => void;
 onUpdateMonitoredFlight: (flight: MonitoredFlight) => void;
 onDeleteMonitoredFlight: (id: string) => void;
 onNotify: (message: string, type: 'info' | 'success' | 'error') => void;
}

const FlightsPanel: React.FC<FlightsPanelProps> = ({ 
 reservations, 
 monitoredFlights, 
 onUpdateReservation,
 onAddMonitoredFlight,
 onUpdateMonitoredFlight,
 onDeleteMonitoredFlight,
 onNotify
}) => {
 const [manualSearch, setManualSearch] = useState('');
 const [manualDescription, setManualDescription] = useState('');
 const [isSearching, setIsSearching] = useState(false);
 const [searchResult, setSearchResult] = useState<FlightData | null>(null);
 const [refreshing, setRefreshing] = useState(false);

 // Filter relevant reservations (Today and Tomorrow)
 const relevantReservations = React.useMemo(() => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(tomorrow);
  afterTomorrow.setDate(afterTomorrow.getDate() + 1);

  return reservations.filter(r => {
   // Filter out if no flight info provided
   if (!r.flightInfo && !r.flightData) return false;

   const checkIn = new Date(r.checkInDate);
   checkIn.setHours(0,0,0,0);
   const checkOut = new Date(r.checkOutDate);
   checkOut.setHours(0,0,0,0);

   // Include if Check-in OR Check-out is Today or Tomorrow
   const isCheckInRelevant = checkIn.getTime() === today.getTime() || checkIn.getTime() === tomorrow.getTime();
   const isCheckOutRelevant = checkOut.getTime() === today.getTime() || checkOut.getTime() === tomorrow.getTime();

   return isCheckInRelevant || isCheckOutRelevant;
  });
 }, [reservations]);

 const handleManualSearch = async () => {
  if (!manualSearch) return;
  setIsSearching(true);
  setSearchResult(null);
  try {
   const data = await checkFlightStatus(manualSearch);
   if (data) {
    setSearchResult(data);
   } else {
    alert("Voo não encontrado.");
   }
  } catch (e) {
   console.error(e);
   alert("Erro ao buscar status do voo.");
  }
  setIsSearching(false);
 };

 const handleAddMonitor = () => {
  if (searchResult) {
   onAddMonitoredFlight({
    id: Math.random().toString(36).substr(2, 9),
    code: searchResult.number,
    description: manualDescription || `Voo ${searchResult.number}`,
    flightData: searchResult,
    createdAt: Date.now()
   });
   setManualSearch('');
   setManualDescription('');
   setSearchResult(null);
   onNotify(`Monitoramento adicionado: ${searchResult.number}`, 'success');
  }
 };

 const refreshAllFlights = async () => {
  setRefreshing(true);
  let updatesCount = 0;

  // 1. Refresh Reservations
  for (const res of relevantReservations) {
   const flightCode = res.flightInfo || res.flightData?.number;
   if (flightCode) {
    try {
     const newData = await checkFlightStatus(flightCode);
     if (newData) {
      // Check for status change to notify
      if (res.flightData?.status !== newData.status) {
       onNotify(`Atualização: Voo ${newData.number} da reserva ${res.propertyCode} mudou para ${newData.status}`, 'info');
      }
      // Only update DB if data changed (checking status or time)
      if (
        res.flightData?.status !== newData.status || 
        res.flightData?.estimatedArrival !== newData.estimatedArrival
      ) {
        onUpdateReservation(res.id, { flightData: newData });
        updatesCount++;
      }
     }
    } catch (e) {
     console.error(`Error refreshing reservation ${res.id}`, e);
    }
   }
  }

  // 2. Refresh Manual Monitored Flights
  for (const mf of monitoredFlights) {
   try {
    const newData = await checkFlightStatus(mf.code);
    if (newData) {
     if (mf.flightData.status !== newData.status) {
       onNotify(`Atualização: Voo monitorado ${newData.number} mudou para ${newData.status}`, 'info');
     }
     if (
      mf.flightData.status !== newData.status || 
      mf.flightData.estimatedArrival !== newData.estimatedArrival
     ) {
       onUpdateMonitoredFlight({ ...mf, flightData: newData });
       updatesCount++;
     }
    }
   } catch (e) {
    console.error(`Error refreshing flight ${mf.id}`, e);
   }
  }

  setRefreshing(false);
  if (updatesCount === 0) {
    // Optional: onNotify('Nenhuma alteração de status detectada.', 'info');
  }
 };

 // Auto-refresh every 30 minutes
 useEffect(() => {
  const interval = setInterval(() => {
    console.log("Auto-refreshing flights...");
    refreshAllFlights();
  }, 30 * 60 * 1000); // 30 minutes
  return () => clearInterval(interval);
 }, [relevantReservations, monitoredFlights]);

 const getStatusColor = (status: string) => {
   switch(status) {
     case 'Landed': return 'bg-green-100 text-green-700 border-green-200';
     case 'On Time': return 'bg-blue-100 text-blue-700 border-blue-200';
     case 'Delayed': return 'bg-red-100 text-red-700 border-red-200';
     case 'Cancelled': return 'bg-gray-800 text-white border-gray-900';
     default: return 'bg-gray-100 text-gray-700 border-gray-200';
   }
 };

 return (
  <div className="space-y-6 animate-fade-in">
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex items-center gap-3">
     <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
      <Plane size={24} />
     </div>
     <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900">Painel de Voos</h2>
      <p className="text-gray-500 text-sm">Monitoramento em tempo real de chegadas e partidas.</p>
     </div>
    </div>
    <button 
     onClick={refreshAllFlights}
     disabled={refreshing}
     className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
    >
     <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
     {refreshing ? 'Atualizando...' : 'Atualizar Status'}
    </button>
   </div>

   {/* Manual Search Section */}
   <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
     <h3 className="font-bold text-gray-800 mb-4">Adicionar Monitoramento Manual</h3>
     <div className="flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="text-xs font-medium text-gray-500 mb-1 block">Número do Voo (Ex: TP123)</label>
        <div className="flex gap-2">
         <input 
          type="text" 
          value={manualSearch} 
          onChange={e => setManualSearch(e.target.value)}
          className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          placeholder="AA1234"
         />
         <button 
          onClick={handleManualSearch}
          disabled={isSearching || !manualSearch}
          className="bg-gray-100 text-gray-700 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50"
         >
          {isSearching ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
         </button>
        </div>
      </div>
      
      {searchResult && (
        <>
         <div className="flex-1 w-full animate-fade-in">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição / Notas</label>
          <input 
           type="text" 
           value={manualDescription} 
           onChange={e => setManualDescription(e.target.value)}
           className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
           placeholder="Ex: Chegada Proprietário"
          />
         </div>
         <div className="w-full md:w-auto animate-fade-in">
           <button 
            onClick={handleAddMonitor}
            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
           >
            <Plus size={18} /> Monitorar
           </button>
         </div>
        </>
      )}
     </div>

     {searchResult && (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-4 animate-fade-in">
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(searchResult.status)}`}>
          {searchResult.status}
        </span>
        <div>
          <p className="font-bold text-gray-800">{searchResult.number} - {searchResult.airline || 'Cia Aérea'}</p>
          <p className="text-xs text-gray-500">Estimado: {searchResult.estimatedArrival}</p>
        </div>
      </div>
     )}
   </div>

   {/* Flights Table */}
   <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
         <tr>
           <th className="p-4">Voo</th>
           <th className="p-4">Status</th>
           <th className="p-4">Horário Estimado</th>
           <th className="p-4">Contexto</th>
           <th className="p-4">Atualizado em</th>
           <th className="p-4 text-right">Ações</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
         {/* Reservation Flights */}
         {relevantReservations.map(res => {
           const fData = res.flightData || { number: res.flightInfo || 'N/A', status: 'Scheduled', estimatedArrival: '--', lastUpdated: 0 };
           const isArrival = new Date(res.checkInDate) > new Date(); // Rough logic, usually guests arrive on checkin
           
           return (
            <tr key={res.id} className="hover:bg-gray-50">
              <td className="p-4 font-bold text-gray-900">{fData.number}</td>
              <td className="p-4">
               <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(fData.status)}`}>
                 {fData.status}
               </span>
              </td>
              <td className="p-4 text-gray-700">{fData.estimatedArrival}</td>
              <td className="p-4">
               <div className="flex flex-col">
                 <span className="font-medium text-gray-900">{res.guestName}</span>
                 <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={10} /> {res.propertyCode}
                 </span>
               </div>
              </td>
              <td className="p-4 text-xs text-gray-400">
               {fData.lastUpdated ? new Date(fData.lastUpdated).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}
              </td>
              <td className="p-4 text-right">
               <a 
                href={`https://www.google.com/search?q=flight+${fData.number}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-xs font-medium"
               >
                 <ExternalLink size={14} /> Google
               </a>
              </td>
            </tr>
           );
         })}

         {/* Manual Flights */}
         {monitoredFlights.map(flight => (
           <tr key={flight.id} className="hover:bg-gray-50 bg-blue-50/10">
            <td className="p-4 font-bold text-gray-900">{flight.code}</td>
            <td className="p-4">
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(flight.flightData.status)}`}>
               {flight.flightData.status}
              </span>
            </td>
            <td className="p-4 text-gray-700">{flight.flightData.estimatedArrival}</td>
            <td className="p-4">
              <div className="flex flex-col">
               <span className="font-medium text-gray-900">{flight.description || 'Monitoramento Manual'}</span>
               <span className="text-xs text-blue-500 font-bold">Manual</span>
              </div>
            </td>
            <td className="p-4 text-xs text-gray-400">
              {flight.createdAt ? new Date(flight.flightData.lastUpdated).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}
            </td>
            <td className="p-4 text-right flex items-center justify-end gap-3">
              <a 
               href={`https://www.google.com/search?q=flight+${flight.code}`} 
               target="_blank" 
               rel="noreferrer"
               className="text-blue-600 hover:text-blue-800"
              >
               <ExternalLink size={16} />
              </a>
              <button 
               onClick={() => onDeleteMonitoredFlight(flight.id)}
               className="text-gray-400 hover:text-red-500"
               title="Parar monitoramento"
              >
               <Trash2 size={16} />
              </button>
            </td>
           </tr>
         ))}
         
         {relevantReservations.length === 0 && monitoredFlights.length === 0 && (
           <tr>
            <td colSpan={6} className="p-8 text-center text-gray-400">
              Nenhum voo programado para hoje ou amanhã.
            </td>
           </tr>
         )}
        </tbody>
      </table>
     </div>
   </div>
  </div>
 );
};

export default FlightsPanel;

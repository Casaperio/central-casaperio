import React, { useState, useEffect, useMemo } from 'react';
import { Property, Reservation, Ticket, TicketStatus, ReservationStatus } from '../types';
import { Map, MapPin, Filter, AlertCircle, Home, LogIn, LogOut, CheckCircle2, Wrench, Gem } from 'lucide-react';
import { computeOccupancyNow, getTodayBrazil, parseLocalDate } from '../utils';
import { isAutomaticCheckoutTicket } from '../utils/ticketFilters';

interface MapPanelProps {
 properties: Property[];
 reservations: Reservation[];
 tickets: Ticket[];
 onUpdateProperty: (property: Property) => void;
}

// Simple internal interface for markers
interface MapMarker {
 id: string;
 lat: number;
 lng: number;
 title: string;
 status: 'occupied' | 'vacant';
 hasAlert: boolean;
 alertType?: 'maintenance' | 'concierge' | 'both';
 property: Property;
 guestName?: string;
 tickets: Ticket[];
 isCheckIn: boolean;
 isCheckOut: boolean;
}

const MapPanel: React.FC<MapPanelProps> = ({ properties, reservations, tickets, onUpdateProperty }) => {
 const [filter, setFilter] = useState<'all' | 'checkin' | 'checkout' | 'maintenance' | 'concierge' | 'occupied' | 'vacant'>('all');
 const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
 const [mapInstance, setMapInstance] = useState<any>(null);

 // Load Leaflet resources dynamically
 useEffect(() => {
  const loadLeaflet = async () => {
   if (document.getElementById('leaflet-css')) return;

   const link = document.createElement('link');
   link.id = 'leaflet-css';
   link.rel = 'stylesheet';
   link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
   document.head.appendChild(link);

   const script = document.createElement('script');
   script.id = 'leaflet-js';
   script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
   script.onload = () => {
    initMap();
   };
   document.body.appendChild(script);
  };

  loadLeaflet();
  if ((window as any).L) initMap();

  return () => {
   // Cleanup map on unmount
   if (mapInstance) {
    mapInstance.remove();
    setMapInstance(null);
   }
  };
 }, []);

 // Process Properties into Markers
 // Task 5: Usar helper unificado para garantir consistência com Guest & CRM
 const markers = useMemo(() => {
  // Calcular ocupação usando helper unificado (timezone do Brasil)
  const occupancyData = computeOccupancyNow(reservations);
  const { checkinToday, checkoutToday, inhouseNow, todayTime } = occupancyData;

  // Debug em DEV
  if (import.meta.env.DEV) {
    const now = new Date();
    const today = getTodayBrazil();
    console.group('[MapPanel] 🗺️ Diagnóstico de Ocupação (AGORA)');
    console.log('⏰ Now:', now.toLocaleString('pt-BR'));
    console.log('📅 Today (Brasil):', today.toLocaleDateString('pt-BR'));
    console.log('📊 Totais:');
    console.log('  ├─ Check-in hoje:', checkinToday.size);
    console.log('  ├─ Check-out hoje:', checkoutToday.size);
    console.log('  ├─ In-house agora:', inhouseNow.size);
    console.log('  └─ Ocupados (união):', occupancyData.occupied.size);
    console.log('🔍 Exemplos (3 primeiros de cada):');
    console.log('  ├─ Check-in:', Array.from(checkinToday).slice(0, 3));
    console.log('  ├─ Check-out:', Array.from(checkoutToday).slice(0, 3));
    console.log('  └─ In-house:', Array.from(inhouseNow).slice(0, 3));
    console.groupEnd();
  }

  return properties
   .filter(p => p.lat && p.lng) // Only map properties with coords
   .map(p => {
    // Status Check: Buscar TODAS as reservas deste imóvel (não apenas a primeira)
    let status: 'occupied' | 'vacant' = 'vacant';
    let guestName = '';
    let isCheckIn = false;
    let isCheckOut = false;
    let currentReservation: Reservation | undefined;

    // Buscar reservas ativas para este imóvel
    const propertyReservations = reservations.filter(r => {
     if (r.propertyCode !== p.code || r.status === ReservationStatus.CANCELED) return false;
     
     // Verificar se está no Set de ocupados (já calculado pelo helper)
     return occupancyData.occupied.has(r.id);
    });

    if (propertyReservations.length > 0) {
      // Usar a reserva mais recente (por check-in)
      currentReservation = propertyReservations.sort((a, b) => {
        const aTime = parseLocalDate(a.checkInDate).getTime();
        const bTime = parseLocalDate(b.checkInDate).getTime();
        return bTime - aTime; // Mais recente primeiro
      })[0];

      status = 'occupied';
      guestName = currentReservation.guestName;
      
      // Verificar flags usando os Sets calculados
      isCheckIn = checkinToday.has(currentReservation.id);
      isCheckOut = checkoutToday.has(currentReservation.id);
    }

    // Alert Check com filtros corretos (Task 5)
    // 1. Remover tickets de checkout automático
    // 2. Remover tickets concluídos
    // 3. Filtrar apenas tickets relevantes à estadia atual
    let propTickets = tickets.filter(t => {
      // Filtro básico: mesmo imóvel, não concluído, não é checkout automático
      if (t.propertyCode !== p.code) return false;
      if (t.status === TicketStatus.DONE) return false;
      if (isAutomaticCheckoutTicket(t)) return false;

      // Se há reserva ativa, filtrar por contexto da estadia
      if (currentReservation) {
        // Preferencial: ticket vinculado à reserva atual
        if (t.reservationId === currentReservation.id) {
          return true;
        }

        // Fallback: ticket criado durante o período da estadia atual
        const ticketCreatedAt = t.createdAt;
        const cinTime = parseLocalDate(currentReservation.checkInDate).getTime();
        const coutTime = parseLocalDate(currentReservation.checkOutDate).getTime();
        
        return ticketCreatedAt >= cinTime && ticketCreatedAt <= coutTime;
      }

      // Se não há reserva ativa, considerar todos os tickets não finalizados
      // (pode ser ticket de manutenção preventiva em imóvel vazio)
      return true;
    });

    const hasMaint = propTickets.some(t => !t.category || t.category === 'maintenance');
    const hasConcierge = propTickets.some(t => t.category === 'concierge');
    
    let alertType: 'maintenance' | 'concierge' | 'both' | undefined = undefined;
    if (hasMaint && hasConcierge) alertType = 'both';
    else if (hasMaint) alertType = 'maintenance';
    else if (hasConcierge) alertType = 'concierge';

    return {
     id: p.code,
     lat: p.lat!,
     lng: p.lng!,
     title: p.code,
     status,
     hasAlert: propTickets.length > 0,
     alertType,
     property: p,
     guestName,
     tickets: propTickets,
     isCheckIn,
     isCheckOut
    };
   });
 }, [properties, reservations, tickets]);

 const filteredMarkers = useMemo(() => {
  return markers.filter(m => {
   if (filter === 'all') return true;
   if (filter === 'occupied') return m.status === 'occupied';
   if (filter === 'vacant') return m.status === 'vacant';
   if (filter === 'maintenance') return m.alertType === 'maintenance' || m.alertType === 'both';
   if (filter === 'concierge') return m.alertType === 'concierge' || m.alertType === 'both';
   if (filter === 'checkin') return m.isCheckIn;
   if (filter === 'checkout') return m.isCheckOut;
   return true;
  });
 }, [markers, filter]);

 // Map Initialization & Updates
 const initMap = () => {
  const L = (window as any).L;
  if (!L || mapInstance) return;

  const map = L.map('map-container').setView([-22.9847, -43.2036], 13); // Center on Rio (Ipanema/Leblon area approx)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 20
  }).addTo(map);

  setMapInstance(map);
 };

 // Render Markers on Map update
 useEffect(() => {
  const L = (window as any).L;
  if (!L || !mapInstance) return;

  // Clear existing markers
  mapInstance.eachLayer((layer: any) => {
   if (layer instanceof L.Marker) {
    mapInstance.removeLayer(layer);
   }
  });

  const featureGroup = L.featureGroup();

  filteredMarkers.forEach(m => {
   // Create Custom Icon
   // Determinar cor baseada no status:
   // Vermelho: check-out hoje
   // Verde: check-in hoje
   // Azul: in house (ocupado, mas não é check-in/out)
   // Branco: vazio
   let bgColor = 'bg-white';
   let textColor = 'text-gray-700';

   if (m.isCheckOut) {
    bgColor = 'bg-red-500';
    textColor = 'text-white';
   } else if (m.isCheckIn) {
    bgColor = 'bg-green-500';
    textColor = 'text-white';
   } else if (m.status === 'occupied') {
    bgColor = 'bg-blue-500';
    textColor = 'text-white';
   }

   const alertBadge = m.hasAlert ?
    `<div class="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center text-yellow-900 font-bold text-xs animate-bounce">!</div>`
    : '';

   const iconHtml = `
    <div class="relative w-8 h-8 rounded-full ${bgColor} border-2 border-gray-300 shadow-md flex items-center justify-center ${textColor} transform hover:scale-110 transition-transform">
     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
     ${alertBadge}
    </div>
   `;

   const icon = L.divIcon({
    className: 'custom-map-marker',
    html: iconHtml,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
   });

   const marker = L.marker([m.lat, m.lng], { icon }).addTo(mapInstance);
   
   marker.on('click', () => {
    setSelectedMarker(m);
    // Center map slightly offset to accommodate sidebar if on mobile
    mapInstance.panTo([m.lat, m.lng], { animate: true });
   });

   featureGroup.addLayer(marker);
  });

  // Auto fit bounds if markers exist
  if (filteredMarkers.length > 0) {
   mapInstance.fitBounds(featureGroup.getBounds(), { padding: [50, 50], maxZoom: 16 });
  }

 }, [mapInstance, filteredMarkers]);

 // Fetch coordinates for properties without them
 const fetchMissingCoords = async () => {
  const missing = properties.filter(p => (!p.lat || !p.lng) && (p.address || p.zipCode));
  if (missing.length === 0) {
   alert("Todos os imóveis já possuem coordenadas.");
   return;
  }

  if (!window.confirm(`Buscar coordenadas para ${missing.length} imóveis? Isso pode levar alguns segundos.`)) return;

  let count = 0;
  for (const p of missing) {
   try {
    const query = p.zipCode ? `${p.address}, ${p.zipCode}` : p.address;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    if (data && data.length > 0) {
     const updated = { ...p, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
     onUpdateProperty(updated); // This saves to DB via App.tsx logic
     count++;
    }
    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 1000));
   } catch (e) {
    console.error(`Erro ao buscar para ${p.code}`, e);
   }
  }
  alert(`Atualização concluída! ${count} imóveis atualizados.`);
 };

 return (
  <div className="flex flex-col h-full bg-gray-100 relative">
   {/* Header / Filters */}
   <div className="bg-white p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm z-10">
    <div className="flex items-center gap-3">
     <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
      <Map size={24} />
     </div>
     <div>
      <h2 className="text-xl font-bold text-gray-900">Mapa de Imóveis</h2>
      <p className="text-xs text-gray-500">{filteredMarkers.length} imóveis visíveis</p>
     </div>
    </div>

    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
     <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>Todos</button>
     <button onClick={() => setFilter('occupied')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filter === 'occupied' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>Ocupados</button>
     <button onClick={() => setFilter('vacant')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filter === 'vacant' ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>Vazios</button>
     <button onClick={() => setFilter('checkin')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1 ${filter === 'checkin' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><LogIn size={12}/> Check-in</button>
     <button onClick={() => setFilter('checkout')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1 ${filter === 'checkout' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><LogOut size={12}/> Check-out</button>
     <button onClick={() => setFilter('maintenance')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1 ${filter === 'maintenance' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><AlertCircle size={12}/> Manutenção</button>
    </div>
   </div>

   {/* Map Container */}
   <div className="flex-1 relative">
    <div id="map-container" className="w-full h-full z-0" style={{ background: '#e5e7eb' }}></div>
    
    {/* Missing Coords Warning */}
    {properties.filter(p => !p.lat).length > 0 && (
     <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur p-3 rounded-lg shadow-md border border-yellow-200 max-w-xs">
      <p className="text-xs text-yellow-800 mb-2 flex items-center gap-1"><AlertCircle size={14}/> {properties.filter(p => !p.lat).length} imóveis sem coordenadas.</p>
      <button onClick={fetchMissingCoords} className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold py-1.5 rounded transition-colors">
       Buscar Automaticamente
      </button>
     </div>
    )}

    {/* Selected Property Detail Card (Floating) */}
    {selectedMarker && (
     <div className="absolute top-4 right-4 z-[400] w-80 bg-white rounded-none shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-right-10">
      <div className={`p-4 ${selectedMarker.status === 'occupied' ? 'bg-red-50 border-b border-red-100' : 'bg-green-50 border-b border-green-100'} flex justify-between items-start`}>
       <div>
        <h3 className="font-bold text-gray-900 text-lg">{selectedMarker.title}</h3>
        <p className="text-xs text-gray-500">{selectedMarker.property.address}</p>
       </div>
       <button onClick={() => setSelectedMarker(null)} className="text-gray-400 hover:text-gray-600"><Filter size={16} className="rotate-45" /></button>
      </div>
      
      <div className="p-4 space-y-4">
       {/* Status */}
       <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${selectedMarker.status === 'occupied' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
         {selectedMarker.status === 'occupied' ? 'Ocupado' : 'Vazio'}
        </span>
        {selectedMarker.guestName && <span className="text-sm font-medium text-gray-800">{selectedMarker.guestName}</span>}
       </div>

       {/* Tickets */}
       <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
         Alertas Pendentes ({selectedMarker.tickets.length})
        </h4>
        {selectedMarker.tickets.length === 0 ? (
         <div className="text-center py-4 bg-gray-50 rounded-lg text-gray-400 text-xs flex flex-col items-center gap-1">
          <CheckCircle2 size={24} className="text-green-300" />
          Tudo certo por aqui.
         </div>
        ) : (
         <div className="space-y-2 max-h-40 overflow-y-auto">
          {selectedMarker.tickets.map(t => (
           <div key={t.id} className="p-2 bg-gray-50 border border-gray-100 rounded hover:bg-gray-100">
            <div className="flex justify-between items-start mb-1">
             <span className={`text-[10px] px-1.5 rounded font-bold ${t.category === 'concierge' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
              {t.category === 'concierge' ? 'Concierge' : 'Manutenção'}
             </span>
             <span className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-gray-700 line-clamp-2">{t.description}</p>
           </div>
          ))}
         </div>
        )}
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 );
};

export default MapPanel;
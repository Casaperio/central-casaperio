
import React, { useState, useCallback } from 'react';
import { PropertyCharacteristics, User } from '../types';
import {
 Building2, Search, Wifi, Key, Clock,
 Bed, Maximize, Wind, Eye, VolumeX, Copy, DollarSign, MapPin, Filter, BedDouble, Users, Tag,
 Pencil, Save, X, Loader2
} from 'lucide-react';
import { updatePropertyCharacteristics } from '../services/propertiesApiService';

interface PropertiesToolProps {
 properties: PropertyCharacteristics[];
 currentUserRole?: string;
 currentUser?: User;
 onPropertyUpdated?: (updatedProperty: PropertyCharacteristics) => void;
}

const PropertiesTool: React.FC<PropertiesToolProps> = ({
 properties,
 currentUserRole,
 currentUser,
 onPropertyUpdated
}) => {
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedProperty, setSelectedProperty] = useState<PropertyCharacteristics | null>(null);

 // Filter States
 const [showFilters, setShowFilters] = useState(false);
 const [filterMinSize, setFilterMinSize] = useState('');
 const [filterMaxSize, setFilterMaxSize] = useState('');
 const [filterMinRooms, setFilterMinRooms] = useState('');
 const [filterNeighborhood, setFilterNeighborhood] = useState('');

 // Edit Mode States
 const [isEditing, setIsEditing] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [editError, setEditError] = useState<string | null>(null);

 // Edit Form Values
 const [editWifiNetwork, setEditWifiNetwork] = useState('');
 const [editWifiPassword, setEditWifiPassword] = useState('');
 const [editDoorCode, setEditDoorCode] = useState('');
 const [editConciergeHours, setEditConciergeHours] = useState('');

 const isAdmin = currentUserRole === 'Admin';

 // Initialize edit form with current values
 const startEditing = useCallback(() => {
   if (selectedProperty) {
     setEditWifiNetwork(selectedProperty.manualOverrides.wifi.network || '');
     setEditWifiPassword(selectedProperty.manualOverrides.wifi.password || '');
     setEditDoorCode(selectedProperty.manualOverrides.access.doorCode || '');
     setEditConciergeHours(selectedProperty.manualOverrides.access.conciergeHours || '');
     setIsEditing(true);
     setEditError(null);
   }
 }, [selectedProperty]);

 const cancelEditing = useCallback(() => {
   setIsEditing(false);
   setEditError(null);
 }, []);

 const saveChanges = useCallback(async () => {
   if (!selectedProperty || !currentUser) return;

   setIsSaving(true);
   setEditError(null);

   try {
     const updatedProperty = await updatePropertyCharacteristics(
       selectedProperty.propertyId,
       currentUser.id,
       {
         wifi: {
           network: editWifiNetwork || null,
           password: editWifiPassword || null,
         },
         access: {
           doorCode: editDoorCode || null,
           conciergeHours: editConciergeHours || null,
         },
       }
     );

     // Update local state
     setSelectedProperty(updatedProperty);
     setIsEditing(false);

     // Notify parent component
     if (onPropertyUpdated) {
       onPropertyUpdated(updatedProperty);
     }
   } catch (error) {
     console.error('Error saving property changes:', error);
     setEditError(error instanceof Error ? error.message : 'Erro ao salvar alterações');
   } finally {
     setIsSaving(false);
   }
 }, [selectedProperty, currentUser, editWifiNetwork, editWifiPassword, editDoorCode, editConciergeHours, onPropertyUpdated]);

 const filteredProperties = properties.filter(p => {
  // 1. Text Search (internalName or Address)
  const matchSearch =
   p.internalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
   p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
   p.address.toLowerCase().includes(searchTerm.toLowerCase());

  // 2. Size Filter (m2)
  const size = p.basicInfo.squareFeet || 0;
  const minS = filterMinSize ? parseFloat(filterMinSize) : 0;
  const maxS = filterMaxSize ? parseFloat(filterMaxSize) : Infinity;
  const matchSize = size >= minS && size <= maxS;

  // 3. Bedroom Count Filter
  const bedroomCount = p.basicInfo.rooms || 0;
  const minR = filterMinRooms ? parseInt(filterMinRooms) : 0;
  const matchRooms = bedroomCount >= minR;

  // 4. Neighborhood/Address Filter
  const matchNeighborhood = !filterNeighborhood ||
   p.address.toLowerCase().includes(filterNeighborhood.toLowerCase());

  return matchSearch && matchSize && matchRooms && matchNeighborhood;
 });

 const clearFilters = () => {
  setSearchTerm('');
  setFilterMinSize('');
  setFilterMaxSize('');
  setFilterMinRooms('');
  setFilterNeighborhood('');
 };

 const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert(`Copiado: ${text}`);
 };

 return (
  <div className="flex flex-col h-full bg-[#fdf8f6] animate-fade-in">
   {/* Header */}
   <div className="flex items-center justify-between p-6 pb-2">
    <div className="flex items-center gap-3">
      <div className="bg-brand-100 p-2 rounded-lg text-brand-700">
      <Building2 size={24} />
      </div>
      <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900">Imóveis & Apartamentos</h2>
      <p className="text-gray-500 text-sm">Informações técnicas, acessos e configurações.</p>
      </div>
    </div>
   </div>

   <div className="flex flex-1 p-6 gap-6 overflow-hidden">
    
    {/* Sidebar List */}
    <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-none shadow-sm border border-gray-200 flex flex-col overflow-hidden">
     <div className="p-4 border-b border-gray-100 bg-white space-y-3">
      <div className="relative">
       <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
       <input 
        type="text" 
        placeholder="Buscar por código ou endereço..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
       />
       <button 
        onClick={() => setShowFilters(!showFilters)}
        className={`absolute right-2 top-2 p-1 rounded hover:bg-gray-100 ${showFilters ? 'text-brand-600 bg-brand-50' : 'text-gray-400'}`}
        title="Filtros Avançados"
       >
        <Filter size={16} />
       </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
       <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3 animate-in slide-in-from-top-2">
         <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
          <span>Filtros</span>
          <button onClick={clearFilters} className="text-red-500 hover:underline font-normal">Limpar</button>
         </div>
         
         <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Maximize size={12}/> Área (m²)</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Mín" 
              value={filterMinSize}
              onChange={e => setFilterMinSize(e.target.value)}
              className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-brand-500"
            />
            <input 
              type="number" 
              placeholder="Máx" 
              value={filterMaxSize}
              onChange={e => setFilterMaxSize(e.target.value)}
              className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-brand-500"
            />
          </div>
         </div>

         <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><BedDouble size={12}/> Min Quartos</label>
            <input 
              type="number" 
              placeholder="0" 
              value={filterMinRooms}
              onChange={e => setFilterMinRooms(e.target.value)}
              className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><MapPin size={12}/> Bairro</label>
            <input 
              type="text" 
              placeholder="Ex: Ipanema" 
              value={filterNeighborhood}
              onChange={e => setFilterNeighborhood(e.target.value)}
              className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-brand-500"
            />
          </div>
         </div>
       </div>
      )}
     </div>

     <div className="flex-1 overflow-y-auto">
      {filteredProperties.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          Nenhum imóvel encontrado.
        </div>
      ) : (
        filteredProperties.map(p => {
          const bedrooms = p.basicInfo.rooms || 0;
          const squareFeet = p.basicInfo.squareFeet || 0;
          return (
            <div
              key={p.propertyId}
              onClick={() => { setSelectedProperty(p); }}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedProperty?.propertyId === p.propertyId ? 'bg-brand-50 border-l-4 border-brand-500' : 'border-l-4 border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-gray-900">{p.internalName}</h4>
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                  {squareFeet ? <span>{squareFeet}m²</span> : <span>-</span>}
                  <span className="w-px h-2 bg-gray-300"></span>
                  <span>{bedrooms} {bedrooms === 1 ? 'Qto' : 'Qtos'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                <MapPin size={10} className="flex-shrink-0" />
                {p.address}
              </p>
            </div>
          );
        })
      )}
     </div>
    </div>

    {/* Details Panel */}
    <div className="flex-1 bg-white rounded-none shadow-sm border border-gray-200 flex flex-col overflow-hidden">
     {selectedProperty ? (
       <div className="flex flex-col h-full">
        {/* View Header */}
        <div className="p-6 border-b border-gray-100 bg-white">
         <div>
          <div className="flex items-center gap-3 mb-2">
           <h2 className="text-3xl font-bold text-gray-900">{selectedProperty.internalName}</h2>
           {selectedProperty.basicInfo.squareFeet && selectedProperty.basicInfo.squareFeet > 0 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">{selectedProperty.basicInfo.squareFeet}m²</span>
           )}
          </div>
          <p className="text-gray-600 flex items-center gap-1"><Building2 size={14}/> {selectedProperty.address}</p>
          {selectedProperty.location?.latitude && selectedProperty.location?.longitude && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
             <MapPin size={12}/> Geolocalização: {selectedProperty.location.latitude.toFixed(4)}, {selectedProperty.location.longitude.toFixed(4)}
            </p>
          )}
         </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* Access Card */}
         <div className="bg-white rounded-none border border-gray-200 shadow-sm p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider flex items-center gap-2">
            <Key size={16} /> Acesso & Conectividade
           </h3>
           {isAdmin && !isEditing && (
            <button
             onClick={startEditing}
             className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded transition-colors"
            >
             <Pencil size={14} /> Editar
            </button>
           )}
           {isEditing && (
            <div className="flex items-center gap-2">
             <button
              onClick={cancelEditing}
              disabled={isSaving}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
             >
              <X size={14} /> Cancelar
             </button>
             <button
              onClick={saveChanges}
              disabled={isSaving}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded transition-colors disabled:opacity-50"
             >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'Salvando...' : 'Salvar'}
             </button>
            </div>
           )}
          </div>

          {editError && (
           <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {editError}
           </div>
          )}

          <div className="space-y-4">
           {/* Wi-Fi Network */}
           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
            <div className="flex items-center gap-3 flex-1">
             <div className="bg-white p-2 rounded-full text-gray-400"><Wifi size={18}/></div>
             <div className="flex-1">
              <p className="text-xs text-gray-500 font-bold">REDE WI-FI</p>
              {isEditing ? (
               <input
                type="text"
                value={editWifiNetwork}
                onChange={(e) => setEditWifiNetwork(e.target.value)}
                placeholder="Nome da rede"
                className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
               />
              ) : (
               <p className="text-gray-900 font-medium">{selectedProperty.manualOverrides.wifi.network || 'Não cadastrado'}</p>
              )}
             </div>
            </div>
            {!isEditing && selectedProperty.manualOverrides.wifi.network && (
             <button onClick={() => copyToClipboard(selectedProperty.manualOverrides.wifi.network || '')} className="text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={16}/></button>
            )}
           </div>

           {/* Wi-Fi Password */}
           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
            <div className="flex items-center gap-3 flex-1">
             <div className="bg-white p-2 rounded-full text-gray-400"><Key size={18}/></div>
             <div className="flex-1">
              <p className="text-xs text-gray-500 font-bold">SENHA WI-FI</p>
              {isEditing ? (
               <input
                type="text"
                value={editWifiPassword}
                onChange={(e) => setEditWifiPassword(e.target.value)}
                placeholder="Senha da rede"
                className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono"
               />
              ) : (
               <p className="text-gray-900 font-mono font-medium">{selectedProperty.manualOverrides.wifi.password || '---'}</p>
              )}
             </div>
            </div>
            {!isEditing && selectedProperty.manualOverrides.wifi.password && (
             <button onClick={() => copyToClipboard(selectedProperty.manualOverrides.wifi.password || '')} className="text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={16}/></button>
            )}
           </div>

           {/* Door Code */}
           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
            <div className="flex items-center gap-3 flex-1">
             <div className="bg-white p-2 rounded-full text-gray-400"><Key size={18}/></div>
             <div className="flex-1">
              <p className="text-xs text-gray-500 font-bold">FECHADURA DIGITAL</p>
              {isEditing ? (
               <input
                type="text"
                value={editDoorCode}
                onChange={(e) => setEditDoorCode(e.target.value)}
                placeholder="Código da fechadura"
                className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono tracking-widest"
               />
              ) : (
               <p className="text-gray-900 font-mono font-medium tracking-widest">{selectedProperty.manualOverrides.access.doorCode || '---'}</p>
              )}
             </div>
            </div>
            {!isEditing && selectedProperty.manualOverrides.access.doorCode && (
             <button onClick={() => copyToClipboard(selectedProperty.manualOverrides.access.doorCode || '')} className="text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={16}/></button>
            )}
           </div>

           {/* Concierge Hours */}
           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
             <div className="bg-white p-2 rounded-full text-gray-400"><Clock size={18}/></div>
             <div className="flex-1">
              <p className="text-xs text-gray-500 font-bold">PORTARIA</p>
              {isEditing ? (
               <input
                type="text"
                value={editConciergeHours}
                onChange={(e) => setEditConciergeHours(e.target.value)}
                placeholder="Ex: 24h ou 06:00 - 22:00"
                className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
               />
              ) : (
               <p className="text-gray-900 font-medium">{selectedProperty.manualOverrides.access.conciergeHours || 'Não informado'}</p>
              )}
             </div>
            </div>
           </div>
          </div>
         </div>

         {/* Details Card */}
         <div className="space-y-6">
          {/* Basic Info from Stays.net */}
          {selectedProperty.basicInfo && (
           <div className="bg-white rounded-none border border-gray-200 shadow-sm p-5 h-fit">
            <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider flex items-center gap-2 mb-4">
             <Building2 size={16} /> Informações do Imóvel (Stays.net)
            </h3>
            <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center gap-3">
              <div className="bg-brand-50 p-2 rounded-full text-brand-600">
               <BedDouble size={18} />
              </div>
              <div>
               <p className="text-[10px] text-gray-400 uppercase font-bold">Quartos</p>
               <p className="text-lg font-bold text-gray-800">{selectedProperty.basicInfo.rooms}</p>
              </div>
             </div>

             <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full text-blue-600">
               <Bed size={18} />
              </div>
              <div>
               <p className="text-[10px] text-gray-400 uppercase font-bold">Camas</p>
               <p className="text-lg font-bold text-gray-800">{selectedProperty.basicInfo.beds}</p>
              </div>
             </div>

             <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-full text-purple-600">
               <Wind size={18} />
              </div>
              <div>
               <p className="text-[10px] text-gray-400 uppercase font-bold">Banheiros</p>
               <p className="text-lg font-bold text-gray-800">{selectedProperty.basicInfo.bathrooms}</p>
              </div>
             </div>

             <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-full text-green-600">
               <Users size={18} />
              </div>
              <div>
               <p className="text-[10px] text-gray-400 uppercase font-bold">Capacidade</p>
               <p className="text-lg font-bold text-gray-800">{selectedProperty.basicInfo.maxGuests} hóspedes</p>
              </div>
             </div>

             {selectedProperty.basicInfo.squareFeet && selectedProperty.basicInfo.squareFeet > 0 && (
              <div className="flex items-center gap-3 col-span-2">
               <div className="bg-orange-50 p-2 rounded-full text-orange-600">
                <Maximize size={18} />
               </div>
               <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Área</p>
                <p className="text-lg font-bold text-gray-800">{selectedProperty.basicInfo.squareFeet} m²</p>
               </div>
              </div>
             )}
            </div>
           </div>
          )}

          {/* Specs from Manual Overrides */}
          <div className="bg-white rounded-none border border-gray-200 shadow-sm p-5 h-fit">
           <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Maximize size={16} /> Especificações Adicionais
           </h3>
           <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
             <Wind className="text-gray-400" size={18} />
             <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Posição</p>
              <p className="text-sm text-gray-800">{selectedProperty.manualOverrides.specifications.position || '-'}</p>
             </div>
            </div>
            <div className="flex items-center gap-2">
             <Eye className="text-gray-400" size={18} />
             <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Vista</p>
              <p className="text-sm text-gray-800">{selectedProperty.manualOverrides.specifications.viewType || '-'}</p>
             </div>
            </div>
            <div className="flex items-center gap-2">
             <VolumeX className="text-gray-400" size={18} />
             <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Janela Anti-Ruído</p>
              <p className="text-sm text-gray-800">{selectedProperty.manualOverrides.specifications.hasAntiNoiseWindow ? 'Sim' : 'Não'}</p>
             </div>
            </div>
            <div className="flex items-center gap-2">
             <DollarSign className="text-gray-400" size={18} />
             <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Taxa Limpeza</p>
              <p className="text-sm text-gray-800">
               {selectedProperty.manualOverrides.specifications.cleaningFee ? `R$ ${selectedProperty.manualOverrides.specifications.cleaningFee}` : '-'}
              </p>
             </div>
            </div>
           </div>
          </div>

          {/* Amenities from Stays */}
          <div className="bg-white rounded-none border border-gray-200 shadow-sm p-5 h-fit">
           <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Tag size={16} /> Comodidades (Stays.net)
           </h3>

           {selectedProperty.amenities && selectedProperty.amenities.length > 0 ? (
            <>
             <p className="text-xs text-gray-500 mb-3">
              {selectedProperty.amenities.length} comodidades disponíveis
             </p>
             <div className="flex flex-wrap gap-2">
              {selectedProperty.amenities.map((amenity) => (
               <span key={amenity.staysAmenityId} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                {amenity.namePtBr}
               </span>
              ))}
             </div>
            </>
           ) : (
            <p className="text-sm text-gray-400 italic">
             Nenhuma comodidade cadastrada para este imóvel.
            </p>
           )}
          </div>

          {/* Descriptions from Stays.net */}
          {selectedProperty.descriptions && Object.keys(selectedProperty.descriptions).length > 0 && (
           <div className="bg-white rounded-none border border-gray-200 shadow-sm p-5 h-fit">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-4">
             <Building2 size={16} /> Descrição do Imóvel (Stays.net)
            </h3>
            <div className="space-y-4">
             {selectedProperty.descriptions['pt_BR'] && (
              <div>
               <p className="text-xs font-bold text-gray-500 mb-2">🇧🇷 Português</p>
               <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedProperty.descriptions['pt_BR']}
               </p>
              </div>
             )}
             {selectedProperty.descriptions['en_US'] && (
              <div className="pt-3 border-t border-gray-100">
               <p className="text-xs font-bold text-gray-500 mb-2">🇺🇸 English</p>
               <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedProperty.descriptions['en_US']}
               </p>
              </div>
             )}
            </div>
           </div>
          )}
         </div>

        </div>
       </div>
     ) : (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
       <Building2 size={64} className="mb-4 text-gray-200" />
       <p className="text-lg font-medium">Selecione um imóvel ao lado</p>
       <p className="text-sm">Veja detalhes de wi-fi, quartos e especificações.</p>
      </div>
     )}
    </div>
   </div>
  </div>
 );
};

export default PropertiesTool;

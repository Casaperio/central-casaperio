import React, { useState, useEffect } from 'react';
import { Property, InventoryItem, InventoryCategory, Supplier, ServiceTypeDefinition, AfterHoursConfig, AfterHoursRule } from '../types';
import { Trash2, Plus, Settings, Home, AlertTriangle, PenTool, Tablet, Package, Box, Edit2, Check, X, Briefcase, Phone, Mail, DollarSign, Clock, MessageSquare, Calendar, Smartphone } from 'lucide-react';
import { generateId } from '../utils';

interface SettingsPanelProps {
 properties: Property[];
 priorities: string[];
 serviceTypes: (string | ServiceTypeDefinition)[];
 inventoryItems?: InventoryItem[];
 suppliers?: Supplier[];
 initialTab?: 'properties' | 'priorities' | 'services' | 'tablet' | 'catalog' | 'suppliers' | 'field_app';
 afterHoursConfig?: AfterHoursConfig;
 onAddProperty: (code: string, address: string) => void;
 onDeleteProperty: (code: string) => void;
 onAddPriority: (item: string) => void;
 onDeletePriority: (item: string) => void;
 onAddServiceType: (item: string | ServiceTypeDefinition) => void;
 onDeleteServiceType: (item: string | ServiceTypeDefinition) => void;
 onUpdateServiceType?: (oldItem: string | ServiceTypeDefinition, newItem: ServiceTypeDefinition) => void;
 onAddInventoryItem?: (item: InventoryItem) => void;
 onDeleteInventoryItem?: (id: string) => void;
 onUpdateInventoryItem?: (item: InventoryItem) => void;
 onAddSupplier?: (item: Supplier) => void;
 onDeleteSupplier?: (id: string) => void;
 onUpdateSupplier?: (item: Supplier) => void;
 onUpdateSettings?: (settings: any) => void;
 onActivateTablet?: (propertyCode: string) => void;
 onOpenFieldApp?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
 properties, 
 priorities, 
 serviceTypes,
 inventoryItems = [],
 suppliers = [],
 initialTab = 'properties',
 afterHoursConfig,
 onAddProperty,
 onDeleteProperty,
 onAddPriority,
 onDeletePriority,
 onAddServiceType,
 onDeleteServiceType,
 onUpdateServiceType,
 onAddInventoryItem,
 onDeleteInventoryItem,
 onUpdateInventoryItem,
 onAddSupplier,
 onDeleteSupplier,
 onUpdateSupplier,
 onUpdateSettings,
 onActivateTablet,
 onOpenFieldApp
}) => {
 const [activeTab, setActiveTab] = useState<'properties' | 'priorities' | 'services' | 'tablet' | 'catalog' | 'suppliers' | 'field_app'>(initialTab);

 const [newPropCode, setNewPropCode] = useState('');
 const [newPropAddress, setNewPropAddress] = useState('');
 const [newItem, setNewItem] = useState('');
 const [newServicePrice, setNewServicePrice] = useState('');
 
 // Edit Inventory Item State
 const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
 
 // Edit Service Type State
 const [editingServiceType, setEditingServiceType] = useState<{ original: string | ServiceTypeDefinition, name: string, price: string } | null>(null);

 // Supplier Form State
 const [supName, setSupName] = useState('');
 const [supCategory, setSupCategory] = useState('');
 const [supPhone, setSupPhone] = useState('');
 const [supEmail, setSupEmail] = useState('');
 const [supNotes, setSupNotes] = useState('');
 
 // Tablet Settings State
 const [selectedTabletProp, setSelectedTabletProp] = useState('');
 const [afterHoursEnabled, setAfterHoursEnabled] = useState(false);
 const [afterHoursMessage, setAfterHoursMessage] = useState('');
 const [afterHoursRules, setAfterHoursRules] = useState<AfterHoursRule[]>([]);
 
 // New Rule State
 const [newRuleDays, setNewRuleDays] = useState<number[]>([]);
 const [newRuleStart, setNewRuleStart] = useState('20:00');
 const [newRuleEnd, setNewRuleEnd] = useState('08:00');

 // Load After Hours config
 useEffect(() => {
   if (afterHoursConfig) {
     setAfterHoursEnabled(afterHoursConfig.enabled);
     setAfterHoursMessage(afterHoursConfig.message);
     setAfterHoursRules(afterHoursConfig.rules || []);
   }
 }, [afterHoursConfig]);

 // Update activeTab if initialTab changes (e.g. coming from Landing Page)
 useEffect(() => {
  if (initialTab) {
   setActiveTab(initialTab);
  }
 }, [initialTab]);

 const handlePropertySubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (newPropCode && newPropAddress) {
   onAddProperty(newPropCode, newPropAddress);
   setNewPropCode('');
   setNewPropAddress('');
  }
 };

 const handleItemSubmit = (e: React.FormEvent, type: 'priority' | 'service') => {
  e.preventDefault();
  if (!newItem) return;
  
  if (type === 'priority') {
   onAddPriority(newItem);
  } else {
   if (newServicePrice) {
    onAddServiceType({ name: newItem, defaultPrice: parseFloat(newServicePrice) });
   } else {
    onAddServiceType(newItem);
   }
   setNewServicePrice('');
  }
  setNewItem('');
 };

 const handleSupplierSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   if (!supName || !onAddSupplier) return;

   const newSupplier: Supplier = {
     id: Math.random().toString(36).substr(2, 9),
     name: supName,
     category: supCategory,
     phone: supPhone,
     email: supEmail,
     notes: supNotes,
     active: true
   };

   onAddSupplier(newSupplier);
   setSupName('');
   setSupCategory('');
   setSupPhone('');
   setSupEmail('');
   setSupNotes('');
 };

 const activateTabletMode = async () => {
   if(!selectedTabletProp) return;
   
   const confirmed = window.confirm(
     `ATENÇÃO: Isso transformará este dispositivo em um Tablet para o imóvel ${selectedTabletProp}.\n\nVocê será deslogado e o app entrará em modo Kiosk.\n\nDeseja continuar?`
   );

   if(confirmed && onActivateTablet) {
     onActivateTablet(selectedTabletProp);
   }
 };

 const handleAddRule = () => {
   if (newRuleDays.length === 0 || !newRuleStart || !newRuleEnd) {
     alert("Selecione pelo menos um dia e defina o horário de início e fim.");
     return;
   }

   const newRule: AfterHoursRule = {
     id: generateId(),
     days: newRuleDays.sort((a, b) => a - b),
     start: newRuleStart,
     end: newRuleEnd
   };

   setAfterHoursRules([...afterHoursRules, newRule]);
   setNewRuleDays([]);
   setNewRuleStart('20:00');
   setNewRuleEnd('08:00');
 };

 const handleDeleteRule = (id: string) => {
   setAfterHoursRules(afterHoursRules.filter(r => r.id !== id));
 };

 const handleSaveTabletConfig = () => {
   if (onUpdateSettings) {
     onUpdateSettings({
       afterHours: {
         enabled: afterHoursEnabled,
         message: afterHoursMessage,
         rules: afterHoursRules
       }
     });
     alert("Configurações do Tablet salvas com sucesso!");
   }
 };

 const toggleDaySelection = (day: number) => {
   setNewRuleDays(prev => 
     prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
   );
 };

 const handleUpdateItem = (e: React.FormEvent) => {
  e.preventDefault();
  if (editingItem && onUpdateInventoryItem) {
   onUpdateInventoryItem(editingItem);
   setEditingItem(null);
  }
 };

 const handleUpdateService = (e: React.FormEvent) => {
  e.preventDefault();
  if (editingServiceType && onUpdateServiceType) {
    onUpdateServiceType(editingServiceType.original, {
      name: editingServiceType.name,
      defaultPrice: editingServiceType.price ? parseFloat(editingServiceType.price) : 0
    });
    setEditingServiceType(null);
  }
 };

 const initiateEditService = (item: string | ServiceTypeDefinition) => {
   const name = typeof item === 'string' ? item : item.name;
   const price = typeof item !== 'string' && item.defaultPrice ? item.defaultPrice.toString() : '';
   setEditingServiceType({
     original: item,
     name,
     price
   });
 };

 // Helper to extract string from ServiceType
 const getServiceLabel = (s: string | ServiceTypeDefinition) => {
  return typeof s === 'string' ? s : s.name;
 };

 const WEEKDAYS = [
   { num: 0, label: 'D', name: 'Domingo' },
   { num: 1, label: 'S', name: 'Segunda' },
   { num: 2, label: 'T', name: 'Terça' },
   { num: 3, label: 'Q', name: 'Quarta' },
   { num: 4, label: 'Q', name: 'Quinta' },
   { num: 5, label: 'S', name: 'Sexta' },
   { num: 6, label: 'S', name: 'Sábado' }
 ];

 return (
  <div className="space-y-6">
   <div className="flex items-center gap-3 mb-6">
    <div className="bg-brand-100 p-2 rounded-lg text-brand-700">
     <Settings size={24} />
    </div>
    <div>
     <h2 className="text-2xl font-heading font-bold text-gray-900">Configurações do Sistema</h2>
     <p className="text-gray-500 text-sm">Gerencie imóveis, categorias e catálogo de produtos.</p>
    </div>
   </div>

   {/* Tabs */}
   <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
    <button
     type="button"
     onClick={() => setActiveTab('properties')}
     className={`pb-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'properties' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
     <Home size={18} /> Imóveis
    </button>
    <button
     type="button"
     onClick={() => setActiveTab('suppliers')}
     className={`pb-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'suppliers' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
     <Briefcase size={18} /> Fornecedores
    </button>
    <button
     type="button"
     onClick={() => setActiveTab('catalog')}
     className={`pb-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'catalog' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
     <Package size={18} /> Catálogo de Produtos
    </button>
    <button
     type="button"
     onClick={() => setActiveTab('priorities')}
     className={`pb-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'priorities' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
     <AlertTriangle size={18} /> Prioridades
    </button>
    <button
     type="button"
     onClick={() => setActiveTab('services')}
     className={`pb-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'services' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
     <PenTool size={18} /> Tipos de Serviço
    </button>
    <button
     type="button"
     onClick={() => setActiveTab('tablet')}
     className={`pb-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'tablet' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
     <Tablet size={18} /> Configurar Tablet
    </button>
    <button
     type="button"
     onClick={() => setActiveTab('field_app')}
     className={`pb-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'field_app' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
     <Smartphone size={18} /> App de Campo
    </button>
   </div>

   <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6">
    {/* ... Properties, Suppliers, Catalog, Priorities, Services Tabs (Same as before) ... */}
    {activeTab === 'properties' && (
     <div className="space-y-6">
      <form onSubmit={handlePropertySubmit} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
       <div className="flex-1 w-full">
        <label className="block text-xs font-medium text-gray-700 mb-1">Código (Ex: I-AC-101)</label>
        <input 
         value={newPropCode} onChange={e => setNewPropCode(e.target.value)}
         className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
         placeholder="Código" required 
        />
       </div>
       <div className="flex-[2] w-full">
        <label className="block text-xs font-medium text-gray-700 mb-1">Endereço Completo</label>
        <input 
         value={newPropAddress} onChange={e => setNewPropAddress(e.target.value)}
         className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
         placeholder="Endereço" required 
        />
       </div>
       <button type="submit" className="bg-brand-600 text-white p-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm w-full md:w-auto flex justify-center">
        <Plus size={20} />
       </button>
      </form>

      <div className="max-h-96 overflow-y-auto border rounded-lg border-gray-100">
       <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0">
         <tr>
          <th className="p-3 border-b border-gray-200">Código</th>
          <th className="p-3 border-b border-gray-200">Endereço</th>
          <th className="p-3 border-b border-gray-200 text-right">Ação</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
         {properties.map(p => (
          <tr key={p.code} className="hover:bg-gray-50">
           <td className="p-3 font-medium text-gray-900">{p.code}</td>
           <td className="p-3 text-gray-600">{p.address}</td>
           <td className="p-3 text-right">
            <button 
             type="button"
             onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteProperty(p.code);
             }}
             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
             title="Excluir Imóvel"
            >
             <Trash2 size={16} />
            </button>
           </td>
          </tr>
         ))}
         {properties.length === 0 && (
          <tr>
           <td colSpan={3} className="p-4 text-center text-gray-400">Nenhum imóvel cadastrado.</td>
          </tr>
         )}
        </tbody>
       </table>
      </div>
     </div>
    )}

    {/* SUPPLIERS TAB */}
    {activeTab === 'suppliers' && (
      <div className="space-y-6 animate-fade-in">
        <form onSubmit={handleSupplierSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Plus size={16}/> Novo Fornecedor / Parceiro
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
              <input 
                value={supName} onChange={e => setSupName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
                placeholder="Nome da Empresa ou Pessoa" required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoria (Ex: Manutenção, Limpeza)</label>
              <input 
                value={supCategory} onChange={e => setSupCategory(e.target.value)}
                list="service-types-list"
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
                placeholder="Selecione ou digite..." 
              />
              <datalist id="service-types-list">
                {serviceTypes.map(s => <option key={getServiceLabel(s)} value={getServiceLabel(s)} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
              <input 
                value={supPhone} onChange={e => setSupPhone(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
                placeholder="(21) 99999-9999" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email"
                value={supEmail} onChange={e => setSupEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
                placeholder="contato@empresa.com" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
            <textarea 
              value={supNotes} onChange={e => setSupNotes(e.target.value)}
              rows={2}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
              placeholder="Informações adicionais..." 
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm flex items-center gap-2">
              <Check size={16} /> Cadastrar Fornecedor
            </button>
          </div>
        </form>

        <div className="max-h-[500px] overflow-y-auto border rounded-lg border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0">
              <tr>
                <th className="p-3 border-b border-gray-200">Nome / Categoria</th>
                <th className="p-3 border-b border-gray-200">Contato</th>
                <th className="p-3 border-b border-gray-200">Obs</th>
                <th className="p-3 border-b border-gray-200 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="p-3 align-top">
                    <div className="font-bold text-gray-900">{s.name}</div>
                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded w-fit mt-1">{s.category}</div>
                  </td>
                  <td className="p-3 align-top text-gray-600">
                    {s.phone && <div className="flex items-center gap-1 mb-1"><Phone size={12} /> {s.phone}</div>}
                    {s.email && <div className="flex items-center gap-1"><Mail size={12} /> {s.email}</div>}
                  </td>
                  <td className="p-3 align-top text-gray-500 text-xs italic">
                    {s.notes}
                  </td>
                  <td className="p-3 text-right align-top">
                    <button 
                      onClick={() => { if(window.confirm('Excluir este fornecedor?')) onDeleteSupplier?.(s.id); }}
                      className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">Nenhum fornecedor cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* CATALOG MANAGEMENT TAB */}
    {activeTab === 'catalog' && (
     <div className="space-y-8 animate-fade-in">
       <div className="border border-gray-200 rounded-lg overflow-hidden">
         <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
           <h4 className="font-bold text-gray-700">Produtos Cadastrados</h4>
           <span className="text-xs text-gray-500">Adicione novos produtos na aba Inventário</span>
         </div>
         <div className="max-h-[600px] overflow-y-auto">
           <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0">
               <tr>
                 <th className="p-3">Nome</th>
                 <th className="p-3">Categoria</th>
                 <th className="p-3">Detalhes (Marca/Modelo)</th>
                 <th className="p-3 text-right">Ação</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {inventoryItems.map(item => (
                 <tr key={item.id} className="hover:bg-gray-50">
                   <td className="p-3 font-medium text-gray-900">{item.name}</td>
                   <td className="p-3 text-gray-500">{item.category}</td>
                   <td className="p-3 text-gray-500 text-xs">
                     {[item.brand, item.model, item.dimensions].filter(Boolean).join(' • ')}
                   </td>
                   <td className="p-3 text-right">
                     <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="text-gray-400 hover:text-blue-500 p-1 rounded"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      {onDeleteInventoryItem && (
                        <button 
                          onClick={() => {
                            if(window.confirm("ATENÇÃO: Excluir este produto apagará todo o histórico de estoque associado.\n\nDeseja continuar?")) {
                              onDeleteInventoryItem(item.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 p-1 rounded"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                     </div>
                   </td>
                 </tr>
               ))}
               {inventoryItems.length === 0 && (
                 <tr><td colSpan={4} className="p-6 text-center text-gray-400">Nenhum produto cadastrado.</td></tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
     </div>
    )}

    {(activeTab === 'priorities' || activeTab === 'services') && (
     <div className="space-y-6">
       <form onSubmit={(e) => handleItemSubmit(e, activeTab === 'priorities' ? 'priority' : 'service')} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
       <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">
         Novo {activeTab === 'priorities' ? 'Nível de Prioridade' : 'Tipo de Serviço'}
        </label>
        <input 
         value={newItem} onChange={e => setNewItem(e.target.value)}
         className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
         placeholder="Digite o nome..." required 
        />
       </div>
       {activeTab === 'services' && (
        <div className="flex-1">
         <label className="block text-xs font-medium text-gray-700 mb-1">
          Valor Padrão (Opcional)
         </label>
         <div className="relative">
          <DollarSign size={14} className="absolute left-2 top-2.5 text-gray-400" />
          <input 
           type="number"
           step="0.01"
           value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)}
           className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" 
           placeholder="0.00" 
          />
         </div>
        </div>
       )}
       <button type="submit" className="bg-brand-600 text-white p-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
        <Plus size={20} />
       </button>
      </form>

      <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto border rounded-lg border-gray-100">
       {(activeTab === 'priorities' ? priorities : serviceTypes).map((item, idx) => {
        // Ensure key is unique if duplicates somehow exist
        const keyVal = typeof item === 'string' ? item : item.name;
        return (
         <li key={`${keyVal}-${idx}`} className="p-3 flex justify-between items-center hover:bg-gray-50 bg-white transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-gray-800">{keyVal}</span>
            {typeof item !== 'string' && item.defaultPrice && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                R$ {item.defaultPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
           {activeTab === 'services' && (
             <button 
              type="button"
              onClick={() => initiateEditService(item)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
              title="Editar Valor"
             >
              <Edit2 size={16} />
             </button>
           )}
           <button 
            type="button"
            onClick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             activeTab === 'priorities' ? onDeletePriority(item as string) : onDeleteServiceType(item as any);
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
            title="Excluir Item"
           >
            <Trash2 size={16} />
           </button>
          </div>
         </li>
        );
       })}
       {(activeTab === 'priorities' ? priorities : serviceTypes).length === 0 && (
        <li className="p-4 text-center text-gray-400 text-sm">Nenhum item cadastrado.</li>
       )}
      </ul>
     </div>
    )}

    {activeTab === 'tablet' && (
      <div className="space-y-8 animate-fade-in">
        {/* Tablet Activation */}
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="text-yellow-800 font-bold flex items-center gap-2 mb-2">
              <Tablet size={20} /> Ativar Modo Kiosk
            </h3>
            <p className="text-sm text-yellow-700 leading-relaxed">
              Ao ativar o modo tablet, este dispositivo se transformará em um terminal exclusivo para hóspedes.
              Ele ficará "preso" ao imóvel selecionado, não pedirá login e mostrará apenas a interface de boas-vindas.
            </p>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Imóvel deste Tablet</label>
            <select 
              value={selectedTabletProp}
              onChange={e => setSelectedTabletProp(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white mb-4"
            >
              <option value="">Selecione...</option>
              {properties.map(p => (
                <option key={p.code} value={p.code}>{p.code} - {p.address}</option>
              ))}
            </select>
            
            <button 
              type="button"
              onClick={activateTabletMode}
              disabled={!selectedTabletProp}
              className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ativar Modo Tablet Agora
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* After Hours Configuration */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" /> Horário de Atendimento e Mensagens
              </h3>
              <p className="text-sm text-gray-500">
                Configure a mensagem automática exibida aos hóspedes fora do horário comercial.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={afterHoursEnabled} 
                onChange={e => setAfterHoursEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {afterHoursEnabled && (
            <div className="bg-gray-50 p-6 rounded-none border border-gray-200 space-y-6 animate-fade-in">
              
              {/* Message Config */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <MessageSquare size={12} /> Mensagem Automática
                </label>
                <textarea 
                  rows={3}
                  value={afterHoursMessage}
                  onChange={e => setAfterHoursMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="Ex: Nosso horário de atendimento é das 08h às 20h. Sua solicitação será atendida por ordem de chegada."
                />
              </div>

              <hr className="border-gray-200" />

              {/* Rules List */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} /> Regras de Horário (Quando a mensagem aparece)
                </h4>
                
                {afterHoursRules.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {afterHoursRules.map((rule) => (
                      <div key={rule.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex gap-2 items-center">
                          <div className="flex gap-1">
                            {WEEKDAYS.map(d => (
                              <span key={d.num} className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded ${rule.days.includes(d.num) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-300'}`}>
                                {d.label}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700 ml-2">
                            {rule.start} às {rule.end}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteRule(rule.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-4">Nenhuma regra definida.</p>
                )}

                {/* Add Rule Form */}
                <div className="bg-white p-4 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Dias da Semana</label>
                    <div className="flex gap-1">
                      {WEEKDAYS.map(d => (
                        <button
                          key={d.num}
                          onClick={() => toggleDaySelection(d.num)}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded transition-colors ${newRuleDays.includes(d.num) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          title={d.name}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Início</label>
                    <input 
                      type="time" 
                      value={newRuleStart}
                      onChange={e => setNewRuleStart(e.target.value)}
                      className="p-2 border border-gray-300 rounded text-sm w-24"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fim</label>
                    <input 
                      type="time" 
                      value={newRuleEnd}
                      onChange={e => setNewRuleEnd(e.target.value)}
                      className="p-2 border border-gray-300 rounded text-sm w-24"
                    />
                  </div>
                  <button 
                    onClick={handleAddRule}
                    className="bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 p-2 rounded-lg transition-colors"
                    title="Adicionar Regra"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSaveTabletConfig}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Check size={18} /> Salvar Configuração
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {activeTab === 'field_app' && (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="text-blue-800 font-bold flex items-center gap-2 mb-2">
            <Smartphone size={20} /> App de Campo
          </h3>
          <p className="text-sm text-blue-700 leading-relaxed">
            O App de Campo é uma interface mobile otimizada para técnicos de manutenção.
            Permite visualizar tickets atribuídos, iniciar trabalhos, registrar conclusões com fotos e acompanhar localização em tempo real via GPS.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Smartphone size={18} className="text-brand-600" /> Acesso ao App de Campo
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Clique no botão abaixo para abrir o App de Campo. Você verá apenas os tickets atribuídos ao seu usuário.
            </p>

            <button
              type="button"
              onClick={onOpenFieldApp}
              disabled={!onOpenFieldApp}
              className="w-full md:w-auto bg-brand-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Smartphone size={20} /> Abrir App de Campo
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-3">Funcionalidades</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">•</span>
                <span>Visualização de tickets atribuídos a você (regular e checkout)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">•</span>
                <span>Rastreamento GPS em tempo real para localização do técnico</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">•</span>
                <span>Iniciar e finalizar trabalhos com relatórios fotográficos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">•</span>
                <span>Acesso direto a códigos de porta e informações do imóvel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600 font-bold">•</span>
                <span>Interface mobile-first otimizada para uso em campo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )}
   </div>

   {/* Edit Inventory Item Modal */}
   {editingItem && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
     <div className="bg-white rounded-none shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Produto</h3>
      <form onSubmit={handleUpdateItem} className="space-y-4">
       <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
        <select 
         value={editingItem.category} 
         onChange={e => setEditingItem({ ...editingItem, category: e.target.value as InventoryCategory })}
         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none"
        >
         {Object.values(InventoryCategory).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
       </div>
       <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
        <input 
         value={editingItem.name} 
         onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} 
         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none" 
         required 
        />
       </div>
       <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
          <input 
           value={editingItem.brand || ''} 
           onChange={e => setEditingItem({ ...editingItem, brand: e.target.value })} 
           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none" 
          />
         </div>
         <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Modelo</label>
          <input 
           value={editingItem.model || ''} 
           onChange={e => setEditingItem({ ...editingItem, model: e.target.value })} 
           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none" 
          />
         </div>
       </div>
       <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tamanho/Dimensão</label>
          <input 
           value={editingItem.dimensions || ''} 
           onChange={e => setEditingItem({ ...editingItem, dimensions: e.target.value })} 
           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none" 
          />
         </div>
         <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Estoque Mínimo</label>
          <input 
           type="number"
           value={editingItem.minStock} 
           onChange={e => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })} 
           className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none" 
          />
         </div>
       </div>
       <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
        <textarea 
         value={editingItem.description || ''} 
         onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} 
         rows={2}
         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none" 
        />
       </div>

       <div className="flex justify-end gap-2 pt-2">
        <button 
         type="button" 
         onClick={() => setEditingItem(null)} 
         className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
         Cancelar
        </button>
        <button 
         type="submit" 
         className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 flex items-center gap-2"
        >
         <Check size={16} /> Salvar
        </button>
       </div>
      </form>
     </div>
    </div>
   )}

   {/* Edit Service Type Modal */}
   {editingServiceType && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
     <div className="bg-white rounded-none shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Serviço</h3>
      <form onSubmit={handleUpdateService} className="space-y-4">
       <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Serviço</label>
        <input 
         value={editingServiceType.name} 
         onChange={e => setEditingServiceType({ ...editingServiceType, name: e.target.value })} 
         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none" 
         required 
        />
       </div>
       <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Valor Padrão (R$)</label>
        <input 
         type="number"
         step="0.01"
         value={editingServiceType.price} 
         onChange={e => setEditingServiceType({ ...editingServiceType, price: e.target.value })} 
         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none" 
         placeholder="0.00"
        />
        <p className="text-[10px] text-gray-400 mt-1">Deixe vazio para manter zero.</p>
       </div>

       <div className="flex justify-end gap-2 pt-2">
        <button 
         type="button" 
         onClick={() => setEditingServiceType(null)} 
         className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
         Cancelar
        </button>
        <button 
         type="submit" 
         className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 flex items-center gap-2"
        >
         <Check size={16} /> Salvar
        </button>
       </div>
      </form>
     </div>
    </div>
   )}
  </div>
 );
};

export default SettingsPanel;
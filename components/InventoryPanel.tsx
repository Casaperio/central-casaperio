import React, { useState, useMemo, useEffect } from 'react';
import {
 InventoryItem, InventoryCategory, InventoryTransaction,
 TransactionType, Property, User
} from '../types';
import {
 Box, Search, Plus, ArrowRightLeft, Trash2,
 AlertTriangle, History, Package, Filter, Edit2, Check, Download, Loader2,
 ChevronLeft, ChevronRight
} from 'lucide-react';
import { useInventoryReference } from '../src/hooks/useInventoryReference';
import { PropertyAmenitiesSection } from '../src/components/PropertyAmenitiesSection';

interface InventoryPanelProps {
 items: InventoryItem[];
 transactions: InventoryTransaction[];
 properties: Property[];
 currentUser: User;
 onUpdateItem?: (item: InventoryItem) => Promise<InventoryItem>;
 onCreateItem?: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => Promise<InventoryItem>;
 onDeleteItem?: (id: string) => Promise<void>;
 onCreateTransaction?: (tx: {
  itemId: string;
  type: TransactionType;
  quantity: number;
  source: string;
  destination: string;
  user: string;
  notes?: string;
 }) => Promise<void>;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({
 items, transactions, properties, currentUser, onUpdateItem,
 onCreateItem, onDeleteItem, onCreateTransaction
}) => {
 const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
 const [searchTerm, setSearchTerm] = useState('');
 const [categoryFilter, setCategoryFilter] = useState<string>('all');
 const [propertyFilter, setPropertyFilter] = useState<string>('all');

 // Pagination States
 const [stockPage, setStockPage] = useState(1);
 const [movementsPage, setMovementsPage] = useState(1);
 const itemsPerPage = 20;

 // Modal States
 const [showItemModal, setShowItemModal] = useState(false);
 const [showMoveModal, setShowMoveModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);

 const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

 // Stays.net Reference Data Hook
 const { categories: refCategories, items: refItems, conditions: refConditions, amenities: refAmenities, loading: refLoading } = useInventoryReference();

 // Form States (Item - Quick Add / Edit)
 const [itemName, setItemName] = useState('');
 const [itemCategory, setItemCategory] = useState<InventoryCategory>(InventoryCategory.LINEN);
 const [itemBrand, setItemBrand] = useState('');
 const [itemModel, setItemModel] = useState('');
 const [itemDimensions, setItemDimensions] = useState('');
 const [itemMinStock, setItemMinStock] = useState(10);
 const [itemDescription, setItemDescription] = useState('');
 
 // Dynamic placeholders state
 const [placeholders, setPlaceholders] = useState({ name: '', brand: '', model: '', dimensions: '' });

 // Form States (Movement)
 const [moveType, setMoveType] = useState<TransactionType>(TransactionType.TRANSFER);
 const [moveQty, setMoveQty] = useState(1);
 const [moveSource, setMoveSource] = useState('CENTRAL');
 const [moveDest, setMoveDest] = useState('');
 const [moveNotes, setMoveNotes] = useState('');

 // Update placeholders when category changes
 useEffect(() => {
   switch (itemCategory) {
     case InventoryCategory.LINEN:
       setPlaceholders({ name: 'Ex: Lençol King 400 Fios', brand: 'Ex: Trousseau', model: 'Ex: Hotel Collection', dimensions: 'Ex: King' });
       break;
     case InventoryCategory.ELECTRONICS:
       setPlaceholders({ name: 'Ex: Smart TV 50"', brand: 'Ex: Samsung', model: 'Ex: Crystal UHD', dimensions: 'Ex: 50 Polegadas' });
       break;
     case InventoryCategory.FURNITURE:
       setPlaceholders({ name: 'Ex: Cama Box Casal', brand: 'Ex: Ortobom', model: 'Ex: Pró-saúde', dimensions: 'Ex: 1,38x1,88' });
       break;
     case InventoryCategory.AMENITY:
       setPlaceholders({ name: 'Ex: Shampoo', brand: 'Ex: L\'Occitane', model: 'Ex: Verbena', dimensions: 'Ex: 30ml' });
       break;
     case InventoryCategory.UTENSIL:
       setPlaceholders({ name: 'Ex: Jogo de Taças', brand: 'Ex: Oxford', model: 'Ex: Cristal', dimensions: 'Ex: 6 Peças' });
       break;
     default:
       setPlaceholders({ name: 'Nome do Item', brand: 'Marca', model: 'Modelo', dimensions: 'Tamanho' });
   }
 }, [itemCategory]);

 // Autocomplete Logic
 const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const val = e.target.value;
   setItemName(val);
   
   // Try to find exact match in existing items to prefill
   const existing = items.find(i => i.name.toLowerCase() === val.toLowerCase());
   if (existing && !showEditModal) {
     setItemCategory(existing.category);
     setItemBrand(existing.brand || '');
     setItemModel(existing.model || '');
     setItemDimensions(existing.dimensions || '');
     setItemMinStock(existing.minStock);
     setItemDescription(existing.description || '');
   }
 };

 // Reset pagination when filters change
 useEffect(() => {
  setStockPage(1);
 }, [searchTerm, categoryFilter]);

 useEffect(() => {
  setMovementsPage(1);
 }, [searchTerm]);

 // --- FILTERS ---
 const filteredItems = useMemo(() => {
  return items.filter(item => {
   const matchSearch =
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase()));

   const matchCat = categoryFilter === 'all' || item.category === categoryFilter;

   return matchSearch && matchCat;
  });
 }, [items, searchTerm, categoryFilter]);

 const filteredTransactions = useMemo(() => {
  return transactions.filter(t =>
   t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
   t.user.toLowerCase().includes(searchTerm.toLowerCase())
  );
 }, [transactions, searchTerm]);

 // --- PAGINATION ---
 const paginatedItems = useMemo(() => {
  const startIndex = (stockPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredItems.slice(startIndex, endIndex);
 }, [filteredItems, stockPage, itemsPerPage]);

 const paginatedTransactions = useMemo(() => {
  const startIndex = (movementsPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredTransactions.slice(startIndex, endIndex);
 }, [filteredTransactions, movementsPage, itemsPerPage]);

 const totalStockPages = Math.ceil(filteredItems.length / itemsPerPage);
 const totalMovementsPages = Math.ceil(filteredTransactions.length / itemsPerPage);

 // --- ACTIONS ---

 const handleCreateItem = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!itemName || !onCreateItem) return;

  const newItem = {
   name: itemName,
   category: itemCategory,
   brand: itemBrand,
   model: itemModel,
   dimensions: itemDimensions,
   minStock: itemMinStock,
   description: itemDescription,
   stock: { 'CENTRAL': 0 },
  };

  await onCreateItem(newItem);
  setShowItemModal(false);
  resetForms();
 };

 const handleUpdateItemSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedItem || !onUpdateItem) return;

  const updatedItem: InventoryItem = {
    ...selectedItem,
    name: itemName,
    category: itemCategory,
    brand: itemBrand,
    model: itemModel,
    dimensions: itemDimensions,
    minStock: itemMinStock,
    description: itemDescription,
    updatedAt: Date.now()
  };

  onUpdateItem(updatedItem);
  setShowEditModal(false);
  resetForms();
 };

 const handleDeleteItem = async (id: string) => {
  if (!onDeleteItem) return;
  if (window.confirm("Tem certeza? Isso apagará todo o histórico de estoque deste item.")) {
   await onDeleteItem(id);
  }
 };

 const handleMovement = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedItem || moveQty <= 0 || !onCreateTransaction) return;

  // Logic Validation
  let source = moveSource;
  let dest = moveDest;

  // Auto-set dest/source based on type for simplicity
  if (moveType === TransactionType.PURCHASE) {
   source = 'VENDOR';
   dest = 'CENTRAL';
  } else if (moveType === TransactionType.CONSUMPTION || moveType === TransactionType.BREAKAGE || moveType === TransactionType.LOSS) {
   dest = 'TRASH'; // Leaving the system
   if (!source) { alert("Selecione a origem da baixa."); return; }
  } else if (moveType === TransactionType.TRANSFER) {
   if (!source || !dest) { alert("Selecione origem e destino."); return; }
   if (source === dest) { alert("Origem e destino devem ser diferentes."); return; }
  }

  // Check Stock availability (skip for Purchase) - frontend validation
  if (source !== 'VENDOR') {
    const currentStock = selectedItem.stock[source] || 0;
    if (currentStock < moveQty) {
      alert(`Estoque insuficiente em ${source}. Disponível: ${currentStock}`);
      return;
    }
  }

  try {
   // Call API - backend handles stock update atomically
   await onCreateTransaction({
    itemId: selectedItem.id,
    type: moveType,
    quantity: moveQty,
    source,
    destination: dest,
    user: currentUser.name,
    notes: moveNotes,
   });

   setShowMoveModal(false);
   resetForms();
  } catch (error) {
   const message = error instanceof Error ? error.message : 'Erro ao registrar movimentação';
   alert(message);
  }
 };

 const resetForms = () => {
  setItemName('');
  setItemBrand('');
  setItemModel('');
  setItemDimensions('');
  setItemDescription('');
  setItemMinStock(10);
  setSelectedItem(null);
  setMoveQty(1);
  setMoveNotes('');
  setMoveSource('CENTRAL');
  setMoveDest('');
 };

 const openMoveModal = (item: InventoryItem, preSetType?: TransactionType) => {
  setSelectedItem(item);
  if (preSetType) setMoveType(preSetType);
  setShowMoveModal(true);
 };

 const openEditModal = (item: InventoryItem) => {
  setSelectedItem(item);
  setItemName(item.name);
  setItemCategory(item.category);
  setItemBrand(item.brand || '');
  setItemModel(item.model || '');
  setItemDimensions(item.dimensions || '');
  setItemMinStock(item.minStock);
  setItemDescription(item.description || '');
  setShowEditModal(true);
 };

 const getStockForColumn = (item: InventoryItem, context: string) => {
  return item.stock[context] || 0;
 };

 const getTotalStock = (item: InventoryItem) => {
  return Object.values(item.stock).reduce((a, b) => a + b, 0);
 };

 // Permission Checks
 const canManageCatalog = currentUser.role === 'Admin';

 return (
  <div className="space-y-6 animate-fade-in pb-20">
   
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex items-center gap-3">
     <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
      <Box size={24} />
     </div>
     <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900">Gestão de Inventário</h2>
      <p className="text-gray-500 text-sm">Controle de enxoval, equipamentos e amenities.</p>
     </div>
    </div>
    
    <div className="flex gap-2">
      <button
        onClick={() => setActiveTab('stock')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stock' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
      >
        <Package size={16} className="inline mr-2" /> Estoque
      </button>
      <button
        onClick={() => setActiveTab('movements')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'movements' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
      >
        <History size={16} className="inline mr-2" /> Histórico
      </button>
      {canManageCatalog && (
        <button
          onClick={() => { resetForms(); setShowItemModal(true); }}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Novo Item
        </button>
      )}
    </div>
   </div>

   {/* Filters */}
   <div className="bg-white p-4 rounded-none shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4">
     <div className="relative flex-[2]">
      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      <input 
       type="text" 
       placeholder={activeTab === 'stock' ? "Buscar por nome, marca ou modelo..." : "Buscar movimento..."}
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
       className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
      />
     </div>
     
     {activeTab === 'stock' && (
       <>
        <div className="w-full lg:w-48 relative">
          <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none appearance-none"
            >
            <option value="all">Todas Categorias</option>
            {Object.values(InventoryCategory).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="w-full lg:w-48 relative">
          <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none appearance-none"
            >
            <option value="all">Visão Geral</option>
            {properties.map(p => (
              <option key={p.code} value={p.code}>{p.code}</option>
            ))}
          </select>
        </div>
       </>
     )}
   </div>

   {/* PROPERTY AMENITIES - When Property Selected */}
   {propertyFilter !== 'all' && (
     <PropertyAmenitiesSection propertyCode={propertyFilter} />
   )}

   {/* STOCK VIEW */}
   {activeTab === 'stock' && (
    <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
        <tr>
          <th className="p-4">Item & Detalhes</th>
          <th className="p-4">Categoria</th>
          <th className="p-4">Imóveis</th>
          <th className="p-4 text-center bg-amber-50 text-amber-900 border-x border-amber-100">
            {propertyFilter === 'all' ? 'Estoque Central' : `Estoque ${propertyFilter}`}
          </th>
          {propertyFilter === 'all' && <th className="p-4 text-center">Em Imóveis</th>}
          <th className="p-4 text-right">Total</th>
          <th className="p-4 text-right">Ações</th>
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
        {paginatedItems.map(item => {
          const centralStock = item.stock['CENTRAL'] || 0;
          const totalStock = getTotalStock(item);
          const propertiesStock = totalStock - centralStock;
          
          // If filtering by property, show that property's stock in the highlighted col
          const highlightedStock = propertyFilter === 'all' 
            ? centralStock 
            : (item.stock[propertyFilter] || 0);

          const isLow = highlightedStock < item.minStock;

          // Details String
          const details = [item.brand, item.model, item.dimensions].filter(Boolean).join(' • ');

          return (
          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4">
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900">{item.name}</div>
                {canManageCatalog && (
                  <button 
                    onClick={() => openEditModal(item)}
                    className="text-gray-400 hover:text-blue-500 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
                    title="Editar Detalhes"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
              {details && <div className="text-xs text-gray-500 mt-0.5">{details}</div>}
            </td>
            <td className="p-4">
              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">{item.category}</span>
            </td>
            <td className="p-4 text-xs text-gray-600">
              {Object.entries(item.stock)
                .filter(([loc, qty]) => loc !== 'CENTRAL' && qty > 0)
                .map(([loc]) => {
                  const property = properties.find(p => p.code === loc);
                  return property ? property.code : loc;
                })
                .join(', ') || '-'}
            </td>
            <td className="p-4 text-center bg-amber-50/30 border-x border-amber-100/50">
               <div className="flex items-center justify-center gap-2">
                <span className={`font-bold text-lg ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                  {highlightedStock}
                </span>
                {isLow && <div title="Estoque Baixo"><AlertTriangle size={14} className="text-red-500" /></div>}
               </div>
            </td>
            {propertyFilter === 'all' && (
               <td className="p-4 text-center text-gray-500">{propertiesStock}</td>
            )}
            <td className="p-4 text-right font-medium text-gray-700">{totalStock}</td>
            <td className="p-4 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => openMoveModal(item, TransactionType.TRANSFER)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" 
                  title="Mover / Transferir"
                >
                  <ArrowRightLeft size={16} />
                </button>
                <button 
                  onClick={() => openMoveModal(item, TransactionType.PURCHASE)}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded" 
                  title="Adicionar / Compra"
                >
                  <Plus size={16} />
                </button>
              </div>
            </td>
          </tr>
          );
        })}
        {paginatedItems.length === 0 && (
          <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum item encontrado.</td></tr>
        )}
        </tbody>
      </table>
      </div>

      {/* Pagination Controls for Stock */}
      {filteredItems.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Mostrando {((stockPage - 1) * itemsPerPage) + 1} até {Math.min(stockPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} itens
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStockPage(p => Math.max(1, p - 1))}
              disabled={stockPage === 1}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Página {stockPage} de {totalStockPages}
            </span>
            <button
              onClick={() => setStockPage(p => Math.min(totalStockPages, p + 1))}
              disabled={stockPage === totalStockPages}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Próxima página"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
   )}

   {/* MOVEMENTS VIEW */}
   {activeTab === 'movements' && (
    <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
       <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
        <tr>
          <th className="p-4">Data/Hora</th>
          <th className="p-4">Item</th>
          <th className="p-4">Tipo</th>
          <th className="p-4">Qtd</th>
          <th className="p-4">Origem {'->'} Destino</th>
          <th className="p-4">Usuário</th>
        </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
        {paginatedTransactions.map(tx => (
          <tr key={tx.id} className="hover:bg-gray-50">
            <td className="p-4 text-gray-500">{new Date(tx.timestamp).toLocaleString()}</td>
            <td className="p-4 font-medium text-gray-900">{tx.itemName}</td>
            <td className="p-4">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                tx.type === TransactionType.PURCHASE ? 'bg-green-50 text-green-700 border-green-200' :
                tx.type === TransactionType.BREAKAGE || tx.type === TransactionType.LOSS ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {tx.type}
              </span>
            </td>
            <td className="p-4 font-bold text-gray-800">{tx.quantity}</td>
            <td className="p-4 text-gray-600 text-xs">
               {tx.source} <ArrowRightLeft size={10} className="inline mx-1"/> {tx.destination}
               {tx.notes && <div className="text-gray-400 italic mt-1">"{tx.notes}"</div>}
            </td>
            <td className="p-4 text-gray-600">{tx.user}</td>
          </tr>
        ))}
        {paginatedTransactions.length === 0 && (
           <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma movimentação registrada.</td></tr>
        )}
        </tbody>
      </table>
      </div>

      {/* Pagination Controls for Movements */}
      {filteredTransactions.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Mostrando {((movementsPage - 1) * itemsPerPage) + 1} até {Math.min(movementsPage * itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length} movimentações
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMovementsPage(p => Math.max(1, p - 1))}
              disabled={movementsPage === 1}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Página {movementsPage} de {totalMovementsPages}
            </span>
            <button
              onClick={() => setMovementsPage(p => Math.min(totalMovementsPages, p + 1))}
              disabled={movementsPage === totalMovementsPages}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Próxima página"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
   )}

   {/* CREATE / EDIT ITEM MODAL */}
   {(showItemModal || showEditModal) && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-none shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {showEditModal ? 'Editar Detalhes do Item' : 'Cadastrar Novo Item'}
        </h3>
        <form onSubmit={showEditModal ? handleUpdateItemSubmit : handleCreateItem} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
            <select 
              value={itemCategory} 
              onChange={e => setItemCategory(e.target.value as InventoryCategory)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {Object.values(InventoryCategory).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Item</label>
            <input 
              list="inventory-suggestions"
              value={itemName} 
              onChange={handleNameChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none" 
              placeholder={placeholders.name} 
              required 
            />
            <datalist id="inventory-suggestions">
              {/* Existing items */}
              {items.map(i => <option key={i.id} value={i.name} />)}
              {/* Stays.net reference items */}
              {!refLoading && refItems.map(ri => (
                <option key={ri.id} value={`${ri.name} (${ri.nameEn})`} />
              ))}
              {/* Stays.net amenities */}
              {!refLoading && refAmenities.map(ra => (
                <option key={ra.id} value={`Amenidade: ${ra.name} (${ra.nameEn})`} />
              ))}
            </datalist>
          </div>
          
          {/* Dynamic Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Marca {itemCategory === InventoryCategory.ELECTRONICS && '(Opcional)'}</label>
               <input value={itemBrand} onChange={e => setItemBrand(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder={placeholders.brand} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Modelo {itemCategory === InventoryCategory.LINEN && '(Opcional)'}</label>
              <input value={itemModel} onChange={e => setItemModel(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder={placeholders.model} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Tamanho/Dimensão</label>
               <input value={itemDimensions} onChange={e => setItemDimensions(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder={placeholders.dimensions} />
             </div>
             <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estoque Mínimo (Alerta)</label>
              <input type="number" min="0" value={itemMinStock} onChange={e => setItemMinStock(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição Adicional</label>
            <textarea value={itemDescription} onChange={e => setItemDescription(e.target.value)} rows={2} className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button 
              type="button" 
              onClick={() => { setShowItemModal(false); setShowEditModal(false); resetForms(); }} 
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 shadow-sm flex items-center gap-2">
              <Check size={16} /> {showEditModal ? 'Salvar Alterações' : 'Criar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
   )}

   {/* MOVEMENT MODAL */}
   {showMoveModal && selectedItem && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-none shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Movimentar Estoque</h3>
        <p className="text-sm text-gray-500 mb-4">{selectedItem.name} {selectedItem.brand ? `- ${selectedItem.brand}` : ''}</p>
        
        <form onSubmit={handleMovement} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Ação</label>
               <select 
                value={moveType} 
                onChange={e => setMoveType(e.target.value as TransactionType)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade</label>
              <input type="number" min="1" value={moveQty} onChange={e => setMoveQty(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" required />
            </div>
          </div>

          {/* DYNAMIC SOURCE/DEST FIELDS */}
          
          {/* If Purchase: Source fixed to VENDOR */}
          {moveType === TransactionType.PURCHASE && (
             <div className="p-3 bg-green-50 text-green-700 text-sm rounded border border-green-100">
               Entrada de estoque: <strong>Fornecedor {'->'} Central</strong>
             </div>
          )}

          {/* If Transfer: Select both */}
          {moveType === TransactionType.TRANSFER && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Origem (De onde sai)</label>
                <select value={moveSource} onChange={e => setMoveSource(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm">
                  <option value="CENTRAL">Estoque Central ({getStockForColumn(selectedItem, 'CENTRAL')})</option>
                  {properties.map(p => (
                    <option key={p.code} value={p.code}>{p.code} ({getStockForColumn(selectedItem, p.code)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Destino (Para onde vai)</label>
                <select value={moveDest} onChange={e => setMoveDest(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm" required>
                  <option value="">Selecione...</option>
                  <option value="CENTRAL">Estoque Central</option>
                  {properties.map(p => (
                    <option key={p.code} value={p.code}>{p.code}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* If Breakage/Consumption: Select Source, Dest is Trash */}
          {(moveType === TransactionType.BREAKAGE || moveType === TransactionType.CONSUMPTION || moveType === TransactionType.LOSS) && (
             <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Baixar de (Origem)</label>
              <select value={moveSource} onChange={e => setMoveSource(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-sm">
                <option value="CENTRAL">Estoque Central ({getStockForColumn(selectedItem, 'CENTRAL')})</option>
                {properties.map(p => (
                  <option key={p.code} value={p.code}>{p.code} ({getStockForColumn(selectedItem, p.code)})</option>
                ))}
              </select>
              <p className="text-xs text-red-500 mt-1">O item será removido do sistema.</p>
            </div>
          )}

          {moveType === TransactionType.ADJUSTMENT && (
             <div className="p-3 bg-amber-50 text-amber-700 text-sm rounded border border-amber-100">
               Para ajustes, use Transferência ou Quebra. <br/>Use Baixa para reduzir e Compra para aumentar.
             </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações (Opcional)</label>
            <textarea value={moveNotes} onChange={e => setMoveNotes(e.target.value)} rows={2} className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={() => setShowMoveModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 shadow-sm">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
   )}

  </div>
 );
};

export default InventoryPanel;
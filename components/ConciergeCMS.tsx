import React, { useState } from 'react';
import { ConciergeOffer, Supplier } from '../types';
import { Plus, Trash2, Image as ImageIcon, Calendar, DollarSign, Users, Tag, Eye, Check, X } from 'lucide-react';

interface ConciergeCMSProps {
 offers: ConciergeOffer[];
 suppliers: Supplier[];
 onAddOffer: (offer: ConciergeOffer) => void;
 onUpdateOffer: (offer: ConciergeOffer) => void;
 onDeleteOffer: (id: string) => void;
}

const ConciergeCMS: React.FC<ConciergeCMSProps> = ({ offers, suppliers, onAddOffer, onUpdateOffer, onDeleteOffer }) => {
 const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
 const [selectedOffer, setSelectedOffer] = useState<ConciergeOffer | null>(null);
 const [showBookingsModal, setShowBookingsModal] = useState(false);

 // Form State
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [price, setPrice] = useState<string>('');
 const [priceDescription, setPriceDescription] = useState('');
 const [supplier, setSupplier] = useState('');
 const [date, setDate] = useState('');
 const [maxQty, setMaxQty] = useState<string>('');
 const [imageUrl, setImageUrl] = useState('');
 const [category, setCategory] = useState<'Eventos' | 'Gastronomia' | 'Tours' | 'Serviços' | 'Transporte'>('Eventos');

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!title || !description || !price) return;

  const newOffer: ConciergeOffer = {
   id: Math.random().toString(36).substr(2, 9),
   title,
   description,
   price: parseFloat(price),
   priceDescription,
   supplier,
   date: date || undefined,
   maxQuantity: maxQty ? parseInt(maxQty) : undefined,
   imageUrl,
   category,
   bookings: [],
   active: true
  };

  onAddOffer(newOffer);
  resetForm();
  setActiveTab('list');
  alert('Oferta criada com sucesso!');
 };

 const resetForm = () => {
  setTitle('');
  setDescription('');
  setPrice('');
  setPriceDescription('');
  setSupplier('');
  setDate('');
  setMaxQty('');
  setImageUrl('');
  setCategory('Eventos');
 };

 const handleUpdateBookingStatus = (offer: ConciergeOffer, bookingIndex: number, newStatus: 'pending' | 'paid' | 'canceled') => {
   const updatedBookings = [...offer.bookings];
   updatedBookings[bookingIndex] = { ...updatedBookings[bookingIndex], status: newStatus };
   onUpdateOffer({ ...offer, bookings: updatedBookings });
 };

 const calculateSold = (offer: ConciergeOffer) => {
   return offer.bookings.reduce((sum, b) => b.status !== 'canceled' ? sum + b.quantity : sum, 0);
 };

 return (
  <div className="space-y-6">
   <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
      <Tag size={24} />
      </div>
      <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900">Gestão de Experiências</h2>
      <p className="text-gray-500 text-sm">Crie e gerencie ofertas para o Tablet do Hóspede.</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {/* Botão de Ação Rápida */}
      <button
        onClick={() => setActiveTab('create')}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
      >
        <Plus size={18} />
        <span className="font-medium hidden md:inline">Inserir Novo</span>
      </button>
      {/* Tabs de Navegação */}
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-medium rounded-none transition-all ${activeTab === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Ofertas Ativas
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 text-sm font-medium rounded-none transition-all ${activeTab === 'create' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Nova Oferta
        </button>
      </div>
    </div>
   </div>

   {activeTab === 'create' && (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-3xl mx-auto">
     <h3 className="text-lg font-bold text-gray-800 mb-6">Criar Nova Experiência</h3>
     <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título da Oferta</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="Ex: Jogo Flamengo x Vasco - Maracanã"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select 
            value={category}
            onChange={e => setCategory(e.target.value as any)}
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="Eventos">Eventos / Shows</option>
            <option value="Gastronomia">Gastronomia / Chef</option>
            <option value="Tours">Tours / Passeios</option>
            <option value="Transporte">Transporte</option>
            <option value="Serviços">Serviços / Limpeza</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
          <div className="relative">
            <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="number" 
              min="0"
              step="0.01"
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div className="md:col-span-2 lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes do Preço</label>
          <input 
            type="text" 
            value={priceDescription} 
            onChange={e => setPriceDescription(e.target.value)} 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="Ex: Por pessoa (crianças até 5 anos não pagam)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora (Opcional)</label>
          <input 
            type="datetime-local" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Máxima</label>
          <input 
            type="number" 
            min="1"
            value={maxQty} 
            onChange={e => setMaxQty(e.target.value)} 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="Ilimitado"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor / Parceiro</label>
        <select 
          value={supplier} 
          onChange={e => setSupplier(e.target.value)} 
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="">Selecione um fornecedor...</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
          ))}
        </select>
        {suppliers.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">Nenhum fornecedor cadastrado. Vá em Configurações &gt; Fornecedores para adicionar.</p>
        )}
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
       <textarea 
        rows={4}
        value={description} 
        onChange={e => setDescription(e.target.value)} 
        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        placeholder="Detalhes sobre o que está incluso, ponto de encontro, etc..."
        required
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
       <div className="relative">
         <ImageIcon className="absolute left-3 top-3 text-gray-400" size={16} />
         <input 
          type="text" 
          value={imageUrl} 
          onChange={e => setImageUrl(e.target.value)} 
          className="w-full pl-9 pr-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
          placeholder="https://..."
         />
       </div>
       {imageUrl && (
         <div className="mt-2 h-40 w-full rounded-lg overflow-hidden border border-gray-200">
           <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
         </div>
       )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button 
          type="button" 
          onClick={() => setActiveTab('list')}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 shadow-sm">
          <Plus size={18} /> Publicar Oferta
        </button>
      </div>
     </form>
    </div>
   )}

   {activeTab === 'list' && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {offers.length === 0 ? (
       <div className="col-span-full text-center py-20 bg-gray-50 rounded-lg text-gray-500 border border-dashed border-gray-300">
        Nenhuma oferta ativa no momento.
       </div>
      ) : (
       offers.map(offer => {
        const sold = calculateSold(offer);
        const isSoldOut = offer.maxQuantity ? sold >= offer.maxQuantity : false;

        return (
        <div key={offer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col group">
          <div className="h-48 bg-gray-200 relative">
            {offer.imageUrl ? (
              <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                <Tag size={32} />
              </div>
            )}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
              R$ {offer.price.toFixed(2)}
            </div>
            <div className="absolute top-3 left-3 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm">
              {offer.category}
            </div>
          </div>
          
          <div className="p-4 flex-1 flex flex-col">
            <h4 className="font-bold text-gray-900 mb-1 text-lg leading-tight">{offer.title}</h4>
            {offer.date && (
              <p className="text-sm text-purple-700 font-medium mb-2 flex items-center gap-1">
                <Calendar size={14} /> {new Date(offer.date).toLocaleString()}
              </p>
            )}
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{offer.description}</p>
            {offer.priceDescription && (
              <p className="text-xs text-gray-400 italic mb-2">{offer.priceDescription}</p>
            )}
            
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span className={`font-bold ${isSoldOut ? 'text-red-500' : 'text-gray-800'}`}>
                  {sold}
                </span> 
                {offer.maxQuantity ? ` / ${offer.maxQuantity}` : ''} vendidos
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedOffer(offer); setShowBookingsModal(true); }}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  title="Ver Inscritos"
                >
                  <Users size={18} />
                </button>
                <button 
                  onClick={() => { if(window.confirm('Excluir esta oferta?')) onDeleteOffer(offer.id); }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        );
       })
      )}
    </div>
   )}

   {/* BOOKINGS LIST MODAL */}
   {showBookingsModal && selectedOffer && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
       <div className="bg-white rounded-none shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <div>
             <h3 className="text-xl font-bold text-gray-900">{selectedOffer.title}</h3>
             <p className="text-sm text-gray-500">Lista de Inscritos</p>
           </div>
           <button onClick={() => setShowBookingsModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
             <X size={20} />
           </button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
               <tr>
                 <th className="p-3 rounded-l-lg">Hóspede / Quarto</th>
                 <th className="p-3 text-center">Qtd</th>
                 <th className="p-3 text-right">Total</th>
                 <th className="p-3 text-center">Status Pagamento</th>
                 <th className="p-3 text-right rounded-r-lg">Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {selectedOffer.bookings.map((booking, idx) => (
                 <tr key={booking.id} className={booking.status === 'canceled' ? 'opacity-50 bg-gray-50' : ''}>
                   <td className="p-3">
                     <div className="font-bold text-gray-800">{booking.guestName}</div>
                     <div className="text-xs text-gray-500">{booking.propertyCode}</div>
                   </td>
                   <td className="p-3 text-center font-medium">{booking.quantity}</td>
                   <td className="p-3 text-right font-medium">R$ {booking.totalPrice.toFixed(2)}</td>
                   <td className="p-3 text-center">
                     <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                       booking.status === 'paid' ? 'bg-green-100 text-green-700' :
                       booking.status === 'canceled' ? 'bg-red-100 text-red-700' :
                       'bg-yellow-100 text-yellow-700'
                     }`}>
                       {booking.status === 'paid' ? 'Pago' : booking.status === 'canceled' ? 'Cancelado' : 'Pendente'}
                     </span>
                   </td>
                   <td className="p-3 text-right">
                     {booking.status === 'pending' && (
                       <button 
                         onClick={() => handleUpdateBookingStatus(selectedOffer, idx, 'paid')}
                         className="text-green-600 hover:bg-green-50 p-1.5 rounded mr-1"
                         title="Marcar como Pago"
                       >
                         <Check size={16} />
                       </button>
                     )}
                     {booking.status !== 'canceled' && (
                       <button 
                         onClick={() => { if(window.confirm('Cancelar inscrição?')) handleUpdateBookingStatus(selectedOffer, idx, 'canceled'); }}
                         className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded"
                         title="Cancelar"
                       >
                         <X size={16} />
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
               {selectedOffer.bookings.length === 0 && (
                 <tr><td colSpan={5} className="p-6 text-center text-gray-400 italic">Nenhum inscrito ainda.</td></tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
     </div>
   )}
  </div>
 );
};

export default ConciergeCMS;

import React, { useState } from 'react';
import { 
 Delivery, DeliveryStatus, Property, User, UserWithPassword
} from '../types';
import { 
 Truck, Building2, Plus, Trash2, Briefcase, User as UserIcon, Calendar, Clock, FileText, CheckCircle2
} from 'lucide-react';
import { storageService } from '../services/storage';

interface OfficePanelProps {
 deliveries: Delivery[];
 properties: Property[];
 users: UserWithPassword[];
 currentUser: User;
 // Receiving unused props to maintain compatibility with App.tsx without breaking the build
 supplies?: any[];
 assets?: any[];
 shifts?: any[];
}

const OfficePanel: React.FC<OfficePanelProps> = ({
 deliveries, properties, currentUser
}) => {
 // Deliveries State
 const [showDeliveryModal, setShowDeliveryModal] = useState(false);
 const [newDeliveryDesc, setNewDeliveryDesc] = useState('');
 const [newDeliveryCourier, setNewDeliveryCourier] = useState('');
 const [newDeliveryKeyword, setNewDeliveryKeyword] = useState('');
 const [newDeliveryProp, setNewDeliveryProp] = useState('');
 const [newDeliveryNotes, setNewDeliveryNotes] = useState('');

 // --- ACTIONS ---

 const handleAddDelivery = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newDeliveryDesc) return;
  
  await storageService.officeDeliveries.add({
   id: Math.random().toString(36).substr(2, 9),
   description: newDeliveryDesc,
   courier: newDeliveryCourier,
   keyword: newDeliveryKeyword,
   propertyCode: newDeliveryProp,
   notes: newDeliveryNotes,
   status: DeliveryStatus.PENDING,
   createdByName: currentUser.name,
   createdAt: Date.now(),
   updatedAt: Date.now()
  });
  
  setNewDeliveryDesc('');
  setNewDeliveryCourier('');
  setNewDeliveryKeyword('');
  setNewDeliveryProp('');
  setNewDeliveryNotes('');
  setShowDeliveryModal(false);
 };

 const updateDeliveryStatus = async (item: Delivery, status: DeliveryStatus) => {
   const updates: Partial<Delivery> = {
     status,
     updatedAt: Date.now()
   };

   if (status === DeliveryStatus.RECEIVED) {
     updates.recipient = currentUser.name; // Keep legacy support
     updates.receivedBy = currentUser.name;
     updates.receivedAt = Date.now();
   }

   await storageService.officeDeliveries.update({
     ...item,
     ...updates
   });
 };

 return (
  <div className="space-y-6 animate-fade-in pb-20">
   
   {/* Header */}
   <div className="flex items-center gap-3 mb-6">
    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
     <Briefcase size={24} />
    </div>
    <div>
     <h2 className="text-2xl font-heading font-bold text-gray-900">Gestão de Escritório</h2>
     <p className="text-gray-500 text-sm">Controle de encomendas e recebimento de mercadorias.</p>
    </div>
   </div>

   {/* DELIVERIES VIEW */}
   <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-none shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800">Controle de Recebimento</h3>
        <button onClick={() => setShowDeliveryModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={16} /> Nova Entrega
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveries.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-none border border-gray-200 shadow-sm flex flex-col relative overflow-hidden group">
            {item.status === DeliveryStatus.PENDING && (
              <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                AGUARDANDO
              </div>
            )}
            {item.status === DeliveryStatus.RECEIVED && (
              <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                NO ESCRITÓRIO
              </div>
            )}
            {item.status === DeliveryStatus.DELIVERED && (
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                ENTREGUE
              </div>
            )}

            <h4 className="font-bold text-gray-900 text-lg mb-1 pr-16">{item.description}</h4>
            <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
              <Truck size={14} /> {item.courier || 'Entregador não especificado'}
            </p>

            {item.keyword && (
              <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg mb-3">
                <p className="text-xs text-indigo-500 uppercase font-bold mb-1">Palavra-Chave / Código</p>
                <p className="text-lg font-mono font-bold text-indigo-700">{item.keyword}</p>
              </div>
            )}

            {item.propertyCode && (
              <div className="flex items-center gap-1 text-xs font-bold text-gray-700 mb-2">
                <Building2 size={12} /> Destino: {item.propertyCode}
              </div>
            )}

            {item.notes && (
              <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3 italic flex gap-1">
                <FileText size={12} className="mt-0.5 flex-shrink-0" /> "{item.notes}"
              </div>
            )}

            <div className="mt-auto space-y-2 pt-3 border-t border-gray-100">
              {/* Creation Info */}
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><UserIcon size={10} /> Criado por {item.createdByName?.split(' ')[0] || 'Sistema'}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Reception Info (If Applicable) */}
              {(item.status === DeliveryStatus.RECEIVED || item.status === DeliveryStatus.DELIVERED) && (item.receivedBy || item.recipient) && (
                <div className="flex items-center justify-between text-[10px] text-green-600 bg-green-50 p-1.5 rounded">
                  <span className="flex items-center gap-1 font-semibold"><CheckCircle2 size={10} /> Recebido por {item.receivedBy?.split(' ')[0] || item.recipient?.split(' ')[0]}</span>
                  <span>{item.receivedAt ? new Date(item.receivedAt).toLocaleDateString() : ''}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {item.status === DeliveryStatus.PENDING && (
                  <button 
                    onClick={() => updateDeliveryStatus(item, DeliveryStatus.RECEIVED)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Receber
                  </button>
                )}
                {item.status === DeliveryStatus.RECEIVED && (
                  <button 
                    onClick={() => updateDeliveryStatus(item, DeliveryStatus.DELIVERED)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Entregar ao Destino
                  </button>
                )}
                <button 
                  onClick={async () => { if(window.confirm('Excluir registro?')) await storageService.officeDeliveries.delete(item.id); }}
                  className="p-2 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {deliveries.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400 bg-white rounded-none border border-dashed border-gray-300">
            Nenhuma entrega registrada.
          </div>
        )}
      </div>
   </div>

   {/* MODALS */}
   {showDeliveryModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-none shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Nova Encomenda</h3>
        <form onSubmit={handleAddDelivery} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
            <input value={newDeliveryDesc} onChange={e => setNewDeliveryDesc(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Caixa com Fechadura" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Entregador / Serviço</label>
            <input value={newDeliveryCourier} onChange={e => setNewDeliveryCourier(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500" placeholder="Ex: MercadoLivre, iFood..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Palavra-Chave / Código (Se houver)</label>
            <input value={newDeliveryKeyword} onChange={e => setNewDeliveryKeyword(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 font-mono text-indigo-700 font-bold" placeholder="Ex: 1234" />
            <p className="text-[10px] text-gray-400 mt-1">Informe este código ao entregador.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Destino (Imóvel)</label>
            <select value={newDeliveryProp} onChange={e => setNewDeliveryProp(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
              <option value="">-- Selecione (Opcional) --</option>
              {properties.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações (Opcional)</label>
            <textarea value={newDeliveryNotes} onChange={e => setNewDeliveryNotes(e.target.value)} rows={2} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Deixar na portaria, Caixa amassada..." />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={() => setShowDeliveryModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Registrar</button>
          </div>
        </form>
      </div>
    </div>
   )}

  </div>
 );
};

export default OfficePanel;
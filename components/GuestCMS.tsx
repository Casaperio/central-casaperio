
import React, { useState } from 'react';
import { GuestTip } from '../types';
import { Plus, Trash2, Image as ImageIcon, BookOpen } from 'lucide-react';

interface GuestCMSProps {
 tips: GuestTip[];
 onAddTip: (tip: GuestTip) => void;
 onDeleteTip: (id: string) => void;
}

const GuestCMS: React.FC<GuestCMSProps> = ({ tips, onAddTip, onDeleteTip }) => {
 const [title, setTitle] = useState('');
 const [category, setCategory] = useState<'Restaurante' | 'Passeio' | 'Serviço' | 'Outro'>('Restaurante');
 const [content, setContent] = useState('');
 const [imageUrl, setImageUrl] = useState('');

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!title || !content) return;

  const newTip: GuestTip = {
   id: Math.random().toString(36).substr(2, 9),
   title,
   category,
   content,
   imageUrl,
   createdAt: Date.now()
  };

  onAddTip(newTip);
  setTitle('');
  setContent('');
  setImageUrl('');
  alert('Dica adicionada com sucesso!');
 };

 return (
  <div className="space-y-6">
   <div className="flex items-center gap-3 mb-6">
    <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
     <BookOpen size={24} />
    </div>
    <div>
     <h2 className="text-2xl font-heading font-bold text-gray-900">Blog do Hóspede (Tablet)</h2>
     <p className="text-gray-500 text-sm">Gerencie o conteúdo de dicas que aparece nos tablets dos imóveis.</p>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Form */}
    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200 h-fit lg:col-span-1">
     <h3 className="text-lg font-bold text-gray-800 mb-4">Adicionar Nova Dica</h3>
     <form onSubmit={handleSubmit} className="space-y-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
       <input 
        type="text" 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Ex: Melhor Sushi do Leblon"
        required
       />
      </div>
      
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
       <select 
        value={category} 
        onChange={e => setCategory(e.target.value as any)}
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
       >
        <option value="Restaurante">Restaurante</option>
        <option value="Passeio">Passeio</option>
        <option value="Serviço">Serviço</option>
        <option value="Outro">Outro</option>
       </select>
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo/Descrição</label>
       <textarea 
        rows={5}
        value={content} 
        onChange={e => setContent(e.target.value)} 
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Escreva as dicas aqui..."
        required
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem (Opcional)</label>
       <div className="relative">
         <ImageIcon className="absolute left-3 top-2.5 text-gray-400" size={16} />
         <input 
          type="text" 
          value={imageUrl} 
          onChange={e => setImageUrl(e.target.value)} 
          className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          placeholder="https://..."
         />
       </div>
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
       <Plus size={18} /> Publicar Dica
      </button>
     </form>
    </div>

    {/* List */}
    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
      {tips.length === 0 ? (
       <div className="col-span-full text-center py-20 bg-gray-50 rounded-none text-gray-500">
        Nenhuma dica cadastrada ainda.
       </div>
      ) : (
       tips.map(tip => (
        <div key={tip.id} className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden flex flex-col">
         {tip.imageUrl ? (
          <img src={tip.imageUrl} alt={tip.title} className="w-full h-40 object-cover" />
         ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
           <ImageIcon size={32} />
          </div>
         )}
         <div className="p-4 flex-1 flex flex-col">
           <div className="flex justify-between items-start mb-2">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{tip.category}</span>
            <button onClick={() => onDeleteTip(tip.id)} className="text-gray-400 hover:text-red-500">
             <Trash2 size={16} />
            </button>
           </div>
           <h4 className="font-bold text-gray-900 mb-2">{tip.title}</h4>
           <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">{tip.content}</p>
           <p className="text-xs text-gray-400 mt-auto">Postado em {new Date(tip.createdAt).toLocaleDateString()}</p>
         </div>
        </div>
       ))
      )}
    </div>
   </div>
  </div>
 );
};

export default GuestCMS;

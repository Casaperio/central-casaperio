import React, { useState, useMemo } from 'react';
import { UserWithPassword, AppModule } from '../types';
import { Trash2, UserPlus, Shield, KeyRound, X, AlertTriangle, Check, Wrench, Users, UserCog, Camera, Image as ImageIcon, Box, Briefcase, CalendarRange, Gem, LayoutDashboard, Loader2 } from 'lucide-react';

interface AdminPanelProps {
 users: UserWithPassword[];
 onAddUser: (user: UserWithPassword) => void;
 onDeleteUser: (id: string) => void;
 onUpdateUser: (user: UserWithPassword) => void;
 currentUserEmail: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onDeleteUser, onUpdateUser, currentUserEmail }) => {
 // Create User State
 const [newName, setNewName] = useState('');
 const [newEmail, setNewEmail] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [newRole, setNewRole] = useState<'Guest Relations' | 'Maintenance' | 'Admin' | 'Faxineira' | 'Administrativo'>('Guest Relations');
 const [selectedModules, setSelectedModules] = useState<AppModule[]>(['maintenance', 'guest']);

 // Modal State
 const [activeUser, setActiveUser] = useState<UserWithPassword | null>(null);
 const [actionType, setActionType] = useState<'delete' | 'reset_password' | 'edit_permissions' | 'edit_avatar' | null>(null);
 
 // Modal Form States
 const [resetPasswordValue, setResetPasswordValue] = useState('');
 const [editModules, setEditModules] = useState<AppModule[]>([]);
 const [avatarUrlValue, setAvatarUrlValue] = useState('');
 
 // Deduplication State
 const [isDeduplicating, setIsDeduplicating] = useState(false);
 const [deduplicationResult, setDeduplicationResult] = useState<{ removed: number; kept: number; details: Array<{ email: string; duplicates: number }> } | null>(null);
 const [showDeduplicationModal, setShowDeduplicationModal] = useState(false);

 // Toggle for Create Form
 const handleModuleToggle = (module: AppModule) => {
  setSelectedModules(prev => 
   prev.includes(module) 
    ? prev.filter(m => m !== module)
    : [...prev, module]
  );
 };

 // Toggle for Edit Modal
 const handleEditModuleToggle = (module: AppModule) => {
  setEditModules(prev => 
   prev.includes(module) 
    ? prev.filter(m => m !== module)
    : [...prev, module]
  );
 };

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!newName || !newEmail || !newPassword) return;

  if (selectedModules.length === 0) {
   alert("Selecione pelo menos um módulo de acesso.");
   return;
  }

  const newUser: UserWithPassword = {
   id: Math.random().toString(36).substr(2, 9),
   name: newName,
   email: newEmail.toLowerCase().trim(), // Normaliza email
   password: newPassword,
   role: newRole,
   allowedModules: selectedModules
  };

  onAddUser(newUser);
  setNewName('');
  setNewEmail('');
  setNewPassword('');
  setNewRole('Guest Relations');
  setSelectedModules(['maintenance', 'guest']);
 };

 // Open Modals
 const initiateDelete = (user: UserWithPassword) => {
  setActiveUser(user);
  setActionType('delete');
 };

 const initiatePasswordReset = (user: UserWithPassword) => {
  setActiveUser(user);
  setResetPasswordValue('');
  setActionType('reset_password');
 };

 const initiateEditPermissions = (user: UserWithPassword) => {
  setActiveUser(user);
  // Initialize with current user modules or default to empty if undefined
  setEditModules(user.allowedModules || []);
  setActionType('edit_permissions');
 };

 const initiateEditAvatar = (user: UserWithPassword) => {
  setActiveUser(user);
  setAvatarUrlValue(user.avatar || '');
  setActionType('edit_avatar');
 };

 // Deduplication Handler
 const handleDeduplication = async () => {
  if (isDeduplicating) return;
  
  if (!confirm('Deseja remover usuários duplicados? Isso manterá apenas 1 usuário por email (priorizando Admins e unindo permissões).')) {
   return;
  }
  
  setIsDeduplicating(true);
  try {
   // Chama o método de deduplicação do storage service
   const result = await (window as any).storageService.users.deduplicateByEmail();
   setDeduplicationResult(result);
   setShowDeduplicationModal(true);
   
   console.log('✅ Deduplicação concluída:', result);
  } catch (error) {
   console.error('❌ Erro ao deduplic ar:', error);
   alert('Erro ao remover duplicados. Veja o console para mais detalhes.');
  } finally {
   setIsDeduplicating(false);
  }
 };

 // Execute Actions
 const handleConfirmAction = () => {
  if (!activeUser || !actionType) return;

  if (actionType === 'delete') {
   // Verificar se é o último Admin
   const adminCount = users.filter(u => u.role === 'Admin').length;
   if (activeUser.role === 'Admin' && adminCount <= 1) {
    alert('Não é possível excluir o último Admin do sistema.');
    closeModal();
    return;
   }
   
   // Verificar se está tentando excluir a si mesmo
   if (activeUser.email === currentUserEmail) {
    if (!confirm('Tem certeza que deseja excluir sua própria conta? Você será deslogado.')) {
     closeModal();
     return;
    }
   }
   
   onDeleteUser(activeUser.id);
  } else if (actionType === 'reset_password') {
   if (!resetPasswordValue.trim()) {
    alert("A senha não pode ser vazia.");
    return;
   }
   onUpdateUser({ ...activeUser, password: resetPasswordValue });
  } else if (actionType === 'edit_permissions') {
   if (editModules.length === 0) {
    alert("O usuário deve ter acesso a pelo menos um módulo.");
    return;
   }
   onUpdateUser({ ...activeUser, allowedModules: editModules });
  } else if (actionType === 'edit_avatar') {
   onUpdateUser({ ...activeUser, avatar: avatarUrlValue });
  }
  
  closeModal();
 };

 const closeModal = () => {
  setActiveUser(null);
  setActionType(null);
  setResetPasswordValue('');
  setEditModules([]);
  setAvatarUrlValue('');
 };

 const PermissionOption = ({ 
  module, 
  label, 
  icon, 
  isChecked, 
  onToggle, 
  colorClass 
 }: { 
  module: AppModule, 
  label: string, 
  icon: React.ReactNode, 
  isChecked: boolean, 
  onToggle: () => void, 
  colorClass: string 
 }) => (
  <label className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all">
   <div className="flex items-center gap-2">
    <div className={`p-1.5 rounded-none ${colorClass} bg-opacity-20 text-opacity-100`}>
     {icon}
    </div>
    <span className="text-sm font-medium text-gray-700">{label}</span>
   </div>
   <div className="relative inline-flex items-center cursor-pointer">
    <input 
     type="checkbox" 
     checked={isChecked}
     onChange={onToggle}
     className="sr-only peer"
    />
    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
   </div>
  </label>
 );

 // Filtrar duplicados da listagem (mostra apenas o canônico)
 const displayUsers = useMemo(() => {
  const seen = new Set<string>();
  const filtered: UserWithPassword[] = [];
  
  // Ordena para priorizar Admin e depois por ID (mais antigo primeiro)
  const sorted = [...users].sort((a, b) => {
   // 1. Admin tem prioridade
   if (a.role === 'Admin' && b.role !== 'Admin') return -1;
   if (b.role === 'Admin' && a.role !== 'Admin') return 1;
   // 2. Manter o primeiro documento (por ID)
   return a.id.localeCompare(b.id);
  });
  
  sorted.forEach(user => {
   const normalized = user.email.toLowerCase().trim();
   if (!seen.has(normalized)) {
    seen.add(normalized);
    filtered.push(user);
   }
  });
  
  return filtered;
 }, [users]);

 // Detectar duplicados para exibir aviso
 const duplicateEmails = useMemo(() => {
  const emailCounts = new Map<string, number>();
  users.forEach(u => {
   const normalized = u.email.toLowerCase().trim();
   emailCounts.set(normalized, (emailCounts.get(normalized) || 0) + 1);
  });
  return Array.from(emailCounts.entries()).filter(([_, count]) => count > 1).map(([email]) => email);
 }, [users]);

 return (
  <>
   <div className="space-y-8 relative">
    <div className="flex items-center justify-between mb-6">
     <div className="flex items-center gap-3">
      <div className="bg-brand-100 p-2 rounded-lg text-brand-700">
       <Shield size={24} />
      </div>
      <div>
       <h2 className="text-2xl font-heading font-bold text-gray-900">Gerenciar Acessos</h2>
       <p className="text-gray-500 text-sm">Controle quem tem acesso ao sistema Casapē.</p>
      </div>
     </div>
     
     {/* Bot\u00e3o de Deduplica\u00e7\u00e3o */}
     {duplicateEmails.length > 0 && (
      <button
       onClick={handleDeduplication}
       disabled={isDeduplicating}
       className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
       title="Remover usu\u00e1rios duplicados"
      >
       {isDeduplicating ? (
        <>
         <Loader2 size={16} className="animate-spin" />
         <span className="text-sm font-medium">Processando...</span>
        </>
       ) : (
        <>
         <AlertTriangle size={16} />
         <span className="text-sm font-medium">Corrigir {duplicateEmails.length} email(s) duplicado(s)</span>
        </>
       )}
      </button>
     )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
     {/* Form Section */}
     <div className="lg:col-span-1">
      <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200 sticky top-4">
       <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <UserPlus size={18} /> Novo Usuário
       </h3>
       <form onSubmit={handleSubmit} className="space-y-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
         <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          placeholder="Ex: Ana Silva"
          required
         />
        </div>
        
        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
         <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          placeholder="ana@casape.com"
          required
         />
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
         <input
          type="text"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          placeholder="********"
          required
         />
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Função / Cargo</label>
         <select
          value={newRole}
          onChange={e => setNewRole(e.target.value as any)}
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
         >
          <option value="Guest Relations">Guest Relations</option>
          <option value="Maintenance">Manutenção</option>
          <option value="Admin">Admin</option>
          <option value="Faxineira">Faxineira</option>
          <option value="Administrativo">Administrativo</option>
         </select>
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 mb-2">Permissão de Acesso</label>
         <div className="flex flex-col gap-1 border border-gray-100 rounded-lg p-2 max-h-60 overflow-y-auto">
          <PermissionOption 
            module="maintenance" label="Manutenção" icon={<Wrench size={16}/>} 
            isChecked={selectedModules.includes('maintenance')} onToggle={() => handleModuleToggle('maintenance')} colorClass="text-brand-600 bg-brand-100" 
          />
          <PermissionOption 
            module="concierge" label="Concierge" icon={<Gem size={16}/>} 
            isChecked={selectedModules.includes('concierge')} onToggle={() => handleModuleToggle('concierge')} colorClass="text-purple-600 bg-purple-100" 
          />
          <PermissionOption 
            module="guest" label="Guest & CRM" icon={<Users size={16}/>} 
            isChecked={selectedModules.includes('guest')} onToggle={() => handleModuleToggle('guest')} colorClass="text-blue-600 bg-blue-100" 
          />
          <PermissionOption 
            module="reservations" label="Reservas" icon={<CalendarRange size={16}/>} 
            isChecked={selectedModules.includes('reservations')} onToggle={() => handleModuleToggle('reservations')} colorClass="text-teal-600 bg-teal-100" 
          />
          <PermissionOption 
            module="inventory" label="Inventário" icon={<Box size={16}/>} 
            isChecked={selectedModules.includes('inventory')} onToggle={() => handleModuleToggle('inventory')} colorClass="text-amber-600 bg-amber-100" 
          />
          <PermissionOption 
            module="office" label="Escritório" icon={<Briefcase size={16}/>} 
            isChecked={selectedModules.includes('office')} onToggle={() => handleModuleToggle('office')} colorClass="text-indigo-600 bg-indigo-100" 
          />
          <PermissionOption 
            module="management" label="Gestão (Admin)" icon={<LayoutDashboard size={16}/>} 
            isChecked={selectedModules.includes('management')} onToggle={() => handleModuleToggle('management')} colorClass="text-gray-600 bg-gray-200" 
          />
         </div>
        </div>

        <button
         type="submit"
         className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition-colors mt-2"
        >
         Adicionar Membro
        </button>
       </form>
      </div>
     </div>

     {/* List Section */}
     <div className="lg:col-span-2">
      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
       <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
         <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
          <tr>
           <th className="p-4">Usuário</th>
           <th className="p-4">Função</th>
           <th className="p-4">Acessos</th>
           <th className="p-4 text-right">Ações</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-gray-100">
          {displayUsers.map(user => (
           <tr key={user.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4">
             <div className="flex items-center gap-3">
              {/* Avatar Clickable Area */}
              <div 
               onClick={() => initiateEditAvatar(user)}
               className="relative group cursor-pointer"
               title="Clique para alterar foto"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xs uppercase border border-brand-100">
                   {user.name.slice(0, 2)}
                  </div>
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={14} className="text-white" />
                </div>
              </div>

              <div>
               <span className="block font-medium text-gray-900">{user.name}</span>
               <span className="text-xs text-gray-500">{user.email}</span>
              </div>
             </div>
            </td>
            <td className="p-4">
             <span className={`px-2 py-1 rounded-full text-xs font-semibold
              ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
               user.role === 'Maintenance' ? 'bg-orange-100 text-orange-700' : 
               user.role === 'Guest Relations' ? 'bg-blue-100 text-blue-700' :
               'bg-gray-100 text-gray-700'
              }`}>
              {user.role}
             </span>
            </td>
            <td className="p-4">
             <div className="flex gap-2 flex-wrap max-w-[200px]">
              {user.allowedModules?.includes('maintenance') && (
               <div title="Manutenção" className="w-6 h-6 rounded bg-brand-100 text-brand-700 flex items-center justify-center">
                <Wrench size={12} />
               </div>
              )}
              {user.allowedModules?.includes('concierge') && (
               <div title="Concierge" className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center">
                <Gem size={12} />
               </div>
              )}
              {user.allowedModules?.includes('guest') && (
               <div title="Guest" className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users size={12} />
               </div>
              )}
              {user.allowedModules?.includes('reservations') && (
               <div title="Reservas" className="w-6 h-6 rounded bg-teal-100 text-teal-700 flex items-center justify-center">
                <CalendarRange size={12} />
               </div>
              )}
              {user.allowedModules?.includes('inventory') && (
               <div title="Inventário" className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center">
                <Box size={12} />
               </div>
              )}
              {user.allowedModules?.includes('office') && (
               <div title="Escritório" className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Briefcase size={12} />
               </div>
              )}
              {user.allowedModules?.includes('management') && (
               <div title="Gestão" className="w-6 h-6 rounded bg-gray-200 text-gray-700 flex items-center justify-center">
                <LayoutDashboard size={12} />
               </div>
              )}
              {(!user.allowedModules || user.allowedModules.length === 0) && (
               <span className="text-xs text-gray-400">Padrão</span>
              )}
             </div>
            </td>
            <td className="p-4 text-right">
             <div className="flex justify-end gap-2">
               <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); initiateEditPermissions(user); }}
                className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors cursor-pointer"
                title="Editar Permissões"
               >
                <UserCog size={18} />
               </button>

               <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); initiatePasswordReset(user); }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                title="Resetar Senha"
               >
                <KeyRound size={18} />
               </button>
              
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); initiateDelete(user); }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                title="Remover acesso"
               >
                <Trash2 size={18} />
               </button>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>
     </div>
    </div>
   </div>

   {/* Action Modal */}
   {activeUser && actionType && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
     <div className="bg-white rounded-none shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
      <button 
       onClick={closeModal}
       className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
      >
       <X size={20} />
      </button>

      {actionType === 'delete' ? (
       <div className="text-center pt-2">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 border border-red-100">
         <AlertTriangle size={28} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Usuário</h3>
        <p className="text-gray-600 mb-8">
         Tem certeza que deseja remover o acesso de <strong className="text-gray-900">{activeUser.name}</strong>?<br/>Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-center">
         <button
          onClick={closeModal}
          className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
         >
          Cancelar
         </button>
         <button
          onClick={handleConfirmAction}
          className="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors shadow-sm"
         >
          Sim, Excluir
         </button>
        </div>
       </div>
      ) : actionType === 'reset_password' ? (
       <div className="pt-2">
        <div className="flex items-center gap-3 mb-6">
         <div className="bg-blue-100 p-2.5 rounded-lg text-blue-700">
          <KeyRound size={24} />
         </div>
         <div>
          <h3 className="text-lg font-bold text-gray-900">Alterar Senha</h3>
          <p className="text-sm text-gray-500">Defina uma nova credencial.</p>
         </div>
        </div>
        
        <div className="mb-8">
         <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha para {activeUser.name}</label>
         <input 
          type="text" 
          value={resetPasswordValue}
          onChange={(e) => setResetPasswordValue(e.target.value)}
          className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-lg"
          placeholder="Digite a nova senha..."
          autoFocus
         />
        </div>

        <div className="flex gap-3 justify-end">
         <button
          onClick={closeModal}
          className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
         >
          Cancelar
         </button>
         <button
          onClick={handleConfirmAction}
          className="px-5 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
         >
          <Check size={18} /> Salvar Senha
         </button>
        </div>
       </div>
      ) : actionType === 'edit_avatar' ? (
       // Edit Avatar Mode
       <div className="pt-2">
        <div className="flex items-center gap-3 mb-6">
         <div className="bg-green-100 p-2.5 rounded-lg text-green-700">
          <ImageIcon size={24} />
         </div>
         <div>
          <h3 className="text-lg font-bold text-gray-900">Foto de Perfil</h3>
          <p className="text-sm text-gray-500">Atualize o avatar de {activeUser.name}.</p>
         </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-50 mb-4 shadow-sm">
           {avatarUrlValue ? (
            <img src={avatarUrlValue} alt="Preview" className="w-full h-full object-cover" />
           ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold font-heading text-2xl uppercase">
             {activeUser.name.slice(0, 2)}
            </div>
           )}
          </div>
          <p className="text-xs text-gray-500">Pré-visualização</p>
        </div>
        
        <div className="mb-8">
         <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
         <input 
          type="text" 
          value={avatarUrlValue}
          onChange={(e) => setAvatarUrlValue(e.target.value)}
          className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
          placeholder="https://..."
          autoFocus
         />
         <p className="text-xs text-gray-400 mt-2">Cole o link direto de uma imagem.</p>
        </div>

        <div className="flex gap-3 justify-end">
         <button
          onClick={closeModal}
          className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
         >
          Cancelar
         </button>
         <button
          onClick={handleConfirmAction}
          className="px-5 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
         >
          <Check size={18} /> Salvar Foto
         </button>
        </div>
       </div>
      ) : (
       // Edit Permissions Mode
       <div className="pt-2">
        <div className="flex items-center gap-3 mb-6">
         <div className="bg-brand-100 p-2.5 rounded-lg text-brand-700">
          <UserCog size={24} />
         </div>
         <div>
          <h3 className="text-lg font-bold text-gray-900">Permissões de Acesso</h3>
          <p className="text-sm text-gray-500">Defina os módulos que {activeUser.name} pode acessar.</p>
         </div>
        </div>
        
        <div className="mb-8 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <PermissionOption 
            module="maintenance" label="Manutenção" icon={<Wrench size={20}/>} 
            isChecked={editModules.includes('maintenance')} onToggle={() => handleEditModuleToggle('maintenance')} colorClass="text-brand-600 bg-brand-100" 
          />
          <PermissionOption 
            module="concierge" label="Concierge" icon={<Gem size={20}/>} 
            isChecked={editModules.includes('concierge')} onToggle={() => handleEditModuleToggle('concierge')} colorClass="text-purple-600 bg-purple-100" 
          />
          <PermissionOption 
            module="guest" label="Guest & CRM" icon={<Users size={20}/>} 
            isChecked={editModules.includes('guest')} onToggle={() => handleEditModuleToggle('guest')} colorClass="text-blue-600 bg-blue-100" 
          />
          <PermissionOption 
            module="reservations" label="Reservas" icon={<CalendarRange size={20}/>} 
            isChecked={editModules.includes('reservations')} onToggle={() => handleEditModuleToggle('reservations')} colorClass="text-teal-600 bg-teal-100" 
          />
          <PermissionOption 
            module="inventory" label="Inventário" icon={<Box size={20}/>} 
            isChecked={editModules.includes('inventory')} onToggle={() => handleEditModuleToggle('inventory')} colorClass="text-amber-600 bg-amber-100" 
          />
          <PermissionOption 
            module="office" label="Escritório" icon={<Briefcase size={20}/>} 
            isChecked={editModules.includes('office')} onToggle={() => handleEditModuleToggle('office')} colorClass="text-indigo-600 bg-indigo-100" 
          />
          <PermissionOption 
            module="management" label="Gestão (Admin)" icon={<LayoutDashboard size={20}/>} 
            isChecked={editModules.includes('management')} onToggle={() => handleEditModuleToggle('management')} colorClass="text-gray-600 bg-gray-200" 
          />
        </div>

        <div className="flex gap-3 justify-end">
         <button
          onClick={closeModal}
          className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
         >
          Cancelar
         </button>
         <button
          onClick={handleConfirmAction}
          className="px-5 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
         >
          <Check size={18} /> Salvar Permissões
         </button>
        </div>
       </div>
      )}
     </div>
    </div>
   )}

   {/* Modal de Resultado de Deduplicação */}
   {showDeduplicationModal && deduplicationResult && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
     <div className="bg-white rounded-none shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
      <button
       onClick={() => setShowDeduplicationModal(false)}
       className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
       <X size={20} />
      </button>

      <div className="flex items-center gap-3 mb-6">
       <div className="bg-green-100 p-2.5 rounded-lg text-green-700">
        <Check size={24} />
       </div>
       <div>
        <h3 className="text-lg font-bold text-gray-900">Deduplicação Concluída</h3>
        <p className="text-sm text-gray-500">Usuários duplicados foram removidos com sucesso.</p>
       </div>
      </div>

      <div className="space-y-4 mb-6">
       <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
         <span className="text-sm font-medium text-gray-600">Duplicados Removidos:</span>
         <span className="text-lg font-bold text-red-600">{deduplicationResult.removed}</span>
        </div>
        <div className="flex justify-between items-center">
         <span className="text-sm font-medium text-gray-600">Usuários Únicos Mantidos:</span>
         <span className="text-lg font-bold text-green-600">{deduplicationResult.kept}</span>
        </div>
       </div>

       {deduplicationResult.details.length > 0 && (
        <div className="max-h-60 overflow-y-auto">
         <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Detalhes:</p>
         <div className="space-y-2">
          {deduplicationResult.details.map((detail, idx) => (
           <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <span className="font-medium text-gray-800">{detail.email}</span>
            <span className="text-gray-600"> - removidos {detail.duplicates} duplicado(s)</span>
           </div>
          ))}
         </div>
        </div>
       )}
      </div>

      <button
       onClick={() => setShowDeduplicationModal(false)}
       className="w-full px-5 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-medium transition-colors shadow-sm"
      >
       Fechar
      </button>
     </div>
    </div>
   )}
  </>
 );
};

export default AdminPanel;
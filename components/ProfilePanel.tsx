
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Lock, Check, AlertTriangle, Bell, Volume2, Image as ImageIcon } from 'lucide-react';

interface ProfilePanelProps {
 user: User;
 onUpdatePassword: (currentPass: string, newPass: string) => Promise<boolean>;
 onUpdatePreferences: (updatedUser: User) => void;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ user, onUpdatePassword, onUpdatePreferences }) => {
 const [currentPassword, setCurrentPassword] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 
 // Profile Info
 const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');

 // Notification State
 const [notifyNewTicket, setNotifyNewTicket] = useState(true);
 const [notifyAssignment, setNotifyAssignment] = useState(true);
 
 const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
 const [prefMessage, setPrefMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
 const [loading, setLoading] = useState(false);

 // Load initial preferences
 useEffect(() => {
  if (user.notificationPreferences) {
   setNotifyNewTicket(user.notificationPreferences.newTicket);
   setNotifyAssignment(user.notificationPreferences.assignment);
  }
  setAvatarUrl(user.avatar || '');
 }, [user]);

 const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage(null);

  if (newPassword !== confirmPassword) {
   setMessage({ type: 'error', text: 'As novas senhas não conferem.' });
   return;
  }

  if (newPassword.length < 3) {
   setMessage({ type: 'error', text: 'A nova senha é muito curta.' });
   return;
  }

  setLoading(true);
  try {
   const success = await onUpdatePassword(currentPassword, newPassword);
   if (success) {
    setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
   } else {
    setMessage({ type: 'error', text: 'Senha atual incorreta.' });
   }
  } catch (e) {
   setMessage({ type: 'error', text: 'Erro ao atualizar senha.' });
  } finally {
   setLoading(false);
  }
 };

 const handlePreferencesSave = () => {
  const updatedUser: User = {
   ...user,
   avatar: avatarUrl,
   notificationPreferences: {
    newTicket: notifyNewTicket,
    assignment: notifyAssignment
   }
  };
  onUpdatePreferences(updatedUser);
  setPrefMessage({ type: 'success', text: 'Perfil e Preferências salvos.' });
  setTimeout(() => setPrefMessage(null), 3000);
 };

 return (
  <div className="max-w-2xl mx-auto space-y-6">
   <div className="flex items-center gap-3 mb-6">
    <div className="bg-brand-100 p-2 rounded-lg text-brand-700">
     <Lock size={24} />
    </div>
    <div>
     <h2 className="text-2xl font-heading font-bold text-gray-900">Meu Perfil</h2>
     <p className="text-gray-500 text-sm">Gerencie suas credenciais, foto e preferências.</p>
    </div>
   </div>

   <div className="bg-white rounded-none shadow-sm border border-gray-200 p-8">
    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
     {user.avatar ? (
       <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border border-gray-200" />
     ) : (
       <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold font-heading text-2xl uppercase">
        {user.name.slice(0, 2)}
       </div>
     )}
     <div className="flex-1">
      <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
      <p className="text-gray-500">{user.email}</p>
      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
       {user.role}
      </span>
     </div>
    </div>
    
    {/* PUBLIC PROFILE INFO */}
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
       <ImageIcon className="text-brand-600" size={20} />
       <h3 className="text-lg font-semibold text-gray-800">Foto de Perfil</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-6">
       <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
       <input 
        type="text"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        placeholder="https://exemplo.com/minha-foto.jpg"
       />
       <p className="text-xs text-gray-400 mt-1">Cole o link de uma imagem hospedada na web.</p>
      </div>
    </div>

    {/* NOTIFICATIONS SECTION */}
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
       <Bell className="text-brand-600" size={20} />
       <h3 className="text-lg font-semibold text-gray-800">Notificações e Alertas</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-4">
       <div className="flex items-center justify-between">
         <div>
          <p className="text-sm font-medium text-gray-900">Novos Chamados Gerais</p>
          <p className="text-xs text-gray-500">Receber alerta sonoro e visual quando qualquer chamado for aberto.</p>
         </div>
         <label className="relative inline-flex items-center cursor-pointer">
          <input 
           type="checkbox" 
           className="sr-only peer"
           checked={notifyNewTicket}
           onChange={(e) => setNotifyNewTicket(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
         </label>
       </div>

       <div className="flex items-center justify-between pt-4 border-t border-gray-200">
         <div>
          <p className="text-sm font-medium text-gray-900">Atribuição de Chamado</p>
          <p className="text-xs text-gray-500">Receber alerta quando eu for definido como responsável.</p>
         </div>
         <label className="relative inline-flex items-center cursor-pointer">
          <input 
           type="checkbox" 
           className="sr-only peer"
           checked={notifyAssignment}
           onChange={(e) => setNotifyAssignment(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
         </label>
       </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
       <div className="flex items-center gap-2 text-xs text-gray-400">
         <Volume2 size={14} />
         <span>Os alertas incluem aviso sonoro.</span>
       </div>
       <button 
         onClick={handlePreferencesSave}
         className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
       >
        Salvar Alterações
       </button>
      </div>
      
      {prefMessage && (
      <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in ${prefMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
       <Check size={16} />
       {prefMessage.text}
      </div>
      )}
    </div>

    <hr className="border-gray-100 mb-8" />

    {/* PASSWORD SECTION */}
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Alterar Senha</h3>
    
    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
      <input 
       type="password"
       value={currentPassword}
       onChange={(e) => setCurrentPassword(e.target.value)}
       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
       required
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
      <input 
       type="password"
       value={newPassword}
       onChange={(e) => setNewPassword(e.target.value)}
       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
       required
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Confirme a Nova Senha</label>
      <input 
       type="password"
       value={confirmPassword}
       onChange={(e) => setConfirmPassword(e.target.value)}
       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
       required
      />
     </div>

     {message && (
      <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
       {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
       {message.text}
      </div>
     )}

     <button 
      type="submit" 
      disabled={loading}
      className="w-full bg-brand-600 text-white font-medium py-3 rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-70"
     >
      {loading ? 'Atualizando...' : 'Atualizar Senha'}
     </button>
    </form>
   </div>
  </div>
 );
};

export default ProfilePanel;

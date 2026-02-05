import React, { useEffect } from 'react';
import { Bell, Trash2, X } from 'lucide-react';

export interface SystemNotification {
 id: string;
 title: string;
 message: string;
 type: 'info' | 'success' | 'warning' | 'error';
 timestamp: number;
 read: boolean;
}

interface NotificationCenterProps {
 notifications: SystemNotification[];
 showNotifications: boolean;
 onToggle: () => void;
 onMarkAllRead: () => void;
 onClear: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
 notifications,
 showNotifications,
 onToggle,
 onMarkAllRead,
 onClear,
}) => {
 const unreadCount = notifications.filter(n => !n.read).length;

 // Prevenir scroll do body quando painel aberto no mobile
 useEffect(() => {
  if (showNotifications && window.innerWidth < 768) {
   document.body.style.overflow = 'hidden';
   return () => {
    document.body.style.overflow = '';
   };
  }
 }, [showNotifications]);

 return (
  <div className="relative">
   <button
    onClick={onToggle}
    className={`p-2 transition-colors rounded-full hover:bg-gray-100 ${showNotifications ? 'bg-brand-50 text-brand-600' : 'text-gray-400'}`}
   >
    <Bell size={20} />
    {unreadCount > 0 && (
     <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
    )}
   </button>

   {/* Mobile: Full-screen drawer */}
   {showNotifications && (
    <>
     {/* Backdrop (mobile only) */}
     <div 
      className="fixed inset-0 bg-black/50 z-[9998] md:hidden animate-in fade-in"
      onClick={onToggle}
     />

     {/* Panel */}
     <div className={`
      fixed md:absolute
      inset-0 md:inset-auto
      md:right-0 md:top-full md:mt-2
      w-full md:w-80
      bg-white
      md:rounded-lg md:shadow-xl md:border md:border-gray-100
      z-[9999]
      flex flex-col
      animate-in slide-in-from-bottom md:slide-in-from-top-2 md:fade-in
     `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
       <span className="text-sm font-bold text-gray-700 uppercase">Notificações</span>
       <div className="flex items-center gap-3">
        <button 
         onClick={onMarkAllRead} 
         className="text-xs font-medium text-blue-600 hover:underline"
        >
         Marcar como lida
        </button>
        <button 
         onClick={onClear} 
         className="text-gray-400 hover:text-red-500 transition-colors"
         title="Limpar notificações"
        >
         <Trash2 size={16}/>
        </button>
        {/* Close button (mobile only) */}
        <button
         onClick={onToggle}
         className="p-1 text-gray-500 transition-colors rounded-lg md:hidden hover:bg-gray-100"
        >
         <X size={20} />
        </button>
       </div>
      </div>

      {/* Content with scroll */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
       <div 
        className="min-h-0"
        style={{
         paddingBottom: 'env(safe-area-inset-bottom)',
        }}
       >
        {notifications.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
          <Bell size={32} className="mb-3 opacity-20"/>
          <p className="text-sm">Nenhuma notificação nova</p>
         </div>
        ) : (
         notifications.map(n => (
          <div
           key={n.id}
           className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors relative ${!n.read ? 'bg-blue-50/30' : ''}`}
          >
           {!n.read && (
            <div className="absolute left-3 top-5 w-2 h-2 rounded-full bg-blue-500"></div>
           )}
           <div className="pl-4">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{n.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
            <p className="text-[10px] text-gray-400 mt-2 text-right">
             {new Date(n.timestamp).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
             })}
            </p>
           </div>
          </div>
         ))
        )}
       </div>
      </div>
     </div>
    </>
   )}
  </div>
 );
};

export default NotificationCenter;

import React from 'react';
import { Bell, Trash2 } from 'lucide-react';

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

   {/* Dropdown */}
   {showNotifications && (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-none shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
     <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
      <span className="text-xs font-bold text-gray-500 uppercase">Notificações</span>
      <div className="flex gap-2">
       <button onClick={onMarkAllRead} className="text-xs text-blue-600 hover:underline">
        Lida
       </button>
       <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">
        <Trash2 size={14}/>
       </button>
      </div>
     </div>
     <div className="max-h-80 overflow-y-auto">
      {notifications.length === 0 ? (
       <div className="p-8 text-center text-gray-400 text-xs">
        <Bell size={24} className="mx-auto mb-2 opacity-20"/>
        Nenhuma notificação nova.
       </div>
      ) : (
       notifications.map(n => (
        <div
         key={n.id}
         className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors relative ${!n.read ? 'bg-blue-50/30' : ''}`}
        >
         {!n.read && (
          <div className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
         )}
         <div className="pl-3">
          <p className="text-sm font-bold text-gray-800">{n.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
          <p className="text-[10px] text-gray-400 mt-1 text-right">
           {new Date(n.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </p>
         </div>
        </div>
       ))
      )}
     </div>
    </div>
   )}
  </div>
 );
};

export default NotificationCenter;

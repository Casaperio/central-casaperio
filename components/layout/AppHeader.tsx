import React from 'react';
import { Plus, Search, Menu, Loader2, PhoneCall, CalendarClock, LayoutGrid, List, Calendar, Wrench } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import type { AppModule, CallSession, ViewMode } from '../../types';
import type { SystemNotification } from './NotificationCenter';

interface AppHeaderProps {
 searchTerm: string;
 setSearchTerm: (term: string) => void;
 mobileMenuOpen: boolean;
 setMobileMenuOpen: (open: boolean) => void;
 activeModule: AppModule | null;
 viewMode: ViewMode;
 setViewMode: (mode: ViewMode) => void;
 kioskProperty: string | null;
 incomingCalls: CallSession[];
 setActiveCall: (call: CallSession | null) => void;
 isGlobalLoading: boolean;
 notifications: SystemNotification[];
 showNotifications: boolean;
 toggleNotifications: () => void;
 markAllRead: () => void;
 clearNotifications: () => void;
 ticketFormMode: 'corrective' | 'preventive';
 setTicketFormMode: (mode: 'corrective' | 'preventive') => void;
 setShowTicketForm: (show: boolean) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
 searchTerm,
 setSearchTerm,
 setMobileMenuOpen,
 activeModule,
 viewMode,
 setViewMode,
 kioskProperty,
 incomingCalls,
 setActiveCall,
 isGlobalLoading,
 notifications,
 showNotifications,
 toggleNotifications,
 markAllRead,
 clearNotifications,
 ticketFormMode,
 setTicketFormMode,
 setShowTicketForm,
}) => {
 const showSearch = viewMode !== 'inventory' &&
           viewMode !== 'office' &&
           viewMode !== 'general-calendar' &&
           viewMode !== 'properties' &&
           viewMode !== 'financial' &&
           viewMode !== 'concierge-cms' &&
           viewMode !== 'guest-crm' &&
           viewMode !== 'map' &&
           viewMode !== 'boards' &&
           viewMode !== 'messages';

 const getSearchPlaceholder = () => {
  if (activeModule === 'maintenance') return 'Buscar em Chamados...';
  if (activeModule === 'concierge') return 'Buscar em Concierge...';
  return 'Buscar em Reservas...';
 };

 return (
  <>
   <header className="z-10 flex items-center justify-between flex-shrink-0 h-16 px-4 bg-white border-b border-gray-200 shadow-sm md:px-6">
    <div className="flex items-center flex-1 gap-4">
     <button
      onClick={() => setMobileMenuOpen(true)}
      className="p-2 -ml-2 text-gray-600 rounded-lg md:hidden hover:bg-gray-100"
     >
      <Menu size={24} />
     </button>

     {showSearch && (
      <div className="relative w-full max-w-xs md:max-w-md">
       <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
       <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={getSearchPlaceholder()}
        className="w-full py-2 pl-10 pr-4 text-sm transition-all border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-brand-500 focus:outline-none focus:bg-white"
       />
      </div>
     )}
    </div>

    <div className="flex items-center gap-2 md:gap-4">
     {/* Incoming Call Notification (Staff Only) */}
     {!kioskProperty && incomingCalls.length > 0 && (
      <button
       onClick={() => setActiveCall(incomingCalls[0])}
       className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-full animate-bounce shadow-lg"
      >
       <PhoneCall size={16} />
       <span className="hidden text-xs font-bold uppercase md:inline">Recebendo Chamada...</span>
      </button>
     )}

     {isGlobalLoading && (
      <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100 rounded-full bg-blue-50 animate-pulse">
       <Loader2 size={12} className="animate-spin" />
       <span className="hidden md:inline">Atualizando dados...</span>
       <span className="md:hidden">Atualizando...</span>
      </div>
     )}

     {/* Notification Center */}
     <NotificationCenter
      notifications={notifications}
      showNotifications={showNotifications}
      onToggle={toggleNotifications}
      onMarkAllRead={markAllRead}
      onClear={clearNotifications}
     />

     {/* Action buttons (Add Ticket etc) */}
     {activeModule === 'maintenance' && (
       <button
        onClick={() => {
         setTicketFormMode('corrective');
         setShowTicketForm(true);
        }}
        className="items-center hidden gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm md:flex bg-brand-600 hover:bg-brand-700"
       >
        <Plus size={18} /> Chamado
       </button>
     )}

     {/* Concierge - Add new request button */}
     {activeModule === 'concierge' && (
      <button
       onClick={() => {
        setTicketFormMode('corrective');
        setShowTicketForm(true);
       }}
       className="items-center hidden gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg shadow-sm md:flex bg-purple-600 hover:bg-purple-700"
      >
       <Plus size={18} /> Nova Solicitação
      </button>
     )}

     {/* View toggle for Guest module */}
     {activeModule === 'guest' && (viewMode === 'cards' || viewMode === 'list' || viewMode === 'calendar') && (
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
       <button
        onClick={() => setViewMode('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
         viewMode === 'cards'
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
        }`}
       >
        <LayoutGrid size={16} />
        <span className="hidden md:inline">Cards</span>
       </button>
       <button
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
         viewMode === 'list'
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
        }`}
       >
        <List size={16} />
        <span className="hidden md:inline">Lista</span>
       </button>
       <button
        onClick={() => setViewMode('calendar')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
         viewMode === 'calendar'
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
        }`}
       >
        <Calendar size={16} />
        <span className="hidden md:inline">Calendário</span>
       </button>
      </div>
     )}

     {/* View toggle for Maintenance and Concierge modules */}
     {(activeModule === 'maintenance' || activeModule === 'concierge') && (viewMode === 'cards' || viewMode === 'list' || viewMode === 'calendar') && (
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
       <button
        onClick={() => setViewMode('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
         viewMode === 'cards'
          ? 'bg-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
        }`}
        style={viewMode === 'cards' ? { color: '#024F6C' } : {}}
       >
        <LayoutGrid size={16} />
        <span className="hidden md:inline">Cards</span>
       </button>
       <button
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
         viewMode === 'list'
          ? 'bg-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
        }`}
        style={viewMode === 'list' ? { color: '#024F6C' } : {}}
       >
        <List size={16} />
        <span className="hidden md:inline">Lista</span>
       </button>
       <button
        onClick={() => setViewMode('calendar')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
         viewMode === 'calendar'
          ? 'bg-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
        }`}
        style={viewMode === 'calendar' ? { color: '#024F6C' } : {}}
       >
        <Calendar size={16} />
        <span className="hidden md:inline">Calendário</span>
       </button>
      </div>
     )}
    </div>
   </header>

   {/* Task 35: FAB (Floating Action Button) for mobile - Maintenance module */}
   {activeModule === 'maintenance' && (
    <button
     onClick={() => {
      setTicketFormMode('corrective');
      setShowTicketForm(true);
     }}
     className="fixed z-50 flex items-center justify-center w-14 h-14 text-white rounded-full shadow-lg bottom-6 right-6 md:hidden bg-brand-600 hover:bg-brand-700 active:scale-95 transition-transform"
     aria-label="Novo Chamado"
    >
     <Plus size={24} />
    </button>
   )}

   {/* Task 35: FAB for mobile - Concierge module */}
   {activeModule === 'concierge' && (
    <button
     onClick={() => {
      setTicketFormMode('corrective');
      setShowTicketForm(true);
     }}
     className="fixed z-50 flex items-center justify-center w-14 h-14 text-white rounded-full shadow-lg bottom-6 right-6 md:hidden bg-purple-600 hover:bg-purple-700 active:scale-95 transition-transform"
     aria-label="Nova Solicitação"
    >
     <Plus size={24} />
    </button>
   )}
  </>
 );
};

export default AppHeader;

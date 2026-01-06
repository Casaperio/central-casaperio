import React from 'react';
import {
 Wrench, Shield, CalendarRange, Inbox, Smartphone, Kanban, Target,
 Building2, Map, Plane, Box, Briefcase, PieChart, FileText, BookOpen,
 Tag, MessageSquare, DollarSign, Settings, ScrollText, ChevronRight,
 LogOut as LogOutIcon, Gem
} from 'lucide-react';
import type { User, AppModule, ViewMode } from '../../types';

interface AppSidebarProps {
 currentUser: User;
 activeModule: AppModule | null;
 viewMode: ViewMode;
 sidebarOpen: boolean;
 mobileMenuOpen: boolean;
 onModuleChange: (module: AppModule, view: ViewMode) => void;
 onViewModeChange: (view: ViewMode) => void;
 onToggleSidebar: () => void;
 onCloseMobileMenu: () => void;
 onLogout: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
 currentUser,
 activeModule,
 viewMode,
 sidebarOpen,
 mobileMenuOpen,
 onModuleChange,
 onViewModeChange,
 onToggleSidebar,
 onCloseMobileMenu,
 onLogout,
}) => {
 const handleModuleClick = (module: AppModule, view: ViewMode) => {
  onModuleChange(module, view);
  onCloseMobileMenu();
 };

 const handleViewClick = (view: ViewMode) => {
  onViewModeChange(view);
  onCloseMobileMenu();
 };

 return (
  <>
   <div className="relative flex items-center bg-[#024F6C] justify-center h-20 bg-white border-b border-gray-100">
    <img src="/images/logo.png" alt="Casapē Logo" className='w-36 mb-3' />
    {/* Collapse Button (Desktop Only) */}
    <button
     onClick={onToggleSidebar}
     className="absolute z-30 hidden p-1 text-gray-400 bg-white border border-gray-200 rounded-full shadow-sm md:block -right-3 top-6 hover:text-brand-600"
    >
     <ChevronRight size={14} className={`transform transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
    </button>
   </div>

   <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto bg-white">
    {/* Main Module Nav */}
    <div className="mb-6">
     <p className={`px-3 text-xs font-semibold text-gray-400 uppercase mb-2 ${!sidebarOpen && 'md:hidden'}`}>
      Módulo Principal
     </p>
     <button
      onClick={() => handleModuleClick('maintenance', 'cards')}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeModule === 'maintenance' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
     >
      <Wrench size={20} />
      {(sidebarOpen || mobileMenuOpen) && <span>Manutenção</span>}
     </button>
     {(!currentUser.allowedModules || currentUser.allowedModules.includes('concierge') || currentUser.role === 'Admin') && (
      <button
       onClick={() => handleModuleClick('concierge', 'cards')}
       className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeModule === 'concierge' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
      >
       <Gem size={20} />
       {(sidebarOpen || mobileMenuOpen) && <span>Concierge</span>}
      </button>
     )}
     <button
      onClick={() => handleModuleClick('guest', 'cards')}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeModule === 'guest' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
     >
      <Shield size={20} />
      {(sidebarOpen || mobileMenuOpen) && <span>Guest & CRM</span>}
     </button>
     {(!currentUser.allowedModules || currentUser.allowedModules.includes('reservations') || currentUser.role === 'Admin') && (
      <button
       onClick={() => handleModuleClick('reservations', 'general-calendar')}
       className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeModule === 'reservations' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
      >
       <CalendarRange size={20} />
       {(sidebarOpen || mobileMenuOpen) && <span>Reservas</span>}
      </button>
     )}
    </div>

    {/* Tools */}
    <div className="mb-6">
     <p className={`px-3 text-xs font-semibold text-gray-400 uppercase mb-2 ${!sidebarOpen && 'md:hidden'}`}>
      Ferramentas
     </p>
     <button onClick={() => handleViewClick('messages')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'messages' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Inbox size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Mensagens</span>}
     </button>
     <button onClick={() => handleViewClick('boards')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'boards' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Kanban size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Painéis & Fluxos</span>}
     </button>
     <button onClick={() => handleViewClick('guest-crm')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'guest-crm' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Target size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>CRM & Ciclo</span>}
     </button>
     <button onClick={() => handleViewClick('properties')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'properties' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Building2 size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Imóveis</span>}
     </button>
     <button onClick={() => handleViewClick('map')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Map size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Mapa</span>}
     </button>
     <button onClick={() => handleViewClick('flights')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'flights' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Plane size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Voos</span>}
     </button>
     {(!currentUser.allowedModules || currentUser.allowedModules.includes('inventory') || currentUser.role === 'Admin') && (
      <button
       onClick={() => handleModuleClick('inventory', 'inventory')}
       className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'inventory' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
      >
       <Box size={20} />
       {(sidebarOpen || mobileMenuOpen) && <span>Inventário</span>}
      </button>
     )}
     {(!currentUser.allowedModules || currentUser.allowedModules.includes('office') || currentUser.role === 'Admin') && (
      <button
       onClick={() => handleModuleClick('office', 'office')}
       className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'office' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
      >
       <Briefcase size={20} />
       {(sidebarOpen || mobileMenuOpen) && <span>Escritório</span>}
      </button>
     )}
     <button onClick={() => handleViewClick('stats')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'stats' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <PieChart size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Estatísticas</span>}
     </button>
     <button onClick={() => handleViewClick('reports')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'reports' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <FileText size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Relatórios</span>}
     </button>
     <button onClick={() => handleViewClick('cms')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'cms' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <BookOpen size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>CMS Tablet</span>}
     </button>
     <button onClick={() => handleViewClick('concierge-cms')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'concierge-cms' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Tag size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Gestão Ofertas</span>}
     </button>
     <button onClick={() => handleViewClick('feedbacks')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'feedbacks' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
      <MessageSquare size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Avaliações</span>}
     </button>
    </div>

    {/* Admin / Management */}
    {(currentUser.role === 'Admin' || currentUser.allowedModules?.includes('management')) && (
     <div>
      <p className={`px-3 text-xs font-semibold text-gray-400 uppercase mb-2 ${!sidebarOpen && 'md:hidden'}`}>
       Gestão
      </p>
      <button onClick={() => handleViewClick('financial')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'financial' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
       <DollarSign size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Financeiro</span>}
      </button>
      <button onClick={() => handleViewClick('admin')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'admin' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
       <Shield size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Acessos</span>}
      </button>
      <button onClick={() => handleViewClick('logs')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'logs' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
       <ScrollText size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Logs</span>}
      </button>
      <button onClick={() => handleViewClick('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${viewMode === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
       <Settings size={20} /> {(sidebarOpen || mobileMenuOpen) && <span>Configurações</span>}
      </button>
     </div>
    )}
   </nav>

   <div className="p-4 bg-white border-t border-gray-200">
    <div className={`flex items-center gap-3 ${!sidebarOpen && !mobileMenuOpen && 'justify-center'}`}>
     <button onClick={() => handleViewClick('profile')} className="relative shrink-0">
      {currentUser.avatar ? (
       <img src={currentUser.avatar} alt="Profile" className="object-cover border border-gray-200 rounded-full w-9 h-9" />
      ) : (
       <div className="flex items-center justify-center text-xs font-bold rounded-full w-9 h-9 bg-brand-100 text-brand-700">
        {currentUser.name.slice(0, 2)}
       </div>
      )}
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
     </button>

     {(sidebarOpen || mobileMenuOpen) && (
      <div className="flex-1 min-w-0">
       <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
       <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
      </div>
     )}

     {(sidebarOpen || mobileMenuOpen) && (
      <button onClick={onLogout} className="text-gray-400 hover:text-red-500">
       <LogOutIcon size={18} />
      </button>
     )}
    </div>
   </div>
  </>
 );
};

export default AppSidebar;

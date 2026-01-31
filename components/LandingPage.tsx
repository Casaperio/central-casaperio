import React from 'react';
import { Wrench, Users, ArrowRight, Home, Tablet, Box, Briefcase, CalendarRange, Gem, Smartphone } from 'lucide-react';
import { User } from '../types';

interface LandingPageProps {
 user: User;
 onSelectModule: (module: 'maintenance' | 'concierge' | 'guest' | 'reservations' | 'inventory' | 'office' | 'kiosk' | 'field_app') => void;
 onLogout: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, onSelectModule, onLogout }) => {
 // Check user permissions. If undefined (legacy users), allow both for safety or default to all.
 const canAccessMaintenance = !user.allowedModules || user.allowedModules.includes('maintenance');
 const canAccessConcierge = !user.allowedModules || user.allowedModules.includes('concierge');
 const canAccessGuest = !user.allowedModules || user.allowedModules.includes('guest');
 const canAccessReservations = !user.allowedModules || user.allowedModules.includes('reservations');
 const canAccessInventory = !user.allowedModules || user.allowedModules.includes('inventory');
 const canAccessOffice = !user.allowedModules || user.allowedModules.includes('office');
 
 // Field App access is implied for Maintenance and Cleaners
 const canAccessFieldApp = user.role === 'Maintenance' || user.role === 'Limpeza' || user.role === 'Admin';

 return (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
   <div className="max-w-6xl w-full">
    <div className="text-center mb-12">
     <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 text-white mb-6 shadow-lg shadow-primary-600/20">
      <Home size={32} />
     </div>
     <h1 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-3">Bem-vindo, {user.name.split(' ')[0]}</h1>
     <p className="text-gray-500 text-lg">Selecione o módulo que deseja acessar hoje.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mx-auto">
     {/* Field App Module (Special Highlight for Field Staff) */}
     {canAccessFieldApp && (
      <button
       onClick={() => onSelectModule('field_app')}
       className="group relative bg-white p-8 rounded-none shadow-md border-2 border-green-100 hover:border-green-400 hover:shadow-xl transition-all duration-300 text-left flex flex-col overflow-hidden ring-4 ring-transparent hover:ring-green-50"
      >
       <div className="absolute top-0 right-0 p-32 bg-green-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>

       <div className="relative z-10">
        <div className="w-14 h-14 bg-green-100 rounded-none flex items-center justify-center text-green-700 mb-6 group-hover:scale-110 transition-transform duration-300">
         <Smartphone size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold font-heading text-gray-900 mb-2">App de Campo</h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
         Interface simplificada para técnicos e faxineiras em serviço externo.
        </p>
        <div className="flex items-center text-green-700 font-bold group-hover:gap-2 transition-all mt-auto">
         Entrar no Modo Campo <ArrowRight size={20} className="ml-2" />
        </div>
       </div>
      </button>
     )}

     {/* Maintenance Module */}
     {canAccessMaintenance && (
      <button
       onClick={() => onSelectModule('maintenance')}
       className="group relative bg-white p-8 rounded-none shadow-sm border border-gray-200 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-600/5 transition-all duration-300 text-left flex flex-col overflow-hidden"
      >
       <div className="absolute top-0 right-0 p-32 bg-primary-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>

       <div className="relative z-10">
        <div className="w-14 h-14 bg-primary-100 rounded-none flex items-center justify-center text-primary-700 mb-6 group-hover:scale-110 transition-transform duration-300">
         <Wrench size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold font-heading text-gray-900 mb-2">Manutenção</h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
         Gestão de chamados técnicos, elétrica, hidráulica e reparos gerais.
        </p>
        <div className="flex items-center text-primary-600 font-semibold group-hover:gap-2 transition-all mt-auto">
         Acessar <ArrowRight size={20} className="ml-2" />
        </div>
       </div>
      </button>
     )}

     {/* Concierge Module */}
     {canAccessConcierge && (
      <button 
       onClick={() => onSelectModule('concierge')}
       className="group relative bg-white p-8 rounded-none shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-600/5 transition-all duration-300 text-left flex flex-col overflow-hidden"
      >
       <div className="absolute top-0 right-0 p-32 bg-purple-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
       
       <div className="relative z-10">
        <div className="w-14 h-14 bg-purple-100 rounded-none flex items-center justify-center text-purple-700 mb-6 group-hover:scale-110 transition-transform duration-300">
         <Gem size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold font-heading text-gray-900 mb-2">Concierge</h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
         Experiências, transporte, chef em casa e serviços exclusivos.
        </p>
        <div className="flex items-center text-purple-600 font-semibold group-hover:gap-2 transition-all mt-auto">
         Acessar <ArrowRight size={20} className="ml-2" />
        </div>
       </div>
      </button>
     )}

     {/* Guest Module */}
     {canAccessGuest && (
      <button 
       onClick={() => onSelectModule('guest')}
       className="group relative bg-white p-8 rounded-none shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 text-left flex flex-col overflow-hidden"
      >
       <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
       
       <div className="relative z-10">
        <div className="w-14 h-14 bg-blue-100 rounded-none flex items-center justify-center text-blue-700 mb-6 group-hover:scale-110 transition-transform duration-300">
         <Users size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold font-heading text-gray-900 mb-2">Guest & CRM</h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
         Lista de check-ins, perfil de hóspedes, voos e documentação.
        </p>
        <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all mt-auto">
         Acessar <ArrowRight size={20} className="ml-2" />
        </div>
       </div>
      </button>
     )}

     {/* Reservations Module */}
     {canAccessReservations && (
      <button 
       onClick={() => onSelectModule('reservations')}
       className="group relative bg-white p-8 rounded-none shadow-sm border border-gray-200 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-600/5 transition-all duration-300 text-left flex flex-col overflow-hidden"
      >
       <div className="absolute top-0 right-0 p-32 bg-teal-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
       
       <div className="relative z-10">
        <div className="w-14 h-14 bg-teal-100 rounded-none flex items-center justify-center text-teal-700 mb-6 group-hover:scale-110 transition-transform duration-300">
         <CalendarRange size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold font-heading text-gray-900 mb-2">Reservas</h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
         Mapa geral de ocupação, calendário e planejamento semanal.
        </p>
        <div className="flex items-center text-teal-600 font-semibold group-hover:gap-2 transition-all mt-auto">
         Acessar <ArrowRight size={20} className="ml-2" />
        </div>
       </div>
      </button>
     )}

     {/* Inventory Module */}
     {canAccessInventory && (
      <button
       onClick={() => onSelectModule('inventory')}
       className="group relative bg-white p-8 rounded-none shadow-sm border border-gray-200 hover:border-secondary-300 hover:shadow-xl hover:shadow-secondary-600/5 transition-all duration-300 text-left flex flex-col overflow-hidden"
      >
       <div className="absolute top-0 right-0 p-32 bg-secondary-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>

       <div className="relative z-10">
        <div className="w-14 h-14 bg-secondary-100 rounded-none flex items-center justify-center text-secondary-700 mb-6 group-hover:scale-110 transition-transform duration-300">
         <Box size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold font-heading text-gray-900 mb-2">Inventário</h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
         Controle de estoque, enxoval, equipamentos e consumo.
        </p>
        <div className="flex items-center text-secondary-600 font-semibold group-hover:gap-2 transition-all mt-auto">
         Acessar <ArrowRight size={20} className="ml-2" />
        </div>
       </div>
      </button>
     )}

     {/* Office Module */}
     {canAccessOffice && (
      <button
       onClick={() => onSelectModule('office')}
       className="group relative bg-white p-8 rounded-none shadow-sm border border-gray-200 hover:border-secondary-300 hover:shadow-xl hover:shadow-secondary-600/5 transition-all duration-300 text-left flex flex-col overflow-hidden"
      >
       <div className="absolute top-0 right-0 p-32 bg-secondary-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>

       <div className="relative z-10">
        <div className="w-14 h-14 bg-secondary-100 rounded-none flex items-center justify-center text-secondary-700 mb-6 group-hover:scale-110 transition-transform duration-300">
         <Briefcase size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold font-heading text-gray-900 mb-2">Escritório</h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
         Recebimento de encomendas, almoxarifado e ativos da empresa.
        </p>
        <div className="flex items-center text-secondary-600 font-semibold group-hover:gap-2 transition-all mt-auto">
         Acessar <ArrowRight size={20} className="ml-2" />
        </div>
       </div>
      </button>
     )}

     {/* Kiosk Mode (Manual Access) */}
     <button 
      onClick={() => onSelectModule('kiosk')}
      className="group relative bg-white p-8 rounded-none shadow-sm border border-gray-200 hover:border-yellow-300 hover:shadow-xl hover:shadow-yellow-600/5 transition-all duration-300 text-left flex flex-col overflow-hidden"
     >
      <div className="absolute top-0 right-0 p-32 bg-yellow-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
      
      <div className="relative z-10">
       <div className="w-14 h-14 bg-yellow-100 rounded-none flex items-center justify-center text-yellow-700 mb-6 group-hover:scale-110 transition-transform duration-300">
        <Tablet size={32} />
       </div>
       <h2 className="text-2xl font-heading font-bold font-heading text-gray-900 mb-2">Modo Kiosk</h2>
       <p className="text-gray-500 mb-8 leading-relaxed text-sm">
        Acesse a interface do hóspede manualmente selecionando um imóvel.
       </p>
       <div className="flex items-center text-yellow-600 font-semibold group-hover:gap-2 transition-all mt-auto">
        Simular Tablet <ArrowRight size={20} className="ml-2" />
       </div>
      </div>
     </button>
    </div>

    <div className="mt-12 text-center">
     <button 
      onClick={onLogout}
      className="text-gray-400 hover:text-red-600 text-sm font-medium transition-colors"
     >
      Sair do Sistema
     </button>
    </div>
   </div>
  </div>
 );
};

export default LandingPage;
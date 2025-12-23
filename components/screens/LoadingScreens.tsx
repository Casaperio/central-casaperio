import React from 'react';
import { Loader2 } from 'lucide-react';
import Login from '../Login';
import LandingPage from '../LandingPage';
import { User, UserWithPassword, AppModule } from '../../types';

interface LoadingScreensProps {
  isDbConnected: boolean;
  kioskProperty: string | null;
  currentUser: User | null;
  viewMode: string;
  users: UserWithPassword[];
  onLogin: (user: User) => void;
  onLogout: () => void;
  onSelectModule: (module: AppModule) => void;
}

export function LoadingScreens({
  isDbConnected,
  kioskProperty,
  currentUser,
  viewMode,
  users,
  onLogin,
  onLogout,
  onSelectModule,
}: LoadingScreensProps) {

  // Kiosk Mode Loading
  if (kioskProperty && !isDbConnected) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#fdf8f6]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
          <p className="font-medium text-gray-500 animate-pulse">Iniciando Modo Tablet...</p>
        </div>
      </div>
    );
  }

  // DB Connection Loading
  if (!isDbConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf8f6]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
          <p className="font-medium text-gray-500 animate-pulse">Conectando ao sistema...</p>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!currentUser) {
    return <Login onLogin={onLogin} users={users} />;
  }

  // Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        user={currentUser}
        onSelectModule={(m: 'maintenance' | 'concierge' | 'guest' | 'reservations' | 'inventory' | 'office' | 'kiosk' | 'field_app') => {
          onSelectModule(m as AppModule);
        }}
        onLogout={onLogout}
      />
    );
  }

  return null;
}

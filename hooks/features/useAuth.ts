import { useState, useCallback } from 'react';
import { User, AppModule, ViewMode } from '../../types';

const STORAGE_KEY_USER = 'casape_current_user_id';

export const getPrimaryModuleForRole = (role: User['role']): AppModule => {
  switch(role) {
    case 'Maintenance':
    case 'Faxineira':
      return 'maintenance';
    case 'Guest Relations':
      return 'guest';
    case 'Administrativo':
      return 'office';
    case 'Admin':
      return 'maintenance';
    default:
      return 'maintenance';
  }
};

export const getDefaultViewForModule = (module: AppModule): ViewMode => {
  switch(module) {
    case 'inventory': return 'inventory';
    case 'office': return 'office';
    case 'reservations': return 'general-calendar';
    case 'guest': return 'cards';
    default: return 'cards';
  }
};

export function useAuth(users: User[]) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = useCallback((user: User) => {
    localStorage.setItem(STORAGE_KEY_USER, user.id);
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_USER);
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    handleLogin,
    handleLogout,
    getPrimaryModuleForRole,
    getDefaultViewForModule,
  };
}

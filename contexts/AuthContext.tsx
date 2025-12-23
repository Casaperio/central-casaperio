import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserWithPassword, AppModule, ViewMode } from '../types';
import { auth } from '../services/firebase';

const STORAGE_KEY_USER = 'casape_current_user_id';

interface KioskMode {
  active: boolean;
  propertyCode: string | null;
}

interface AuthContextValue {
  currentUser: User | null;
  isDbConnected: boolean;
  kioskMode: KioskMode;
  login: (user: User) => void;
  logout: () => void;
  activateTablet: (propertyCode: string) => void;
  getPrimaryModuleForRole: (role: User['role']) => AppModule;
  getDefaultViewForModule: (module: AppModule) => ViewMode;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  users: UserWithPassword[];
  onUserChange: (user: User | null) => void;
}

export function AuthProvider({ children, users, onUserChange }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [kioskProperty, setKioskProperty] = useState<string | null>(
    localStorage.getItem('casape_tablet_property')
  );

  // Firebase Auth Initialization
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsDbConnected(true);
      } else {
        auth.signInAnonymously().catch((error) => {
          console.error("Firebase Auth Error:", error);
        });
      }
    });
    return () => unsubAuth();
  }, []);

  // Persistent Login - Restore user from localStorage
  useEffect(() => {
    if (!isDbConnected || users.length === 0) return;

    const savedUserId = localStorage.getItem(STORAGE_KEY_USER);
    if (savedUserId && !currentUser) {
      const savedUser = users.find(u => u.id === savedUserId);
      if (savedUser) {
        const { password, ...userWithoutPassword } = savedUser;
        setCurrentUser(userWithoutPassword);
        onUserChange(userWithoutPassword);
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }
  }, [isDbConnected, users, currentUser, onUserChange]);

  // Helper: Get primary module based on user role
  const getPrimaryModuleForRole = useCallback((role: User['role']): AppModule => {
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
  }, []);

  // Helper: Get default view for module
  const getDefaultViewForModule = useCallback((module: AppModule): ViewMode => {
    switch(module) {
      case 'inventory': return 'inventory';
      case 'office': return 'office';
      case 'reservations': return 'general-calendar';
      case 'guest': return 'cards';
      default: return 'cards';
    }
  }, []);

  // Login Handler
  const login = useCallback((user: User) => {
    localStorage.setItem(STORAGE_KEY_USER, user.id);
    setCurrentUser(user);
    onUserChange(user);
  }, [onUserChange]);

  // Logout Handler
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_USER);
    setCurrentUser(null);
    onUserChange(null);
  }, [onUserChange]);

  // Activate Tablet/Kiosk Mode
  const activateTablet = useCallback((propertyCode: string) => {
    localStorage.setItem('casape_tablet_property', propertyCode);
    setKioskProperty(propertyCode);
    auth.signOut().catch(err => console.error("Error signing out for tablet mode", err));
    setCurrentUser(null);
    onUserChange(null);
    window.location.reload();
  }, [onUserChange]);

  const value: AuthContextValue = {
    currentUser,
    isDbConnected,
    kioskMode: {
      active: !!kioskProperty,
      propertyCode: kioskProperty
    },
    login,
    logout,
    activateTablet,
    getPrimaryModuleForRole,
    getDefaultViewForModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

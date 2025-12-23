import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppModule, ViewMode } from '../types';

interface NavigationContextValue {
  activeModule: AppModule | null;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  setActiveModule: (module: AppModule | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  navigate: (module: AppModule, view?: ViewMode) => void;
}

export const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  initialModule?: AppModule | null;
  initialView?: ViewMode;
}

export function NavigationProvider({
  children,
  initialModule = null,
  initialView = 'landing'
}: NavigationProviderProps) {
  const [activeModule, setActiveModule] = useState<AppModule | null>(initialModule);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const navigate = useCallback((module: AppModule, view?: ViewMode) => {
    setActiveModule(module);
    if (view) {
      setViewMode(view);
    }
  }, []);

  const value: NavigationContextValue = {
    activeModule,
    viewMode,
    sidebarOpen,
    mobileMenuOpen,
    setActiveModule,
    setViewMode,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
    navigate,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

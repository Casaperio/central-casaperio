import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { NavigationProvider } from './NavigationContext';
import { UserWithPassword, User } from '../types';

interface AppProvidersProps {
  children: ReactNode;
  users: UserWithPassword[];
  onUserChange: (user: User | null) => void;
  onModuleChange: (module: any) => void;
  onViewModeChange: (mode: any) => void;
}

/**
 * AppProviders - Composition root for all context providers
 * Wraps the app with Auth and Navigation contexts
 */
export function AppProviders({
  children,
  users,
  onUserChange,
  onModuleChange,
  onViewModeChange
}: AppProvidersProps) {
  return (
    <AuthProvider users={users} onUserChange={onUserChange}>
      <NavigationProvider>
        {children}
      </NavigationProvider>
    </AuthProvider>
  );
}

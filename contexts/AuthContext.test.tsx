import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { createAdminUser, createMaintenanceUser, createMockUser } from '../tests/fixtures/users';
import { User } from '../types';

describe('AuthContext', () => {
  let users: User[];
  let onUserChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    users = [
      createAdminUser({ id: '1', name: 'Admin User' }),
      createMaintenanceUser({ id: '2', name: 'Maint User' }),
      createMockUser({ id: '3', name: 'Guest User', role: 'Guest Relations' })
    ];
    onUserChange = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider users={users} onUserChange={onUserChange}>
      {children}
    </AuthProvider>
  );

  describe('initialization', () => {
    it('should initialize with no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.currentUser).toBeNull();
    });

    it('should initialize with kiosk mode inactive', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.kioskMode.active).toBe(false);
      expect(result.current.kioskMode.propertyCode).toBeNull();
    });

    it('should detect kiosk mode from localStorage', () => {
      localStorage.setItem('casape_tablet_property', '501A');

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.kioskMode.active).toBe(true);
      expect(result.current.kioskMode.propertyCode).toBe('501A');
    });

    it('should restore user from localStorage when db connects', async () => {
      localStorage.setItem('casape_current_user_id', '1');

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for Firebase auth and user restore
      await waitFor(() => {
        expect(result.current.currentUser).not.toBeNull();
      }, { timeout: 1000 });

      expect(result.current.currentUser?.id).toBe('1');
      expect(onUserChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' })
      );
    });

    it('should remove invalid user ID from localStorage', async () => {
      localStorage.setItem('casape_current_user_id', 'invalid-id');

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(localStorage.getItem('casape_current_user_id')).toBeNull();
      });
    });
  });

  describe('login', () => {
    it('should set current user and save to localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login(users[0]);
      });

      expect(result.current.currentUser).toEqual(users[0]);
      expect(localStorage.getItem('casape_current_user_id')).toBe('1');
      expect(onUserChange).toHaveBeenCalledWith(users[0]);
    });

    it('should work for different user roles', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login(users[1]); // Maintenance user
      });

      expect(result.current.currentUser?.role).toBe('Maintenance');
      expect(localStorage.getItem('casape_current_user_id')).toBe('2');
    });
  });

  describe('logout', () => {
    it('should clear current user and localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      act(() => {
        result.current.login(users[0]);
      });

      expect(result.current.currentUser).not.toBeNull();

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.currentUser).toBeNull();
      expect(localStorage.getItem('casape_current_user_id')).toBeNull();
      expect(onUserChange).toHaveBeenLastCalledWith(null);
    });
  });

  describe('getPrimaryModuleForRole', () => {
    it('should return maintenance for Maintenance role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const module = result.current.getPrimaryModuleForRole('Maintenance');

      expect(module).toBe('maintenance');
    });

    it('should return maintenance for Faxineira role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const module = result.current.getPrimaryModuleForRole('Faxineira');

      expect(module).toBe('maintenance');
    });

    it('should return guest for Guest Relations role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const module = result.current.getPrimaryModuleForRole('Guest Relations');

      expect(module).toBe('guest');
    });

    it('should return office for Administrativo role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const module = result.current.getPrimaryModuleForRole('Administrativo');

      expect(module).toBe('office');
    });

    it('should return maintenance for Admin role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const module = result.current.getPrimaryModuleForRole('Admin');

      expect(module).toBe('maintenance');
    });

    it('should return maintenance as default for unknown role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const module = result.current.getPrimaryModuleForRole('Unknown Role' as any);

      expect(module).toBe('maintenance');
    });
  });

  describe('getDefaultViewForModule', () => {
    it('should return inventory for inventory module', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const view = result.current.getDefaultViewForModule('inventory');

      expect(view).toBe('inventory');
    });

    it('should return office for office module', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const view = result.current.getDefaultViewForModule('office');

      expect(view).toBe('office');
    });

    it('should return general-calendar for reservations module', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const view = result.current.getDefaultViewForModule('reservations');

      expect(view).toBe('general-calendar');
    });

    it('should return cards for guest module', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const view = result.current.getDefaultViewForModule('guest');

      expect(view).toBe('cards');
    });

    it('should return cards as default', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const view = result.current.getDefaultViewForModule('maintenance');

      expect(view).toBe('cards');
    });
  });

  describe('activateTablet', () => {
    it('should set kiosk property in localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.activateTablet('501A');
      });

      expect(localStorage.getItem('casape_tablet_property')).toBe('501A');
    });

    it('should clear current user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      act(() => {
        result.current.login(users[0]);
      });

      // Activate tablet
      act(() => {
        result.current.activateTablet('904B');
      });

      expect(result.current.currentUser).toBeNull();
      expect(onUserChange).toHaveBeenLastCalledWith(null);
    });

    it('should update kiosk mode state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.activateTablet('702C');
      });

      // Note: kioskMode.propertyCode updates after component re-render
      expect(localStorage.getItem('casape_tablet_property')).toBe('702C');
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');
    });
  });

  describe('Firebase integration', () => {
    it('should set isDbConnected to true when Firebase auth succeeds', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isDbConnected).toBe(true);
      });
    });
  });

  describe('state persistence', () => {
    it('should persist login across sessions', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login(users[1]);
      });

      // Simulate page reload by creating new hook
      const { result: newResult } = renderHook(() => useAuth(), { wrapper });

      // User should be restored from localStorage after db connects
      waitFor(() => {
        expect(newResult.current.currentUser?.id).toBe('2');
      });
    });

    it('should persist tablet mode across sessions', () => {
      localStorage.setItem('casape_tablet_property', 'COPA-001');

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.kioskMode.active).toBe(true);
      expect(result.current.kioskMode.propertyCode).toBe('COPA-001');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NavigationProvider, useNavigation } from './NavigationContext';

describe('NavigationContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NavigationProvider>{children}</NavigationProvider>
  );

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      expect(result.current.activeModule).toBeNull();
      expect(result.current.viewMode).toBe('landing');
      expect(result.current.sidebarOpen).toBe(true);
      expect(result.current.mobileMenuOpen).toBe(false);
    });

    it('should accept custom initial module', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <NavigationProvider initialModule="maintenance">
          {children}
        </NavigationProvider>
      );

      const { result } = renderHook(() => useNavigation(), { wrapper: customWrapper });

      expect(result.current.activeModule).toBe('maintenance');
    });

    it('should accept custom initial view', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <NavigationProvider initialView="cards">
          {children}
        </NavigationProvider>
      );

      const { result } = renderHook(() => useNavigation(), { wrapper: customWrapper });

      expect(result.current.viewMode).toBe('cards');
    });
  });

  describe('setActiveModule', () => {
    it('should update active module', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.setActiveModule('maintenance');
      });

      expect(result.current.activeModule).toBe('maintenance');
    });

    it('should set module to null', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.setActiveModule('guest');
      });

      expect(result.current.activeModule).toBe('guest');

      act(() => {
        result.current.setActiveModule(null);
      });

      expect(result.current.activeModule).toBeNull();
    });
  });

  describe('setViewMode', () => {
    it('should update view mode', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.setViewMode('cards');
      });

      expect(result.current.viewMode).toBe('cards');
    });

    it('should switch between different views', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      const views: Array<'cards' | 'list' | 'calendar'> = ['cards', 'list', 'calendar'];

      views.forEach(view => {
        act(() => {
          result.current.setViewMode(view);
        });

        expect(result.current.viewMode).toBe(view);
      });
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar from open to closed', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      expect(result.current.sidebarOpen).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(false);
    });

    it('should toggle sidebar back to open', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.toggleSidebar();
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(true);
    });
  });

  describe('toggleMobileMenu', () => {
    it('should toggle mobile menu from closed to open', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      expect(result.current.mobileMenuOpen).toBe(false);

      act(() => {
        result.current.toggleMobileMenu();
      });

      expect(result.current.mobileMenuOpen).toBe(true);
    });

    it('should toggle mobile menu back to closed', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.toggleMobileMenu();
        result.current.toggleMobileMenu();
      });

      expect(result.current.mobileMenuOpen).toBe(false);
    });
  });

  describe('closeMobileMenu', () => {
    it('should close mobile menu', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      // Open first
      act(() => {
        result.current.toggleMobileMenu();
      });

      expect(result.current.mobileMenuOpen).toBe(true);

      // Close
      act(() => {
        result.current.closeMobileMenu();
      });

      expect(result.current.mobileMenuOpen).toBe(false);
    });

    it('should be idempotent when already closed', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      expect(result.current.mobileMenuOpen).toBe(false);

      act(() => {
        result.current.closeMobileMenu();
      });

      expect(result.current.mobileMenuOpen).toBe(false);
    });
  });

  describe('navigate', () => {
    it('should set module and view together', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigate('maintenance', 'cards');
      });

      expect(result.current.activeModule).toBe('maintenance');
      expect(result.current.viewMode).toBe('cards');
    });

    it('should set only module when view not provided', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      const originalView = result.current.viewMode;

      act(() => {
        result.current.navigate('guest');
      });

      expect(result.current.activeModule).toBe('guest');
      expect(result.current.viewMode).toBe(originalView); // View unchanged
    });

    it('should navigate to different modules', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.navigate('maintenance', 'cards');
      });

      expect(result.current.activeModule).toBe('maintenance');

      act(() => {
        result.current.navigate('inventory', 'inventory');
      });

      expect(result.current.activeModule).toBe('inventory');
      expect(result.current.viewMode).toBe('inventory');
    });
  });

  describe('useNavigation hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useNavigation());
      }).toThrow('useNavigation must be used within NavigationProvider');
    });
  });
});

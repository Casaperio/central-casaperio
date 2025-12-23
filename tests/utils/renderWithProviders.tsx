import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, AuthContextValue } from '../../contexts/AuthContext';
import { NavigationContext, NavigationContextValue } from '../../contexts/NavigationContext';
import { createMockUser } from '../fixtures/users';

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<AuthContextValue>;
  navValue?: Partial<NavigationContextValue>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    authValue = {},
    navValue = {},
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const mockUser = createMockUser({ role: 'Admin' });

  const defaultAuthValue: AuthContextValue = {
    currentUser: mockUser,
    isDbConnected: true,
    kioskMode: { active: false, propertyCode: null },
    login: vi.fn(),
    logout: vi.fn(),
    activateTablet: vi.fn(),
    getPrimaryModuleForRole: vi.fn(() => 'maintenance'),
    getDefaultViewForModule: vi.fn(() => 'cards'),
    ...authValue
  };

  const defaultNavValue: NavigationContextValue = {
    activeModule: 'maintenance',
    viewMode: 'cards',
    sidebarOpen: true,
    mobileMenuOpen: false,
    setActiveModule: vi.fn(),
    setViewMode: vi.fn(),
    toggleSidebar: vi.fn(),
    toggleMobileMenu: vi.fn(),
    closeMobileMenu: vi.fn(),
    navigate: vi.fn(),
    ...navValue
  };

  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={defaultAuthValue}>
          <NavigationContext.Provider value={defaultNavValue}>
            {children}
          </NavigationContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockUser,
    authValue: defaultAuthValue,
    navValue: defaultNavValue
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };

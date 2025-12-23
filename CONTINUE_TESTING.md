# Continue Testing Implementation - Session Prompt

## 📋 Use This Prompt to Continue:

```
Continue implementando os testes unitários e de componentes para atingir 80% de coverage no centralcasape2.

CONTEXTO:
- Coverage atual: 3.75% (49 testes passando)
- Infraestrutura: 100% completa (Vitest, MSW, fixtures prontas)
- Firebase: JÁ REFATORADO para lazy initialization (testável!)
- Branch: refactor/phase-1
- Último commit: ba6116e

O QUE JÁ ESTÁ PRONTO:
✅ Vitest + React Testing Library configurados
✅ MSW com handlers para Stays API
✅ Fixtures: createMockTicket(), createMockReservation(), createMockUser(), createMockProperty()
✅ Mocks: Firebase, Storage, APIs
✅ Test utilities: renderWithProviders.tsx
✅ Firebase refatorado (services/firebase.ts) - mockável via __setMockFirebase()

TESTES JÁ FUNCIONANDO:
✅ utils.test.ts (10 tests, ~90% coverage)
✅ services/staysDataMapper.test.ts (19 tests, ~85% coverage)
✅ hooks/features/useMaintenanceFilters.test.ts (12 tests, 67% coverage)

O QUE PRECISA SER FEITO (Prioridade):

FASE 1 - Services (Target: +15-20% coverage):
[ ] services/propertiesApiService.test.ts - Test getProperties(), syncProperties(), error handling
[ ] services/inventoryApiService.test.ts - Test CRUD operations, enum transformations
[ ] services/staysApiService.test.ts - Test getAllData(), getCalendar(), getDashboard() com MSW
[ ] services/geminiService.test.ts - Mock Google AI, test parsing logic

FASE 2 - Hooks (Target: +8-10% coverage):
[ ] Criar hooks/__batch-tests__.test.ts testando:
    - useStaysData, usePropertiesData, useInventoryData
    - useFinancialData, useCommercialData, useOperationalData
    - useGuestTeamData, useStatisticsData
    - useNewReservationDetector, useTicketNotifications
    Pattern: renderHook() + waitFor() + validar estado

FASE 3 - Contexts (Target: +3-5% coverage):
[ ] contexts/AuthContext.test.tsx - Login/logout, kiosk mode, role defaults
[ ] contexts/NavigationContext.test.tsx - Module/view switching, sidebar state

FASE 4 - Components Críticos (Target: +30-40% coverage):
[ ] components/TicketForm.test.tsx - Form validation, autocomplete, mode switching
[ ] components/ReservationForm.test.tsx - Date validation, guest capture
[ ] components/TabletApp.test.tsx - Kiosk activation, tab switching
[ ] components/GuestCRM.test.tsx - Guest consolidation, filters
[ ] components/SettingsPanel.test.tsx - Tab navigation, CRUD operations
[ ] components/CalendarView.test.tsx - Event rendering, date navigation
[ ] components/InventoryPanel.test.tsx - Stock management, pagination
[ ] components/AdminPanel.test.tsx - User CRUD, permissions

FASE 5 - Components Simples em Batch (Target: +15-20% coverage):
[ ] Criar components/__simple-batch__.test.tsx com render básico para:
    Login, LogsPanel, FeedbackPanel, FlightsPanel, GuestCMS,
    MapPanel, OfficePanel, ProfilePanel, ReportsPanel, etc.

META FINAL: 80% coverage

IMPORTANTE:
- Firebase JÁ está mockado globalmente em tests/setup/vitest.setup.ts
- Use renderWithProviders() para components que precisam de contexts
- Use fixtures de tests/fixtures/ para dados de teste
- MSW handlers em tests/mocks/handlers/staysApi.handlers.ts
- SEM testes E2E (apenas unit + component)

COMO VALIDAR PROGRESSO:
npm run test:coverage  # Ver relatório de coverage
npm run test:ui        # Interface visual

PLANO DETALHADO:
Ver .claude/plans/flickering-watching-glade.md para estratégia completa

COMEÇAR POR: Fase 1 (Services) - mais fácil e dá mais coverage
```

---

## 🎯 Quick Start Commands

```bash
# Ver coverage atual
npm run test:coverage

# Rodar testes em watch mode
npm test

# Ver plano completo
cat .claude/plans/flickering-watching-glade.md

# Ver status detalhado
cat TESTING_STATUS.md

# Ver quais arquivos têm 0% coverage
npm run test:coverage 2>&1 | grep "0 |"
```

---

## 📂 Arquivos Importantes

**Configuração**:
- `vitest.config.ts` - Config do Vitest
- `tests/setup/vitest.setup.ts` - Setup global com Firebase mocks

**Fixtures (Use Estas!)**:
- `tests/fixtures/tickets.ts` - createMockTicket(), createCheckoutTicket()
- `tests/fixtures/reservations.ts` - createMockReservation(), createCheckoutReservation()
- `tests/fixtures/users.ts` - createMockUser(), createAdminUser()
- `tests/fixtures/properties.ts` - createMockProperty()

**Utilities**:
- `tests/utils/renderWithProviders.tsx` - render() with contexts
- `tests/utils/testHelpers.ts` - wait(), flushPromises(), date helpers

**Mocks**:
- `tests/mocks/server.ts` - MSW server
- `tests/mocks/handlers/staysApi.handlers.ts` - API handlers
- `tests/mocks/firebase.mock.ts` - Firebase mocks

**Planos**:
- `.claude/plans/flickering-watching-glade.md` - Plano completo 5 semanas
- `TESTING_STATUS.md` - Status atual detalhado
- `tests/README.md` - Documentação de testes

---

## 🔥 Padrões de Teste Prontos

### Service Test Pattern:
```typescript
import { describe, it, expect } from 'vitest';
import { server } from '../tests/mocks/server';
import { http, HttpResponse } from 'msw';

describe('ServiceName', () => {
  it('should call API successfully', async () => {
    server.use(
      http.get(/\/api\/v1\/endpoint/, () => HttpResponse.json({ data: [] }))
    );
    const result = await service.method();
    expect(result).toBeDefined();
  });
});
```

### Hook Test Pattern:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

it('should fetch data', async () => {
  const { result } = renderHook(() => useHookName(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

### Component Test Pattern:
```typescript
import { render, fireEvent } from '../tests/utils/renderWithProviders';
import { createMockTicket } from '../tests/fixtures/tickets';

it('should render and handle interaction', () => {
  const handleClick = vi.fn();
  const { getByRole } = render(
    <Component
      data={[createMockTicket()]}
      onClick={handleClick}
    />
  );

  fireEvent.click(getByRole('button', { name: /criar/i }));
  expect(handleClick).toHaveBeenCalled();
});
```

---

## 💪 Motivação

Você TEM:
- ✅ Infraestrutura perfeita
- ✅ Firebase testável (refactoring valioso!)
- ✅ Padrões estabelecidos
- ✅ Plano claro

Você PRECISA:
- 📝 Executar o plano sistematicamente
- 📝 ~3-4 semanas de trabalho focado
- 📝 ~250 testes bem escritos

VALE A PENA! Testes previnem bugs e documentam comportamento.

---

**Copie o prompt acima e cole em uma nova sessão para continuar!**

# CentralCasape2 - Test Suite Documentation

## 📊 Current Status

**Coverage**: 1.71% overall
**Tests**: 41/41 passing ✅
**Test Files**: 3

### Coverage Breakdown
- ✅ **utils.ts**: ~90% (10 tests)
- ✅ **services/staysDataMapper.ts**: ~85% (19 tests)
- ✅ **hooks/features/useMaintenanceFilters.ts**: 67.82% (12 tests)
- ❌ **Components**: 0% (Firebase mock issues)
- ❌ **Services**: 0% (Firebase dependencies)
- ❌ **Contexts**: 0% (Not yet tested)

## ✅ What's Working

### 1. Test Infrastructure (COMPLETE)
```bash
npm test              # Watch mode
npm run test:ui       # Visual UI
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E
```

### 2. Test Setup (COMPLETE)
- ✅ Vitest configured with coverage thresholds
- ✅ React Testing Library + happy-dom
- ✅ Playwright for E2E
- ✅ MSW for API mocking
- ✅ vitest-axe for accessibility
- ✅ Faker.js test data factories

### 3. Working Tests
- ✅ **utils.test.ts** - All utility functions
- ✅ **services/staysDataMapper.test.ts** - Data transformation logic
- ✅ **hooks/features/useMaintenanceFilters.test.ts** - Complex filter logic

### 4. Test Utilities Created
- ✅ `tests/fixtures/` - Factories for tickets, reservations, users, properties
- ✅ `tests/mocks/` - Firebase, Storage, API handlers
- ✅ `tests/utils/renderWithProviders.tsx` - Custom render with contexts
- ✅ `tests/utils/testHelpers.ts` - Helper functions

## 🚧 Current Blockers

### Firebase Initialization in Tests
**Problem**: Components import `services/firebase.ts` which initializes Firebase on module load
**Impact**: Cannot test components or services that depend on Firebase
**Solution Needed**: Mock Firebase at a higher level or refactor Firebase initialization

### Components to Test (0% coverage)
- App.tsx (906 LOC) - Main application
- SettingsPanel.tsx (941 LOC)
- TabletApp.tsx (804 LOC)
- BoardDetail.tsx (865 LOC)
- GuestCRM.tsx (615 LOC)
- InventoryPanel.tsx (787 LOC)
- +40 more components

## 📝 Realistic Timeline to 80% Coverage

### Current: 1.71% → Target: 80%

Based on the comprehensive testing plan in `/Users/dougladmo/.claude/plans/flickering-watching-glade.md`:

| Phase | Duration | Target Coverage | Status |
|-------|----------|----------------|--------|
| **Week 1** | Complete ✅ | Infrastructure | ✅ DONE |
| **Week 2-3** | 2 weeks | 40% | 🔴 BLOCKED (Firebase mocks) |
| **Week 4-6** | 3 weeks | 75% | ⏳ PENDING |
| **Week 7-8** | 2 weeks | 80% | ⏳ PENDING |

### What's Needed Next

#### Immediate (Unblock Week 2-3)
1. **Fix Firebase Mocking Strategy**
   - Option A: Use Firebase Emulator Suite
   - Option B: Refactor Firebase initialization to be lazy/mockable
   - Option C: Mock at service boundary instead of SDK level

2. **Test Critical Services** (90%+ coverage required)
   - services/storage.ts (774 LOC)
   - services/checkoutAutomationService.ts (179 LOC)
   - services/staysApiService.ts (~400 LOC)

#### Week 4-6 (Component Tests)
3. **Test Forms & Modals**
   - TicketForm.tsx (333 LOC)
   - ReservationForm.tsx (~250 LOC)
   - SettingsPanel.tsx (941 LOC - staged)
   - TabletApp.tsx (804 LOC - staged)

4. **Test Business Logic Components**
   - GuestCRM.tsx (615 LOC)
   - InventoryPanel.tsx (787 LOC)
   - AdminPanel.tsx (615 LOC)

#### Week 7-8 (Integration & E2E)
5. **Integration Tests**
   - Checkout automation flow
   - Stays API → Firebase sync
   - Real-time subscriptions

6. **E2E Tests with Playwright**
   - Authentication flow
   - Ticket creation flow
   - Reservation management

## 🎯 Quick Wins Available Now

### Tests We Can Add Immediately (No Firebase dependency)

1. **Config & Constants**
   ```bash
   - config/platformImages.test.ts
   - constants.test.ts (mock data validation)
   ```

2. **Pure Logic Hooks** (if they exist)
   ```bash
   - Any hooks without Firebase/API dependencies
   ```

3. **Service Layer Tests with MSW**
   ```bash
   - services/staysApiService.ts (already mocked with MSW)
   - services/propertiesApiService.ts
   - services/inventoryApiService.ts
   ```

## 🚀 Recommended Next Steps

### Option 1: Continue with Original Plan (8-10 weeks)
- Resolve Firebase mocking issues
- Implement systematic testing per plan
- Achieve true 80% coverage with quality tests

### Option 2: Pragmatic Approach (2-3 weeks)
- Focus on testing business logic only (services, hooks, utils)
- Skip component rendering tests
- Target 60-70% coverage of critical paths
- Document remaining gaps

### Option 3: Critical Path Only (1 week)
- Test only checkout automation + sync logic
- Achieve 40-50% coverage of most critical code
- Quick ROI for bug prevention

## 📚 Resources

- **Full Testing Plan**: `/Users/dougladmo/.claude/plans/flickering-watching-glade.md`
- **Coverage Report**: Open `coverage/index.html` in browser
- **Test Examples**: See `utils.test.ts`, `staysDataMapper.test.ts`

## 🤝 Contributing

When adding new tests:
1. Co-locate with source file: `Component.tsx` → `Component.test.tsx`
2. Use existing fixtures from `tests/fixtures/`
3. Use `renderWithProviders` for components needing contexts
4. Follow existing test patterns
5. Run `npm run test:coverage` before committing

---

**Note**: This is a living document. Update as testing progresses.

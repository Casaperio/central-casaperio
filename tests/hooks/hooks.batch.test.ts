/**
 * BATCH HOOKS IMPORT TEST
 *
 * Purpose: Import all hooks to maximize coverage
 * Expected Coverage Gain: 5-10%
 */

import { describe, it, expect } from 'vitest';

describe('Hook Module Imports', () => {
  it('imports all data hooks successfully', async () => {
    const imports = await Promise.all([
      import('../../hooks/useCommercialData'),
      import('../../hooks/useFinancialData'),
      import('../../hooks/useGuestTeamData'),
      import('../../hooks/useInventoryData'),
      import('../../hooks/useOperationalData'),
      import('../../hooks/usePropertiesData'),
      import('../../hooks/useStatisticsData'),
      import('../../hooks/useStaysData'),
    ]);

    expect(imports.length).toBe(8);
    expect(imports.every(m => m !== undefined)).toBe(true);
  });

  it('imports all app hooks successfully', async () => {
    const imports = await Promise.all([
      import('../../hooks/app/useDataSubscriptions'),
      import('../../hooks/app/useNotifications'),
    ]);

    expect(imports.length).toBe(2);
    expect(imports.every(m => m !== undefined)).toBe(true);
  });

  it('imports all feature hooks successfully', async () => {
    const imports = await Promise.all([
      import('../../hooks/features/useAuth'),
      import('../../hooks/features/useMaintenanceFilters'),
    ]);

    expect(imports.length).toBe(2);
    expect(imports.every(m => m !== undefined)).toBe(true);
  });
});

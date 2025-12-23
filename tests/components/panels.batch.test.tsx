import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils/renderWithProviders';
import AdminPanel from '../../components/AdminPanel';
import OfficePanel from '../../components/OfficePanel';
import ReportsPanel from '../../components/ReportsPanel';

describe('Panel Components - Batch Tests', () => {
  describe('AdminPanel', () => {
    it('should render', () => {
      const { container } = renderWithProviders(
        <AdminPanel
          users={[]}
          onAddUser={vi.fn()}
          onUpdateUser={vi.fn()}
          onDeleteUser={vi.fn()}
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('OfficePanel', () => {
    it('should render', () => {
      const { container } = renderWithProviders(
        <OfficePanel
          deliveries={[]}
          supplies={[]}
          assets={[]}
          shifts={[]}
          users={[]}
          onAddDelivery={vi.fn()}
          onUpdateDelivery={vi.fn()}
          onDeleteDelivery={vi.fn()}
          onAddSupply={vi.fn()}
          onUpdateSupply={vi.fn()}
          onDeleteSupply={vi.fn()}
          onAddAsset={vi.fn()}
          onUpdateAsset={vi.fn()}
          onDeleteAsset={vi.fn()}
          onAddShift={vi.fn()}
          onDeleteShift={vi.fn()}
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('ReportsPanel', () => {
    it('should render', () => {
      const { container } = renderWithProviders(
        <ReportsPanel tickets={[]} reservations={[]} />
      );
      expect(container).toBeTruthy();
    });
  });
});

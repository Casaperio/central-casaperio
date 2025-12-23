import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils/renderWithProviders';
import ReservationForm from '../../components/ReservationForm';
import { createMockProperty } from '../fixtures/properties';

describe('Form Components - Batch Tests', () => {
  describe('ReservationForm', () => {
    it('should render create mode', () => {
      const { container } = renderWithProviders(
        <ReservationForm
          properties={[createMockProperty()]}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(container).toBeTruthy();
    });

    it('should render edit mode', () => {
      const { container } = renderWithProviders(
        <ReservationForm
          properties={[createMockProperty()]}
          reservation={{ id: 'res-1', guestName: 'Test', checkInDate: '2025-12-20', checkOutDate: '2025-12-22' } as any}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(container).toBeTruthy();
    });
  });
});

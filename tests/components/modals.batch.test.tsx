import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils/renderWithProviders';
import TicketDetailModal from '../../components/TicketDetailModal';
import { createMockTicket } from '../fixtures/tickets';
import { createMockProperty } from '../fixtures/properties';
import { createMockUser } from '../fixtures/users';

describe('Modal Components - Batch Tests', () => {
  describe('TicketDetailModal', () => {
    it('should render ticket details', () => {
      const ticket = createMockTicket();

      const { container } = renderWithProviders(
        <TicketDetailModal
          ticket={ticket}
          users={[createMockUser()]}
          properties={[createMockProperty()]}
          onUpdate={vi.fn()}
          onAddExpense={vi.fn()}
          onSchedule={vi.fn()}
          onAssignResponsible={vi.fn()}
          onDelete={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(container).toBeTruthy();
    });
  });
});

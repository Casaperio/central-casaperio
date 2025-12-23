import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageService } from './storage';
import { db } from './firebase';

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tickets', () => {
    it('should subscribe to tickets collection', () => {
      const callback = vi.fn();
      storageService.tickets.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('tickets');
    });

    it('should call callback with sorted tickets', () => {
      const callback = vi.fn();
      const ticket1 = { id: 'ticket-1', createdAt: 1000, description: 'First' };
      const ticket2 = { id: 'ticket-2', createdAt: 3000, description: 'Second' };
      const ticket3 = { id: 'ticket-3', createdAt: 2000, description: 'Third' };

      const mockOnSnapshot = vi.fn((successCallback) => {
        successCallback({
          docs: [ticket1, ticket2, ticket3].map(ticket => ({
            id: ticket.id,
            data: () => ticket
          }))
        });
        return vi.fn();
      });

      vi.mocked(db.collection).mockReturnValue({
        onSnapshot: mockOnSnapshot
      } as any);

      storageService.tickets.subscribe(callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'ticket-2', createdAt: 3000 }),
        expect.objectContaining({ id: 'ticket-3', createdAt: 2000 }),
        expect.objectContaining({ id: 'ticket-1', createdAt: 1000 })
      ]);
    });

    it('should add ticket without id field', async () => {
      const mockAdd = vi.fn().mockResolvedValue({ id: 'new-id' });
      vi.mocked(db.collection).mockReturnValue({ add: mockAdd } as any);

      await storageService.tickets.add({ id: 'test-id', description: 'Test' } as any);

      const addedData = mockAdd.mock.calls[0][0];
      expect(addedData).not.toHaveProperty('id');
      expect(addedData.description).toBe('Test');
    });

    it('should update ticket without id field', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({});
      const mockDoc = vi.fn().mockReturnValue({ update: mockUpdate });
      vi.mocked(db.collection).mockReturnValue({ doc: mockDoc } as any);

      await storageService.tickets.update({ id: 'test-id', description: 'Updated' } as any);

      expect(mockDoc).toHaveBeenCalledWith('test-id');
      const updatedData = mockUpdate.mock.calls[0][0];
      expect(updatedData).not.toHaveProperty('id');
    });

    it('should delete ticket', async () => {
      const mockDelete = vi.fn().mockResolvedValue({});
      const mockDoc = vi.fn().mockReturnValue({ delete: mockDelete });
      vi.mocked(db.collection).mockReturnValue({ doc: mockDoc } as any);

      await storageService.tickets.delete('test-id');

      expect(mockDoc).toHaveBeenCalledWith('test-id');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should clean undefined values', async () => {
      const mockAdd = vi.fn().mockResolvedValue({});
      vi.mocked(db.collection).mockReturnValue({ add: mockAdd } as any);

      await storageService.tickets.add({
        id: 'test-id',
        description: 'Test',
        propertyCode: '501A',
        responsibleUserId: undefined,
        completedAt: undefined
      } as any);

      const addedData = mockAdd.mock.calls[0][0];
      expect(addedData).toHaveProperty('description');
      expect(addedData).not.toHaveProperty('responsibleUserId');
      expect(addedData).not.toHaveProperty('completedAt');
    });
  });

  describe('reservations', () => {
    it('should subscribe to reservations collection', () => {
      const callback = vi.fn();
      storageService.reservations.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('reservations');
    });

    it('should sort reservations by checkInDate', () => {
      const callback = vi.fn();
      const res1 = { id: 'res-1', checkInDate: '2025-12-25' };
      const res2 = { id: 'res-2', checkInDate: '2025-12-20' };
      const res3 = { id: 'res-3', checkInDate: '2025-12-22' };

      const mockOnSnapshot = vi.fn((cb) => {
        cb({ docs: [res1, res2, res3].map(r => ({ id: r.id, data: () => r })) });
        return vi.fn();
      });

      vi.mocked(db.collection).mockReturnValue({ onSnapshot: mockOnSnapshot } as any);
      storageService.reservations.subscribe(callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'res-2' }),
        expect.objectContaining({ id: 'res-3' }),
        expect.objectContaining({ id: 'res-1' })
      ]);
    });

    it('should update reservation using set with merge', async () => {
      const mockSet = vi.fn().mockResolvedValue({});
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
      vi.mocked(db.collection).mockReturnValue({ doc: mockDoc } as any);

      await storageService.reservations.update({ id: 'res-1', guestName: 'Test' } as any);

      expect(mockSet).toHaveBeenCalledWith(expect.any(Object), { merge: true });
    });
  });

  describe('users', () => {
    it('should subscribe to users collection', () => {
      const callback = vi.fn();
      storageService.users.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('users');
    });

    it('should add user', async () => {
      const mockAdd = vi.fn().mockResolvedValue({});
      vi.mocked(db.collection).mockReturnValue({ add: mockAdd } as any);

      await storageService.users.add({ id: 'user-1', name: 'Test' } as any);

      expect(db.collection).toHaveBeenCalledWith('users');
      expect(mockAdd).toHaveBeenCalled();
    });
  });

  describe('properties', () => {
    it('should subscribe to properties collection', () => {
      const callback = vi.fn();
      storageService.properties.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('properties');
    });

    it('should sort properties by code', () => {
      const callback = vi.fn();
      const props = [
        { id: '1', code: '904B' },
        { id: '2', code: '501A' },
        { id: '3', code: '702C' }
      ];

      const mockOnSnapshot = vi.fn((cb) => {
        cb({ docs: props.map(p => ({ id: p.id, data: () => p })) });
        return vi.fn();
      });

      vi.mocked(db.collection).mockReturnValue({ onSnapshot: mockOnSnapshot } as any);
      storageService.properties.subscribe(callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ code: '501A' }),
        expect.objectContaining({ code: '702C' }),
        expect.objectContaining({ code: '904B' })
      ]);
    });
  });

  describe('logs', () => {
    it('should add log entry', async () => {
      const mockAdd = vi.fn().mockResolvedValue({});
      vi.mocked(db.collection).mockReturnValue({ add: mockAdd } as any);

      await storageService.logs.add({
        id: 'log-1',
        action: 'CREATE',
        entityType: 'ticket',
        entityId: 'ticket-1',
        userId: 'user-1',
        timestamp: Date.now()
      } as any);

      expect(db.collection).toHaveBeenCalledWith('logs');
      expect(mockAdd).toHaveBeenCalled();
    });
  });

  describe('settings', () => {
    it('should subscribe to settings document', () => {
      const callback = vi.fn();
      storageService.settings.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('settings');
    });

    it('should call callback with settings data', () => {
      const callback = vi.fn();
      const settings = { priorities: ['Alta', 'Média'] };

      const mockOnSnapshot = vi.fn((cb) => {
        cb({ exists: () => true, data: () => settings });
        return vi.fn();
      });

      const mockDoc = vi.fn().mockReturnValue({ onSnapshot: mockOnSnapshot });
      vi.mocked(db.collection).mockReturnValue({ doc: mockDoc } as any);

      storageService.settings.subscribe(callback);

      expect(callback).toHaveBeenCalledWith(settings);
    });

    it('should call callback with null when settings do not exist', () => {
      const callback = vi.fn();

      const mockOnSnapshot = vi.fn((cb) => {
        cb({ exists: () => false, data: () => null });
        return vi.fn();
      });

      const mockDoc = vi.fn().mockReturnValue({ onSnapshot: mockOnSnapshot });
      vi.mocked(db.collection).mockReturnValue({ doc: mockDoc } as any);

      storageService.settings.subscribe(callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

  });

  describe('inventory', () => {
    it('should subscribe to inventory items', () => {
      const callback = vi.fn();
      storageService.inventory.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('inventory_items');
    });

    it('should sort items by name', () => {
      const callback = vi.fn();
      const items = [
        { id: '1', name: 'Zebra' },
        { id: '2', name: 'Apple' },
        { id: '3', name: 'Banana' }
      ];

      const mockOnSnapshot = vi.fn((cb) => {
        cb({ docs: items.map(i => ({ id: i.id, data: () => i })) });
        return vi.fn();
      });

      vi.mocked(db.collection).mockReturnValue({ onSnapshot: mockOnSnapshot } as any);
      storageService.inventory.subscribe(callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Apple' }),
        expect.objectContaining({ name: 'Banana' }),
        expect.objectContaining({ name: 'Zebra' })
      ]);
    });
  });

  describe('boards', () => {
    it('should subscribe to boards', () => {
      const callback = vi.fn();
      storageService.boards.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('boards');
    });
  });

  describe('office', () => {
    it('should subscribe to deliveries', () => {
      const callback = vi.fn();
      storageService.officeDeliveries.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('office_deliveries');
    });

    it('should subscribe to supplies', () => {
      const callback = vi.fn();
      storageService.officeSupplies.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('office_supplies');
    });

    it('should subscribe to assets', () => {
      const callback = vi.fn();
      storageService.officeAssets.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('office_assets');
    });

    it('should subscribe to shifts', () => {
      const callback = vi.fn();
      storageService.officeShifts.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('office_shifts');
    });
  });

  describe('concierge and suppliers', () => {
    it('should subscribe to concierge offers', () => {
      const callback = vi.fn();
      storageService.conciergeOffers.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('concierge_offers');
    });

    it('should subscribe to suppliers', () => {
      const callback = vi.fn();
      storageService.suppliers.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('suppliers');
    });

    it('should sort suppliers by name', () => {
      const callback = vi.fn();
      const suppliers = [
        { id: '1', name: 'ZCorp' },
        { id: '2', name: 'Acme' },
        { id: '3', name: 'Beta' }
      ];

      const mockOnSnapshot = vi.fn((cb) => {
        cb({ docs: suppliers.map(s => ({ id: s.id, data: () => s })) });
        return vi.fn();
      });

      vi.mocked(db.collection).mockReturnValue({ onSnapshot: mockOnSnapshot } as any);
      storageService.suppliers.subscribe(callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Acme' }),
        expect.objectContaining({ name: 'Beta' }),
        expect.objectContaining({ name: 'ZCorp' })
      ]);
    });
  });

  describe('monitored flights and tips', () => {
    it('should subscribe to monitored flights', () => {
      const callback = vi.fn();
      storageService.monitoredFlights.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('monitoredFlights');
    });

    it('should subscribe to tips', () => {
      const callback = vi.fn();
      storageService.tips.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('tips');
    });

    it('should subscribe to feedbacks', () => {
      const callback = vi.fn();
      storageService.feedbacks.subscribe(callback);
      expect(db.collection).toHaveBeenCalledWith('feedbacks');
    });
  });
});

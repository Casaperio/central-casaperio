import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMaintenanceFilters } from './useMaintenanceFilters';
import { createMockTicket, createCheckoutTicket } from '../../tests/fixtures/tickets';
import { createMockReservation, createCheckoutReservation } from '../../tests/fixtures/reservations';
import { TicketStatus } from '../../types';

describe('useMaintenanceFilters', () => {
  const defaultProps = {
    tickets: [],
    staysReservations: [],
    searchTerm: '',
    filterStatus: 'all' as const,
    filterMaintenanceAssignee: 'all' as const,
    filterMaintenanceProperty: 'all' as const,
    filterMaintenanceType: 'all' as const,
    activeModule: 'maintenance' as const
  };

  describe('filteredTickets', () => {
    it('should return all tickets when no filters applied', () => {
      const tickets = [
        createMockTicket(),
        createMockTicket(),
        createMockTicket()
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets })
      );

      expect(result.current.filteredTickets).toHaveLength(3);
    });

    it('should filter by status', () => {
      const tickets = [
        createMockTicket({ status: TicketStatus.OPEN, category: 'maintenance' }),
        createMockTicket({ status: TicketStatus.IN_PROGRESS, category: 'maintenance' }),
        createMockTicket({ status: TicketStatus.DONE, category: 'maintenance' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets, filterStatus: TicketStatus.OPEN })
      );

      expect(result.current.filteredTickets).toHaveLength(1);
      expect(result.current.filteredTickets[0].status).toBe(TicketStatus.OPEN);
    });

    it('should filter by assignee', () => {
      const tickets = [
        createMockTicket({ assignee: 'user-1', category: 'maintenance' }),
        createMockTicket({ assignee: 'user-2', category: 'maintenance' }),
        createMockTicket({ assignee: undefined, category: 'maintenance' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets, filterMaintenanceAssignee: 'user-1' })
      );

      expect(result.current.filteredTickets).toHaveLength(1);
      expect(result.current.filteredTickets[0].assignee).toBe('user-1');
    });

    it('should filter by property', () => {
      const tickets = [
        createMockTicket({ propertyCode: '501A' }),
        createMockTicket({ propertyCode: '904B' }),
        createMockTicket({ propertyCode: '501A' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets, filterMaintenanceProperty: '501A' })
      );

      expect(result.current.filteredTickets).toHaveLength(2);
    });

    it('should filter by ticket type (checkout)', () => {
      const tickets = [
        createMockTicket({ isCheckoutTicket: true, category: 'maintenance' }),
        createMockTicket({ isCheckoutTicket: false, category: 'maintenance' }),
        createMockTicket({ isCheckoutTicket: true, category: 'maintenance' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets, filterMaintenanceType: 'checkout' })
      );

      expect(result.current.filteredTickets).toHaveLength(2);
    });

    it('should filter by search term in description', () => {
      const tickets = [
        createMockTicket({ description: 'Porta emperrada' }),
        createMockTicket({ description: 'Vazamento no banheiro' }),
        createMockTicket({ description: 'Troca de lâmpada' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets, searchTerm: 'porta' })
      );

      expect(result.current.filteredTickets).toHaveLength(1);
      expect(result.current.filteredTickets[0].description).toContain('Porta');
    });

    it('should filter by search term case-insensitive', () => {
      const tickets = [
        createMockTicket({ description: 'PORTA EMPERRADA' }),
        createMockTicket({ description: 'porta quebrada' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets, searchTerm: 'PoRtA' })
      );

      expect(result.current.filteredTickets).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const tickets = [
        createMockTicket({ status: TicketStatus.OPEN, propertyCode: '501A', isCheckoutTicket: true, category: 'maintenance' }),
        createMockTicket({ status: TicketStatus.OPEN, propertyCode: '904B', isCheckoutTicket: true, category: 'maintenance' }),
        createMockTicket({ status: TicketStatus.DONE, propertyCode: '501A', isCheckoutTicket: true, category: 'maintenance' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({
          ...defaultProps,
          tickets,
          filterStatus: TicketStatus.OPEN,
          filterMaintenanceProperty: '501A',
          filterMaintenanceType: 'checkout'
        })
      );

      expect(result.current.filteredTickets).toHaveLength(1);
    });

    it('should exclude completed tickets from past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tickets = [
        createMockTicket({
          status: TicketStatus.DONE,
          completedDate: yesterday.toISOString().split('T')[0]
        }),
        createMockTicket({ status: TicketStatus.OPEN })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets })
      );

      expect(result.current.filteredTickets).toHaveLength(1);
      expect(result.current.filteredTickets[0].status).toBe(TicketStatus.OPEN);
    });

    it('should handle empty tickets array', () => {
      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets: [] })
      );

      expect(result.current.filteredTickets).toEqual([]);
    });
  });

  describe('maintenanceGroups', () => {
    it('should group tickets by scheduled date', () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const tickets = [
        createMockTicket({ scheduledDate: today, category: 'maintenance' }),
        createMockTicket({ scheduledDate: tomorrow, category: 'maintenance' }),
        createMockTicket({ scheduledDate: undefined, category: 'maintenance' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets })
      );

      expect(result.current.maintenanceGroups.length).toBeGreaterThan(0);
    });

    it('should create backlog group for unscheduled tickets', () => {
      const tickets = [
        createMockTicket({ scheduledDate: undefined, category: 'maintenance' })
      ];

      const { result } = renderHook(() =>
        useMaintenanceFilters({ ...defaultProps, tickets })
      );

      const backlog = result.current.maintenanceGroups.find(g => g.isBacklog);
      expect(backlog).toBeDefined();
      expect(backlog?.items).toHaveLength(1);
    });
  });
});

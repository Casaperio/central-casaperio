import { describe, it, expect } from 'vitest';
import {
  mapApiStatusToDailyStatus,
  mapGuestToReservation,
  mapCalendarReservationToReservation
} from './staysDataMapper';
import type { GuestData, CalendarReservation } from './staysApiService';
import { ReservationStatus } from '../types';

describe('staysDataMapper', () => {
  describe('mapApiStatusToDailyStatus', () => {
    it('should map checkin to CHECKIN', () => {
      expect(mapApiStatusToDailyStatus('checkin')).toBe('CHECKIN');
    });

    it('should map checkout to CHECKOUT', () => {
      expect(mapApiStatusToDailyStatus('checkout')).toBe('CHECKOUT');
    });

    it('should map staying to INHOUSE', () => {
      expect(mapApiStatusToDailyStatus('staying')).toBe('INHOUSE');
    });

    it('should map unknown status to FUTURE', () => {
      expect(mapApiStatusToDailyStatus('unknown' as any)).toBe('FUTURE');
    });
  });

  describe('mapGuestToReservation', () => {
    const mockGuest: GuestData = {
      id: '123',
      bookingId: 'BK-456',
      guestName: 'João Silva',
      apartmentCode: '501A',
      status: 'checkin',
      checkInDate: '2024-01-15',
      checkInTime: '14:00',
      checkOutDate: '2024-01-20',
      checkOutTime: '11:00',
      guestCount: 2,
      nights: 5,
      platform: 'Airbnb',
      platformImage: 'https://example.com/airbnb.png'
    };

    it('should map all fields correctly', () => {
      const result = mapGuestToReservation(mockGuest);

      expect(result).toMatchObject({
        id: 'stays-123',
        externalId: 'BK-456',
        source: 'Stays',
        channel: 'Airbnb',
        propertyCode: '501A',
        guestName: 'João Silva',
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-20',
        guestCount: 2,
        status: ReservationStatus.CONFIRMED,
        dailyStatus: 'CHECKIN',
        nights: 5,
        platformImage: 'https://example.com/airbnb.png'
      });
    });

    it('should handle missing platform gracefully', () => {
      const guestNoPlatform: GuestData = {
        ...mockGuest,
        platform: null,
        platformImage: ''
      };

      const result = mapGuestToReservation(guestNoPlatform);

      expect(result.channel).toBe('Direto');
      expect(result.platformImage).toBe('');
    });

    it('should map checkout status correctly', () => {
      const checkoutGuest: GuestData = {
        ...mockGuest,
        status: 'checkout'
      };

      const result = mapGuestToReservation(checkoutGuest);

      expect(result.dailyStatus).toBe('CHECKOUT');
    });

    it('should map staying status correctly', () => {
      const stayingGuest: GuestData = {
        ...mockGuest,
        status: 'staying'
      };

      const result = mapGuestToReservation(stayingGuest);

      expect(result.dailyStatus).toBe('INHOUSE');
    });

    it('should initialize with empty expenses array', () => {
      const result = mapGuestToReservation(mockGuest);

      expect(result.expenses).toEqual([]);
    });

    it('should set default boolean flags', () => {
      const result = mapGuestToReservation(mockGuest);

      expect(result.hasBabies).toBe(false);
      expect(result.docsSent).toBe(false);
      expect(result.docsSentToBuilding).toBe(false);
      expect(result.specialAttention).toBe(false);
      expect(result.problemReported).toBe(false);
    });
  });

  describe('mapCalendarReservationToReservation', () => {
    const mockCalendarRes: CalendarReservation = {
      id: '789',
      bookingId: 'BK-999',
      guestName: 'Maria Santos',
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      adults: 2,
      children: 1,
      babies: 0,
      guestCount: 3,
      nights: 4,
      platform: 'Booking.com',
      platformImage: 'https://example.com/booking.png'
    };

    it('should map calendar reservation correctly', () => {
      const result = mapCalendarReservationToReservation(mockCalendarRes, 'AP101');

      expect(result).toMatchObject({
        id: 'stays-789',
        externalId: 'BK-999',
        source: 'Stays',
        channel: 'Booking.com',
        propertyCode: 'AP101',
        guestName: 'Maria Santos',
        checkInDate: '2024-02-01',
        checkOutDate: '2024-02-05',
        guestCount: 3,
        nights: 4,
        platformImage: 'https://example.com/booking.png'
      });
    });

    it('should set hasBabies to true when babies > 0', () => {
      const resWithBabies: CalendarReservation = {
        ...mockCalendarRes,
        babies: 1
      };

      const result = mapCalendarReservationToReservation(resWithBabies, 'AP101');

      expect(result.hasBabies).toBe(true);
    });

    it('should set hasBabies to false when babies = 0', () => {
      const result = mapCalendarReservationToReservation(mockCalendarRes, 'AP101');

      expect(result.hasBabies).toBe(false);
    });

    it('should handle missing platform', () => {
      const resNoPlatform: CalendarReservation = {
        ...mockCalendarRes,
        platform: null,
        platformImage: ''
      };

      const result = mapCalendarReservationToReservation(resNoPlatform, 'TEST-01');

      expect(result.channel).toBe('Direto');
    });

    it('should use provided unit code as propertyCode', () => {
      const result = mapCalendarReservationToReservation(mockCalendarRes, 'CUSTOM-CODE');

      expect(result.propertyCode).toBe('CUSTOM-CODE');
    });

    it('should initialize with confirmed status', () => {
      const result = mapCalendarReservationToReservation(mockCalendarRes, 'AP101');

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('should have undefined dailyStatus (computed later)', () => {
      const result = mapCalendarReservationToReservation(mockCalendarRes, 'AP101');

      expect(result.dailyStatus).toBeUndefined();
    });

    it('should initialize maintenanceAck as not seen', () => {
      const result = mapCalendarReservationToReservation(mockCalendarRes, 'AP101');

      expect(result.maintenanceAck).toEqual({ seen: false });
    });

    it('should initialize empty history array', () => {
      const result = mapCalendarReservationToReservation(mockCalendarRes, 'AP101');

      expect(result.history).toEqual([]);
    });
  });
});

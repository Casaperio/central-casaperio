import { faker } from '@faker-js/faker';
import { Reservation, ReservationStatus } from '../../types';
import { generateId } from '../../utils';

export function createMockReservation(overrides?: Partial<Reservation>): Reservation {
  const checkInDate = faker.date.future();
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + faker.number.int({ min: 1, max: 14 }));

  return {
    id: `stays-${generateId()}`,
    propertyCode: faker.helpers.arrayElement(['501A', '904B', '702C', 'AP101']),
    propertyName: faker.location.streetAddress(),
    guestName: faker.person.fullName(),
    checkInDate: checkInDate.toISOString().split('T')[0],
    checkOutDate: checkOutDate.toISOString().split('T')[0],
    guestCount: faker.number.int({ min: 1, max: 6 }),
    hasBabies: faker.datatype.boolean(),
    status: ReservationStatus.CONFIRMED,
    expenses: [],
    docsSent: faker.datatype.boolean(),
    docsSentToBuilding: faker.datatype.boolean(),
    channel: faker.helpers.arrayElement(['Airbnb', 'Booking.com', 'Direto', 'Expedia']),
    bookingId: `BK-${faker.string.alphanumeric(8)}`,
    ...overrides
  };
}

export function createCheckoutReservation(overrides?: Partial<Reservation>): Reservation {
  const today = new Date();
  return createMockReservation({
    checkOutDate: today.toISOString().split('T')[0],
    status: ReservationStatus.CHECKOUT,
    ...overrides
  });
}

export function createCheckinReservation(overrides?: Partial<Reservation>): Reservation {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 3);

  return createMockReservation({
    checkInDate: today.toISOString().split('T')[0],
    checkOutDate: tomorrow.toISOString().split('T')[0],
    status: ReservationStatus.CHECKIN,
    ...overrides
  });
}

export function createMockReservations(count: number): Reservation[] {
  return Array.from({ length: count }, () => createMockReservation());
}

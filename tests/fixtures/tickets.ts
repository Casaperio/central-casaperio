import { faker } from '@faker-js/faker';
import { Ticket, TicketStatus, ServiceType, TicketCategory } from '../../types';
import { generateId } from '../../utils';

export function createMockTicket(overrides?: Partial<Ticket>): Ticket {
  const propertyCode = faker.helpers.arrayElement(['501A', '904B', '702C', 'AP101', 'COPA-001']);

  return {
    id: generateId(),
    propertyCode,
    propertyName: `Apartamento ${propertyCode}`,
    priority: faker.helpers.arrayElement(['Baixa', 'Média', 'Alta', 'Urgente']),
    serviceType: ServiceType.MAINTENANCE,
    description: faker.lorem.sentence(),
    desiredDate: faker.date.future().toISOString().split('T')[0],
    guestAuth: faker.datatype.boolean(),
    status: TicketStatus.OPEN,
    createdBy: generateId(),
    createdByName: faker.person.fullName(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    category: 'maintenance' as TicketCategory,
    ...overrides
  };
}

export function createCheckoutTicket(reservationId: string, overrides?: Partial<Ticket>): Ticket {
  return createMockTicket({
    serviceType: ServiceType.CHECKOUT_CLEANING,
    isCheckoutTicket: true,
    reservationId,
    description: 'Limpeza de check-out automática',
    priority: 'Alta',
    category: 'maintenance',
    ...overrides
  });
}

export function createPreventiveTicket(overrides?: Partial<Ticket>): Ticket {
  return createMockTicket({
    isPreventive: true,
    recurrence: faker.helpers.arrayElement(['Única', 'Semanal', 'Quinzenal', 'Mensal']),
    category: 'maintenance',
    ...overrides
  });
}

export function createMockTickets(count: number): Ticket[] {
  return Array.from({ length: count }, () => createMockTicket());
}

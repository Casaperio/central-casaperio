import { faker } from '@faker-js/faker';
import { UserWithPassword } from '../../types';
import { generateId } from '../../utils';

export function createMockUser(overrides?: Partial<UserWithPassword>): UserWithPassword {
  return {
    id: generateId(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'test123',
    role: faker.helpers.arrayElement(['Admin', 'Maintenance', 'Guest Relations', 'Office']),
    allowedModules: ['maintenance', 'guest', 'reservations'],
    avatar: faker.image.avatar(),
    ...overrides
  };
}

export function createAdminUser(overrides?: Partial<UserWithPassword>): UserWithPassword {
  return createMockUser({
    role: 'Admin',
    allowedModules: ['maintenance', 'guest', 'reservations', 'inventory', 'office', 'concierge', 'boards', 'field_app', 'management'],
    ...overrides
  });
}

export function createMaintenanceUser(overrides?: Partial<UserWithPassword>): UserWithPassword {
  return createMockUser({
    role: 'Maintenance',
    allowedModules: ['maintenance', 'field_app'],
    ...overrides
  });
}

export function createMockUsers(count: number): UserWithPassword[] {
  return Array.from({ length: count }, () => createMockUser());
}

import { faker } from '@faker-js/faker';
import { Property } from '../../types';

export function createMockProperty(overrides?: Partial<Property>): Property {
  const code = faker.string.alphanumeric({ length: 4, casing: 'upper' });

  return {
    code,
    address: faker.location.streetAddress(),
    wifi_ssid: `WiFi-${code}`,
    wifi_password: faker.internet.password(),
    door_code: faker.string.numeric(4),
    rooms: faker.number.int({ min: 1, max: 4 }),
    beds: faker.number.int({ min: 1, max: 6 }),
    bathrooms: faker.number.int({ min: 1, max: 3 }),
    maxGuests: faker.number.int({ min: 2, max: 8 }),
    ...overrides
  };
}

export function createMockProperties(count: number): Property[] {
  return Array.from({ length: count }, () => createMockProperty());
}

// Specific test properties
export const mockProperty501A: Property = {
  code: '501A',
  address: 'Rua Test 501, Apt A',
  wifi_ssid: 'WiFi-501A',
  wifi_password: 'test123',
  door_code: '1234',
  rooms: 2,
  beds: 3,
  bathrooms: 2,
  maxGuests: 4
};

export const mockPropertyCOPA001: Property = {
  code: 'COPA-001',
  address: 'Av. Atlântica 1000, Copacabana',
  wifi_ssid: 'WiFi-COPA',
  wifi_password: 'copa123',
  door_code: '5678',
  rooms: 3,
  beds: 4,
  bathrooms: 2,
  maxGuests: 6
};

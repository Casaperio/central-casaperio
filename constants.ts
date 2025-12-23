import { Property, ServiceType, Priority, User } from './types';

export const MOCK_PROPERTIES: Property[] = [
  {
    code: 'I-AC-187-102',
    address: 'IPA Alberto de Campos 187/102',
    wifiNetwork: 'Casape_AC102',
    wifiPassword: 'riodejaneiro!',
    doorCode: '123456',
    conciergeHours: '24 Horas',
    sizeM2: 85,
    cleaningFee: 200,
    position: 'Frente',
    viewType: 'Rua',
    hasAntiNoiseWindow: true,
    bathrooms: 2,
    rooms: [
      { id: '1', name: 'Suíte 1', type: 'Suíte', bedType: 'Queen', bedCount: 1, canSplit: true },
      { id: '2', name: 'Quarto 2', type: 'Quarto', bedType: 'Solteiro', bedCount: 2, canSplit: false }
    ]
  },
  {
    code: 'I-AC-187-201',
    address: 'IPA Alberto de Campos 187/201',
    wifiNetwork: 'Casape_AC201',
    wifiPassword: 'ipanemabeach',
    doorCode: '654321',
    conciergeHours: '08h às 22h',
    sizeM2: 70,
    cleaningFee: 180,
    position: 'Fundos',
    viewType: 'Interna',
    bathrooms: 1,
    rooms: [
      { id: '1', name: 'Quarto Principal', type: 'Quarto', bedType: 'King', bedCount: 1, canSplit: true }
    ]
  },
  { code: 'I-VN-302-PH', address: 'Vieira Souto 302 Penthouse' },
  { code: 'I-RL-040-101', address: 'Redentor Leblon 040/101' },
  { code: 'I-BJ-500-302', address: 'Barão de Jaguaripe 500/302' },
  { code: 'I-NP-220-C01', address: 'Nascimento Silva 220 Casa 01' },
  { code: 'I-XA-099-505', address: 'Xavier da Silveira 99/505' },
];

export const SERVICE_TYPES = Object.values(ServiceType);
export const PRIORITIES = Object.values(Priority);

export const CONCIERGE_SERVICE_TYPES = [
  'Transfer / Motorista',
  'Chef em Casa',
  'Limpeza Extra',
  'Compras de Mercado',
  'Passeios Turísticos',
  'Massagem / Spa',
  'Reserva Restaurante',
  'Experiências',
  'Outros'
];

// In a real app, passwords would be hashed and checked on backend
export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Ana Guest Relations',
    email: 'ana@casape.com',
    password: '123',
    role: 'Guest Relations',
    notificationPreferences: { newTicket: true, assignment: true },
    allowedModules: ['guest', 'maintenance', 'concierge']
  },
  {
    id: '2',
    name: 'João Manutenção',
    email: 'joao@casape.com',
    password: '123',
    role: 'Maintenance',
    notificationPreferences: { newTicket: true, assignment: true },
    allowedModules: ['maintenance']
  },
  {
    id: '3',
    name: 'Admin Casapē',
    email: 'admin@casape.com',
    password: 'NAOACESSAR',
    role: 'Admin',
    notificationPreferences: { newTicket: true, assignment: true },
    allowedModules: ['guest', 'maintenance', 'concierge', 'reservations', 'inventory', 'office']
  }
];
/**
 * Platform image mapping configuration
 * Maps platform names to their logo image paths
 */

export interface PlatformImageConfig {
  name: string;
  imagePath: string;
  alt: string;
}

/**
 * Platform image mapping
 * Based on actual API responses from Stays.net:
 * - "API airbnb" for Airbnb bookings
 * - "API booking.com" for Booking.com bookings
 * - "Website" for direct website bookings
 * - "Direto" for direct bookings
 */
export const PLATFORM_IMAGES: Record<string, PlatformImageConfig> = {
  // Airbnb (API returns "API airbnb")
  'API airbnb': {
    name: 'Airbnb',
    imagePath: '/images/platforms/airbnb.png',
    alt: 'Airbnb',
  },

  // Booking.com (API returns "API booking.com")
  'API booking.com': {
    name: 'Booking.com',
    imagePath: '/images/platforms/booking.png',
    alt: 'Booking.com',
  },

  // Website bookings (API returns "Website")
  'Website': {
    name: 'Website',
    imagePath: '/images/platforms/website.png',
    alt: 'Reserva pelo Site',
  },

  // Direct bookings (API returns "Direto")
  'Direto': {
    name: 'Direto',
    imagePath: '/images/platforms/direct.png',
    alt: 'Reserva Direta',
  },

  // Additional platforms
  'API expedia': {
    name: 'Expedia',
    imagePath: '/images/platforms/expedia.png',
    alt: 'Expedia',
  },

  'API vrbo': {
    name: 'VRBO',
    imagePath: '/images/platforms/vrbo.png',
    alt: 'VRBO',
  },
};

/**
 * Default platform configuration for unknown platforms
 */
export const DEFAULT_PLATFORM: PlatformImageConfig = {
  name: 'Outro',
  imagePath: '/images/platforms/default.png',
  alt: 'Plataforma Desconhecida',
};

/**
 * Gets platform image configuration by platform name
 * Supports exact and case-insensitive partial matching
 */
export function getPlatformImage(platform?: string): PlatformImageConfig {
  if (!platform) {
    return DEFAULT_PLATFORM;
  }

  // Try exact match first
  if (PLATFORM_IMAGES[platform]) {
    return PLATFORM_IMAGES[platform];
  }

  // Try case-insensitive partial match
  const normalizedPlatform = platform.toLowerCase();
  for (const [key, config] of Object.entries(PLATFORM_IMAGES)) {
    if (normalizedPlatform.includes(key.toLowerCase())) {
      return config;
    }
  }

  // Return default configuration
  return DEFAULT_PLATFORM;
}

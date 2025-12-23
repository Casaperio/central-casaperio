import { Reservation, ReservationStatus, Property } from '../types';
import { env } from '../env';

// Stays.net Configuration from environment variables
const STAYS_CONFIG = {
  clientId: env.VITE_STAYS_CLIENT_ID,
  clientSecret: env.VITE_STAYS_CLIENT_SECRET,
  baseUrl: env.VITE_STAYS_BASE_URL,
  authUrl: env.VITE_STAYS_AUTH_URL
};

// Public CORS Proxy to bypass browser restrictions
const CORS_PROXY = 'https://corsproxy.io/?';

interface StaysTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface StaysListing {
  _id: string;
  internal_name?: string;
  reference?: string; // Código do imóvel (ex: I-AC-101)
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    zip_code?: string;
    latitude?: string | number;
    longitude?: string | number;
  };
  active: boolean;
  amenities?: string[];
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  max_guests?: number;
  area?: number;
  features?: string[];
}

interface StaysReservation {
  _id: string;
  guest_name: string;
  listing_code?: string;
  listing_id?: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  status: string; 
  creation_date: string;
  comments?: string;
  partner?: {
    name?: string;
  };
  origin?: string;
  price?: {
    total?: number;
    currency?: string;
  };
  total_price?: number; // Fallback field sometimes used
  
  // Review fields (may vary based on Stays API version/configuration)
  guest_review_score?: number; 
  guest_review_comment?: string;
}

export const staysService = {
  // 1. Authenticate with Stays.net
  authenticate: async (): Promise<string> => {
    try {
      const targetUrl = STAYS_CONFIG.authUrl;
      const proxyUrl = CORS_PROXY + encodeURIComponent(targetUrl);

      console.log('Stays: Tentando autenticar em', targetUrl);

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: STAYS_CONFIG.clientId,
          client_secret: STAYS_CONFIG.clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stays Auth Failed Body:', errorText);
        throw new Error(`Falha na autenticação (Status ${response.status})`);
      }

      const data: StaysTokenResponse = await response.json();
      console.log('Stays: Autenticado com sucesso.');
      return data.access_token;
    } catch (error) {
      console.error('Stays Auth Error:', error);
      throw error;
    }
  },

  // 2. Fetch Listings (Properties)
  fetchListings: async (token: string): Promise<Property[]> => {
    try {
      // Endpoint de conteúdo para pegar endereços e nomes
      const targetUrl = `${STAYS_CONFIG.baseUrl}/content/listings?active=true&limit=100`;
      const proxyUrl = CORS_PROXY + encodeURIComponent(targetUrl);

      console.log('Stays: Buscando imóveis...');

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar imóveis (Status ${response.status})`);
      }

      const data = await response.json();
      const items: StaysListing[] = Array.isArray(data) ? data : (data.items || []);

      // Mapear para o formato do App
      return items.map(item => {
        // Tenta montar o endereço mais completo possível
        const addr = item.address;
        const fullAddress = addr 
          ? `${addr.street || ''}, ${addr.number || ''} ${addr.complement ? '- ' + addr.complement : ''}`.trim()
          : item.internal_name || 'Endereço não informado';

        // Usa a referência como código, ou o ID se não tiver referência
        const code = item.reference || item.internal_name?.substring(0, 10) || item._id;

        // Extract Coordinates if available
        let lat = undefined;
        let lng = undefined;
        if (addr?.latitude && addr?.longitude) {
            const parsedLat = parseFloat(String(addr.latitude));
            const parsedLng = parseFloat(String(addr.longitude));
            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                lat = parsedLat;
                lng = parsedLng;
            }
        }

        return {
          code: code,
          address: fullAddress.replace(/^, /, '').replace(/ ,/, ''), // Limpeza básica
          zipCode: addr?.zip_code,
          lat: lat,
          lng: lng,
          staysListingId: item._id,
          amenities: item.amenities || item.features || [],
          maxGuests: item.max_guests,
          bedroomCount: item.bedrooms,
          bedCount: item.beds,
          bathrooms: item.bathrooms,
          sizeM2: item.area
        };
      });

    } catch (error) {
      console.error('Stays Fetch Listings Error:', error);
      throw error;
    }
  },

  // 3. Fetch Reservations
  fetchReservations: async (token: string): Promise<StaysReservation[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Construct the URL with filters. We try to fetch detailed info including price.
      const targetUrl = `${STAYS_CONFIG.baseUrl}/booking/reservations?skip=0&limit=50&filters={"check_in_date":{"$gte":"${today}"}}`;
      const proxyUrl = CORS_PROXY + encodeURIComponent(targetUrl);

      console.log('Stays: Buscando reservas...');

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stays Fetch Failed Body:', errorText);
        throw new Error(`Erro ao buscar reservas (Status ${response.status})`);
      }

      const data = await response.json();
      
      const items = Array.isArray(data) ? data : (data.items || []);
      console.log(`Stays: ${items.length} reservas encontradas.`);
      
      return items;
    } catch (error) {
      console.error('Stays Fetch Error:', error);
      throw error;
    }
  },

  // 4. Map Stays Status to App Status
  mapStatus: (staysStatus: string): ReservationStatus => {
    const s = String(staysStatus);
    if (s === '1') return ReservationStatus.PENDING;
    if (s === '2' || s === '5') return ReservationStatus.CONFIRMED;
    if (s === '3') return ReservationStatus.CANCELED;
    return ReservationStatus.PENDING;
  },

  // 5. Convert Stays Data to Reservation Interface
  normalizeToApp: (staysRes: any): Omit<Reservation, 'createdAt' | 'updatedAt'> => {
    let pCode = staysRes.listing_code || staysRes.listing_id || 'STAYS-UNK';
    
    const checkIn = new Date(staysRes.check_in_date);
    const checkOut = new Date(staysRes.check_out_date);

    // Tentativa de obter o canal
    const partnerName = staysRes.partner?.name || staysRes.origin || 'Direto';

    // Tentativa de obter valor financeiro
    // A API Stays geralmente retorna price object ou total_price no root
    const totalPrice = staysRes.price?.total || staysRes.total_price || 0;

    // Normalização de Review (se existir)
    // Stays pode retornar score em diferentes escalas dependendo da config. Vamos assumir que vem algo e normalizar se necessário.
    // Se não tiver review, deixamos undefined.
    const rating = staysRes.guest_review_score ? Number(staysRes.guest_review_score) : undefined;
    const review = staysRes.guest_review_comment || undefined;

    return {
      id: '', 
      externalId: staysRes._id,
      source: 'Stays',
      channel: partnerName,
      propertyCode: pCode,
      propertyName: 'Importado via Stays.net',
      guestName: staysRes.guest_name || 'Hóspede (Stays)',
      checkInDate: !isNaN(checkIn.getTime()) ? checkIn.toISOString() : new Date().toISOString(),
      checkOutDate: !isNaN(checkOut.getTime()) ? checkOut.toISOString() : new Date().toISOString(),
      guestCount: Number(staysRes.guests) || 1,
      hasBabies: false,
      docsSent: false,
      status: staysService.mapStatus(staysRes.status),
      maintenanceAck: { seen: false },
      language: 'Outro',
      notes: staysRes.comments || '',
      roomConfig: '',
      flightInfo: '',
      totalValue: Number(totalPrice),
      currency: staysRes.price?.currency || 'BRL',
      channelRating: rating,
      channelReview: review
    };
  }
};
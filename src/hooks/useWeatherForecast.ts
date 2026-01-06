/**
 * Hook for fetching 3-day weather forecast from Open-Meteo API (Rio de Janeiro)
 * Uses localStorage cache to reduce API calls (30 min TTL)
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Sun, Cloud, CloudFog, CloudRain, CloudLightning, CloudDrizzle, CloudSun, LucideIcon
} from 'lucide-react';

// Rio de Janeiro coordinates
const RIO_LATITUDE = -22.9068;
const RIO_LONGITUDE = -43.1729;
const CACHE_KEY = 'casape_weather_forecast';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface WeatherDay {
  date: string;
  dayLabel: string; // "Hoje", "Amanhã", or weekday name
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  icon: LucideIcon;
  iconLabel: string;
}

interface WeatherForecastState {
  data: WeatherDay[] | null;
  loading: boolean;
  error: string | null;
  refreshedAt: number | null;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weathercode: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

interface CachedData {
  data: WeatherDay[];
  timestamp: number;
}

/**
 * Map Open-Meteo weather code to icon and label
 * Reference: https://open-meteo.com/en/docs
 */
function mapWeatherCode(code: number): { icon: LucideIcon; label: string } {
  if (code === 0 || code === 1) {
    return { icon: Sun, label: 'Ensolarado' };
  }
  if (code === 2) {
    return { icon: CloudSun, label: 'Parcialmente nublado' };
  }
  if (code === 3) {
    return { icon: Cloud, label: 'Nublado' };
  }
  if (code === 45 || code === 48) {
    return { icon: CloudFog, label: 'Neblina' };
  }
  if (code === 51 || code === 53 || code === 55) {
    return { icon: CloudDrizzle, label: 'Garoa' };
  }
  if (code === 61 || code === 63 || code === 65 || code === 80 || code === 81 || code === 82) {
    return { icon: CloudRain, label: 'Chuva' };
  }
  if (code === 95 || code === 96 || code === 99) {
    return { icon: CloudLightning, label: 'Trovoada' };
  }
  // Fallback
  return { icon: Cloud, label: 'Nublado' };
}

/**
 * Get day label (Hoje, Amanhã, or weekday name)
 */
function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  
  // Parse date in Brazil timezone to avoid UTC conversion issues
  const date = new Date(dateStr + 'T12:00:00-03:00');
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

/**
 * Fetch weather from Open-Meteo API
 */
async function fetchWeatherForecast(): Promise<WeatherDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${RIO_LATITUDE}&longitude=${RIO_LONGITUDE}&current=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=America/Sao_Paulo&forecast_days=3`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar previsão: ${response.status}`);
  }
  
  const data: OpenMeteoResponse = await response.json();
  
  const days: WeatherDay[] = data.daily.time.map((date, index) => {
    // Para o primeiro dia (hoje), usar temperatura atual em vez da máxima
    const code = index === 0 ? data.current.weathercode : data.daily.weathercode[index];
    const { icon, label } = mapWeatherCode(code);
    
    return {
      date,
      dayLabel: getDayLabel(date, index),
      // Para hoje, mostrar temperatura atual como máxima
      tempMax: Math.round(index === 0 ? data.current.temperature_2m : data.daily.temperature_2m_max[index]),
      tempMin: Math.round(data.daily.temperature_2m_min[index]),
      weatherCode: code,
      icon,
      iconLabel: label,
    };
  });
  
  return days;
}

/**
 * Get cached data from localStorage
 */
function getCachedData(): WeatherDay[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - parsed.timestamp < CACHE_TTL) {
      // Re-hydrate icon references (they don't serialize)
      return parsed.data.map(day => ({
        ...day,
        icon: mapWeatherCode(day.weatherCode).icon,
      }));
    }
    
    // Cache expired
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading weather cache:', error);
    return null;
  }
}

/**
 * Save data to localStorage cache
 */
function setCachedData(data: WeatherDay[]): void {
  try {
    const cacheData: CachedData = {
      data: data.map(day => ({
        ...day,
        icon: Sun, // Placeholder, will be re-hydrated on load
      })),
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving weather cache:', error);
  }
}

/**
 * Hook for 3-day weather forecast with caching
 */
export function useWeatherForecast() {
  const [state, setState] = useState<WeatherForecastState>({
    data: null,
    loading: true,
    error: null,
    refreshedAt: null,
  });

  const fetchData = useCallback(async (ignoreCache = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Try cache first (unless forced refresh)
      if (!ignoreCache) {
        const cached = getCachedData();
        if (cached) {
          setState({
            data: cached,
            loading: false,
            error: null,
            refreshedAt: Date.now(),
          });
          return;
        }
      }

      // Fetch from API
      const data = await fetchWeatherForecast();
      setCachedData(data);
      
      setState({
        data,
        loading: false,
        error: null,
        refreshedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar previsão',
        refreshedAt: null,
      });
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Force refresh (ignores cache)
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    ...state,
    refresh,
  };
}

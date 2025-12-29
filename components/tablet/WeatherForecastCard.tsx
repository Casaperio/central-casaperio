/**
 * Weather Forecast Card Component for Tablet Mode
 * Displays 3-day weather forecast for Rio de Janeiro
 */

import React from 'react';
import { RefreshCw, MapPin, AlertCircle } from 'lucide-react';
import { useWeatherForecast } from '../../src/hooks/useWeatherForecast';

export const WeatherForecastCard: React.FC = () => {
  const { data, loading, error, refresh, refreshedAt } = useWeatherForecast();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-white">
          <MapPin size={20} className="opacity-90" />
          <div>
            <h3 className="font-bold text-base leading-tight">Previsão do tempo</h3>
            <p className="text-xs opacity-90">Rio de Janeiro</p>
          </div>
        </div>
        
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 hover:bg-white/20 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Atualizar previsão"
        >
          <RefreshCw 
            size={18} 
            className={`text-white ${loading ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Loading State */}
        {loading && !data && (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-16 rounded-lg mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mx-auto mb-2"></div>
                <div className="bg-gray-200 h-6 rounded w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle size={32} className="text-red-400 mb-3" />
            <p className="text-sm text-gray-600">Não foi possível carregar a previsão</p>
            <button
              onClick={refresh}
              className="mt-3 text-xs text-blue-600 hover:underline font-medium"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Data Display */}
        {data && !error && (
          <div className="grid grid-cols-3 gap-4">
            {data.map((day, index) => {
              const Icon = day.icon;
              
              return (
                <div
                  key={day.date}
                  className={`
                    flex flex-col items-center justify-center
                    p-4 rounded-xl border-2 transition-all
                    ${
                      index === 0
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  {/* Day Label */}
                  <p className={`
                    text-xs font-semibold uppercase tracking-wide mb-2
                    ${index === 0 ? 'text-blue-700' : 'text-gray-600'}
                  `}>
                    {day.dayLabel}
                  </p>

                  {/* Weather Icon */}
                  <div className="mb-3">
                    <Icon 
                      size={36} 
                      className={`
                        ${index === 0 ? 'text-blue-600' : 'text-gray-600'}
                        drop-shadow-sm
                      `}
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Icon Label */}
                  <p className="text-xs text-gray-600 mb-2 text-center leading-tight h-8 flex items-center">
                    {day.iconLabel}
                  </p>

                  {/* Temperature */}
                  <div className="flex items-center gap-1.5">
                    <span className={`
                      text-2xl font-bold
                      ${index === 0 ? 'text-blue-700' : 'text-gray-800'}
                    `}>
                      {day.tempMax}°
                    </span>
                    {index === 0 ? (
                      <span className="text-xs text-gray-500 font-medium">
                        agora
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 font-medium">
                        / {day.tempMin}°
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Last Updated */}
        {refreshedAt && !loading && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Atualizado às {new Date(refreshedAt).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default WeatherForecastCard;

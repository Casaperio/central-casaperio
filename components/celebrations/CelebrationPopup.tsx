import React from 'react';
import Confetti from 'react-confetti';
import { Reservation } from '../../types';

interface CelebrationPopupProps {
  show: boolean;
  newReservations: Reservation[];
  onClose: () => void;
  windowSize: { width: number; height: number };
}

/**
 * CelebrationPopup - Displays a celebration modal with confetti when new reservations are detected
 *
 * Extracted from App.tsx to eliminate 268 lines of duplicated code
 * Originally appeared in lines 1154-1277 and 1996-2130
 */
export function CelebrationPopup({
  show,
  newReservations,
  onClose,
  windowSize
}: CelebrationPopupProps) {
  // Helper function for date formatting
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper function for currency formatting
  const formatValue = (value: number, currency?: string): string => {
    const currencySymbol = currency === 'USD' ? '$' : 'R$';
    return `${currencySymbol} ${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (!show || newReservations.length === 0) {
    return null;
  }

  return (
    <>
      {/* Full Screen Black Background with Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-6xl max-h-[90vh] overflow-auto">

          {/* Emoji */}
          <div className="text-[8rem] mb-8 text-center">🎉</div>

          {/* Title */}
          <h1 className="mb-8 font-bold text-gray-800 text-6xl text-center">
            {newReservations.length === 1
              ? 'Nova Reserva Confirmada!'
              : `${newReservations.length} Novas Reservas!`
            }
          </h1>

          {/* Content - Varies by quantity */}
          {newReservations.length === 1 ? (
            // CASE 1: SINGLE RESERVATION - Full details
            <div className="space-y-4 text-left text-2xl text-gray-700">
              <div className="flex items-center gap-3">
                <span className="font-semibold">👤 Hóspede:</span>
                <span>{newReservations[0].guestName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">🏠 Propriedade:</span>
                <span>{newReservations[0].propertyCode}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">📅 Check-in:</span>
                <span>{formatDate(newReservations[0].checkInDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">📅 Check-out:</span>
                <span>{formatDate(newReservations[0].checkOutDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">🌙 Noites:</span>
                <span>{newReservations[0].nights || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">👥 Hóspedes:</span>
                <span>{newReservations[0].guestCount}</span>
              </div>
              {newReservations[0].channel && (
                <div className="flex items-center gap-3">
                  <span className="font-semibold">🌐 Plataforma:</span>
                  <span>{newReservations[0].channel}</span>
                </div>
              )}
              {newReservations[0].totalValue && (
                <div className="flex items-center gap-3">
                  <span className="font-semibold">💰 Valor:</span>
                  <span>{formatValue(newReservations[0].totalValue, newReservations[0].currency)}</span>
                </div>
              )}
            </div>
          ) : newReservations.length <= 3 ? (
            // CASE 2: 2-3 RESERVATIONS - Side-by-side cards
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newReservations.map((res, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                  <h3 className="font-bold text-xl mb-3 text-gray-800">{res.guestName}</h3>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">🏠</span>
                      <span className="text-sm">{res.propertyCode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">📅</span>
                      <span className="text-sm">{formatDate(res.checkInDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">🌙</span>
                      <span className="text-sm">{res.nights || '-'} noites</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">👥</span>
                      <span className="text-sm">{res.guestCount} hóspedes</span>
                    </div>
                    {res.channel && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">🌐</span>
                        <span className="text-sm">{res.channel}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // CASE 3: 4+ RESERVATIONS - Scrollable list
            <div className="max-h-[60vh] overflow-y-auto bg-gray-50 rounded-2xl p-6">
              <div className="space-y-3">
                {newReservations.map((res, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center gap-4 text-gray-700">
                      <span className="font-bold text-lg">{res.guestName}</span>
                      <span className="text-gray-500">|</span>
                      <span>🏠 {res.propertyCode}</span>
                      <span className="text-gray-500">|</span>
                      <span>📅 {formatDate(res.checkInDate)}</span>
                      <span className="text-gray-500">→</span>
                      <span>{formatDate(res.checkOutDate)}</span>
                      <span className="text-gray-500">|</span>
                      <span>🌙 {res.nights || '-'}n</span>
                      {res.channel && (
                        <>
                          <span className="text-gray-500">|</span>
                          <span>🌐 {res.channel}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Confetti on top */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={500}
        recycle={false}
        gravity={0.3}
        wind={0.01}
        style={{ zIndex: 10000 }}
      />
    </>
  );
}

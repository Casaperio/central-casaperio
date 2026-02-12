import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, Crown, DollarSign, MessageSquare, Moon, Repeat, Star, X } from 'lucide-react';
import { Reservation, ReservationStatus } from '../types';
import { getDetailedFinancials } from '../services/staysApiService';
import { storageService } from '../services/storage';
import { formatCurrency, formatDatePtBR } from '../utils';

interface GuestSummaryModalProps {
  guestName: string;
  staysReservations: Reservation[];
  onClose: () => void;
}

const normalizeGuestName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

const calculateReservationNights = (reservation: Reservation): number => {
  if (reservation.nights && reservation.nights > 0) {
    return reservation.nights;
  }

  const checkIn = new Date(reservation.checkInDate).getTime();
  const checkOut = new Date(reservation.checkOutDate).getTime();
  const diff = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff || 0);
};

const GuestSummarySkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg border border-gray-200 bg-gray-100" />
      ))}
    </div>
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg border border-gray-200 bg-gray-100" />
      ))}
    </div>
  </div>
);

const GuestSummaryModal: React.FC<GuestSummaryModalProps> = ({ guestName, staysReservations, onClose }) => {
  const guestKey = useMemo(() => normalizeGuestName(guestName), [guestName]);

  const guestReservations = useMemo(() => {
    return staysReservations
      .filter((reservation) => normalizeGuestName(reservation.guestName) === guestKey)
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
  }, [guestKey, staysReservations]);

  const activeReservations = useMemo(
    () => guestReservations.filter((reservation) => reservation.status !== ReservationStatus.CANCELED),
    [guestReservations]
  );

  const financialRange = useMemo(() => {
    if (activeReservations.length === 0) return null;

    const dates = activeReservations
      .flatMap((reservation) => [reservation.checkInDate, reservation.checkOutDate])
      .map((value) => value.split('T')[0])
      .sort();

    return {
      from: dates[0],
      to: dates[dates.length - 1],
    };
  }, [activeReservations]);

  const {
    data: detailedFinancialData,
    isLoading: isLoadingFinancial,
    isError: hasFinancialError,
  } = useQuery({
    queryKey: ['guest-summary-financial', guestKey, financialRange?.from, financialRange?.to],
    queryFn: () => getDetailedFinancials(financialRange?.from, financialRange?.to),
    enabled: Boolean(financialRange),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const {
    data: guestNote,
    isLoading: isLoadingNote,
    isError: hasGuestNoteError,
  } = useQuery({
    queryKey: ['guest-summary-note', guestKey],
    queryFn: () => storageService.guestNotes.get(guestKey),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const financialMap = useMemo(() => {
    const map = new Map<string, number>();
    detailedFinancialData?.reservations?.forEach((item) => {
      map.set(item.bookingCode, item.reserveTotal || 0);
      map.set(item.reservationId, item.reserveTotal || 0);
    });
    return map;
  }, [detailedFinancialData]);

  const reservationTotals = useMemo(() => {
    return activeReservations.map((reservation) => {
      const hasExternal = Boolean(reservation.externalId && financialMap.has(reservation.externalId));
      const hasInternal = Boolean(reservation.id && financialMap.has(reservation.id));
      const apiTotal = hasExternal
        ? financialMap.get(reservation.externalId as string)
        : hasInternal
          ? financialMap.get(reservation.id)
          : undefined;
      const fallbackTotal = reservation.totalValue || 0;
      const expensesTotal = reservation.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

      return {
        reservation,
        totalValue: (apiTotal ?? fallbackTotal) + expensesTotal,
      };
    });
  }, [activeReservations, financialMap]);

  const metrics = useMemo(() => {
    const totalStays = activeReservations.length;
    const totalNights = activeReservations.reduce((sum, reservation) => {
      return sum + calculateReservationNights(reservation);
    }, 0);
    const totalSpend = reservationTotals.reduce((sum, item) => sum + item.totalValue, 0);
    const propertiesVisited = new Set(activeReservations.map((reservation) => reservation.propertyCode)).size;

    return {
      totalStays,
      totalNights,
      totalSpend,
      propertiesVisited,
      averageTicket: totalStays > 0 ? totalSpend / totalStays : 0,
      vip: totalSpend >= 10000,
    };
  }, [activeReservations, reservationTotals]);

  const guestComments = useMemo(() => {
    return guestReservations
      .filter((reservation) => Boolean(reservation.channelReview))
      .map((reservation) => ({
        propertyCode: reservation.propertyCode,
        checkOutDate: reservation.checkOutDate,
        rating: reservation.channelRating,
        comment: reservation.channelReview as string,
      }));
  }, [guestReservations]);

  const guestOrdinal = metrics.totalStays > 0 ? `${metrics.totalStays}ª reserva` : '1ª reserva';
  const showInitialSkeleton = isLoadingFinancial || isLoadingNote;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col bg-white md:mx-auto md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 p-4 md:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">{guestName}</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                <Repeat size={12} /> {guestOrdinal}
              </span>
              {metrics.vip && (
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                  <Crown size={12} /> VIP
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">Resumo consolidado do hospede no Guest & CRM.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar resumo do hospede"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
          {showInitialSkeleton ? (
            <GuestSummarySkeleton />
          ) : (
            <>
              {hasFinancialError && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Nao foi possivel carregar os financeiros detalhados agora. Exibindo totais de fallback.</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total gasto</p>
                  <p className="mt-2 flex items-center gap-1 text-xl font-bold text-emerald-700">
                    <DollarSign size={18} /> {formatCurrency(metrics.totalSpend)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total noites</p>
                  <p className="mt-2 flex items-center gap-1 text-xl font-bold text-blue-700">
                    <Moon size={18} /> {metrics.totalNights}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nº de estadias</p>
                  <p className="mt-2 flex items-center gap-1 text-xl font-bold text-purple-700">
                    <CalendarDays size={18} /> {metrics.totalStays}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ticket medio</p>
                  <p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(metrics.averageTicket)}</p>
                </div>
              </div>
            </>
          )}

          <section className="rounded-lg border border-gray-200 bg-white">
            <header className="flex items-center justify-between border-b border-gray-100 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">Historico de reservas</h3>
              <span className="text-xs text-gray-500">{metrics.propertiesVisited} imoveis</span>
            </header>
            <div className="max-h-[280px] divide-y divide-gray-100 overflow-y-auto">
              {reservationTotals.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">Nenhuma reserva encontrada para este hospede.</p>
              ) : (
                reservationTotals.map(({ reservation, totalValue }) => (
                  <div key={`${reservation.id}-${reservation.checkInDate}`} className="p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{reservation.propertyCode}</p>
                      <span className="text-xs font-medium text-gray-500">{reservation.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDatePtBR(reservation.checkInDate)} - {formatDatePtBR(reservation.checkOutDate)} - {calculateReservationNights(reservation)} noites
                    </p>
                    <p className="mt-2 text-sm font-semibold text-emerald-700">{formatCurrency(totalValue)}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white">
            <header className="border-b border-gray-100 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                <MessageSquare size={14} /> Comentarios
              </h3>
            </header>
            <div className="space-y-4 p-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Observacao interna</p>
                {isLoadingNote ? (
                  <div className="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
                ) : hasGuestNoteError ? (
                  <p className="text-sm text-amber-700">Nao foi possivel carregar observacoes internas.</p>
                ) : guestNote?.note ? (
                  <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">{guestNote.note}</p>
                ) : (
                  <p className="text-sm text-gray-400">Sem observacoes internas para este hospede.</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Avaliacoes de canal</p>
                {guestComments.length === 0 ? (
                  <p className="text-sm text-gray-400">Sem comentarios de canais para este hospede.</p>
                ) : (
                  <div className="space-y-3">
                    {guestComments.slice(0, 6).map((comment, index) => (
                      <div key={`${comment.propertyCode}-${comment.checkOutDate}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-700">{comment.propertyCode}</p>
                          <span className="text-xs text-gray-500">{formatDatePtBR(comment.checkOutDate)}</span>
                        </div>
                        {comment.rating && (
                          <p className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Star size={12} className="fill-amber-400 text-amber-400" /> {comment.rating.toFixed(1)}
                          </p>
                        )}
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GuestSummaryModal;

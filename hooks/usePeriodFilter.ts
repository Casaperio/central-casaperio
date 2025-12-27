import { useState, useEffect, useMemo } from 'react';

export type PeriodPreset = 'current-month' | 'last-30-days' | 'ytd' | 'last-12-months' | 'custom';

interface PeriodFilter {
  preset: PeriodPreset;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

interface UsePeriodFilterReturn {
  preset: PeriodPreset;
  from: string;
  to: string;
  setPreset: (preset: PeriodPreset) => void;
  setCustomPeriod: (from: string, to: string) => void;
}

/**
 * Calcula o período baseado no preset
 */
function calculatePeriodFromPreset(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (preset) {
    case 'current-month': {
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      return { from: firstDay, to: today };
    }

    case 'last-30-days': {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { from: thirtyDaysAgo.toISOString().split('T')[0], to: today };
    }

    case 'ytd': {
      const year = now.getFullYear();
      const firstDayOfYear = `${year}-01-01`;
      return { from: firstDayOfYear, to: today };
    }

    case 'last-12-months': {
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      return { from: twelveMonthsAgo.toISOString().split('T')[0], to: today };
    }

    case 'custom':
      // Custom deve ser definido explicitamente via setCustomPeriod
      return { from: today, to: today };

    default:
      return { from: today, to: today };
  }
}

/**
 * Hook para gerenciar filtro de período com persistência em query params
 */
export function usePeriodFilter(): UsePeriodFilterReturn {
  // Ler query params iniciais
  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { preset: 'current-month' as PeriodPreset, from: '', to: '' };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const preset = (urlParams.get('preset') as PeriodPreset) || 'current-month';
    const from = urlParams.get('from') || '';
    const to = urlParams.get('to') || '';

    // Se tem from/to nos params, usar custom
    if (from && to) {
      return { preset: 'custom' as PeriodPreset, from, to };
    }

    // Calcular período do preset
    const { from: calculatedFrom, to: calculatedTo } = calculatePeriodFromPreset(preset);
    return { preset, from: calculatedFrom, to: calculatedTo };
  }, []);

  const [period, setPeriod] = useState<PeriodFilter>({
    preset: initialParams.preset,
    from: initialParams.from,
    to: initialParams.to,
  });

  // Atualizar query params quando o período mudar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);

    if (period.preset === 'custom') {
      urlParams.set('preset', 'custom');
      urlParams.set('from', period.from);
      urlParams.set('to', period.to);
    } else {
      urlParams.set('preset', period.preset);
      urlParams.delete('from');
      urlParams.delete('to');
    }

    // Atualizar URL sem recarregar a página
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [period]);

  const setPreset = (preset: PeriodPreset) => {
    const { from, to } = calculatePeriodFromPreset(preset);
    setPeriod({ preset, from, to });
  };

  const setCustomPeriod = (from: string, to: string) => {
    setPeriod({ preset: 'custom', from, to });
  };

  return {
    preset: period.preset,
    from: period.from,
    to: period.to,
    setPreset,
    setCustomPeriod,
  };
}

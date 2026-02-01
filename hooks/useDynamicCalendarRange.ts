/**
 * useDynamicCalendarRange Hook
 * 
 * Gerencia carregamento dinâmico de dados do calendário conforme navegação
 * Expande o range automaticamente quando o usuário navega para fora do período carregado
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface DynamicRangeOptions {
  /**
   * Data inicial visível no calendário
   */
  visibleStartDate: Date;
  
  /**
   * Número de dias visíveis no calendário
   */
  visibleDays: number;
  
  /**
   * Modo do calendário (normal ou fullscreen)
   */
  mode: 'normal' | 'fullscreen';
  
  /**
   * Callback quando o range precisa ser expandido
   */
  onRangeChange: (from: string, to: string) => void;
}

interface DynamicRangeResult {
  /**
   * Range atual de dados carregados
   */
  dataRange: {
    from: string;
    to: string;
  };
  
  /**
   * Indica se precisa carregar mais dados
   */
  needsExpansion: boolean;
  
  /**
   * Expande o range para incluir as datas visíveis
   */
  expandRange: () => void;
}

/**
 * Formata Date para string YYYY-MM-DD
 */
function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse string YYYY-MM-DD para Date
 */
function parseDateStr(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calcula range inicial baseado no modo
 */
function getInitialRange(mode: 'normal' | 'fullscreen'): { from: string; to: string } {
  const today = new Date();
  
  if (mode === 'fullscreen') {
    // Fullscreen: 6 meses para frente
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 180);
    return {
      from: formatDateStr(today),
      to: formatDateStr(endDate),
    };
  } else {
    // Normal: início do mês atual até +3 meses
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    return {
      from: formatDateStr(startDate),
      to: formatDateStr(endDate),
    };
  }
}

/**
 * Hook para gerenciar range dinâmico de dados do calendário
 */
export function useDynamicCalendarRange(options: DynamicRangeOptions): DynamicRangeResult {
  const { visibleStartDate, visibleDays, mode, onRangeChange } = options;
  
  // Range atual de dados carregados
  const [dataRange, setDataRange] = useState(() => getInitialRange(mode));
  
  // Ref para evitar expansões redundantes
  const lastExpansionRef = useRef<string>('');
  
  // Calcula data final visível
  const visibleEndDate = new Date(visibleStartDate);
  visibleEndDate.setDate(visibleEndDate.getDate() + visibleDays);
  
  // Verifica se precisa expandir o range
  const needsExpansion = useCallback(() => {
    const dataStart = parseDateStr(dataRange.from);
    const dataEnd = parseDateStr(dataRange.to);
    
    // Buffer de 30 dias para trigger de expansão
    const BUFFER_DAYS = 30;
    
    // Verifica se está próximo do início do range
    const daysFromStart = Math.floor((visibleStartDate.getTime() - dataStart.getTime()) / (1000 * 60 * 60 * 24));
    const needsBackwardExpansion = daysFromStart < BUFFER_DAYS && daysFromStart >= 0;
    
    // Verifica se está próximo do fim do range
    const daysToEnd = Math.floor((dataEnd.getTime() - visibleEndDate.getTime()) / (1000 * 60 * 60 * 24));
    const needsForwardExpansion = daysToEnd < BUFFER_DAYS && daysToEnd >= 0;
    
    return needsBackwardExpansion || needsForwardExpansion;
  }, [dataRange, visibleStartDate, visibleEndDate]);
  
  // Expande o range
  const expandRange = useCallback(() => {
    const dataStart = parseDateStr(dataRange.from);
    const dataEnd = parseDateStr(dataRange.to);
    
    // Expansão de 90 dias em cada direção
    const EXPANSION_DAYS = 90;
    
    let newFrom = dataRange.from;
    let newTo = dataRange.to;
    
    // Verifica se precisa expandir para trás
    const daysFromStart = Math.floor((visibleStartDate.getTime() - dataStart.getTime()) / (1000 * 60 * 60 * 24));
    if (daysFromStart < 30 && daysFromStart >= 0) {
      const newStart = new Date(dataStart);
      newStart.setDate(newStart.getDate() - EXPANSION_DAYS);
      newFrom = formatDateStr(newStart);
    }
    
    // Verifica se precisa expandir para frente
    const daysToEnd = Math.floor((dataEnd.getTime() - visibleEndDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToEnd < 30 && daysToEnd >= 0) {
      const newEnd = new Date(dataEnd);
      newEnd.setDate(newEnd.getDate() + EXPANSION_DAYS);
      newTo = formatDateStr(newEnd);
    }
    
    // Evita expansões redundantes
    const expansionKey = `${newFrom}-${newTo}`;
    if (expansionKey === lastExpansionRef.current) {
      return;
    }
    
    lastExpansionRef.current = expansionKey;
    
    // Atualiza o range e notifica
    setDataRange({ from: newFrom, to: newTo });
    onRangeChange(newFrom, newTo);
    
    console.log(`📅 [DynamicRange] Expandindo range: ${newFrom} → ${newTo}`);
  }, [dataRange, visibleStartDate, visibleEndDate, onRangeChange]);
  
  // Auto-expand quando necessário
  useEffect(() => {
    if (needsExpansion()) {
      expandRange();
    }
  }, [needsExpansion, expandRange]);
  
  // Reset range quando modo mudar
  useEffect(() => {
    const initialRange = getInitialRange(mode);
    setDataRange(initialRange);
    lastExpansionRef.current = '';
    onRangeChange(initialRange.from, initialRange.to);
  }, [mode, onRangeChange]);
  
  return {
    dataRange,
    needsExpansion: needsExpansion(),
    expandRange,
  };
}

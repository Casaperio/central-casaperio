import { useState, useMemo, useCallback } from 'react';
import { MaintenanceGroup } from './useMaintenanceFilters';

const ITEMS_PER_PAGE = 20;

interface UseMaintenancePaginationProps {
  groups: MaintenanceGroup[];
  resetTrigger?: any; // Quando mudar, reseta a paginação
}

export function useMaintenancePagination({ groups, resetTrigger }: UseMaintenancePaginationProps) {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Resetar quando os filtros mudarem
  useMemo(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [resetTrigger]);

  // Contar total de items
  const totalItems = useMemo(() => {
    return groups.reduce((sum, group) => sum + group.items.length, 0);
  }, [groups]);

  // Agrupar items paginados
  const paginatedGroups = useMemo(() => {
    let itemCount = 0;
    const result: MaintenanceGroup[] = [];

    for (const group of groups) {
      if (itemCount >= displayCount) break;

      const remainingSlots = displayCount - itemCount;

      if (group.items.length <= remainingSlots) {
        // Grupo inteiro cabe
        result.push(group);
        itemCount += group.items.length;
      } else {
        // Grupo parcial
        result.push({
          ...group,
          items: group.items.slice(0, remainingSlots)
        });
        itemCount += remainingSlots;
      }
    }

    return result;
  }, [groups, displayCount]);

  const hasMore = displayCount < totalItems;

  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  }, []);

  const reset = useCallback(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, []);

  return {
    paginatedGroups,
    hasMore,
    loadMore,
    reset,
    displayCount,
    totalItems,
  };
}

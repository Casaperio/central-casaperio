import { useState, useMemo, useEffect } from 'react';

export interface PaginationConfig {
  itemsPerPage: number;
  currentPage: number;
  totalItems: number;
}

export interface PaginationControls {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setItemsPerPage: (itemsPerPage: number) => void;
}

interface UsePaginationProps<T> {
  items: T[];
  initialItemsPerPage?: number;
  resetTrigger?: string | number; // Qualquer mudança nesse valor reseta para página 1
}

/**
 * Hook genérico de paginação client-side
 * Retorna:
 * - paginatedItems: array com apenas os itens da página atual
 * - pagination: objeto com controles de navegação
 */
export function usePagination<T>({
  items,
  initialItemsPerPage = 10,
  resetTrigger,
}: UsePaginationProps<T>): {
  paginatedItems: T[];
  pagination: PaginationControls;
} {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset para página 1 quando filtros mudarem
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setCurrentPage(1);
    }
  }, [resetTrigger]);

  // Reset para página 1 quando itemsPerPage mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Ajusta página atual se estiver fora do range válido
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Calcula itens da página atual
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const pagination: PaginationControls = {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage: (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    nextPage: () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    },
    previousPage: () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
    setItemsPerPage: (newItemsPerPage: number) => {
      setItemsPerPageState(newItemsPerPage);
    },
  };

  return {
    paginatedItems,
    pagination,
  };
}

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, List } from 'lucide-react';
import { PaginationControls } from '../../hooks/features/usePagination';

interface PaginationBarProps {
  pagination: PaginationControls;
  className?: string;
}

/**
 * Componente de barra de paginação reutilizável
 * Estilo consistente com PeriodFilter
 */
export const PaginationBar: React.FC<PaginationBarProps> = ({ pagination, className = '' }) => {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    setItemsPerPage,
  } = pagination;

  // Não renderizar se não houver itens
  if (totalItems === 0) {
    return null;
  }

  // Calcular índices de exibição
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Gerar array de páginas para exibição (max 7 botões)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Mostrar todas as páginas se forem 7 ou menos
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sempre mostrar primeira página
      pages.push(1);

      if (currentPage <= 3) {
        // Início: 1, 2, 3, 4, ..., última
        pages.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Fim: 1, ..., -3, -2, -1, última
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Meio: 1, ..., atual-1, atual, atual+1, ..., última
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mt-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Info de itens + seletor */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
          <span>
            Mostrando <span className="font-semibold text-gray-900">{startIndex}</span> até{' '}
            <span className="font-semibold text-gray-900">{endIndex}</span> de{' '}
            <span className="font-semibold text-gray-900">{totalItems}</span> {totalItems === 1 ? 'item' : 'itens'}
          </span>

          {/* Seletor de itens por página com estilo do PeriodFilter */}
          <div className="flex items-center gap-2">
            <List size={16} className="text-gray-500" />
            <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Por página:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#02475F] bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={40}>40</option>
              <option value={60}>60</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Controles de navegação com estilo do PeriodFilter */}
        <div className="flex items-center gap-2">
          {/* Primeira página */}
          <button
            onClick={() => goToPage(1)}
            disabled={!hasPreviousPage}
            className="p-2 rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
            title="Primeira página"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Página anterior */}
          <button
            onClick={previousPage}
            disabled={!hasPreviousPage}
            className="p-2 rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Números de página */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400">
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                    isActive
                      ? 'bg-[#02475F] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Próxima página */}
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className="p-2 rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
            title="Próxima página"
          >
            <ChevronRight size={16} />
          </button>

          {/* Última página */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={!hasNextPage}
            className="p-2 rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
            title="Última página"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

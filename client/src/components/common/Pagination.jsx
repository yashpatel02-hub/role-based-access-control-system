import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
}) => {
  if (totalPages <= 1 && totalItems <= limit) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span
            key={`dots-${index}`}
            style={{
              padding: '0 6px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ...
          </span>
        );
      }

      const isActive = page === currentPage;
      return (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            minWidth: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8125rem',
            fontWeight: isActive ? 600 : 500,
            backgroundColor: isActive ? 'var(--primary)' : 'transparent',
            color: isActive ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 20px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
      }}
    >
      {/* Pagination controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {renderPageNumbers()}

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Row count limit selector */}
      {onLimitChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <p className="text-sm text-gray-500">
        Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-primary-500 hover:border-primary-500 disabled:opacity-20 transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-300 font-bold">...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 text-xs font-semibold transition-all border rounded-lg ${
                  p === page
                    ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                    : 'bg-white border-gray-200 text-gray-500 hover:text-primary-500 hover:border-primary-500'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-primary-500 hover:border-primary-500 disabled:opacity-20 transition-all shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

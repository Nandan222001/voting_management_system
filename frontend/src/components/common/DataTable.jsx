import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import Pagination from './Pagination';
import TableActions from './TableActions';

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: `${60 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

function getColumnHeader(col) {
  if (col.header || col.label) return col.header || col.label;
  if (!col.key) return '';
  return String(col.key)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isActionColumn(col) {
  const header = String(col.header || col.label || '').toLowerCase();
  const key = String(col.key || '').toLowerCase();
  return key === 'actions' || key === 'action' || header === 'actions' || header === 'action';
}

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  pagination = true,
  pageSize = 10,
  onEdit,
  onDelete,
  onAction,
  getActions,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const showActions = onEdit || onDelete || onAction;
  const colCount = columns.length + (showActions ? 1 : 0);
  const totalPages = pagination ? Math.ceil((data?.length || 0) / pageSize) : 1;
  const pageData = useMemo(() => {
    if (!pagination) return data;
    const start = (currentPage - 1) * pageSize;
    return data?.slice(start, start + pageSize) || [];
  }, [currentPage, data, pageSize, pagination]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all">
      <div className="w-full">
        <table className="w-full table-fixed text-sm text-left border-collapse">
          {/* Head */}
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              {columns.map((col) => {
                const header = getColumnHeader(col);
                const actionColumn = isActionColumn(col);
                return (
                  <th
                    key={col.key || header}
                    className={`px-3 py-3 text-xs font-semibold text-gray-500 uppercase sm:px-4 ${
                      actionColumn ? 'w-24 whitespace-nowrap text-right' : 'break-words'
                    }`}
                    style={col.width || actionColumn ? { width: col.width || '6rem' } : {}}
                  >
                    {header}
                  </th>
                );
              })}
              {showActions && (
                <th className="w-24 px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap sm:px-4">
                  Action
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={colCount} />
              ))
            ) : data?.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <MoreHorizontal className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">No records found</p>
                    <p className="text-xs text-gray-400">This list is currently empty.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageData?.map((row, rowIdx) => (
                <tr key={row.id ?? rowIdx} className="hover:bg-[#e6edfb]/50 transition-colors group">
                  {columns.map((col) => {
                    const actionColumn = isActionColumn(col);
                    return (
                      <td
                        key={col.key || col.header}
                        className={`px-3 py-3 align-top text-sm font-medium text-gray-700 sm:px-4 ${
                          actionColumn ? 'whitespace-nowrap text-right' : 'break-words'
                        }`}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : typeof row[col.key] === 'object'
                            ? '—'
                            : (row[col.key] ?? '—')}
                      </td>
                    );
                  })}
                  {showActions && (
                    <td className="w-24 px-3 py-3 text-right align-top sm:px-4">
                      <TableActions
                        actions={[
                          ...(getActions?.(row) || []),
                          onAction && row._actionLabel && {
                            key: 'settings',
                            label: row._actionLabel,
                            onClick: () => onAction(row),
                          },
                          onEdit && {
                            key: 'edit',
                            label: 'Edit',
                            onClick: () => onEdit(row),
                          },
                          onDelete && {
                            key: 'delete',
                            label: 'Delete',
                            danger: true,
                            onClick: () => onDelete(row),
                          },
                        ]}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && totalPages > 1 && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Pagination from './Pagination';
import ActionDropdown from './ActionDropdown';

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
  actionLabel = 'Action',
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
    <div className="overflow-hidden rounded-lg border border-[#c4c6d0] bg-white shadow-sm transition-all">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm text-left border-collapse">
          {/* Head */}
          <thead>
            <tr className="bg-[#f4f3f7] border-b border-[#c4c6d0]">
              {columns.map((col) => {
                const header = getColumnHeader(col);
                const actionColumn = isActionColumn(col);
                return (
                  <th
                    key={col.key || header}
                    className={`px-3 py-3 text-xs font-bold text-[#74777f] uppercase tracking-wider sm:px-4 ${
                      actionColumn ? 'w-24 whitespace-nowrap text-right' : 'break-words'
                    }`}
                    style={col.width || actionColumn ? { width: col.width || '6rem' } : {}}
                  >
                    {header}
                  </th>
                );
              })}
              {showActions && (
                <th className="w-24 px-3 py-3 text-right text-xs font-bold text-[#74777f] uppercase tracking-wider whitespace-nowrap sm:px-4">
                  Action
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[#c4c6d0]/70">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={colCount} />
              ))
            ) : data?.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-[#f4f3f7] rounded-lg border border-[#c4c6d0]">
                      <MoreHorizontal className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">No records found</p>
                    <p className="text-xs text-gray-400">This list is currently empty.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageData?.map((row, rowIdx) => (
                <tr key={row.id ?? rowIdx} className="hover:bg-[#1A237E]/[0.04] transition-colors group">
                  {columns.map((col) => {
                    const actionColumn = isActionColumn(col);
                    return (
                      <td
                        key={col.key || col.header}
                        className={`px-3 py-3 align-top text-sm font-medium text-[#44464f] sm:px-4 ${
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
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <ActionDropdown
                        align="right"
                        actions={[
                          onAction && {
                            key: 'action',
                            label: actionLabel || 'Action',
                            icon: MoreHorizontal,
                            onClick: () => onAction(row),
                          },
                          onEdit && {
                            key: 'edit',
                            label: 'Edit',
                            icon: FaEdit,
                            onClick: () => onEdit(row),
                          },
                          onDelete && {
                            key: 'delete',
                            label: 'Delete',
                            icon: FaTrash,
                            danger: true,
                            onClick: () => onDelete(row),
                          },
                        ].filter(Boolean)}
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
        <div className="border-t border-[#c4c6d0] bg-[#f4f3f7]">
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

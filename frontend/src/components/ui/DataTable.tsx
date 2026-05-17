import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T;
  cell?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: keyof T) => void;
  className?: string;
  emptyMessage?: string;
}

export default function DataTable<T>({
  data,
  columns,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  className = '',
  emptyMessage = 'Нет данных для отображения'
}: DataTableProps<T>) {
  
  const handleSort = (column: keyof T) => {
    if (onSort) {
      onSort(column);
    }
  };

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div className={`overflow-hidden rounded-[10px] border border-[var(--line)] bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-[var(--soft)]">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  style={column.width ? { width: column.width } : undefined}
                  className={`
                    px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.03em] text-[var(--muted)]
                    ${getAlignmentClass(column.align)}
                    ${column.sortable ? 'cursor-pointer hover:text-[var(--ink)]' : ''}
                    border-b border-[var(--line)]
                  `}
                  onClick={() => column.sortable && handleSort(column.accessor)}
                >
                  <div className={`flex items-center gap-2 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : ''}`}>
                    {column.header}
                    {column.sortable && sortBy === column.accessor && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="h-4 w-4 text-[var(--muted)]" /> : 
                        <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, rowIndex) => (
                <tr 
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`
                    transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer hover:bg-[var(--soft)]' : ''}
                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-[rgba(247,250,252,0.34)]'}
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={`
                        px-4 py-3 text-sm text-[var(--ink)]
                        ${getAlignmentClass(column.align)}
                        border-b border-[var(--line)]
                      `}
                    >
                      {column.cell ? 
                        column.cell(item[column.accessor], item) : 
                        <div className={getAlignmentClass(column.align)}>
                          {String(item[column.accessor])}
                        </div>
                      }
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center text-[var(--muted)]">
                    <p className="font-medium text-base mb-1">Нет записей</p>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {data.length > 0 && (
        <div className="bg-[var(--soft)] px-4 py-2.5 border-t border-[var(--line)]">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Показано <span className="font-semibold">{data.length}</span> записей</span>
          </div>
        </div>
      )}
    </div>
  );
}

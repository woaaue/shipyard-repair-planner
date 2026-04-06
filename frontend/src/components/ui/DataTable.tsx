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
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  style={column.width ? { width: column.width } : undefined}
                  className={`
                    px-6 py-4 text-sm font-semibold text-gray-900
                    ${getAlignmentClass(column.align)}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                    border-b border-gray-200
                  `}
                  onClick={() => column.sortable && handleSort(column.accessor)}
                >
                  <div className={`flex items-center gap-2 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : ''}`}>
                    {column.header}
                    {column.sortable && sortBy === column.accessor && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((item, rowIndex) => (
                <tr 
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`
                    transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : ''}
                    ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={`
                        px-6 py-4 text-sm text-gray-900
                        ${getAlignmentClass(column.align)}
                        border-t border-gray-100
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
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center text-gray-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="font-medium text-lg mb-1">Пусто</p>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer с количеством записей */}
      {data.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Показано <span className="font-semibold">{data.length}</span> записей</span>
          </div>
        </div>
      )}
    </div>
  );
}
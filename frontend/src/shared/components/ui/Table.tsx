import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from './Skeleton';

interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  getRowKey?: (item: T, index: number) => string;
  onRowDragEnd?: (fromIndex: number, toIndex: number) => void;
}

export function Table<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found',
  className,
  getRowKey,
  onRowDragEnd,
}: TableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800", className)}>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-xs font-semibold">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={getRowKey ? getRowKey(item, idx) : idx}
                draggable={!!onRowDragEnd}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', String(idx));
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  if (onRowDragEnd) event.preventDefault();
                }}
                onDrop={(event) => {
                  if (!onRowDragEnd) return;
                  event.preventDefault();
                  const fromIndex = Number(event.dataTransfer.getData('text/plain'));
                  if (!Number.isNaN(fromIndex) && fromIndex !== idx) {
                    onRowDragEnd(fromIndex, idx);
                  }
                }}
                className={cn(
                  "hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors",
                  onRowDragEnd && "cursor-move"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

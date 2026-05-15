import { Button } from './Button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface PaginationProps {
  total: number;
  page: number;
  limit: number;
  onChange: (page: number) => void;
  className?: string;
}

export function Pagination({ total, page, limit, onChange, className }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  return (
    <nav className={cn("flex items-center justify-center space-x-2", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </Button>
      
      {getPageNumbers().map((n, idx) => (
        n === 'ellipsis' ? (
          <div key={`ellipsis-${idx}`} className="px-2 text-slate-400">
            <MoreHorizontal size={16} />
          </div>
        ) : (
          <Button
            key={n}
            variant={page === n ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onChange(n)}
            className="w-9 px-0"
          >
            {n}
          </Button>
        )
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
}

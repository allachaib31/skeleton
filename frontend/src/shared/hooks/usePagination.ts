import { useState, useCallback } from 'react';

export function usePagination(total: number, limit: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(total / limit);

  const canNext = page < totalPages;
  const canPrev = page > 1;

  const nextPage = useCallback(() => {
    if (canNext) setPage((p) => p + 1);
  }, [canNext]);

  const prevPage = useCallback(() => {
    if (canPrev) setPage((p) => p - 1);
  }, [canPrev]);

  return { 
    page, 
    setPage, 
    totalPages, 
    canNext, 
    canPrev, 
    nextPage, 
    prevPage 
  };
}

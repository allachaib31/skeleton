export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
}

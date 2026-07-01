import { useState } from 'react';

export function usePagination() {
  const [page, setPage] = useState(1);
  return { page, nextPage: () => setPage(p => p + 1), prevPage: () => setPage(p => Math.max(1, p - 1)) };
}
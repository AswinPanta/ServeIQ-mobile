import { useState, useMemo } from 'react';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  /** 1-based current page (already clamped to [1, totalPages]). */
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  /** 0-based start index for Array.slice. */
  startIndex: number;
  /** Inclusive 0-based end index for Array.slice. */
  endIndex: number;
}

/**
 * Client-side pagination state — mirrors the reference web app's usePagination.
 * Pages are 1-based; startIndex/endIndex are 0-based and clamped to the last
 * page so slice(startIndex, endIndex + 1) never overflows. The exposed
 * currentPage is always derived-clamped against totalPages, so a list that
 * shrinks (e.g. a delete on a later page) can never render an empty slice.
 */
export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
}: UsePaginationProps): UsePaginationReturn {
  const [requestedPage, setRequestedPage] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage]
  );

  // Clamp derived state (no setState-in-effect — react-compiler safe). When the
  // item count shrinks below the requested page, we render the last valid page.
  const currentPage = Math.max(1, Math.min(requestedPage, totalPages));

  const setPage = (page: number) => {
    setRequestedPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(currentPage - 1);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, Math.max(0, totalItems - 1));

  return {
    currentPage,
    totalPages,
    setPage,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
  };
}

/**
 * Search Context
 * Manages search state, filters, and results
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { SearchParams, SearchFilters, SearchResults } from '@/types/api';

interface SearchContextType {
  searchParams: SearchParams | null;
  searchFilters: SearchFilters | null;
  searchResults: SearchResults | null;
  isSearching: boolean;
  setSearchParams: (params: SearchParams) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  setSearchResults: (results: SearchResults) => void;
  clearSearch: () => void;
  updateSearchParams: (params: Partial<SearchParams>) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const clearSearch = useCallback(() => {
    setSearchParams(null);
    setSearchFilters(null);
    setSearchResults(null);
    setIsSearching(false);
  }, []);

  const updateSearchParams = useCallback((params: Partial<SearchParams>) => {
    setSearchParams((prev) => (prev ? { ...prev, ...params } : null));
  }, []);

  const value = useMemo<SearchContextType>(
    () => ({
      searchParams,
      searchFilters,
      searchResults,
      isSearching,
      setSearchParams,
      setSearchFilters,
      setSearchResults,
      clearSearch,
      updateSearchParams,
    }),
    [
      searchParams,
      searchFilters,
      searchResults,
      isSearching,
      setSearchParams,
      setSearchFilters,
      setSearchResults,
      clearSearch,
      updateSearchParams,
    ],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

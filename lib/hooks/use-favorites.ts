import { useState } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  return { favorites, toggleFavorite: () => {} };
}
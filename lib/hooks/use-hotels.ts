import { useState } from 'react';

export function useHotels() {
  const [hotels, setHotels] = useState([]);
  return { hotels, loading: false };
}
import { useState } from 'react';

export function useBooking() {
  const [booking, setBooking] = useState(null);
  return { booking, setBooking };
}
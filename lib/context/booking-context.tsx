import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './auth-context'

export interface FolioCharge {
  id: string
  description: string
  amount: number
  category: 'room' | 'dining' | 'minibar' | 'laundry' | 'spa' | 'service' | 'other'
  postedAt: string
}

export interface Booking {
  id: string
  hotelId: number
  hotelName: string
  hotelCity: string
  hotelCountry: string
  hotelImage: string
  checkIn: string
  checkOut: string
  roomTypeName: string
  guests: number
  totalPrice: number
  discountApplied?: {
    code: string
    type: 'percentage' | 'fixed'
    amount: number
  }
  status: 'upcoming' | 'completed' | 'cancelled'
  createdAt: string
  folio?: FolioCharge[]
  refundAmount?: number
}

interface BookingContextValue {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => void
  cancelBooking: (id: string) => { refundAmount: number; policy: string }
  updateBooking: (id: string, updates: Partial<Pick<Booking, 'checkIn' | 'checkOut' | 'roomTypeName' | 'totalPrice' | 'status'>>) => void
  addFolioCharge: (bookingId: string, charge: Omit<FolioCharge, 'id' | 'postedAt'>) => void
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined)

function getStorageKey(userId?: string): string {
  return userId ? `bookings_${userId}` : 'bookings_guest'
}

function autoCompletePastBookings(bookings: Booking[]): Booking[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return bookings.map(b => {
    if (b.status === 'upcoming' && new Date(b.checkOut) < today) {
      return { ...b, status: 'completed' as const }
    }
    return b
  })
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const key = getStorageKey(user?.id)
        const data = await AsyncStorage.getItem(key)
        if (data) {
          const parsed: Booking[] = JSON.parse(data)
          setBookings(autoCompletePastBookings(parsed))
        }
      } catch {}
    }
    load()
  }, [user?.id])

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(getStorageKey(user?.id), JSON.stringify(bookings))
      } catch {}
    }
    save()
  }, [bookings, user?.id])

  const addBooking = useCallback(
    (data: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
      const newBooking: Booking = {
        ...data,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      }
      setBookings(prev => autoCompletePastBookings([newBooking, ...prev]))
    },
    []
  )

  function calculateRefund(booking: Booking): { refundAmount: number; policy: string } {
    const now = new Date()
    const checkIn = new Date(booking.checkIn)
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilCheckIn >= 48) {
      return { refundAmount: booking.totalPrice, policy: 'Full refund — cancelled more than 48 hours before check-in' }
    } else if (hoursUntilCheckIn >= 24) {
      return { refundAmount: Math.round(booking.totalPrice * 0.5), policy: '50% refund — cancelled within 48 hours of check-in' }
    } else if (hoursUntilCheckIn >= 12) {
      return { refundAmount: Math.round(booking.totalPrice * 0.25), policy: '25% refund — cancelled within 24 hours of check-in' }
    } else {
      return { refundAmount: 0, policy: 'No refund — cancelled less than 12 hours before check-in' }
    }
  }

  const cancelBooking = useCallback(
    (id: string) => {
      let result = { refundAmount: 0, policy: 'No refund' }
      setBookings(prev =>
        prev.map(b => {
          if (b.id !== id) return b
          result = calculateRefund(b)
          return { ...b, status: 'cancelled' as const, refundAmount: result.refundAmount }
        })
      )
      return result
    },
    []
  )

  const updateBooking = useCallback(
    (id: string, updates: Partial<Pick<Booking, 'checkIn' | 'checkOut' | 'roomTypeName' | 'totalPrice' | 'status'>>) => {
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, ...updates } : b))
      )
    },
    []
  )

  const addFolioCharge = useCallback(
    (bookingId: string, charge: Omit<FolioCharge, 'id' | 'postedAt'>) => {
      const newCharge: FolioCharge = {
        ...charge,
        id: 'ch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        postedAt: new Date().toISOString(),
      }
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, folio: [...(b.folio || []), newCharge] } : b)
      )
    },
    []
  )

  const value = useMemo(() => ({
    bookings,
    addBooking,
    cancelBooking,
    updateBooking,
    addFolioCharge,
  }), [
    bookings,
    addBooking,
    cancelBooking,
    updateBooking,
    addFolioCharge,
  ]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBookings() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookings must be inside BookingProvider')
  return ctx
}

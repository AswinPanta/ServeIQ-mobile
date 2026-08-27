import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './auth-context'
import { bookingApi } from '@/lib/api/booking-api'
import type { BookingListItem, BookingReservationResponse } from '@/types/api'

export interface FolioCharge {
  id: string
  description: string
  amount: number
  category: 'room' | 'dining' | 'minibar' | 'laundry' | 'spa' | 'service' | 'other'
  postedAt: string
}

export interface Booking {
  id: string
  refNumber?: string
  hotelId: string
  hotelName: string
  hotelCity: string
  hotelCountry: string
  hotelImage: string
  checkIn: string
  checkOut: string
  roomTypeName: string
  guests: number
  totalPrice: number
  subtotal?: number
  discountApplied?: {
    code: string
    type: 'percentage' | 'fixed'
    amount: number
  }
  status: 'upcoming' | 'completed' | 'cancelled'
  createdAt: string
  paymentMethod?: string
  transactionId?: string
  propertyPhone?: string
  propertyEmail?: string
  nights?: number
  folio?: FolioCharge[]
  refundAmount?: number
}

interface BookingContextValue {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'> & { id?: string }) => void
  cancelBooking: (id: string) => Promise<{ refundAmount: number; policy: string }>
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

function mapBookingStatus(status?: string): Booking['status'] {
  const s = (status || '').toLowerCase()
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('complete') || s.includes('checkout')) return 'completed'
  return 'upcoming'
}

function mapBackendBooking(item: BookingListItem): Booking {
  let discountApplied: Booking['discountApplied']
  const couponDiscount = parseFloat(item.coupon_discount || '0') || 0
  const offerDiscount = parseFloat(item.special_offer_discount || '0') || 0
  if (item.coupon_code && couponDiscount > 0) {
    discountApplied = { code: item.coupon_code, type: 'fixed', amount: couponDiscount }
  } else if (offerDiscount > 0) {
    discountApplied = { code: 'Special offer', type: 'percentage', amount: offerDiscount }
  }
  return {
    id: item.id || item.booking_number || item.ref_number,
    refNumber: item.ref_number || item.booking_number || item.id,
    hotelId: item.property_id || '',
    hotelName: item.property_name || 'ServeIQ Property',
    hotelCity: '',
    hotelCountry: '',
    hotelImage: item.property_photo || '',
    checkIn: item.checkin_date,
    checkOut: item.checkout_date,
    roomTypeName: (item.room_names || []).join(', ') || 'Room',
    guests: (item.number_of_adults ?? 1) + (item.number_of_children ?? 0),
    totalPrice: item.total_amount,
    subtotal: parseFloat(item.subtotal || '0') || item.total_amount,
    discountApplied,
    status: mapBookingStatus(item.status),
    createdAt: item.created_at,
    paymentMethod: item.payment_gateway || undefined,
    transactionId: item.payment_gateway ? `pay_${item.ref_number || item.id}` : undefined,
    nights: Math.max(1, Math.round((new Date(item.checkout_date).getTime() - new Date(item.checkin_date).getTime()) / 86400000)),
  }
}

/** Maps the full booking detail response from GET /bookings/{ref_number} into the local Booking shape. */
export function mapReservationToBooking(res: BookingReservationResponse): Booking {
  let discountApplied: Booking['discountApplied']
  if (res.coupon_code && res.coupon_discount > 0) {
    discountApplied = { code: res.coupon_code, type: 'fixed', amount: res.coupon_discount }
  } else if (res.special_offer_discount > 0) {
    discountApplied = { code: 'Special offer', type: 'percentage', amount: res.special_offer_discount }
  }
  return {
    id: res.ref_number || res.booking_id,
    refNumber: res.ref_number,
    hotelId: res.property?.id || '',
    hotelName: res.property?.name || 'ServeIQ Property',
    hotelCity: res.property?.city || '',
    hotelCountry: res.property?.country || '',
    hotelImage: res.property?.photo || '',
    checkIn: res.check_in,
    checkOut: res.check_out,
    roomTypeName: (res.rooms || []).map(r => r.room_name).join(', ') || 'Room',
    guests: (res.number_of_adults ?? 1) + (res.number_of_children ?? 0),
    totalPrice: res.total_amount,
    subtotal: res.subtotal || res.total_amount,
    discountApplied,
    status: mapBookingStatus(res.status),
    createdAt: res.created_at || '',
    paymentMethod: res.payment_gateway || undefined,
    transactionId: res.payment_gateway ? `pay_${res.ref_number || res.booking_id}` : undefined,
    propertyPhone: res.property?.phone_number || undefined,
    propertyEmail: res.property?.email || undefined,
    nights: res.nights || Math.max(1, Math.round((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / 86400000)),
  }
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        // Don't load any bookings when not authenticated
        if (!user) {
          if (!cancelled) setBookings([])
          return
        }
        const key = getStorageKey(user.id)
        const data = await AsyncStorage.getItem(key)
        let local: Booking[] = []
        if (data) {
          local = autoCompletePastBookings(JSON.parse(data))
        }
        // Merge in bookings from the backend
        try {
          const remote = await bookingApi.getMyBookings(
            () => ({ items: [], total: 0, page: 1, limit: 20, total_pages: 0 }),
            1,
            50,
          )
          if (cancelled) return
          const remoteBookings = (remote.items || []).map(mapBackendBooking)
          const remoteIds = new Set(remoteBookings.map(b => b.id))
          const localOnly = local.filter(b => !remoteIds.has(b.id))
          setBookings(autoCompletePastBookings([...remoteBookings, ...localOnly]))
          return
        } catch {
          // fall through to local-only
        }
        if (!cancelled) setBookings(local)
      } catch (e) {
        console.warn('Failed to load bookings:', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(getStorageKey(user?.id), JSON.stringify(bookings))
      } catch (e) {
        console.warn('Failed to save bookings:', e)
      }
    }
    save()
  }, [bookings, user?.id])

  const addBooking = useCallback(
    (data: Omit<Booking, 'id' | 'status' | 'createdAt'> & { id?: string }) => {
      const newBooking: Booking = {
        ...data,
        id: data.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
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
    async (id: string) => {
      const target = bookings.find(b => b.id === id)
      const result = target ? calculateRefund(target) : { refundAmount: 0, policy: 'No refund' }
      setBookings(prev =>
        prev.map(b => {
          if (b.id !== id) return b
          return { ...b, status: 'cancelled' as const, refundAmount: result.refundAmount }
        })
      )
      if (target?.refNumber) {
        try { await bookingApi.cancelBooking(target.refNumber) } catch {}
      }
      return result
    },
    [bookings]
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

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './auth-context'
import type { Coupon } from '@/types/coupon'

interface CouponContextValue {
  coupons: Coupon[]
  activeCoupons: Coupon[]
  usedCoupons: Coupon[]
  useCoupon: (id: string) => void
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void
}

const CouponContext = createContext<CouponContextValue | undefined>(undefined)

function getStorageKey(userId?: string): string {
  return userId ? `coupons_${userId}` : 'coupons_guest'
}

function getSampleCoupons(): Coupon[] {
  return [
    {
      id: 'c1',
      code: 'SUMMER20',
      description: 'Get 20% off on your next booking',
      discount: 20,
      discountType: 'percentage',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'c2',
      code: 'WELCOME10',
      description: '10% discount for new members',
      discount: 10,
      discountType: 'percentage',
      status: 'active',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'c3',
      code: 'STAY50',
      description: '$50 off on stays above $300',
      discount: 50,
      discountType: 'fixed',
      status: 'used',
      expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      usedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'c4',
      code: 'EARLY15',
      description: 'Early bird 15% discount',
      discount: 15,
      discountType: 'percentage',
      status: 'used',
      expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      usedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

export function CouponProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const key = getStorageKey(user?.id)
        const data = await AsyncStorage.getItem(key)
        if (data) {
          if (!cancelled) setCoupons(JSON.parse(data))
        } else {
          const samples = getSampleCoupons()
          await AsyncStorage.setItem(key, JSON.stringify(samples))
          if (!cancelled) setCoupons(samples)
        }
      } catch {
        if (!cancelled) setCoupons(getSampleCoupons())
      }
    }
    load()
    return () => { cancelled = true; }
  }, [user?.id])

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(getStorageKey(user?.id), JSON.stringify(coupons))
      } catch (e) {
        console.warn('Failed to save coupons:', e)
      }
    }
    if (coupons.length > 0) save()
  }, [coupons, user?.id])

  const useCoupon = useCallback((id: string) => {
    setCoupons(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: 'used' as const, usedAt: new Date().toISOString() } : c
      )
    )
  }, [])

  const addCoupon = useCallback((data: Omit<Coupon, 'id'>) => {
    const newCoupon: Coupon = {
      ...data,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    }
    setCoupons(prev => [newCoupon, ...prev])
  }, [])

  const value = useMemo(() => ({
    coupons,
    activeCoupons: coupons.filter(c => c.status === 'active'),
    usedCoupons: coupons.filter(c => c.status === 'used' || c.status === 'expired'),
    useCoupon,
    addCoupon,
  }), [
    coupons,
    useCoupon,
    addCoupon,
  ]);

  return (
    <CouponContext.Provider value={value}>
      {children}
    </CouponContext.Provider>
  )
}

export function useCoupons() {
  const ctx = useContext(CouponContext)
  if (!ctx) throw new Error('useCoupons must be inside CouponProvider')
  return ctx
}

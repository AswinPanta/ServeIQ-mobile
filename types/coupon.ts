export interface Coupon {
  id: string
  code: string
  description: string
  discount: number
  discountType: 'percentage' | 'fixed'
  status: 'active' | 'used' | 'expired'
  expiresAt: string
  usedAt?: string
}

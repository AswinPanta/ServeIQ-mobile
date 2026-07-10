// lib/mock/user-coupons.ts
// User's personal coupons (saved/owned coupons)

export interface UserCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_night';
  value: number;
  minBookingAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usedAt?: string;
  usedOnBooking?: string;
  status: 'active' | 'used' | 'expired';
  applicableRoomTypes: string[];
}

export const USER_COUPONS: UserCoupon[] = [
  {
    id: 'uc-1',
    code: 'WELCOME15',
    title: 'Welcome Discount',
    description: '15% off on your first booking',
    type: 'percentage',
    value: 15,
    minBookingAmount: 5000,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'active',
    applicableRoomTypes: ['standard', 'deluxe', 'suite'],
  },
  {
    id: 'uc-2',
    code: 'SUMMER2026',
    title: 'Summer Special',
    description: '20% off summer special',
    type: 'percentage',
    value: 20,
    minBookingAmount: 10000,
    validFrom: '2026-06-01',
    validUntil: '2026-08-31',
    status: 'active',
    applicableRoomTypes: ['deluxe', 'suite'],
  },
  {
    id: 'uc-3',
    code: 'FLAT2000',
    title: 'Flat Rs 2000 Off',
    description: 'Rs 2,000 off on bookings above Rs 8,000',
    type: 'fixed',
    value: 2000,
    minBookingAmount: 8000,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'used',
    usedAt: '2026-06-15',
    usedOnBooking: 'BK-2026-001',
    applicableRoomTypes: ['standard', 'deluxe', 'suite'],
  },
  {
    id: 'uc-4',
    code: 'FREENIGHT',
    title: 'Free Night Offer',
    description: 'Free night on 3+ night suite bookings',
    type: 'free_night',
    value: 1,
    minBookingAmount: 20000,
    validFrom: '2026-07-01',
    validUntil: '2026-07-31',
    status: 'used',
    usedAt: '2026-06-20',
    usedOnBooking: 'BK-2026-002',
    applicableRoomTypes: ['suite'],
  },
  {
    id: 'uc-5',
    code: 'EXPIRED50',
    title: 'Expired Coupon',
    description: '50% off - expired',
    type: 'percentage',
    value: 50,
    minBookingAmount: 15000,
    validFrom: '2026-05-01',
    validUntil: '2026-05-31',
    status: 'expired',
    applicableRoomTypes: ['deluxe', 'suite'],
  },
];

export function getActiveCoupons(): UserCoupon[] {
  return USER_COUPONS.filter((c) => c.status === 'active');
}

export function getUsedCoupons(): UserCoupon[] {
  return USER_COUPONS.filter((c) => c.status === 'used');
}

export function getExpiredCoupons(): UserCoupon[] {
  return USER_COUPONS.filter((c) => c.status === 'expired');
}
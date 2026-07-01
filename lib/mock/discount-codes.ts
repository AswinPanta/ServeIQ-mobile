// lib/mock/discount-codes.ts
export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed' | 'free_night';
  value: number;
  minBookingAmount: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  applicableRoomTypes: string[];
  description: string;
}

export const DISCOUNT_CODES: DiscountCode[] = [
  {
    code: 'WELCOME15',
    type: 'percentage',
    value: 15,
    minBookingAmount: 5000,
    maxUses: 100,
    usedCount: 42,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    applicableRoomTypes: ['standard', 'deluxe', 'suite'],
    description: '15% off on your first booking',
  },
  {
    code: 'SUMMER2026',
    type: 'percentage',
    value: 20,
    minBookingAmount: 10000,
    maxUses: 50,
    usedCount: 12,
    validFrom: '2026-06-01',
    validUntil: '2026-08-31',
    applicableRoomTypes: ['deluxe', 'suite'],
    description: '20% off summer special',
  },
  {
    code: 'FLAT2000',
    type: 'fixed',
    value: 2000,
    minBookingAmount: 8000,
    maxUses: 30,
    usedCount: 8,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    applicableRoomTypes: ['standard', 'deluxe', 'suite'],
    description: 'Rs 2,000 off on bookings above Rs 8,000',
  },
  {
    code: 'FREENIGHT',
    type: 'free_night',
    value: 1,
    minBookingAmount: 20000,
    maxUses: 10,
    usedCount: 3,
    validFrom: '2026-07-01',
    validUntil: '2026-07-31',
    applicableRoomTypes: ['suite'],
    description: 'Free night on 3+ night suite bookings',
  },
];

export function validateDiscountCode(
  code: string,
  bookingAmount: number,
  roomType: string
): { valid: boolean; error?: string; discount?: DiscountCode } {
  const discount = DISCOUNT_CODES.find(
    (d) => d.code.toUpperCase() === code.toUpperCase()
  );

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' };
  }

  const now = new Date();
  if (now < new Date(discount.validFrom) || now > new Date(discount.validUntil)) {
    return { valid: false, error: 'This code has expired' };
  }

  if (discount.usedCount >= discount.maxUses) {
    return { valid: false, error: 'This code has reached its usage limit' };
  }

  if (bookingAmount < discount.minBookingAmount) {
    return {
      valid: false,
      error: `Minimum booking amount is Rs ${discount.minBookingAmount.toLocaleString()}`,
    };
  }

  if (!discount.applicableRoomTypes.includes(roomType)) {
    return { valid: false, error: 'This code is not applicable for selected room type' };
  }

  return { valid: true, discount };
}

export function calculateDiscount(
  discount: DiscountCode,
  subtotal: number,
  nights: number
): number {
  switch (discount.type) {
    case 'percentage':
      return Math.round(subtotal * (discount.value / 100));
    case 'fixed':
      return discount.value;
    case 'free_night':
      return Math.round(subtotal / nights) * discount.value;
    default:
      return 0;
  }
}

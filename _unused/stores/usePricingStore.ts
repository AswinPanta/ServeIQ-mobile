/**
 * Phase 4 — Pricing Engine
 * Dynamic rate engine with weekend/seasonal/holiday pricing.
 * Tax engine with separate VAT, tourism tax, service charge.
 * Flexible discounts (percentage, fixed, member, coupon, corporate, long stay).
 */
import { create } from 'zustand';

export interface TaxConfig {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  rate: number;    // e.g. 13 for 13%
  isInclusive: boolean; // included in listed price vs added on top
  isActive: boolean;
  appliesTo: 'room' | 'services' | 'all';
}

export interface PriceOverride {
  id: string;
  roomTypeId: string;
  startDate: string;
  endDate: string;
  overridePrice: number;
  reason: string;  // 'holiday' | 'event' | 'seasonal' | 'promotion'
}

export interface DynamicRateResult {
  basePrice: number;
  weekendSurcharge: number;
  seasonalAdjustment: number;
  holidayAdjustment: number;
  lengthDiscount: number;
  subtotal: number;
  taxes: { name: string; rate: number; amount: number }[];
  totalTax: number;
  serviceCharge: number;
  grandTotal: number;
}

const SEASON_MULTIPLIERS: Record<string, number> = {
  peak: 1.4,   // Oct-Nov (festival season), Dec-Jan (holiday)
  high: 1.2,   // Sep, Mar-May
  shoulder: 1.0, // Jun, Feb, Aug
  low: 0.85,   // Jul (monsoon)
};

const HOLIDAY_DATES: Record<string, number> = {
  '2026-12-24': 1.5,
  '2026-12-25': 2.0,
  '2026-12-31': 1.8,
  '2027-01-01': 2.0,
};

interface PricingStore {
  taxConfigs: TaxConfig[];
  priceOverrides: PriceOverride[];
  addTaxConfig: (tax: Omit<TaxConfig, 'id'>) => void;
  toggleTax: (id: string) => void;
  addPriceOverride: (override: Omit<PriceOverride, 'id'>) => void;
  removePriceOverride: (id: string) => void;
  getActiveTaxes: () => TaxConfig[];
  getTaxSummary: (subtotal: number, type?: 'room' | 'services' | 'all') => {
    taxes: { name: string; amount: number; rate: number }[];
    totalTax: number;
    tourismTax: number;
    vat: number;
    serviceCharge: number;
  };
  calculateDynamicRate: (opts: {
    basePrice: number;
    nights: number;
    checkIn: string;
    roomType?: string;
    occupancy?: number;
    guestTier?: string;
    lengthOfStay?: number;
    discountCode?: string;
    corporateCode?: string;
  }) => DynamicRateResult;
}

function getSeason(date: Date): string {
  const m = date.getMonth();
  if (m >= 9 && m <= 10) return 'peak';     // Oct-Nov (Dashain/Tihar)
  if (m === 11 || m === 0) return 'peak';    // Dec-Jan (holiday)
  if (m >= 2 && m <= 4) return 'high';       // Mar-May (spring)
  if (m === 8) return 'high';                // Sep
  if (m === 1 || m === 7) return 'shoulder'; // Feb, Aug
  return 'low';                               // Jun-Jul (monsoon)
}

const DEFAULT_TAXES: TaxConfig[] = [
  { id: 'tx-vat', name: 'VAT', type: 'PERCENTAGE', rate: 13, isInclusive: false, isActive: true, appliesTo: 'all' },
  { id: 'tx-tourism', name: 'Tourism Service Tax', type: 'PERCENTAGE', rate: 3, isInclusive: false, isActive: true, appliesTo: 'room' },
  { id: 'tx-service', name: 'Service Charge', type: 'PERCENTAGE', rate: 10, isInclusive: true, isActive: true, appliesTo: 'all' },
  { id: 'tx-municipality', name: 'Municipality Tax', type: 'FIXED', rate: 200, isInclusive: false, isActive: true, appliesTo: 'room' },
];

export const usePricingStore = create<PricingStore>((set, get) => ({
  taxConfigs: DEFAULT_TAXES,
  priceOverrides: [],

  addTaxConfig: (tax) => {
    const id = 'tx-' + Date.now().toString(36);
    set(s => ({ taxConfigs: [...s.taxConfigs, { ...tax, id }] }));
  },

  toggleTax: (id) => {
    set(s => ({
      taxConfigs: s.taxConfigs.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t),
    }));
  },

  addPriceOverride: (override) => {
    const id = 'po-' + Date.now().toString(36);
    set(s => ({ priceOverrides: [...s.priceOverrides, { ...override, id }] }));
  },

  removePriceOverride: (id) => {
    set(s => ({ priceOverrides: s.priceOverrides.filter(o => o.id !== id) }));
  },

  getActiveTaxes: () => get().taxConfigs.filter(t => t.isActive),

  getTaxSummary: (subtotal, type = 'all') => {
    const activeTaxes = get().taxConfigs.filter(t => t.isActive && (t.appliesTo === type || t.appliesTo === 'all'));
    const taxes = activeTaxes.map(t => ({
      name: t.name,
      rate: t.rate,
      amount: t.type === 'PERCENTAGE' ? Math.round(subtotal * (t.rate / 100)) : t.rate,
    }));
    const totalTax = taxes.reduce((s, t) => s + t.amount, 0);
    const vat = taxes.find(t => t.name === 'VAT')?.amount || 0;
    const tourismTax = taxes.find(t => t.name === 'Tourism Service Tax')?.amount || 0;
    const serviceCharge = taxes.find(t => t.name === 'Service Charge')?.amount || 0;
    return { taxes, totalTax, tourismTax, vat, serviceCharge };
  },

  calculateDynamicRate: (opts) => {
    const { basePrice, nights, checkIn, lengthOfStay, guestTier, discountCode } = opts;

    // 1. Base price
    let runningPrice = basePrice;

    // 2. Weekend surcharge (Fri-Sat: +20%)
    const checkinDate = new Date(checkIn);
    let weekendSurcharge = 0;
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkinDate);
      d.setDate(d.getDate() + i);
      const day = d.getDay();
      if (day === 5 || day === 6) {
        weekendSurcharge += Math.round(basePrice * 0.2);
      }
    }

    // 3. Seasonal adjustment
    const season = getSeason(checkinDate);
    const seasonalMultiplier = SEASON_MULTIPLIERS[season] || 1.0;
    const seasonalAdjustment = Math.round(basePrice * nights * (seasonalMultiplier - 1));

    // 4. Holiday override
    let holidayAdjustment = 0;
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkinDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const holidayMultiplier = HOLIDAY_DATES[dateStr];
      if (holidayMultiplier) {
        holidayAdjustment += Math.round(basePrice * (holidayMultiplier - 1));
      }
    }

    // 5. Length-of-stay discount
    let lengthDiscount = 0;
    if (lengthOfStay && lengthOfStay >= 7) lengthDiscount = Math.round(basePrice * nights * 0.15);
    else if (lengthOfStay && lengthOfStay >= 3) lengthDiscount = Math.round(basePrice * nights * 0.08);

    // 6. Guest tier discount
    let tierDiscount = 0;
    if (guestTier === 'platinum') tierDiscount = Math.round(basePrice * nights * 0.15);
    else if (guestTier === 'gold') tierDiscount = Math.round(basePrice * nights * 0.1);
    else if (guestTier === 'silver') tierDiscount = Math.round(basePrice * nights * 0.05);

    const subtotal = basePrice * nights + weekendSurcharge + seasonalAdjustment + holidayAdjustment;
    const afterDiscounts = Math.max(0, subtotal - lengthDiscount - tierDiscount);

    // 7. Taxes
    const { taxes, totalTax, vat, tourismTax, serviceCharge } = get().getTaxSummary(afterDiscounts);

    // 8. Grand total
    const grandTotal = afterDiscounts + totalTax;

    return {
      basePrice,
      weekendSurcharge,
      seasonalAdjustment,
      holidayAdjustment,
      lengthDiscount: lengthDiscount + tierDiscount,
      subtotal: afterDiscounts,
      taxes,
      totalTax,
      serviceCharge,
      grandTotal,
    };
  },
}));

import { Platform, Share } from 'react-native';

/**
 * Booking receipt generation — mirrors the reference web app's ReceiptGenerator.
 *
 * - Native: builds a plaintext receipt and opens the OS share sheet (which
 *   offers AirPrint / Mail), the same pattern the POS checkout uses.
 * - Web: opens a print-ready HTML window (Ctrl+P / Cmd+P), like the reference.
 */

export interface BookingReceiptRoom {
  room_name: string;
  room_type: string;
  bed_type: string;
  base_rate: number;
  nights: number;
  subtotal: number;
}

export interface BookingReceiptParams {
  confirmationCode: string;
  propertyName: string;
  propertyLocation?: string;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestNationality?: string;
  rooms: BookingReceiptRoom[];
  discount?: number;
  couponCode?: string;
  couponDiscount?: number;
  totalAmount: number;
  currency: string;
  createdAt?: string;
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Escape user-controlled strings before embedding into the print HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plaintext receipt — used by the native share sheet (AirPrint / Mail). */
export function buildBookingReceiptText(p: BookingReceiptParams): string {
  const now = new Date();
  const lines = p.rooms.map(
    (r) =>
      `${r.room_name}${r.room_type ? ` (${r.room_type})` : ''}${r.bed_type ? ` — ${r.bed_type}` : ''}\n` +
      `  ${p.currency} ${fmt(r.base_rate)} × ${r.nights} night${r.nights !== 1 ? 's' : ''} = ${p.currency} ${fmt(r.subtotal)}`
  );
  return [
    'SERVEIQ',
    'Booking Receipt',
    '----------------------------------',
    `Confirmation:   ${p.confirmationCode}`,
    `Guest:          ${p.guestName}`,
    p.guestEmail ? `Email:          ${p.guestEmail}` : null,
    p.guestPhone ? `Phone:          ${p.guestPhone}` : null,
    p.guestNationality ? `Nationality:    ${p.guestNationality}` : null,
    `Property:       ${p.propertyName}`,
    p.propertyLocation ? `Location:       ${p.propertyLocation}` : null,
    `Check-in:       ${p.checkIn}`,
    `Check-out:      ${p.checkOut}`,
    `Guests:         ${p.totalGuests}`,
    '----------------------------------',
    ...lines,
    '----------------------------------',
    p.discount && p.discount > 0 ? `Special Offer:  -${p.currency} ${fmt(p.discount)}` : null,
    p.couponCode ? `Coupon (${p.couponCode}): -${p.currency} ${fmt(p.couponDiscount || 0)}` : null,
    `TOTAL PAID:     ${p.currency} ${fmt(p.totalAmount)}`,
    '',
    'Thank you for booking with ServeIQ!',
    `Generated on ${p.createdAt || now.toLocaleString()}`,
  ]
    .filter((l): l is string => l !== null && l !== undefined)
    .join('\n');
}

/** Print-ready HTML receipt — used on web (window.print). */
export function buildBookingReceiptHtml(p: BookingReceiptParams): string {
  const roomLines = p.rooms
    .map(
      (r) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #eee">${esc(r.room_name)}</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee">${esc(r.room_type)} / ${esc(r.bed_type || '—')}</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${p.currency} ${fmt(r.base_rate)} × ${r.nights}</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${p.currency} ${fmt(r.subtotal)}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html><head><title>Receipt - ${p.confirmationCode}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:20px;color:#333}
  .receipt{max-width:680px;margin:0 auto;border:1px solid #ddd;border-radius:12px;overflow:hidden}
  .header{background:#1a1a2e;color:#fff;padding:24px 28px}
  .header h1{margin:0 0 4px;font-size:22px;font-weight:700}
  .header p{margin:0;opacity:.7;font-size:13px}
  .body{padding:24px 28px}
  .row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px}
  .row .label{color:#888}
  .divider{border:none;border-top:1px solid #eee;margin:16px 0}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:8px 0;border-bottom:2px solid #ddd;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:.5px}
  td{font-size:13px}
  .total-row{display:flex;justify-content:space-between;padding:12px 0 0;font-size:16px;font-weight:700;border-top:2px solid #333;margin-top:8px}
  .footer{text-align:center;padding:16px 28px;background:#f9f9f9;font-size:11px;color:#999;border-top:1px solid #eee}
  @media print{body{padding:0}.receipt{border:none}}
</style></head><body>
<div class="receipt">
  <div class="header">
    <h1>ServeIQ</h1>
    <p>Booking Receipt</p>
  </div>
  <div class="body">
    <div class="row"><span class="label">Confirmation Code</span><strong>${esc(p.confirmationCode)}</strong></div>
    <div class="row"><span class="label">Guest Name</span><span>${esc(p.guestName)}</span></div>
    ${p.guestEmail ? `<div class="row"><span class="label">Email</span><span>${esc(p.guestEmail)}</span></div>` : ''}
    ${p.guestPhone ? `<div class="row"><span class="label">Phone</span><span>${esc(p.guestPhone)}</span></div>` : ''}
    ${p.guestNationality ? `<div class="row"><span class="label">Nationality</span><span>${esc(p.guestNationality)}</span></div>` : ''}
    <hr class="divider">
    <div class="row"><span class="label">Property</span><strong>${esc(p.propertyName)}</strong></div>
    ${p.propertyLocation ? `<div class="row"><span class="label">Location</span><span>${esc(p.propertyLocation)}</span></div>` : ''}
    <hr class="divider">
    <div class="row"><span class="label">Check-in</span><span>${p.checkIn}</span></div>
    <div class="row"><span class="label">Check-out</span><span>${p.checkOut}</span></div>
    <div class="row"><span class="label">Guests</span><span>${p.totalGuests}</span></div>
    <hr class="divider">
    <table>
      <thead><tr><th>Room</th><th>Type</th><th style="text-align:right">Rate</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>${roomLines}</tbody>
    </table>
    <hr class="divider">
    ${p.discount && p.discount > 0 ? `<div class="row"><span class="label">Special Offer Discount</span><span style="color:#16a34a">-${p.currency} ${fmt(p.discount)}</span></div>` : ''}
    ${p.couponCode ? `<div class="row"><span class="label">Coupon (${esc(p.couponCode)})</span><span style="color:#16a34a">-${p.currency} ${fmt(p.couponDiscount || 0)}</span></div>` : ''}
    <div class="total-row"><span>Total</span><span>${p.currency} ${fmt(p.totalAmount)}</span></div>
  </div>
  <div class="footer">
    <p>Thank you for booking with ServeIQ!</p>
    <p>Generated on ${p.createdAt || new Date().toLocaleString()}</p>
  </div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

  return html;
}

/**
 * Share (native) or print (web) a booking receipt.
 * Resolves silently if the user cancels the share sheet.
 */
export async function shareBookingReceipt(p: BookingReceiptParams): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const win = window.open('', '_blank', 'width=700,height=900');
    if (win) {
      win.document.write(buildBookingReceiptHtml(p));
      win.document.close();
      return;
    }
    // Popup blocked — fall through to a clipboard text share attempt.
  }
  try {
    await Share.share({
      message: buildBookingReceiptText(p),
      title: `Receipt_${p.confirmationCode}`,
    });
  } catch {
    // user cancelled or share failed — silently ignore
  }
}

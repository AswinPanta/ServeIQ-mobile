import { Platform } from 'react-native';

/**
 * Shared print/share helpers for receipts and folio invoices.
 *
 * buildInvoiceHtml() is a pure function (used by both the checkout receipt and
 * the folio ledger screen); printHtml() / sharePdf() are thin wrappers around
 * expo-print / expo-sharing.
 */

export interface InvoiceLine {
  label: string;
  amount: number;
}

export interface InvoiceCharge {
  category: string;
  description: string;
  amount: number;
}

export interface InvoiceData {
  title: string;
  subtitle?: string;
  guestName?: string;
  roomNumber?: string;
  ref?: string;
  charges?: InvoiceCharge[];
  lines?: InvoiceLine[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  paymentMethod?: string;
  footer?: string;
}

const formatNpr = (n: number): string =>
  `NPR ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Build a self-contained HTML invoice document for expo-print. */
export function buildInvoiceHtml(data: InvoiceData): string {
  const chargeRows = (data.charges || [])
    .map(
      (c) => `
        <tr>
          <td>${escapeHtml(c.category)}</td>
          <td>${escapeHtml(c.description)}</td>
          <td class="num">${formatNpr(c.amount)}</td>
        </tr>`,
    )
    .join('');

  const lineRows = (data.lines || [])
    .map(
      (l) => `
        <tr>
          <td colspan="2">${escapeHtml(l.label)}</td>
          <td class="num">${formatNpr(l.amount)}</td>
        </tr>`,
    )
    .join('');

  const infoRows = [
    data.guestName ? `<div class="info-row"><span>Guest</span><b>${escapeHtml(data.guestName)}</b></div>` : '',
    data.roomNumber ? `<div class="info-row"><span>Room</span><b>${escapeHtml(data.roomNumber)}</b></div>` : '',
    data.ref ? `<div class="info-row"><span>Ref</span><b>${escapeHtml(data.ref)}</b></div>` : '',
  ]
    .filter(Boolean)
    .join('');

  const totalsRows = [
    typeof data.subtotal === 'number'
      ? `<div class="info-row"><span>Subtotal</span><span>${formatNpr(data.subtotal)}</span></div>`
      : '',
    typeof data.discount === 'number' && data.discount > 0
      ? `<div class="info-row"><span>Discount</span><span>-${formatNpr(data.discount)}</span></div>`
      : '',
    typeof data.tax === 'number'
      ? `<div class="info-row"><span>Tax</span><span>${formatNpr(data.tax)}</span></div>`
      : '',
    typeof data.total === 'number'
      ? `<div class="total-row"><span>Total</span><span>${formatNpr(data.total)}</span></div>`
      : '',
    data.paymentMethod
      ? `<div class="info-row"><span>Payment</span><b>${escapeHtml(data.paymentMethod)}</b></div>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const hasCharges = chargeRows.length > 0;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 16px; }
  .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
  .info-row { display: flex; justify-content: space-between; font-size: 12px; color: #475569; padding: 3px 0; }
  .info-row b { color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 6px 0; }
  td { font-size: 12px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
  td.num { text-align: right; font-weight: 600; }
  .totals { margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-top: 4px; }
  .footer { margin-top: 20px; text-align: center; color: #94a3b8; font-size: 11px; }
</style>
</head>
<body>
  <h1>${escapeHtml(data.title)}</h1>
  ${data.subtitle ? `<div class="sub">${escapeHtml(data.subtitle)}</div>` : ''}
  <div class="card">
    ${infoRows}
    ${
      hasCharges
        ? `<table>
      <thead><tr><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${chargeRows}${lineRows}</tbody>
    </table>`
        : lineRows
          ? `<table><tbody>${lineRows}</tbody></table>`
          : ''
    }
    ${totalsRows ? `<div class="totals">${totalsRows}</div>` : ''}
  </div>
  <div class="footer">${escapeHtml(data.footer || 'Thank you for staying with us!')}</div>
</body>
</html>`;
}

/** Render HTML to PDF and open the system print dialog. */
export async function printHtml(html: string): Promise<void> {
  const Print = require('expo-print');
  await Print.printAsync({ html });
}

/** Render HTML to a PDF file and open the OS share sheet. */
export async function sharePdf(html: string, fileName: string): Promise<void> {
  const Print = require('expo-print');
  const Sharing = require('expo-sharing');
  const FileSystem = require('expo-file-system/legacy');

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const target = uri.substring(uri.lastIndexOf('/') + 1).replace(/\.pdf$/i, '');
  const dest = `${FileSystem.cacheDirectory}${fileName || target}.pdf`;

  // Move/rename so the shared file gets a friendly name.
  await FileSystem.moveAsync({ from: uri, to: dest });

  if (!(await Sharing.isAvailableAsync())) {
    // Sharing unavailable (rare) — fall back to the print dialog.
    await printHtml(html);
    return;
  }
  await Sharing.shareAsync(dest, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}

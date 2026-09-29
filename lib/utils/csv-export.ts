/**
 * Minimal CSV export helpers — mirror the web app's ExportButton (xlsx) for
 * the three list screens that have it: bookings, payments, folios.
 *
 * On native we share a .csv file through the OS share sheet via expo-sharing
 * (Excel/Sheets/Mail all open it); on web we trigger a download. No extra
 * dependency — plain RFC 4180 escaping.
 */

import { Platform } from 'react-native';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

/** Quote a cell per RFC 4180: wrap in quotes when needed, double inner quotes. */
function csvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerLine = columns.map((c) => csvCell(c.header)).join(',');
  const bodyLines = rows.map((row) =>
    columns.map((c) => csvCell(c.value(row))).join(','),
  );
  // BOM helps Excel detect UTF-8 for names like "राम बहादुर".
  return `\uFEFF${[headerLine, ...bodyLines].join('\r\n')}`;
}

/**
 * Export rows as CSV via the share sheet (native) or a download (web).
 * fileName should NOT include the extension.
 */
export async function exportCsv<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  fileName: string,
): Promise<void> {
  const csv = buildCsv(rows, columns);

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const Sharing = require('expo-sharing');
  const FileSystem = require('expo-file-system/legacy');
  const fileUri = `${FileSystem.cacheDirectory}${fileName}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
}

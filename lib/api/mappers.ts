/**
 * Shared backend → UI mappers used across search, properties, and nearby.
 */

/**
 * Backend amenity fields arrive in inconsistent shapes across endpoints and
 * properties: [{name, icon}], [string], {name: "WiFi", icon: "Wifi"},
 * { "WiFi": true }, null, or undefined. Normalize them all to a stable
 * {name, icon} list so downstream mapping never crashes.
 */
export function normalizeAmenities(raw: unknown): { name: string; icon: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    const out: { name: string; icon: string }[] = [];
    for (const item of raw) {
      if (item == null) continue;
      if (typeof item === 'string') {
        out.push({ name: item, icon: '✨' });
      } else if (typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const name = typeof obj.name === 'string' && obj.name ? obj.name : String(obj.name ?? 'Amenity');
        out.push({ name, icon: typeof obj.icon === 'string' ? obj.icon : '✨' });
      }
    }
    return out;
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    // Single-object form: { name: "WiFi", icon: "Wifi" }
    if (typeof obj.name === 'string' && obj.name) {
      return [{ name: obj.name, icon: typeof obj.icon === 'string' ? obj.icon : '✨' }];
    }
    // Dict form: { "WiFi": true, "Pool": true }
    return Object.keys(obj).map((name) => ({ name, icon: '✨' }));
  }
  return [];
}

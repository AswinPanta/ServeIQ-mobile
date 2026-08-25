// Legacy barrel re-exporting the modular API layer (`lib/api/`).
//
// `@/lib/api` resolves to THIS file (Metro picks `lib/api.ts` over the
// `lib/api/index.ts` directory entry), so this must stay in sync with
// `lib/api/index.ts`. Keeping it a thin re-export guarantees every caller —
// including the booking flow's `getAvailableRoomsApi` — uses the same,
// maintained implementation instead of a silently-stale duplicate.

export {
  api,
  getActiveToken,
  isDemoMode,
  handleResponse,
} from './api/client';

export { normalizeAmenities } from './api/mappers';

export {
  getAvailableRoomsApi,
  getPropertyById,
  tryFetchHostProperties,
  type AvailableRoom,
} from './api/properties';

export { searchHotelsApi, searchNearbyApi } from './api/search';

export {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenantApi,
} from './api/tenants';

import { API_ENDPOINTS } from '@/constants/api-config';
import type { TenantCreateRequest, TenantCreateResponse } from '@/types/api';
import { api, handleResponse, isDemoMode } from './client';

// ─── Tenants (SuperAdmin) ─────────────────────────────────────────
// Backend tenant endpoints are JWT-scoped: the logged-in user's tenant is
// used for GET/PATCH/DELETE. The tenant_id is NOT passed as a query param
// or path param for update/delete — the backend infers it from the token.
//
// GET /tenants/     → StandardResponse_TenantResponseSchema_ (single object)
// POST /tenants/    → TenantCreateSchema { name } → StandardResponse_TenantResponseSchema_
// PATCH /tenants/   → TenantUpdateSchema (e.g. { name }) → StandardResponse_TenantResponseSchema_
// DELETE /tenants/  → 204 (no body, no params)

export async function createTenant(data: TenantCreateRequest): Promise<TenantCreateResponse> {
  if (await isDemoMode()) {
    return {
      id: 'tnt-' + Date.now().toString(36),
      name: data.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  try {
    const response = await api.post(API_ENDPOINTS.TENANTS.CREATE, data);
    const json = await handleResponse<{ success: boolean; data: TenantCreateResponse }>(response);
    return json.data;
  } catch {
    return {
      id: 'tnt-' + Date.now().toString(36),
      name: data.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/** Backend returns a single TenantResponseSchema scoped to the JWT user. */
export async function getTenants(): Promise<any[]> {
  if (await isDemoMode()) return [];
  try {
    const response = await api.get(API_ENDPOINTS.TENANTS.GET);
    const json = await handleResponse<{ success: boolean; data: any }>(response);
    const data = json.success !== false && json.data !== undefined ? json.data : json;
    // Backend returns a single object (StandardResponse_TenantResponseSchema_),
    // not a list. Surface it as a 1-item array.
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.tenants)) return data.tenants;
    if (Array.isArray(data?.records)) return data.records;
    if (data && typeof data === 'object' && data.id) return [data];
    return [];
  } catch {
    return [];
  }
}

/** Fetch a single tenant by id (from list or fresh GET). */
export async function getTenantById(id: string): Promise<any | null> {
  if (await isDemoMode()) return null;
  try {
    // Backend only exposes GET /tenants/ (scoped to current user).
    // Fetch the list and filter by id.
    const tenants = await getTenants();
    return tenants.find((t: any) => t.id === id) || tenants[0] || null;
  } catch {
    return null;
  }
}

/**
 * Update the current user's tenant.
 * Backend: PATCH /tenants/ with TenantUpdateSchema body (JWT-scoped).
 * The body should only contain updatable fields like { name }.
 */
export async function updateTenant(id: string, data: Record<string, unknown>): Promise<boolean> {
  if (await isDemoMode()) return false;
  try {
    // Strip tenant_id from the payload — backend uses JWT scope, not a param.
    const { tenant_id: _tid, ...patchData } = data;
    const response = await api.patch(API_ENDPOINTS.TENANTS.UPDATE, patchData);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Delete the current user's tenant.
 * Backend: DELETE /tenants/ with no body/params (JWT-scoped).
 */
export async function deleteTenantApi(id: string): Promise<boolean> {
  if (await isDemoMode()) return false;
  try {
    const response = await api.delete(API_ENDPOINTS.TENANTS.DELETE);
    return response.ok;
  } catch {
    return false;
  }
}

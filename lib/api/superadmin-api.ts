import { api, handleResponse } from './client';
import { API_ENDPOINTS } from '@/constants/api-config';

const EP = API_ENDPOINTS.SUPERADMIN;

export interface SuperAdminProfile {
  id: string;
  email: string;
  name: string;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  tenant_id?: string | null;
  created_at: string;
}

// Raw backend admin shape (GET /superadmin/admins → { admins, total }).
interface BackendAdmin {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  tenant_id?: string | null;
  created_at: string;
}

function toUiAdmin(a: BackendAdmin): AdminAccount {
  return {
    id: a.id,
    email: a.email,
    name: a.full_name,
    role: a.role,
    is_active: a.is_active,
    tenant_id: a.tenant_id,
    created_at: a.created_at,
  };
}

// POST /superadmin/admins/{id}/impersonate
export interface ImpersonateResult {
  access_token: string;
  expires_in: number;
  impersonated_admin_id: string;
  impersonated_admin_email: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  is_active: boolean;
}

// Raw backend plan shape (GET /superadmin/plans → { plans, total }).
interface BackendPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number | string;
  price_yearly?: number | string | null;
  features?: string[] | Record<string, unknown> | null;
  is_active: boolean;
}

function planFeaturesToList(features: BackendPlan['features']): string[] {
  if (Array.isArray(features)) return features.map(String);
  if (features && typeof features === 'object') {
    const list = (features as Record<string, unknown>).list;
    if (Array.isArray(list)) return list.map(String);
    return Object.values(features).map(String);
  }
  return [];
}

function toUiPlan(p: BackendPlan): SubscriptionPlan {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price_monthly) || 0,
    features: planFeaturesToList(p.features),
    is_active: p.is_active,
  };
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'plan';
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  key?: string;
  // Not persisted by the backend; UI falls back when absent.
  environments?: string[];
  rollout?: number;
}

// Raw backend flag shape (GET /superadmin/feature-flags → { flags, total }).
interface BackendFlag {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  is_enabled: boolean;
}

function toUiFlag(f: BackendFlag): FeatureFlag {
  return {
    id: f.id,
    name: f.name,
    key: f.key,
    enabled: f.is_enabled,
    description: f.description ?? undefined,
  };
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_tenants: number;
  total_users: number;
  active_subscriptions: number;
  revenue: number;
}

export const superadminApi = {
  // Profile
  getMe: async () =>
    handleResponse<{ data: SuperAdminProfile }>(await api.get(EP.ME)),

  // Admins (backend: { data: { admins, total } }, name field is full_name)
  listAdmins: async () => {
    const res = handleResponse<{ data: { admins: BackendAdmin[] } }>(await api.get(EP.ADMINS.LIST));
    return { data: (await res).data.admins.map(toUiAdmin) };
  },
  createAdmin: async (data: { email: string; name: string; role: string }) =>
    handleResponse<{ data: AdminAccount }>(await api.post(EP.ADMINS.CREATE, data)),
  getAdmin: async (id: string) =>
    handleResponse<{ data: AdminAccount }>(await api.get(EP.ADMINS.GET(id))),
  updateAdmin: async (id: string, data: Partial<AdminAccount>) =>
    handleResponse<{ data: AdminAccount }>(await api.patch(EP.ADMINS.UPDATE(id), data)),
  deleteAdmin: (id: string) =>
    api.delete(EP.ADMINS.DELETE(id)),
  getAuditTrail: async (id: string) =>
    handleResponse<{ data: any[] }>(await api.get(EP.ADMINS.AUDIT(id))),
  // Backend accepts no body today; reason is sent best-effort for audit detail.
  impersonate: async (id: string, reason?: string) =>
    handleResponse<{ data: ImpersonateResult }>(
      await api.post(EP.ADMINS.IMPERSONATE(id), reason ? { reason } : {})
    ),
  // Backend: { data: { logs, total } }
  getAuditLogs: async () => {
    const res = handleResponse<{ data: { logs: any[] } }>(await api.get(EP.AUDIT_LOGS));
    return { data: (await res).data.logs };
  },

  // Plans (backend: { data: { plans, total } }, snake_case fields)
  listPlans: async () => {
    const res = handleResponse<{ data: { plans: BackendPlan[] } }>(await api.get(EP.PLANS.LIST));
    return { data: (await res).data.plans.map(toUiPlan) };
  },
  createPlan: async (data: Omit<SubscriptionPlan, 'id'>) => {
    const payload = {
      name: data.name,
      slug: slugify(data.name),
      price_monthly: data.price,
      features: { list: data.features },
    };
    const res = handleResponse<{ data: BackendPlan }>(await api.post(EP.PLANS.CREATE, payload));
    return { data: toUiPlan((await res).data) };
  },
  updatePlan: async (id: string, data: Partial<SubscriptionPlan>) => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.price !== undefined) payload.price_monthly = data.price;
    if (data.features !== undefined) payload.features = { list: data.features };
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    const res = handleResponse<{ data: BackendPlan }>(await api.patch(EP.PLANS.UPDATE(id), payload));
    return { data: toUiPlan((await res).data) };
  },
  deletePlan: (id: string) =>
    api.delete(EP.PLANS.DELETE(id)),

  // Subscriptions
  assignSubscription: async (tenantId: string, planId: string, billingCycle?: 'MONTHLY' | 'YEARLY') =>
    api.post(EP.SUBSCRIPTIONS.ASSIGN(tenantId), { plan_id: planId, ...(billingCycle ? { billing_cycle: billingCycle } : {}) }),
  getSubscription: (tenantId: string) =>
    api.get(EP.SUBSCRIPTIONS.GET(tenantId)),
  upgradeSubscription: async (tenantId: string, planId: string, billingCycle?: 'MONTHLY' | 'YEARLY') =>
    api.patch(EP.SUBSCRIPTIONS.ASSIGN(tenantId), { plan_id: planId, ...(billingCycle ? { billing_cycle: billingCycle } : {}) }),

  // Feature Flags (backend: { data: { flags, total } }, is_enabled field)
  listFeatureFlags: async () => {
    const res = handleResponse<{ data: { flags: BackendFlag[] } }>(await api.get(EP.FEATURE_FLAGS.LIST));
    return { data: (await res).data.flags.map(toUiFlag) };
  },
  createFeatureFlag: async (data: { name: string; key?: string; description?: string; enabled?: boolean }) => {
    const payload = {
      name: data.name,
      key: data.key || slugify(data.name),
      description: data.description,
      is_enabled: data.enabled ?? false,
    };
    const res = handleResponse<{ data: BackendFlag }>(await api.post(EP.FEATURE_FLAGS.CREATE, payload));
    return { data: toUiFlag((await res).data) };
  },
  updateFeatureFlag: async (id: string, data: Partial<FeatureFlag>) => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.enabled !== undefined) payload.is_enabled = data.enabled;
    const res = handleResponse<{ data: BackendFlag }>(await api.patch(EP.FEATURE_FLAGS.UPDATE(id), payload));
    return { data: toUiFlag((await res).data) };
  },
  deleteFeatureFlag: (id: string) =>
    api.delete(EP.FEATURE_FLAGS.DELETE(id)),

  // Announcements (backend: { data: { announcements, total } })
  listAnnouncements: async () => {
    const res = handleResponse<{ data: { announcements: Announcement[] } }>(await api.get(EP.ANNOUNCEMENTS.LIST));
    return { data: (await res).data.announcements };
  },
  createAnnouncement: async (data: Omit<Announcement, 'id' | 'created_at'>) =>
    handleResponse<{ data: Announcement }>(await api.post(EP.ANNOUNCEMENTS.CREATE, data)),
  deleteAnnouncement: (id: string) =>
    api.delete(EP.ANNOUNCEMENTS.DELETE(id)),

  // Dashboard & Health
  getDashboard: async () =>
    handleResponse<{ data: DashboardMetrics }>(await api.get(EP.DASHBOARD)),
  getHealth: async () =>
    handleResponse<{ data: any }>(await api.get(EP.HEALTH)),
};

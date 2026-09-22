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
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  is_active: boolean;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
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

  // Admins
  listAdmins: async () =>
    handleResponse<{ data: AdminAccount[] }>(await api.get(EP.ADMINS.LIST)),
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
  impersonate: async (id: string) =>
    handleResponse<{ data: { token: string } }>(await api.post(EP.ADMINS.IMPERSONATE(id))),
  getAuditLogs: async () =>
    handleResponse<{ data: any[] }>(await api.get(EP.AUDIT_LOGS)),

  // Plans
  listPlans: async () =>
    handleResponse<{ data: SubscriptionPlan[] }>(await api.get(EP.PLANS.LIST)),
  createPlan: async (data: Omit<SubscriptionPlan, 'id'>) =>
    handleResponse<{ data: SubscriptionPlan }>(await api.post(EP.PLANS.CREATE, data)),
  updatePlan: async (id: string, data: Partial<SubscriptionPlan>) =>
    handleResponse<{ data: SubscriptionPlan }>(await api.patch(EP.PLANS.UPDATE(id), data)),
  deletePlan: (id: string) =>
    api.delete(EP.PLANS.DELETE(id)),

  // Subscriptions
  assignSubscription: async (tenantId: string, planId: string) =>
    api.post(EP.SUBSCRIPTIONS.ASSIGN(tenantId), { plan_id: planId }),
  getSubscription: (tenantId: string) =>
    api.get(EP.SUBSCRIPTIONS.GET(tenantId)),

  // Feature Flags
  listFeatureFlags: async () =>
    handleResponse<{ data: FeatureFlag[] }>(await api.get(EP.FEATURE_FLAGS.LIST)),
  createFeatureFlag: async (data: Omit<FeatureFlag, 'id'>) =>
    handleResponse<{ data: FeatureFlag }>(await api.post(EP.FEATURE_FLAGS.CREATE, data)),
  updateFeatureFlag: async (id: string, data: Partial<FeatureFlag>) =>
    handleResponse<{ data: FeatureFlag }>(await api.patch(EP.FEATURE_FLAGS.UPDATE(id), data)),
  deleteFeatureFlag: (id: string) =>
    api.delete(EP.FEATURE_FLAGS.DELETE(id)),

  // Announcements
  listAnnouncements: async () =>
    handleResponse<{ data: Announcement[] }>(await api.get(EP.ANNOUNCEMENTS.LIST)),
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

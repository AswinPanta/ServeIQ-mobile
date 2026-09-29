import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { PURPLE, BLUE, STATUS, AMBER, PINK } from '@/lib/constants/figma-tokens';
import { superadminApi, AdminAccount, SubscriptionPlan, FeatureFlag, Announcement, DashboardMetrics } from '@/lib/api/superadmin-api';

// ── Types ──

export interface Permission {
  id: string;
  name: string;
  allowed: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  userCount: number;
  permissions: Permission[];
  isSystem?: boolean;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  mfaEnabled: boolean;
  sessionTimeout: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  webhookUrl: string;
}

interface SuperAdminContextType {
  roles: Role[];
  settings: PlatformSettings;
  updateRole: (roleId: string, updates: Partial<Omit<Role, 'id'>>) => void;
  togglePermission: (roleId: string, permissionId: string) => void;
  createRole: (role: Omit<Role, 'id'>) => void;
  deleteRole: (roleId: string) => void;
  updateSettings: (updates: Partial<PlatformSettings>) => void;
  admins: AdminAccount[];
  plans: SubscriptionPlan[];
  featureFlags: FeatureFlag[];
  announcements: Announcement[];
  dashboardMetrics: DashboardMetrics | null;
  healthStatus: any | null;
  auditLogs: any[];
  fetchAdmins: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchFeatureFlags: () => Promise<void>;
  fetchAnnouncements: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  createAdmin: (data: { email: string; name: string; role: string }) => Promise<void>;
  updateAdmin: (id: string, data: Partial<AdminAccount>) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  createPlan: (data: Omit<SubscriptionPlan, 'id'>) => Promise<void>;
  updatePlan: (id: string, data: Partial<SubscriptionPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  createFeatureFlag: (data: Omit<FeatureFlag, 'id'>) => Promise<void>;
  updateFeatureFlag: (id: string, data: Partial<FeatureFlag>) => Promise<void>;
  deleteFeatureFlag: (id: string) => Promise<void>;
  createAnnouncement: (data: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

// ── Default Data ──

const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'manage_tenants', name: 'Manage Tenants', allowed: false },
  { id: 'view_billing', name: 'View Billing', allowed: false },
  { id: 'manage_platform', name: 'Manage Platform', allowed: false },
  { id: 'manage_roles', name: 'Manage Roles', allowed: false },
  { id: 'view_reports', name: 'View Reports', allowed: false },
  { id: 'system_config', name: 'System Config', allowed: false },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'superadmin',
    name: 'SuperAdmin',
    description: 'Full platform access with all permissions',
    color: PURPLE[700],
    userCount: 1,
    permissions: DEFAULT_PERMISSIONS.map(p => ({ ...p, allowed: true })),
    isSystem: true,
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Operational access with limited platform management',
    color: BLUE[500],
    userCount: 3,
    permissions: DEFAULT_PERMISSIONS.map(p => ({
      ...p,
      allowed: ['manage_tenants', 'view_billing', 'view_reports'].includes(p.id),
    })),
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Tenant management and billing view access',
    color: STATUS.activeGreen,
    userCount: 5,
    permissions: DEFAULT_PERMISSIONS.map(p => ({
      ...p,
      allowed: ['manage_tenants', 'view_billing', 'view_reports'].includes(p.id),
    })),
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Support ticket access only',
    color: AMBER[500],
    userCount: 4,
    permissions: DEFAULT_PERMISSIONS.map(p => ({ ...p, allowed: false })),
  },
  {
    id: 'readonly',
    name: 'Read-Only',
    description: 'View-only access to reports and billing',
    color: PINK[500],
    userCount: 2,
    permissions: DEFAULT_PERMISSIONS.map(p => ({
      ...p,
      allowed: ['view_billing', 'view_reports'].includes(p.id),
    })),
  },
];

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'ServeIQ',
  supportEmail: 'support@serveiq.com',
  defaultCurrency: 'NPR',
  mfaEnabled: false,
  sessionTimeout: '30',
  maintenanceMode: false,
  maintenanceMessage: 'Platform is under scheduled maintenance.',
  webhookUrl: 'https://hooks.serveiq.com/events',
};

// ── Context ──

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await superadminApi.listAdmins();
      setAdmins(res.data);
    } catch (e) {
      console.error('Failed to fetch admins', e);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await superadminApi.listPlans();
      setPlans(res.data);
    } catch (e) {
      console.error('Failed to fetch plans', e);
    }
  }, []);

  const fetchFeatureFlags = useCallback(async () => {
    try {
      const res = await superadminApi.listFeatureFlags();
      setFeatureFlags(res.data);
    } catch (e) {
      console.error('Failed to fetch feature flags', e);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await superadminApi.listAnnouncements();
      setAnnouncements(res.data);
    } catch (e) {
      console.error('Failed to fetch announcements', e);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await superadminApi.getDashboard();
      setDashboardMetrics(res.data);
    } catch (e) {
      console.error('Failed to fetch dashboard', e);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await superadminApi.getHealth();
      setHealthStatus(res.data);
    } catch (e) {
      console.error('Failed to fetch health', e);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await superadminApi.getAuditLogs();
      setAuditLogs(res.data);
    } catch (e) {
      console.error('Failed to fetch audit logs', e);
    }
  }, []);

  useEffect(() => {
    // Deferred so the effect body itself never triggers a state update.
    const kick = () => { void Promise.all([fetchAdmins(), fetchPlans(), fetchFeatureFlags(), fetchAnnouncements(), fetchDashboard(), fetchHealth(), fetchAuditLogs()]); };
    const t = setTimeout(kick, 0);
    return () => clearTimeout(t);
  }, [fetchAdmins, fetchPlans, fetchFeatureFlags, fetchAnnouncements, fetchDashboard, fetchHealth, fetchAuditLogs]);

  const updateRole = useCallback((roleId: string, updates: Partial<Omit<Role, 'id'>>) => {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updates } : r));
  }, []);

  const togglePermission = useCallback((roleId: string, permissionId: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      return {
        ...r,
        permissions: r.permissions.map(p =>
          p.id === permissionId ? { ...p, allowed: !p.allowed } : p
        ),
      };
    }));
  }, []);

  const createRole = useCallback((roleData: Omit<Role, 'id'>) => {
    const newRole: Role = {
      ...roleData,
      id: `role_${Date.now()}`,
    };
    setRoles(prev => [...prev, newRole]);
  }, []);

  const deleteRole = useCallback((roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
  }, []);

  const updateSettings = useCallback((updates: Partial<PlatformSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const createAdmin = useCallback(async (data: { email: string; name: string; role: string }) => {
    await superadminApi.createAdmin(data);
    await fetchAdmins();
  }, [fetchAdmins]);

  const updateAdmin = useCallback(async (id: string, data: Partial<AdminAccount>) => {
    await superadminApi.updateAdmin(id, data);
    await fetchAdmins();
  }, [fetchAdmins]);

  const deleteAdmin = useCallback(async (id: string) => {
    await superadminApi.deleteAdmin(id);
    await fetchAdmins();
  }, [fetchAdmins]);

  const createPlan = useCallback(async (data: Omit<SubscriptionPlan, 'id'>) => {
    await superadminApi.createPlan(data);
    await fetchPlans();
  }, [fetchPlans]);

  const updatePlan = useCallback(async (id: string, data: Partial<SubscriptionPlan>) => {
    await superadminApi.updatePlan(id, data);
    await fetchPlans();
  }, [fetchPlans]);

  const deletePlan = useCallback(async (id: string) => {
    await superadminApi.deletePlan(id);
    await fetchPlans();
  }, [fetchPlans]);

  const createFeatureFlag = useCallback(async (data: Omit<FeatureFlag, 'id'>) => {
    await superadminApi.createFeatureFlag(data);
    await fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  const updateFeatureFlag = useCallback(async (id: string, data: Partial<FeatureFlag>) => {
    await superadminApi.updateFeatureFlag(id, data);
    await fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  const deleteFeatureFlag = useCallback(async (id: string) => {
    await superadminApi.deleteFeatureFlag(id);
    await fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  const createAnnouncement = useCallback(async (data: Omit<Announcement, 'id' | 'created_at'>) => {
    await superadminApi.createAnnouncement(data);
    await fetchAnnouncements();
  }, [fetchAnnouncements]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    await superadminApi.deleteAnnouncement(id);
    await fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <SuperAdminContext.Provider
      value={{
        roles,
        settings,
        updateRole,
        togglePermission,
        createRole,
        deleteRole,
        updateSettings,
        admins,
        plans,
        featureFlags,
        announcements,
        dashboardMetrics,
        healthStatus,
        auditLogs,
        fetchAdmins,
        fetchPlans,
        fetchFeatureFlags,
        fetchAnnouncements,
        fetchDashboard,
        fetchHealth,
        fetchAuditLogs,
        createAdmin,
        updateAdmin,
        deleteAdmin,
        createPlan,
        updatePlan,
        deletePlan,
        createFeatureFlag,
        updateFeatureFlag,
        deleteFeatureFlag,
        createAnnouncement,
        deleteAnnouncement,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  return ctx;
}

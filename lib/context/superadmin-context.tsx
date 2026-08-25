import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PURPLE, BLUE, STATUS, AMBER, PINK } from '@/lib/constants/figma-tokens';

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

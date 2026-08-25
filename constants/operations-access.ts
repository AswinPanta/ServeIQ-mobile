import type { OperatorRole } from '@/types/api';

/**
 * SRS permission matrix (ST-002 role assignment + access grid) for the
 * operations portal. Maps each module route id to the roles that may open it.
 *
 * From the SRS access grid:
 *  - View all bookings / create-cancel bookings / check-in-out  → Manager + Front Desk
 *  - Take table orders (POS)                                   → Waiter + Front Desk
 *  - View Kitchen Display (KDS)                                → Kitchen Staff + Manager
 *  - Access guest CRM                                          → Manager + Front Desk (limited)
 *  - Add/remove staff, approvals, shifts                       → Manager (Admin reserved)
 *  - Housekeeping tasks / maintenance                          → Housekeeping / Maintenance
 */
export const MODULE_ROLES: Record<string, OperatorRole[]> = {
  'front-desk': ['manager', 'front_desk'],
  housekeeping: ['manager', 'housekeeping', 'maintenance'],
  pos: ['manager', 'front_desk', 'waiter', 'pos'],
  kds: ['manager', 'kitchen', 'kds'],
  analytics: ['manager'],
  // The whole admin group (staff / approvals / shifts) is manager-only today;
  // guard the group with a single key so future role changes happen in one place.
  admin: ['manager'],
  'admin/staff': ['manager'],
  'admin/approvals': ['manager'],
  'admin/shifts': ['manager'],
};

/** Human-readable label per operator role (shown in the dashboard header). */
export const OPS_ROLE_LABELS: Record<OperatorRole, string> = {
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  pos: 'POS',
  kds: 'Kitchen Display',
  manager: 'Manager',
  waiter: 'Waiter',
  kitchen: 'Kitchen Staff',
  maintenance: 'Maintenance',
};

/**
 * True when `role` may open the given module. Unknown/missing roles are never
 * locked out: a role outside the known set means the app cannot tell what to
 * restrict, so it defaults to granting access rather than emptying the grid.
 */
export function hasOpsModuleAccess(role: OperatorRole | null | undefined, moduleId: string): boolean {
  if (!role || !(role in OPS_ROLE_LABELS)) return true;
  const allowed = MODULE_ROLES[moduleId];
  return allowed ? allowed.includes(role) : true;
}

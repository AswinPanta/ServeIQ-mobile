import { MODULE_ROLES, OPS_ROLE_LABELS, hasOpsModuleAccess } from '@/constants/operations-access';

const ALL_ROLES = [
  'front_desk',
  'housekeeping',
  'pos',
  'kds',
  'manager',
  'waiter',
  'kitchen',
  'maintenance',
] as const;

describe('operations-access (SRS permission matrix)', () => {
  test('every OperatorRole maps to at least one module (no empty dashboard grid)', () => {
    const coveredRoles = new Set(Object.values(MODULE_ROLES).flat());
    for (const role of ALL_ROLES) {
      expect(coveredRoles.has(role)).toBe(true);
    }
  });

  test('every role label exists (header never shows a raw role key)', () => {
    for (const role of ALL_ROLES) {
      expect(OPS_ROLE_LABELS[role]).toBeTruthy();
    }
  });

  test('front desk opens Front Desk + POS only (SRS access grid)', () => {
    expect(hasOpsModuleAccess('front_desk', 'front-desk')).toBe(true);
    expect(hasOpsModuleAccess('front_desk', 'pos')).toBe(true);
    expect(hasOpsModuleAccess('front_desk', 'kds')).toBe(false);
    expect(hasOpsModuleAccess('front_desk', 'housekeeping')).toBe(false);
    expect(hasOpsModuleAccess('front_desk', 'analytics')).toBe(false);
    expect(hasOpsModuleAccess('front_desk', 'admin')).toBe(false);
  });

  test('kitchen staff opens KDS only; housekeeping opens housekeeping only', () => {
    expect(hasOpsModuleAccess('kitchen', 'kds')).toBe(true);
    expect(hasOpsModuleAccess('kitchen', 'front-desk')).toBe(false);
    expect(hasOpsModuleAccess('housekeeping', 'housekeeping')).toBe(true);
    expect(hasOpsModuleAccess('housekeeping', 'pos')).toBe(false);
  });

  test('manager opens every module (elevated permissions)', () => {
    for (const moduleId of Object.keys(MODULE_ROLES)) {
      expect(hasOpsModuleAccess('manager', moduleId)).toBe(true);
    }
  });

  test('unknown/missing role is never locked out (defensive default)', () => {
    expect(hasOpsModuleAccess(undefined, 'analytics')).toBe(true);
    expect(hasOpsModuleAccess('not_a_role' as any, 'front-desk')).toBe(true);
  });
});

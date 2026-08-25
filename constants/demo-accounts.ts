/**
 * Demo Accounts — Hardcoded credentials for instant access
 *
 * Each role has a unique email/password that triggers a demo login
 * without needing the backend API. Used for development and demos.
 */

import type { PortalType, OperatorRole } from '@/types/api';

export interface DemoAccount {
  email: string;
  password: string;
  name: string;
  portal: PortalType;
  operatorRole?: OperatorRole;
  label: string;
  description: string;
  color: string;
}

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  guest: {
    email: 'guest@serveiq.com',
    password: 'guest123',
    name: 'Demo Guest',
    portal: 'guest',
    label: 'Guest',
    description: 'Search, book & review hotels',
    color: '#E74C3C',
  },
  host: {
    email: 'host@serveiq.com',
    password: 'host123',
    name: 'Demo Host',
    portal: 'host',
    label: 'Host',
    description: 'Manage properties & bookings',
    color: '#2980B9',
  },
  manager: {
    email: 'manager@serveiq.com',
    password: 'manager123',
    name: 'Demo Manager',
    portal: 'operations',
    operatorRole: 'manager',
    label: 'Manager',
    description: 'Hotel operations dashboard',
    color: '#0D9488',
  },
  front_desk: {
    email: 'frontdesk@serveiq.com',
    password: 'frontdesk123',
    name: 'Demo Front Desk',
    portal: 'operations',
    operatorRole: 'front_desk',
    label: 'Front Desk',
    description: 'Check-in, check-out & bookings',
    color: '#0D9488',
  },
  housekeeping: {
    email: 'housekeeping@serveiq.com',
    password: 'housekeeping123',
    name: 'Demo Housekeeper',
    portal: 'operations',
    operatorRole: 'housekeeping',
    label: 'Housekeeping',
    description: 'Room cleaning & inspection',
    color: '#0D9488',
  },
  pos: {
    email: 'pos@serveiq.com',
    password: 'pos123',
    name: 'Demo POS Staff',
    portal: 'operations',
    operatorRole: 'pos',
    label: 'POS',
    description: 'Restaurant & table orders',
    color: '#0D9488',
  },
  kds: {
    email: 'kds@serveiq.com',
    password: 'kds123',
    name: 'Demo Kitchen Staff',
    portal: 'operations',
    operatorRole: 'kds',
    label: 'KDS',
    description: 'Kitchen display system',
    color: '#0D9488',
  },
  superadmin: {
    email: 'admin@serveiq.com',
    password: 'Admin@123',
    name: 'Demo Admin',
    portal: 'superadmin',
    label: 'SuperAdmin',
    description: 'Platform control & settings',
    color: '#7C3AED',
  },
};

/** Find demo account by email+password match */
export function findDemoAccount(email: string, password: string): DemoAccount | null {
  const normalizedEmail = email.toLowerCase().trim();
  for (const account of Object.values(DEMO_ACCOUNTS)) {
    if (account.email.toLowerCase() === normalizedEmail && account.password === password) {
      return account;
    }
  }
  return null;
}

/** Get all demo accounts as an array */
export function getAllDemoAccounts(): DemoAccount[] {
  return Object.values(DEMO_ACCOUNTS);
}

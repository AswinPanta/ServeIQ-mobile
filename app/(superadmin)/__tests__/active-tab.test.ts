import { activeTabKey } from '../_layout';

const TABS = [
  { key: 'index', route: '/(superadmin)' },
  { key: 'tenants', route: '/(superadmin)/tenants' },
  { key: 'commerce', route: '/(superadmin)/commerce/subscriptions' },
  { key: 'platform', route: '/(superadmin)/platform/feature-flags' },
  { key: 'more', route: '/(superadmin)/more' },
];

describe('activeTabKey', () => {
  it.each([
    ['/', 'index'],
    ['/index', 'index'],
    ['/tenants', 'tenants'],
    ['/commerce/subscriptions', 'commerce'],
    ['/platform/feature-flags', 'platform'],
    ['/more', 'more'],
  ])('maps pathname %s to %s', (pathname, expected) => {
    expect(activeTabKey(TABS, pathname)).toBe(expected);
  });
});

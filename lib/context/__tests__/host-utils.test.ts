import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Property } from '@/types/api';
import {
  getHostPropertiesKey,
  persistHostProperties,
  mergeRestoredProperties,
  computeActivePropertyId,
  isApiPropertyId,
  SEED_PROPERTY_IDS,
} from '@/lib/context/host-utils';

function makeProp(id: string, tenant = 'tenant-1'): Property {
  return {
    id,
    tenant_id: tenant,
    name: `Property ${id}`,
    type: 'HOTEL',
    description: '',
    country: '',
    state: '',
    city: '',
    zip_code: '',
    address: '',
    latitude: 0,
    longitude: 0,
    check_in_time_from: '14:00',
    check_in_time_to: '12:00',
    check_out_time_from: '00:00',
    check_out_time_to: '11:00',
    number_of_floors: 1,
    total_rooms: 1,
    year_built: 2020,
    amenities: [],
    is_active: true,
    currency: 'USD',
    timezone: 'UTC',
    brand_color: undefined,
    min_rate_floor: 0,
    logo_url: null,
    custom_domain: null,
    cancellation_policy: 'MODERATE',
    photos: [],
    created_at: '',
    updated_at: '',
  };
}

const deletedAll = new Set<string>(['prop-1', 'prop-2', 'prop-3']);
const empty = new Set<string>();

describe('getHostPropertiesKey', () => {
  it('scopes the persisted key per user id', () => {
    expect(getHostPropertiesKey('user-42')).toBe('host_saved_properties_user-42');
    expect(getHostPropertiesKey('user-7')).toBe('host_saved_properties_user-7');
  });

  it('falls back to the legacy global key when no user id is known', () => {
    expect(getHostPropertiesKey()).toBe('host_saved_properties_v1');
    expect(getHostPropertiesKey(undefined)).toBe('host_saved_properties_v1');
  });
});

describe('persistHostProperties', () => {
  it('never persists the demo seed properties', async () => {
    await persistHostProperties([makeProp('prop-1'), makeProp('custom-9')], 'user-42');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'host_saved_properties_user-42',
      JSON.stringify([makeProp('custom-9')]),
    );
  });
});

describe('mergeRestoredProperties', () => {
  it('gives a REAL host zero properties when nothing is saved, even if prev held seeds', () => {
    const result = mergeRestoredProperties({
      prev: [makeProp('prop-1'), makeProp('prop-2')],
      saved: [],
      deletedSeedIds: empty,
      isDemoHost: false,
    });
    expect(result).toEqual([]);
  });

  it('a REAL host never receives the demo seeds from restored data', () => {
    const result = mergeRestoredProperties({
      prev: [makeProp('prop-3')],
      saved: [makeProp('prop-1'), makeProp('prop-2'), makeProp('own-1')],
      deletedSeedIds: empty,
      isDemoHost: false,
    });
    expect(result.map(p => p.id)).toEqual(['own-1']);
  });

  it('a REAL host restores only their own saved properties (session extras kept, seeds dropped)', () => {
    const result = mergeRestoredProperties({
      prev: [makeProp('session-1'), makeProp('prop-1')],
      saved: [makeProp('own-1')],
      deletedSeedIds: empty,
      isDemoHost: false,
    });
    expect(result.map(p => p.id).sort()).toEqual(['own-1', 'session-1']);
  });

  it('a DEMO host keeps the seed properties when none are deleted', () => {
    const result = mergeRestoredProperties({
      prev: [],
      saved: [],
      deletedSeedIds: empty,
      isDemoHost: true,
    });
    expect(result.map(p => p.id)).toEqual(['prop-1', 'prop-2', 'prop-3']);
  });

  it('a DEMO host drops seeds the user deleted and keeps saved + session props', () => {
    const result = mergeRestoredProperties({
      prev: [makeProp('session-1')],
      saved: [makeProp('custom-1')],
      deletedSeedIds: new Set(['prop-2']),
      isDemoHost: true,
    });
    const ids = result.map(p => p.id).sort();
    expect(ids).toEqual(['custom-1', 'prop-1', 'prop-3', 'session-1']);
  });

  it('a DEMO host sees no seeds when all of them are deleted', () => {
    const result = mergeRestoredProperties({
      prev: [],
      saved: [],
      deletedSeedIds: deletedAll,
      isDemoHost: true,
    });
    expect(result).toEqual([]);
  });
});

describe('isApiPropertyId', () => {
  it('accepts real backend UUIDs', () => {
    expect(isApiPropertyId('7f7a9c1e-4b2d-4a1e-9c3f-0e2a5b6c7d8e')).toBe(true);
    expect(isApiPropertyId('7F7A9C1E-4B2D-4A1E-9C3F-0E2A5B6C7D8E')).toBe(true);
  });

  it('rejects seed/demo ids that would fail backend UUID validation', () => {
    expect(isApiPropertyId('prop-1')).toBe(false);
    expect(isApiPropertyId('custom-9')).toBe(false);
    expect(isApiPropertyId('')).toBe(false);
    expect(isApiPropertyId(null)).toBe(false);
    expect(isApiPropertyId(undefined)).toBe(false);
  });

  it('rejects malformed UUIDs', () => {
    expect(isApiPropertyId('7f7a9c1e-4b2d-4a1e-9c3f')).toBe(false);
    expect(isApiPropertyId('7f7a9c1e-4b2d-4a1e-9c3f-0e2a5b6c7d8ez')).toBe(false);
  });
});

describe('computeActivePropertyId', () => {
  it('a REAL host keeps prevActive when it is in the saved list', () => {
    const id = computeActivePropertyId({
      prevActive: 'own-1',
      saved: [makeProp('own-1')],
      deletedSeedIds: empty,
      isDemoHost: false,
    });
    expect(id).toBe('own-1');
  });

  it('a REAL host returns null when nothing survives', () => {
    const id = computeActivePropertyId({
      prevActive: 'prop-1',
      saved: [],
      deletedSeedIds: empty,
      isDemoHost: false,
    });
    expect(id).toBeNull();
  });

  it('a DEMO host does not point at a deleted seed', () => {
    const id = computeActivePropertyId({
      prevActive: 'prop-1',
      saved: [],
      deletedSeedIds: deletedAll,
      isDemoHost: true,
    });
    expect(id).toBeNull();
  });

  it('SEED_PROPERTY_IDS matches the demo seed ids', () => {
    expect([...SEED_PROPERTY_IDS].sort()).toEqual(['prop-1', 'prop-2', 'prop-3']);
  });
});

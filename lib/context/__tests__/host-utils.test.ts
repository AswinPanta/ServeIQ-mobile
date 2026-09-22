import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistHostProperties,
  mergeRestoredProperties,
  computeActivePropertyId,
  getHostPropertiesKey,
  isApiPropertyId,
} from '@/lib/context/host-utils';
import type { Property } from '@/types/api';

const makeProp = (id: string): Property =>
  ({ id, name: `Property ${id}`, photos: [] } as unknown as Property);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getHostPropertiesKey', () => {
  it('scopes saved properties per user id', () => {
    expect(getHostPropertiesKey('user-42')).toBe('host_saved_properties_user-42');
  });

  it('falls back to the legacy global key when no user id is known', () => {
    expect(getHostPropertiesKey()).toBe('host_saved_properties_v1');
    expect(getHostPropertiesKey(undefined)).toBe('host_saved_properties_v1');
  });
});

describe('persistHostProperties', () => {
  it('never persists the legacy demo seed properties', async () => {
    await persistHostProperties([makeProp('prop-1'), makeProp('custom-9')], 'user-42');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'host_saved_properties_user-42',
      JSON.stringify([makeProp('custom-9')]),
    );
  });
});

describe('mergeRestoredProperties', () => {
  it('restores nothing when nothing is saved, even if prev held seed ids', () => {
    const result = mergeRestoredProperties({
      prev: [makeProp('prop-1'), makeProp('prop-2')],
      saved: [],
    });
    expect(result).toEqual([]);
  });

  it('never restores the legacy demo seed ids from saved data', () => {
    const result = mergeRestoredProperties({
      prev: [makeProp('prop-3')],
      saved: [makeProp('prop-1'), makeProp('prop-2'), makeProp('own-1')],
    });
    expect(result.map(p => p.id)).toEqual(['own-1']);
  });

  it('restores saved properties and keeps session extras (seeds dropped)', () => {
    const result = mergeRestoredProperties({
      prev: [makeProp('session-1'), makeProp('prop-1')],
      saved: [makeProp('own-1')],
    });
    expect(result.map(p => p.id).sort()).toEqual(['own-1', 'session-1']);
  });

  it('deduplicates saved properties against session state', () => {
    const result = mergeRestoredProperties({
      prev: [makeProp('own-1')],
      saved: [makeProp('own-1')],
    });
    expect(result.map(p => p.id)).toEqual(['own-1']);
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
  it('keeps prevActive when it is in the saved list', () => {
    const id = computeActivePropertyId({
      prevActive: 'own-1',
      saved: [makeProp('own-1')],
    });
    expect(id).toBe('own-1');
  });

  it('returns null when nothing survives', () => {
    const id = computeActivePropertyId({
      prevActive: 'prop-1',
      saved: [],
    });
    expect(id).toBeNull();
  });

  it('falls back to the first saved property', () => {
    const id = computeActivePropertyId({
      prevActive: null,
      saved: [makeProp('own-1'), makeProp('own-2')],
    });
    expect(id).toBe('own-1');
  });
});

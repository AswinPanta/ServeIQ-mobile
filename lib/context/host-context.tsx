import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/context/auth-context';
import { useNetworkStatus } from '@/hooks/use-network-status';
import type {
  Property,
  RoomTypeDef,
  AdminRoom,
  RatePlan,
  DateOverride,
  AdminDiscountCode,
  SpecialOffer,
  TaxConfig,
  StaffMember,
  Shift,
  StaffTask,
  AdminRoomStatus,
  BackendStaff,
  StaffPhotos,
  CreateStaffRequest,
} from '@/types/api';
import {
  mockProperties,
  mockRoomTypeDefs,
  mockAdminRooms,
  mockRatePlans,
  mockDateOverrides,
  mockDiscountCodes,
  mockSpecialOffers,
  mockTaxConfigs,
  mockStaff,
  mockShifts,
  mockStaffTasks,
  mockBookings,
} from '@/lib/mock/host-data';
import { hostApi, ensureRoomType, ensureBedType } from '@/lib/api/host-api';
import { addMockProperty, updateMockProperty, removeMockProperty } from '@/lib/mock/properties';
import type { Hotel, HotelAmenity, RoomType } from '@/lib/mock/properties';
import { registerOpsProperty, addOpsFrontDeskRoom, removeOpsFrontDeskRoom, removeOpsProperty } from '@/lib/context/frontdesk-context';
import {
  persistHostProperties,
  mapApiProperty,
  mapApiRoom,
  mapApiStaff,
  getHostPropertiesKey,
  mergeRestoredProperties,
  computeActivePropertyId,
  isApiPropertyId,
  HOST_DELETED_SEEDS_KEY,
  SEED_PROPERTY_IDS,
  OPS_DEFAULT_PROPERTY_ID_KEY,
  OPS_DEFAULT_PROPERTY_NAME_KEY,
} from '@/lib/context/host-utils';

/** Real backend entity ids are UUIDs; seed/demo ids are not. Guards backend sync. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STAFF_SALARY_DEFAULTS: Record<StaffMember['role'], number> = {
  manager: 50000,
  front_desk: 20000,
  housekeeping: 18000,
  waiter: 15000,
  kitchen: 20000,
  maintenance: 20000,
};

/** Maps the app's StaffRole to the backend's BackendJobRole enum. */
const STAFF_ROLE_TO_BACKEND: Record<StaffMember['role'], string> = {
  manager: 'MANAGER',
  front_desk: 'FRONT_DESK',
  housekeeping: 'HOUSEKEEPING',
  waiter: 'WAITER',
  kitchen: 'KITCHEN',
  maintenance: 'MAINTENANCE',
};

/** Backend RoomBase cancellation copy, matching the listing wizard. */
const CANCEL_TITLES: Record<string, string> = {
  FLEXIBLE: 'Flexible cancellation',
  MODERATE: 'Moderate cancellation',
  STRICT: 'Strict cancellation',
  NON_REFUNDABLE: 'Non-refundable',
};
const CANCEL_DESCRIPTIONS: Record<string, string> = {
  FLEXIBLE: 'Free cancellation up to 48 hours before check-in.',
  MODERATE: 'Free cancellation up to 7 days before check-in.',
  STRICT: 'Free cancellation up to 30 days before check-in.',
  NON_REFUNDABLE: 'This booking is non-refundable.',
};

const isRemoteUrl = (u: string) => /^https?:\/\//i.test(u);

interface HostContextType {
  properties: Property[];
  roomTypes: RoomTypeDef[];
  rooms: AdminRoom[];
  ratePlans: RatePlan[];
  dateOverrides: DateOverride[];
  discountCodes: AdminDiscountCode[];
  specialOffers: SpecialOffer[];
  taxConfigs: TaxConfig[];
  staff: StaffMember[];
  shifts: Shift[];
  staffTasks: StaffTask[];
  bookings: typeof mockBookings;
  /** System amenities fetched from GET /properties/amenities (backend-authoritative list). */
  systemAmenities: string[];
  activePropertyId: string | null;
  setActivePropertyId: (id: string | null) => void;
  isDataLoading: boolean;
  loadedPersisted: boolean;
  /** True while local-only properties are being auto-synced to the server. */
  syncingToServer: boolean;
  fetchHostData: () => void;
  refreshRooms: (propertyId?: string) => void;

  /** Adds a property locally and (when it isn't already a backend property) creates it on the server. Resolves with the final property (server id swapped in when created). */
  addProperty: (p: Property) => Promise<Property>;
  /**
   * Pushes an existing local-only property to the server (general info,
   * location, localization, photos, rooms, and special offers) and swaps in its
   * real backend id. Resolves with the synced property plus any warnings for
   * detail uploads that failed.
   */
  syncPropertyToServer: (p: Property) => Promise<{ property: Property; warnings: string[] }>;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  togglePropertyActivation: (id: string) => void;
  removeProperty: (id: string) => void;

  addRoomType: (rt: RoomTypeDef) => void;
  updateRoomType: (id: string, updates: Partial<RoomTypeDef>) => void;
  removeRoomType: (id: string) => void;

  addRoom: (r: AdminRoom, opts?: { skipBackend?: boolean }) => void;
  updateRoom: (id: string, updates: Partial<AdminRoom>) => void;
  removeRoom: (id: string) => void;
  updateRoomStatus: (id: string, status: AdminRoomStatus) => void;
  syncLocalRoomsToServer: (propertyId?: string) => Promise<{ synced: number; errors: string[] }>;

  addRatePlan: (rp: RatePlan) => void;
  updateRatePlan: (id: string, updates: Partial<RatePlan>) => void;
  removeRatePlan: (id: string) => void;

  addDateOverride: (d: DateOverride) => void;
  removeDateOverride: (id: string) => void;

  addDiscountCode: (dc: AdminDiscountCode) => void;
  updateDiscountCode: (id: string, updates: Partial<AdminDiscountCode>) => void;
  removeDiscountCode: (id: string) => void;

  addSpecialOffer: (so: SpecialOffer) => void;
  updateSpecialOffer: (id: string, updates: Partial<SpecialOffer>) => void;
  removeSpecialOffer: (id: string) => void;

  addTaxConfig: (tx: TaxConfig) => void;
  updateTaxConfig: (id: string, updates: Partial<TaxConfig>) => void;
  removeTaxConfig: (id: string) => void;

  addStaff: (s: StaffMember, joiningDate?: string, photos?: StaffPhotos) => Promise<boolean>;
  updateStaff: (id: string, updates: Partial<StaffMember>, extras?: { photos?: StaffPhotos; joining_date?: string }) => void;
  removeStaff: (id: string) => void;

  addShift: (s: Shift) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  removeShift: (id: string) => void;

  addStaffTask: (t: StaffTask) => void;
  updateStaffTask: (id: string, updates: Partial<StaffTask>) => void;
  removeStaffTask: (id: string) => void;

  getFilteredRooms: (propertyId: string) => AdminRoom[];
  getFilteredRoomTypes: (propertyId: string) => RoomTypeDef[];
  getFilteredStaff: (propertyId: string) => StaffMember[];
  getFilteredBookings: (propertyId: string) => typeof mockBookings;

  setPropertyCoverPhoto: (propertyId: string, imageUri: string) => Promise<void>;
  addPropertyGalleryPhotos: (propertyId: string, imageUris: string[]) => Promise<void>;
  removePropertyGalleryPhoto: (propertyId: string, photoUrl: string) => Promise<void>;
}

const HostContext = createContext<HostContextType | undefined>(undefined);

export function HostProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, portal, isLoading: authLoading, user, tokens } = useAuth();
  const [properties, setProperties] = useState<Property[]>([...mockProperties]);
  const [loadedPersisted, setLoadedPersisted] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDef[]>([...mockRoomTypeDefs]);
  const [rooms, setRooms] = useState<AdminRoom[]>([...mockAdminRooms]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([...mockRatePlans]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([...mockDateOverrides]);
  const [discountCodes, setDiscountCodes] = useState<AdminDiscountCode[]>([...mockDiscountCodes]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([...mockSpecialOffers]);
  const [taxConfigs, setTaxConfigs] = useState<TaxConfig[]>([...mockTaxConfigs]);
  const [staff, setStaff] = useState<StaffMember[]>([...mockStaff]);
  const [shifts, setShifts] = useState<Shift[]>([...mockShifts]);
  const [staffTasks, setStaffTasks] = useState<StaffTask[]>([...mockStaffTasks]);
  const [bookings] = useState([...mockBookings]);
  const [apiBookings, setApiBookings] = useState<any[]>([]);
  const [systemAmenities, setSystemAmenities] = useState<string[]>([]);
  // Tracks which properties have had their bookings fetched from the backend.
  // Once a property has been queried, we always prefer the API result (even if
  // empty) over the mock data — this prevents stale mock bookings from showing
  // when a real property has no bookings yet.
  const bookingsFetchedRef = useRef(new Set<string>());
  const [activePropertyId, setActivePropertyIdState] = useState<string | null>('prop-1');
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Offline-first sync: while the server is unreachable, properties are saved to
  // AsyncStorage. When the device regains internet (or starts online) any local-only
  // property is pushed to the backend automatically.
  const { isInternetReachable } = useNetworkStatus();
  const [syncingToServer, setSyncingToServer] = useState(false);
  const autoSyncRef = useRef(false);

  const isHostReady = isSignedIn && portal === 'host';

  // Demo accounts carry local-only tokens and rely on the mock seed data. Real
  // registered hosts must never see the demo seeds or another account's data.
  const isDemoHost = !!tokens.accessToken?.startsWith('demo-');
  const hostPropsKey = React.useMemo(
    () => getHostPropertiesKey((user as { id?: string } | null)?.id),
    [user],
  );

  /**
   * Wrapper that saves the host's selected property to AsyncStorage so the
   * operations portal can use it as the default property.
   */
  const setActivePropertyId = useCallback((id: string | null) => {
    setActivePropertyIdState(id);
    if (id) {
      const property = properties.find(p => p.id === id);
      if (property) {
        AsyncStorage.setItem(OPS_DEFAULT_PROPERTY_ID_KEY, property.id);
        AsyncStorage.setItem(OPS_DEFAULT_PROPERTY_NAME_KEY, property.name);
      }
    }
  }, [properties]);

  // Load real data from backend when host auth is ready, fall back to mock data
  const fetchHostData = useCallback(() => {
    setIsDataLoading(true);
    // Fetch system amenities list from backend (authoritative list of available amenities)
    hostApi.getAmenities(() => []).then(amenities => {
      if (Array.isArray(amenities) && amenities.length > 0) setSystemAmenities(amenities);
    }).catch(() => {});
    hostApi.getProperties(() => []).then(apiProps => {
      const mapped = apiProps.map(mapApiProperty);
      if (isDemoHost) {
        // Demo host: seeds stay unless the backend returns real properties.
        if (mapped.length > 0) {
          setProperties(mapped);
          setActivePropertyIdState(mapped[0].id);
        }
      } else {
        // Real host: the backend (tenant-scoped) is authoritative. Merge with
        // anything this user created locally so offline work isn't wiped, but
        // never show the demo seeds.
        setProperties(prev => {
          const existing = prev.filter(p => p.id && !mapped.some(m => m.id === p.id));
          return [...mapped, ...existing];
        });
        setActivePropertyIdState(prevActive => {
          const alive = mapped.length > 0 && mapped.some(m => m.id === prevActive);
          return alive ? prevActive : (mapped[0]?.id ?? prevActive);
        });
      }
    }).finally(() => setIsDataLoading(false));
  }, [isDemoHost]);

  useEffect(() => {
    // Wait for the persisted-properties restore to settle first so it never
    // clobbers (or is clobbered by) the backend fetch.
    if (isHostReady && !authLoading && loadedPersisted) {
      fetchHostData();
    }
  }, [isHostReady, authLoading, loadedPersisted, fetchHostData]);

  // Restore host-created properties from AsyncStorage so they survive reloads.
  // Demo accounts MERGE the seed defaults (minus deleted seeds) with any
  // host-created properties; real accounts never see seeds and only restore
  // their OWN per-user saved properties.
  useEffect(() => {
    // Only restore once the host's identity is known — otherwise the fallback
    // key would read a previous user's (or a pre-migration) saved properties.
    if (!isHostReady) {
      setLoadedPersisted(true);
      return;
    }
    AsyncStorage.multiGet([hostPropsKey, HOST_DELETED_SEEDS_KEY])
      .then(([[, raw], [, deletedRaw]]) => {
        const deleted = new Set<string>();
        if (deletedRaw) {
          const parsed = JSON.parse(deletedRaw);
          if (Array.isArray(parsed)) parsed.forEach((d: string) => { if (SEED_PROPERTY_IDS.has(d)) deleted.add(d); });
        }
        const saved: Property[] = raw ? JSON.parse(raw) : [];
        setProperties(prev => mergeRestoredProperties({ prev, saved, deletedSeedIds: deleted, isDemoHost }));
        // If the active property was deleted (e.g. its seed was removed in a
        // previous session), point at the first surviving property so child
        // effects never fetch rooms/staff for a ghost id.
        setActivePropertyIdState(prevActive => computeActivePropertyId({ prevActive, saved, deletedSeedIds: deleted, isDemoHost }));
      })
      .catch(e => console.warn('Failed to load saved properties:', e))
      .finally(() => setLoadedPersisted(true));
  }, [isHostReady, isDemoHost, hostPropsKey]);

  const refreshRooms = useCallback((propertyId?: string) => {
    const pid = propertyId || activePropertyId;
    if (!isApiPropertyId(pid)) return;
    hostApi.getRooms(pid, () => []).then(apiRooms => {
      if (apiRooms.length > 0) setRooms(prev => {
        const others = prev.filter(r => r.property_id !== pid);
        return [...others, ...apiRooms.map(r => mapApiRoom({ ...r, property_id: pid }, pid))];
      });
    });
  }, [activePropertyId]);

  useEffect(() => {
    let cancelled = false;
    // Only hit the backend for real property UUIDs — seed/demo ids like
    // "prop-1" are invalid and would 422 in the server logs.
    if (isApiPropertyId(activePropertyId)) {
      hostApi.getRooms(activePropertyId, () => []).then(apiRooms => {
        if (!cancelled && apiRooms.length > 0) setRooms(prev => {
          const others = prev.filter(r => r.property_id !== activePropertyId);
          return [...others, ...apiRooms.map(r => mapApiRoom({ ...r, property_id: activePropertyId }, activePropertyId))];
        });
      }).catch(e => console.warn('Failed to fetch rooms:', e));
      hostApi.getDiscountCodes(activePropertyId, () => []).then(apiCodes => {
        if (!cancelled && apiCodes.length > 0) setDiscountCodes(prev => {
          const others = prev.filter(dc => dc.property_id !== activePropertyId);
          return [...others, ...apiCodes.map(dc => ({ ...dc, property_id: activePropertyId }))];
        });
      }).catch(e => console.warn('Failed to fetch discount codes:', e));
      hostApi.getSpecialOffers(activePropertyId, () => []).then(apiOffers => {
        if (!cancelled && apiOffers.length > 0) setSpecialOffers(prev => {
          const others = prev.filter(o => o.property_id !== activePropertyId);
          return [...others, ...apiOffers.map(o => ({ ...o, property_id: activePropertyId }))];
        });
      }).catch(e => console.warn('Failed to fetch special offers:', e));
      hostApi.getStaff(activePropertyId, () => []).then(apiStaff => {
        if (!cancelled && apiStaff.length > 0) setStaff(prev => {
          const others = prev.filter(s => s.property_id !== activePropertyId);
          return [...others, ...apiStaff.map(s => mapApiStaff(s, activePropertyId))];
        });
      }).catch(e => console.warn('Failed to fetch staff:', e));
      hostApi.getPropertyBookings(activePropertyId, () => []).then(apiData => {
        if (cancelled) return;
        bookingsFetchedRef.current.add(activePropertyId);
        setApiBookings(prev => {
          // Remove old entries for this property before adding new ones
          const withoutThis = prev.filter(b => b.property_id !== activePropertyId);
          return [...withoutThis, ...apiData.map((b: any) => ({
            id: b.id,
            property_id: activePropertyId,
            guest_name: b.guest_name || 'Guest',
            room_name: (b.room_names || []).join(', '),
            check_in: b.checkin_date || '',
            check_out: b.checkout_date || '',
            status: b.status || 'pending',
            total: parseFloat(b.total_amount) || 0,
            created_at: b.created_at || new Date().toISOString(),
          }))];
        });
      }).catch(e => console.warn('Failed to fetch bookings:', e));
    }
    return () => { cancelled = true; };
  }, [activePropertyId]);

  const now = () => new Date().toISOString();

  /** Convert a host Property to a guest-facing Hotel and register it across portals */
  const registerPropertyAcrossPortals = useCallback((created: Property) => {
    const placeholderImage = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop';
    const roomPlaceholderImage = 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop';

    // Generate default room types so the property is bookable from the guest portal
    const defaultRoomTypes: RoomType[] = [
      {
        id: `rt-${created.id}-std`,
        name: 'Standard Room',
        price: created.min_rate_floor || 2000,
        currency: created.currency || 'NPR',
        occupancy: 2,
        bed: 'Queen',
        description: 'A comfortable room with modern amenities for a relaxing stay.',
        available: Math.min(created.total_rooms || 5, 5),
        amenities: ['WiFi', 'AC', 'TV'],
        image: roomPlaceholderImage,
      },
      {
        id: `rt-${created.id}-dlx`,
        name: 'Deluxe Room',
        price: (created.min_rate_floor || 2000) * 1.5,
        currency: created.currency || 'NPR',
        occupancy: 3,
        bed: 'King + Single',
        description: 'A spacious room with premium amenities and extra comfort.',
        available: Math.min(Math.max(Math.floor((created.total_rooms || 5) / 2), 1), 3),
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'],
        image: roomPlaceholderImage,
      },
    ];

    // Build a basic guest-facing Hotel entry from the Property data
    const guestHotel: Hotel = {
      id: created.id.replace('prop-', ''),
      name: created.name,
      location: `${created.city}, ${created.country}`,
      city: created.city,
      country: created.country,
      address: created.address,
      rating: 3.0,
      review_count: 0,
      starRating: 3,
      price: created.min_rate_floor || 2000,
      currency: created.currency || 'NPR',
      description: created.description || '',
      shortDescription: (created.description || '').slice(0, 80),
      images: created.photos.length > 0 ? created.photos.map(p => p.photo_url) : [placeholderImage],
      amenities: created.amenities.map(a => ({ name: a, icon: '•' } as HotelAmenity)),
      roomTypes: defaultRoomTypes,
      reviews: [],
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
      checkInTime: created.check_in_time_from,
      checkOutTime: created.check_out_time_to,
      phone: '',
      email: '',
      coordinates: created.latitude && created.longitude ? { lat: created.latitude, lng: created.longitude } : undefined,
      availableRooms: created.total_rooms,
      tags: [created.type.toLowerCase()],
      brandColor: created.brand_color,
      lat: created.latitude || undefined,
      lng: created.longitude || undefined,
    };

    // Register in guest portal
    addMockProperty(guestHotel);

    // Register in ops portal (front desk rooms, bookings)
    registerOpsProperty(created.id, created.name);
  }, []);

  const addProperty = useCallback(async (p: Property): Promise<Property> => {
    // Never persist the demo tenant on a real host's property. The backend
    // assigns the real tenant from the JWT when the property is created; until
    // then, reuse the tenant of an already-synced property so the local copy
    // stays consistent (and the server copy is never written with a demo tenant).
    let normalized = p;
    if (!isDemoHost && p.tenant_id === 'demo-host-1') {
      const realTenant = properties.find(x => x.tenant_id && x.tenant_id !== 'demo-host-1')?.tenant_id;
      normalized = { ...p, tenant_id: realTenant || '' };
    }
    setProperties(prev => {
      const exists = prev.some(x => x.id === normalized.id);
      const next = exists ? prev : [...prev, normalized];
      persistHostProperties(next, (user as { id?: string } | null)?.id);
      return next;
    });

    // The listing wizard already created this property on the server during its
    // steps (id is a backend UUID). Never create a duplicate — the local id IS
    // the server id, and swapping it would orphan the rooms/photos created
    // against it on the backend.
    if (isApiPropertyId(normalized.id)) {
      registerPropertyAcrossPortals(normalized);
      return normalized;
    }

    try {
      const created = await hostApi.createProperty(normalized, () => null);
      if (created && created.id && created.id !== normalized.id) {
        setProperties(prev => {
          const next = prev.map(x => x.id === normalized.id ? created : x);
          persistHostProperties(next, (user as { id?: string } | null)?.id);
          return next;
        });
        registerPropertyAcrossPortals(created);
        return created;
      }
    } catch (e) {
      console.warn('Failed to sync property to backend:', e);
      // Server unreachable — the property stays local; the caller can surface this.
    }
    // Register local-only property in guest portal (fallback when server is unreachable)
    registerPropertyAcrossPortals(normalized);
    // Refresh from backend so the dashboard shows the authoritative property list
    // (the backend may populate tenant_id, created_at, etc. that we don't have locally).
    setTimeout(() => fetchHostData(), 500);
    return normalized;
  }, [registerPropertyAcrossPortals, user, properties, isDemoHost, fetchHostData]);

  /**
   * Push a local-only property (e.g. created while offline or in demo mode, or
   * before the user had a real account) to the live backend. On success the
   * property's id is swapped to the backend UUID so staff invites become real.
   * Rooms, photos, and special offers created locally are uploaded too; any
   * category that fails is collected in `warnings` (the property itself still
   * syncs).
   */
  const syncPropertyToServer = useCallback(async (p: Property): Promise<{ property: Property; warnings: string[] }> => {
    if (isApiPropertyId(p.id)) return { property: p, warnings: [] };
    const warnings: string[] = [];

    // The backend requires name + phone_number + email on create. The wizard
    // stores them on the property when present; otherwise fall back to the
    // signed-in host account's contact details so the sync always succeeds.
    const account = user as { email?: string; phone?: string } | null;
    let created: any;
    try {
      created = await hostApi.createProperty({
        name: p.name,
        type: p.type,
        description: p.description || '',
        total_rooms: p.total_rooms,
        number_of_floors: p.number_of_floors,
        year_built: p.year_built || undefined,
        phone_number: p.phone_number || account?.phone || undefined,
        email: p.email || account?.email || undefined,
      }, () => null);
    } catch (e) {
      // Surface the backend's actual validation message (e.g. a missing field).
      throw new Error(
        e instanceof Error && e.message ? e.message : 'Could not save this property to the server. Please try again.'
      );
    }
    if (!created || !created.id || !isApiPropertyId(created.id)) {
      throw new Error('The server did not return a property id. Check your connection and try again.');
    }

    // Location + localization — best-effort so the server copy is complete.
    await Promise.all([
      hostApi.createLocation(created.id, {
        country: p.country || 'Nepal',
        state: p.state || '',
        city: p.city || '',
        zip_code: p.zip_code || '',
        address: p.address || '',
        latitude: p.latitude != null ? p.latitude : undefined,
        longitude: p.longitude != null ? p.longitude : undefined,
      }, () => ({} as any)).catch(() => {}),
      hostApi.updateProperty(created.id, {
        check_in_time: p.check_in_time_from,
        check_out_time: p.check_out_time_to,
        currency: p.currency || 'NPR',
        timezone: p.timezone || 'Asia/Kathmandu',
        language: 'English',
        brand_color: p.brand_color || undefined,
        brand_logo_url: p.logo_url || undefined,
      }, () => ({} as any)).catch(() => {}),
    ]);

    // ── Photos + amenities ────────────────────────────────────────────
    try {
      const photoItems = p.photos || [];
      const ordered = [
        ...photoItems.filter(ph => ph.category === 'cover'),
        ...photoItems.filter(ph => ph.category !== 'cover'),
      ];
      const localUris = ordered.filter(ph => !isRemoteUrl(ph.photo_url)).map(ph => ph.photo_url);
      const remoteUrls = ordered.filter(ph => isRemoteUrl(ph.photo_url)).map(ph => ph.photo_url);
      let coverUrl: string | null = null;
      let gallery: string[] = [];
      if (localUris.length > 0) {
        const formData = new FormData();
        localUris.forEach(uri => {
          formData.append('files', { uri, type: 'image/jpeg', name: `photo_${Date.now()}.jpg` } as any);
        });
        const result = await hostApi.uploadPropertyImages(created.id, formData);
        const urls = Array.isArray(result) ? result : (result?.data ?? []);
        if (Array.isArray(urls) && urls.length > 0) {
          coverUrl = urls[0];
          gallery = urls.slice(1);
        }
      }
      if (localUris.length === 0 && remoteUrls.length > 0) {
        coverUrl = remoteUrls[0];
        gallery = remoteUrls.slice(1);
      } else if (localUris.length > 0 && remoteUrls.length > 0) {
        gallery = [...gallery, ...remoteUrls];
      }
      await hostApi.createPhotosAndAmenities(created.id, {
        photos: { cover: coverUrl, gallery },
        amenities: { custom_amenities: p.amenities.map(name => ({ name })) },
      }, () => ({} as any));
    } catch (e) {
      warnings.push(`Photos: ${e instanceof Error ? e.message : 'upload failed'}`);
    }

    // ── Rooms (room types + bed types + bulk rooms) ───────────────────
    const localRooms = rooms.filter(r => r.property_id === p.id);
    if (localRooms.length > 0) {
      try {
        // Local room/bed type ids are generated slugs (rt-<ts>-<name>) when the
        // property was created in demo/offline mode — rebuild them on the server.
        const typeNameFor = (rtId: string): string => {
          const def = roomTypes.find(t => t.id === rtId);
          if (def?.room_type_name) return def.room_type_name;
          const fromRoom = localRooms.find(r => r.room_type_id === rtId && !!r.room_type_name);
          if (fromRoom?.room_type_name) return fromRoom.room_type_name;
          const slug = rtId.replace(/^rt-\d+-/, '').replace(/^rt-/, '');
          if (slug && slug !== rtId) return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return 'Standard Room';
        };
        const bedNameFor = (btId: string): string => {
          const fromRoom = localRooms.find(r => r.bed_type_id === btId && !!r.bed_name);
          if (fromRoom?.bed_name) return fromRoom.bed_name;
          const slug = btId.replace(/^bt-\d+-/, '').replace(/^bt-/, '');
          if (slug && slug !== btId) return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return 'Standard Bed';
        };
        const distinctTypes = [...new Set(localRooms.map(r => r.room_type_id || 'default'))];
        const distinctBeds = [...new Set(localRooms.map(r => r.bed_type_id || 'default'))];
        // The backend ships global default room/bed types ("Standard Room",
        // "Queen Bed", ...) and rejects duplicate names — resolve-or-create so
        // the defaults are reused instead of 400ing.
        const serverTypeIds: Record<string, string> = {};
        for (const rtId of distinctTypes) {
          const id = await ensureRoomType(created.id, typeNameFor(rtId).slice(0, 100));
          if (!id) throw new Error('room types could not be created');
          serverTypeIds[rtId] = id;
        }
        const serverBedIds: Record<string, string> = {};
        for (const btId of distinctBeds) {
          const id = await ensureBedType(created.id, bedNameFor(btId).slice(0, 100));
          if (!id) throw new Error('bed types could not be created');
          serverBedIds[btId] = id;
        }
        // Upload each room's local photos (best-effort) so they can be attached.
        const roomPhotoUrls: Record<string, string[]> = {};
        for (const room of localRooms) {
          const localRoomUris = room.photos.filter(u => !isRemoteUrl(u));
          if (localRoomUris.length === 0) continue;
          try {
            const fd = new FormData();
            localRoomUris.forEach(uri => {
              fd.append('files', { uri, type: 'image/jpeg', name: `room_${Date.now()}.jpg` } as any);
            });
            const res = await hostApi.uploadRoomImages(created.id, fd);
            const urls = Array.isArray(res) ? res : (res?.data ?? []);
            roomPhotoUrls[room.id] = Array.isArray(urls) ? urls : [];
          } catch {
            roomPhotoUrls[room.id] = [];
          }
        }
        const firstTypeId = Object.values(serverTypeIds)[0];
        const firstBedId = Object.values(serverBedIds)[0];
        // Rooms whose photos couldn't be shipped (no fresh room-endpoint upload)
        // sync without photos — tell the host so they can re-add them later.
        const roomsWithoutPhotos = localRooms.filter(
          room => (room.photos?.length ?? 0) > 0 && !(roomPhotoUrls[room.id]?.length)
        );
        if (roomsWithoutPhotos.length > 0) {
          warnings.push(
            `Rooms: photos for ${roomsWithoutPhotos.length} room${roomsWithoutPhotos.length === 1 ? '' : 's'} couldn't be uploaded to the server`
          );
        }
        const roomsPayload = localRooms.map(room => {
          // Backend RoomBase.photos expects { cover, gallery } — an array 422s.
          // Only include URLs freshly uploaded via the room-images endpoint: the
          // backend promotes them from its room-image temp storage, and ANY
          // other URL (e.g. a property-photo reused on a room) makes the whole
          // bulk-create 500 with "Failed to promote one or more room images
          // from temp storage". Rooms without a fresh upload ship no photos.
          const roomUrls = roomPhotoUrls[room.id] || [];
          return {
            floor_number: room.floor_number || 1,
            room_name: room.room_name || `Room ${room.floor_number || 1}`,
            room_type_id: serverTypeIds[room.room_type_id] || firstTypeId,
            bed_type_id: (room.bed_type_id && serverBedIds[room.bed_type_id]) || firstBedId,
            base_rate: room.base_rate || 1,
            max_adults: room.max_adults || 2,
            max_children: room.max_children || 0,
            cancellation_policy: room.cancellation_policy,
            cancellation_title: CANCEL_TITLES[room.cancellation_policy] || 'Flexible cancellation',
            cancellation_description: room.cancellation_notes || CANCEL_DESCRIPTIONS[room.cancellation_policy] || null,
            photos: { cover: roomUrls[0] ?? null, gallery: roomUrls.slice(1) },
            custom_amenities: room.amenities.map(name => ({ name })),
          };
        });
        await hostApi.bulkCreateRooms(created.id, { rooms: roomsPayload }, () => ({} as any));
      } catch (e) {
        warnings.push(`Rooms: ${e instanceof Error ? e.message : 'upload failed'}`);
      }
    }

    // ── Special offers ────────────────────────────────────────────────
    const contextOffers = specialOffers.filter(o => o.property_id === p.id);
    const offersByTitle = new Map<string, any>();
    [...(p.special_offers || []), ...contextOffers].forEach(o => {
      if (o?.title) offersByTitle.set(o.title, o);
    });
    if (offersByTitle.size > 0) {
      try {
        const now = new Date();
        await hostApi.createSpecialOffers(created.id, {
          offers: [...offersByTitle.values()].map(o => ({
            title: o.title,
            description: o.description || null,
            discount_percentage: o.discount_percentage || 10,
            start_date: o.start_date || now.toISOString().slice(0, 10),
            end_date: o.end_date || new Date(now.getTime() + 30 * 864e5).toISOString().slice(0, 10),
            is_active: o.is_active !== false,
            is_custom: !!o.is_custom,
          })),
        }, () => ({} as any));
      } catch (e) {
        warnings.push(`Special offers: ${e instanceof Error ? e.message : 'upload failed'}`);
      }
    }

    // ── Staff (the reason to sync: invites are only emailed once the
    //    property exists on the server) ─────────────────────────────────
    // Skip members whose email already landed on the server (e.g. a retry
    // after a partial sync) — the backend rejects duplicate emails with 400.
    const existingStaffEmails = new Set<string>();
    try {
      const existingStaffList = await hostApi.getStaff(created.id, () => []);
      if (Array.isArray(existingStaffList)) {
        existingStaffList.forEach(s => { if (s?.email) existingStaffEmails.add(String(s.email).toLowerCase()); });
      }
    } catch (e) {
      console.warn('Failed to fetch existing staff for dedup:', e);
      // fall through — the per-member create below surfaces any real failure
    }
    const localStaff = staff.filter(
      s => s.property_id === p.id && !existingStaffEmails.has(String(s.email).toLowerCase())
    );
    for (const s of localStaff) {
      try {
        const payload: CreateStaffRequest = {
          full_name: `${s.first_name} ${s.last_name}`.trim() || s.email,
          email: s.email,
          phone_number: s.phone || null,
          job_role: (STAFF_ROLE_TO_BACKEND[s.role] || 'FRONT_DESK') as CreateStaffRequest['job_role'],
          joining_date: (s.created_at || new Date().toISOString()).slice(0, 10),
          monthly_salary: String(STAFF_SALARY_DEFAULTS[s.role] ?? 0),
          status: s.is_active ? 'ACTIVE' : 'INACTIVE',
        };
        await hostApi.createStaff(created.id, payload, () => null as any);
      } catch (e) {
        warnings.push(`Staff (${s.email}): ${e instanceof Error ? e.message : 'upload failed'}`);
      }
    }

    // The backend assigns the tenant from the JWT on create. Mirror the real
    // tenant on the local copy; only fall back to the property's own tenant for
    // demo accounts (real hosts never keep a "demo-host-1" tenant around).
    const tenantId = created.tenant_id || (
      isDemoHost
        ? p.tenant_id
        : properties.find(x => x.tenant_id && x.tenant_id !== 'demo-host-1')?.tenant_id || ''
    );
    const merged: Property = { ...p, id: created.id, tenant_id: tenantId };
    setProperties(prev => {
      const next = prev.map(x => x.id === p.id ? merged : x);
      persistHostProperties(next, (user as { id?: string } | null)?.id);
      return next;
    });
    // Re-key child entities so the app stays coherent under the new UUID
    // (every property_id-keyed entity array keys off the id).
    setRooms(prev => prev.map(r => r.property_id === p.id ? { ...r, property_id: created.id } : r));
    setStaff(prev => prev.map(s => s.property_id === p.id ? { ...s, property_id: created.id, tenant_id: tenantId } : s));
    setSpecialOffers(prev => prev.map(o => o.property_id === p.id ? { ...o, property_id: created.id } : o));
    setRoomTypes(prev => prev.map(rt => rt.property_id === p.id ? { ...rt, property_id: created.id } : rt));
    setRatePlans(prev => prev.map(x => x.property_id === p.id ? { ...x, property_id: created.id } : x));
    setDateOverrides(prev => prev.map(x => x.property_id === p.id ? { ...x, property_id: created.id } : x));
    setDiscountCodes(prev => prev.map(x => x.property_id === p.id ? { ...x, property_id: created.id } : x));
    setTaxConfigs(prev => prev.map(x => x.property_id === p.id ? { ...x, property_id: created.id } : x));
    setShifts(prev => prev.map(x => x.property_id === p.id ? { ...x, property_id: created.id } : x));
    setStaffTasks(prev => prev.map(x => x.property_id === p.id ? { ...x, property_id: created.id } : x));
    registerPropertyAcrossPortals(merged);
    return { property: merged, warnings };
  }, [registerPropertyAcrossPortals, user, rooms, roomTypes, specialOffers, staff, properties, isDemoHost]);

  /**
   * Offline-first publish: properties that couldn't reach the server stay in
   * AsyncStorage (persistHostProperties). Once the device is online again — or
   * the app starts with a connection — push every local-only property to the
   * backend so it lands in the database with the correct tenant.
   */
  const syncLocalProperties = useCallback(async () => {
    if (autoSyncRef.current) return;
    const localOnly = properties.filter(p => !isApiPropertyId(p.id));
    if (localOnly.length === 0) return;
    autoSyncRef.current = true;
    await Promise.resolve();
    setSyncingToServer(true);
    try {
      for (const p of localOnly) {
        // Retry up to 3 times with backoff for each property
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await syncPropertyToServer(p);
            break; // success, move to next property
          } catch (e) {
            console.warn(`Auto-sync attempt ${attempt + 1}/3 failed for "${p.name}":`, e instanceof Error ? e.message : e);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
          }
        }
      }
    } finally {
      autoSyncRef.current = false;
      setSyncingToServer(false);
    }
  }, [properties, syncPropertyToServer]);

  const syncLocalPropertiesRef = useRef(syncLocalProperties);
  syncLocalPropertiesRef.current = syncLocalProperties;

  useEffect(() => {
    // Real accounts only — demo tokens can't authenticate to the backend.
    // Skipped until persisted properties are restored so we never race that.
    if (!isHostReady || isDemoHost || !loadedPersisted || isInternetReachable !== true) return;
    // Debounce: wait 2s after the last properties change before syncing,
    // so fetchHostData's merge doesn't race the upload.
    const t = setTimeout(() => { syncLocalPropertiesRef.current(); }, 2000);
    return () => clearTimeout(t);
  }, [isHostReady, isDemoHost, loadedPersisted, isInternetReachable, properties]);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    hostApi.updateProperty(id, updates as any, () => ({ ...updates } as Property)).then(() => {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: now() } : p));
      // Sync property name/description changes to guest portal
      const guestId = id.replace('prop-', '');
      const guestUpdates: Partial<Hotel> = {};
      if (updates.name) guestUpdates.name = updates.name;
      if (updates.description !== undefined) guestUpdates.description = updates.description ?? undefined;
      if (updates.city) guestUpdates.city = updates.city;
      if (updates.country) guestUpdates.country = updates.country;
      if (updates.min_rate_floor) guestUpdates.price = updates.min_rate_floor;
      if (Object.keys(guestUpdates).length > 0) {
        updateMockProperty(guestId, guestUpdates);
      }
      // Sync name to AsyncStorage for ops default property
      if (updates.name) {
        AsyncStorage.setItem(OPS_DEFAULT_PROPERTY_NAME_KEY, updates.name);
      }
    });
  }, []);

  const togglePropertyActivation = useCallback((id: string) => {
    // Optimistic update: flip immediately so the UI stays "sticky"
    setProperties(prev => prev.map(p =>
      p.id === id ? { ...p, is_active: !p.is_active, updated_at: now() } : p
    ));
    const targetId = id;
    hostApi.toggleActivation(targetId, () => ({})).catch(() => {
      // Revert on failure — the API didn't go through
      setProperties(prev => prev.map(p =>
        p.id === targetId ? { ...p, is_active: !p.is_active, updated_at: now() } : p
      ));
    });
  }, []);

  const setPropertyCoverPhoto = useCallback(async (propertyId: string, imageUri: string) => {
    const formData = new FormData();
    formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'cover.jpg' } as any);
    const result = await hostApi.uploadPropertyImage(propertyId, formData);
    const url = result?.data || result;
    if (url) {
      const current = properties.find(p => p.id === propertyId);
      const existingGallery = current?.photos
        .filter(ph => ph.category === 'gallery')
        .map(ph => ph.photo_url) || [];
      await hostApi.createPhotosAndAmenities(propertyId, {
        photos: { cover: url, gallery: existingGallery },
      }, () => null);
      setProperties(prev => prev.map(p =>
        p.id === propertyId ? {
          ...p,
          photos: [
            ...p.photos.filter(ph => ph.category !== 'cover'),
            { id: 'cover', photo_url: url, category: 'cover' },
          ],
          updated_at: now(),
        } : p
      ));
    }
  }, [properties]);

  const addPropertyGalleryPhotos = useCallback(async (propertyId: string, imageUris: string[]) => {
    const formData = new FormData();
    imageUris.forEach(uri => {
      formData.append('files', { uri, type: 'image/jpeg', name: `photo_${Date.now()}.jpg` } as any);
    });
    const result = await hostApi.uploadPropertyImages(propertyId, formData);
    const newUrls: string[] = result?.data || result;
    if (newUrls && Array.isArray(newUrls) && newUrls.length > 0) {
      const current = properties.find(p => p.id === propertyId);
      const existingGallery = current?.photos
        .filter(ph => ph.category === 'gallery')
        .map(ph => ph.photo_url) || [];
      const allGallery = [...existingGallery, ...newUrls];
      await hostApi.createPhotosAndAmenities(propertyId, {
        photos: {
          cover: current?.photos.find(p => p.category === 'cover')?.photo_url || null,
          gallery: allGallery,
        },
      }, () => null);
      setProperties(prev => prev.map(p =>
        p.id === propertyId ? {
          ...p,
          photos: [
            ...p.photos.filter(ph => ph.category === 'cover'),
            ...allGallery.map((url: string, i: number) => ({
              id: `gallery-${Date.now()}-${i}`, photo_url: url, category: 'gallery',
            })),
          ],
          updated_at: now(),
        } : p
      ));
    }
  }, [properties]);

  const removePropertyGalleryPhoto = useCallback(async (propertyId: string, photoUrl: string) => {
    const current = properties.find(p => p.id === propertyId);
    if (!current) return;
    const existingGallery = current.photos
      .filter(ph => ph.category === 'gallery' && ph.photo_url !== photoUrl)
      .map(ph => ph.photo_url);
    await hostApi.createPhotosAndAmenities(propertyId, {
      photos: {
        cover: current.photos.find(p => p.category === 'cover')?.photo_url || null,
        gallery: existingGallery,
      },
    }, () => null);
    setProperties(prev => prev.map(p =>
      p.id === propertyId ? {
        ...p,
        photos: [
          ...p.photos.filter(ph => ph.category === 'cover'),
          ...existingGallery.map((url: string, i: number) => ({
            id: `gallery-${Date.now()}-${i}`, photo_url: url, category: 'gallery',
          })),
        ],
        updated_at: now(),
      } : p
    ));
  }, [properties]);

  const addRoomType = useCallback((rt: RoomTypeDef) => setRoomTypes(prev => [...prev, rt]), []);
  const updateRoomType = useCallback((id: string, updates: Partial<RoomTypeDef>) => {
    setRoomTypes(prev => prev.map(rt => rt.id === id ? { ...rt, ...updates, updated_at: now() } : rt));
  }, []);

  const addRoom = useCallback((r: AdminRoom, opts?: { skipBackend?: boolean }) => {
    setRooms(prev => [...prev, r]);
    // Sync new room to ops portal front desk
    addOpsFrontDeskRoom(r.property_id, r.room_name, r.floor_number);
    // Persist to backend for real API properties (skip if caller already persisted, e.g. listing wizard)
    if (!opts?.skipBackend && isApiPropertyId(r.property_id)) {
      const fallbackRoom = { ...r, id: r.id };
      const createOnBackend = async () => {
        // The backend requires valid UUID references for room_type_id and bed_type_id.
        // If the caller didn't provide them (e.g. quick-add from PropertyRooms), auto-create.
        let roomTypeId = r.room_type_id || '';
        let bedTypeId = r.bed_type_id || '';
        if (!roomTypeId) {
          const created = await ensureRoomType(r.property_id, r.room_type_name || 'Standard');
          if (created) roomTypeId = created;
        }
        if (!bedTypeId) {
          const created = await ensureBedType(r.property_id, r.bed_name || 'Single');
          if (created) bedTypeId = created;
        }
        // Skip backend if we still can't resolve the required UUIDs
        if (!roomTypeId || !bedTypeId) return fallbackRoom;
        const result = await hostApi.createRoom(r.property_id, {
          floor_number: r.floor_number || 1,
          room_name: r.room_name || `Room ${r.floor_number || 1}`,
          room_type_id: roomTypeId,
          bed_type_id: bedTypeId,
          base_rate: r.base_rate || 0,
          max_adults: r.max_adults || 2,
          max_children: r.max_children || 0,
          cancellation_policy: r.cancellation_policy,
          cancellation_title: undefined,
          cancellation_description: r.cancellation_notes || undefined,
        }, () => fallbackRoom);
        // Bulk create returns { rooms: [{ id, ... }] } — unwrap the first item
        const createdRoom = Array.isArray(result?.rooms) ? result.rooms[0] : result;
        if (createdRoom?.id && createdRoom.id !== r.id) {
          setRooms(prev => prev.map(room => room.id === r.id ? { ...room, id: createdRoom.id } : room));
        }
        return result;
      };
      createOnBackend().catch((e: any) => console.warn('Failed to create room on backend:', e));
    }
  }, []);
  const updateRoom = useCallback((id: string, updates: Partial<AdminRoom>) => {
    const existing = rooms.find(r => r.id === id);
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates, updated_at: now() } : r));
    // Persist to the backend for real API rooms. The PATCH schema has no photos/
    // amenities/smoking/accessible fields (photos are uploaded separately), so
    // only forward the fields RoomUpdate understands.
    const pid = existing?.property_id || activePropertyId || '';
    if (isApiPropertyId(pid) && UUID_RE.test(id)) {
      const payload: Partial<AdminRoom> = {};
      for (const key of ['room_name', 'room_type_id', 'bed_type_id', 'floor_number', 'max_adults', 'max_children', 'base_rate', 'status', 'cancellation_policy', 'cancellation_notes'] as const) {
        if (updates[key] !== undefined) payload[key] = updates[key] as any;
      }
      if (Object.keys(payload).length > 0) {
        hostApi.updateRoom(pid, id, payload, () => ({ ...existing!, ...updates, updated_at: now() }));
      }
    }
    // If room name changed, sync to ops (requires knowing the old name via state)
    // For simplicity, the ops front desk room name is synced on add/remove only.
  }, [activePropertyId, rooms]);
  const updateRoomStatus = useCallback((id: string, status: AdminRoomStatus) => {
    const existing = rooms.find(r => r.id === id);
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status, updated_at: now() } : r));
    const pid = existing?.property_id || activePropertyId || '';
    if (isApiPropertyId(pid) && UUID_RE.test(id)) {
      hostApi.updateRoom(pid, id, { status }, () => ({ ...existing!, status, updated_at: now() }));
    }
  }, [activePropertyId, rooms]);

  /** Push any locally-created rooms (non-UUID temp IDs) to the server. */
  const syncLocalRoomsToServer = useCallback(async (propertyId?: string): Promise<{ synced: number; errors: string[] }> => {
    const pid = propertyId || activePropertyId;
    if (!isApiPropertyId(pid)) return { synced: 0, errors: ['Property has no server ID yet — sync the property first.'] };
    const localRooms = rooms.filter(r => r.property_id === pid && !UUID_RE.test(r.id));
    if (localRooms.length === 0) return { synced: 0, errors: [] };
    let synced = 0;
    const errors: string[] = [];
    for (const r of localRooms) {
      try {
        let roomTypeId = r.room_type_id || '';
        let bedTypeId = r.bed_type_id || '';
        if (!roomTypeId) {
          const id = await ensureRoomType(pid, r.room_type_name || 'Standard');
          if (id) roomTypeId = id;
        }
        if (!bedTypeId) {
          const id = await ensureBedType(pid, r.bed_name || 'Single');
          if (id) bedTypeId = id;
        }
        if (!roomTypeId || !bedTypeId) {
          errors.push(`${r.room_name}: could not resolve room type or bed type`);
          continue;
        }
        const fallbackRoom = { ...r };
        const result = await hostApi.createRoom(pid, {
          floor_number: r.floor_number || 1,
          room_name: r.room_name || `Room ${r.floor_number || 1}`,
          room_type_id: roomTypeId,
          bed_type_id: bedTypeId,
          base_rate: r.base_rate || 0,
          max_adults: r.max_adults || 2,
          max_children: r.max_children || 0,
          cancellation_policy: r.cancellation_policy,
          cancellation_title: undefined,
          cancellation_description: r.cancellation_notes || undefined,
        }, () => fallbackRoom);
        const createdRoom = Array.isArray(result?.rooms) ? result.rooms[0] : result;
        if (createdRoom?.id && createdRoom.id !== r.id) {
          setRooms(prev => prev.map(room => room.id === r.id ? { ...room, id: createdRoom.id } : room));
        }
        synced++;
      } catch (e: any) {
        errors.push(`${r.room_name}: ${e?.message || 'unknown error'}`);
      }
    }
    return { synced, errors };
  }, [activePropertyId, rooms]);

  const addRatePlan = useCallback((rp: RatePlan) => setRatePlans(prev => [...prev, rp]), []);
  const updateRatePlan = useCallback((id: string, updates: Partial<RatePlan>) => {
    setRatePlans(prev => prev.map(rp => rp.id === id ? { ...rp, ...updates, updated_at: now() } : rp));
  }, []);

  const addDateOverride = useCallback((d: DateOverride) => setDateOverrides(prev => [...prev, d]), []);

  const addDiscountCode = useCallback((dc: AdminDiscountCode) => {
    if (isApiPropertyId(activePropertyId)) {
      hostApi.createDiscountCode(activePropertyId, dc, () => dc).then(created => {
        setDiscountCodes(prev => [...prev, created]);
      });
    } else {
      setDiscountCodes(prev => [...prev, dc]);
    }
  }, [activePropertyId]);
  const updateDiscountCode = useCallback((id: string, updates: Partial<AdminDiscountCode>) => {
    const existing = discountCodes.find(dc => dc.id === id);
    setDiscountCodes(prev => prev.map(dc => dc.id === id ? { ...dc, ...updates, updated_at: now() } : dc));
    const pid = existing?.property_id || activePropertyId || '';
    if (isApiPropertyId(pid)) {
      // Backend DiscountCodeUpdate only accepts these fields — is_active,
      // combinable and applicable_room_types are frontend-only concepts.
      const payload: Partial<AdminDiscountCode> = {};
      for (const key of ['code', 'type', 'discount_value', 'min_amount', 'max_uses', 'valid_from', 'valid_to'] as const) {
        if (updates[key] !== undefined) payload[key] = updates[key] as any;
      }
      hostApi.updateDiscountCode(pid, id, payload, () => ({ ...existing!, ...updates, updated_at: now() }));
    }
  }, [activePropertyId, discountCodes]);

  const addSpecialOffer = useCallback((so: SpecialOffer) => {
    if (isApiPropertyId(activePropertyId)) {
      hostApi.createSpecialOffers(activePropertyId, { offers: [so] }, () => so).then((created: any) => {
        setSpecialOffers(prev => [...prev, created]);
      });
    } else {
      setSpecialOffers(prev => [...prev, so]);
    }
  }, [activePropertyId]);
  const updateSpecialOffer = useCallback((id: string, updates: Partial<SpecialOffer>) => {
    const existing = specialOffers.find(so => so.id === id);
    setSpecialOffers(prev => prev.map(so => so.id === id ? { ...so, ...updates, updated_at: now() } : so));
    const pid = existing?.property_id || activePropertyId || '';
    if (isApiPropertyId(pid)) {
      // Backend SpecialOfferUpdate accepts title/description/discount_percentage/
      // start_date/end_date/is_active — conditions and is_custom are frontend-only.
      const payload: Partial<SpecialOffer> = {};
      for (const key of ['title', 'description', 'discount_percentage', 'start_date', 'end_date', 'is_active'] as const) {
        if (updates[key] !== undefined) payload[key] = updates[key] as any;
      }
      hostApi.updateSpecialOffer(pid, id, payload, () => ({ ...existing!, ...updates, updated_at: now() }));
    }
  }, [activePropertyId, specialOffers]);

  const addTaxConfig = useCallback((tx: TaxConfig) => setTaxConfigs(prev => [...prev, tx]), []);
  const updateTaxConfig = useCallback((id: string, updates: Partial<TaxConfig>) => {
    setTaxConfigs(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates, updated_at: now() } : tx));
  }, []);

  const addStaff = useCallback(async (s: StaffMember, joiningDate?: string, photos?: StaffPhotos): Promise<boolean> => {
    const nameParts = `${s.first_name} ${s.last_name}`.trim().split(/\s+/);
    const roleMap = STAFF_ROLE_TO_BACKEND;
    const pid = s.property_id || activePropertyId || '';
    const joiningDateStr = joiningDate || new Date().toISOString().slice(0, 10);
    if (!isApiPropertyId(pid)) {
      // Seed/demo property (e.g. "prop-1") — keep the invite local; the backend
      // only accepts real property UUIDs.
      setStaff(prev => [...prev, s]);
      return true;
    }
    const fallbackStaff: BackendStaff = {
      id: s.id,
      tenant_id: s.tenant_id,
      full_name: nameParts.join(' '),
      email: s.email,
      phone_number: s.phone,
      job_role: (roleMap[s.role] || 'FRONT_DESK') as BackendStaff['job_role'],
      monthly_salary: String(STAFF_SALARY_DEFAULTS[s.role] ?? 0),
      joining_date: joiningDateStr,
      status: s.is_active ? 'ACTIVE' : 'INACTIVE',
      photos: photos
        ? { profile: photos.profile || null, citizenship_front: photos.citizenship_front || null, citizenship_back: photos.citizenship_back || null }
        : { profile: null, citizenship_front: null, citizenship_back: null },
    };
    try {
      const created = await hostApi.createStaff(pid, {
        full_name: nameParts.join(' '),
        email: s.email,
        phone_number: s.phone,
        job_role: (roleMap[s.role] || 'FRONT_DESK') as any,
        joining_date: joiningDateStr,
        monthly_salary: String(STAFF_SALARY_DEFAULTS[s.role] ?? 0),
        status: s.is_active ? 'ACTIVE' : 'INACTIVE',
        photos,
      }, () => fallbackStaff);
      setStaff(prev => [...prev, created && created.full_name ? mapApiStaff(created, pid) : s]);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create staff. Please try again.';
      Alert.alert('Invitation Failed', message);
      return false;
    }
  }, [activePropertyId]);
  const updateStaff = useCallback((id: string, updates: Partial<StaffMember>, extras?: { photos?: StaffPhotos; joining_date?: string }) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: now() } : s));
    const existing = staff.find(s => s.id === id);
    if (!existing) return;
    const roleMap = STAFF_ROLE_TO_BACKEND;
    const pid = existing.property_id || activePropertyId || '';
    const fallbackStaff: BackendStaff = {
      id: existing.id,
      tenant_id: existing.tenant_id,
      full_name: `${existing.first_name} ${existing.last_name}`.trim(),
      email: existing.email,
      phone_number: existing.phone,
      job_role: (roleMap[existing.role] || 'FRONT_DESK') as BackendStaff['job_role'],
      monthly_salary: String(STAFF_SALARY_DEFAULTS[existing.role] ?? 0),
      joining_date: extras?.joining_date ?? existing.created_at.slice(0, 10),
      status: existing.is_active ? 'ACTIVE' : 'INACTIVE',
      photos: extras?.photos ?? null,
    };
    if (isApiPropertyId(pid)) {
      hostApi.updateStaff(pid, id, {
        full_name: `${updates.first_name ?? existing.first_name} ${updates.last_name ?? existing.last_name}`.trim(),
        email: updates.email ?? existing.email,
        phone_number: updates.phone ?? existing.phone,
        job_role: (roleMap[(updates.role ?? existing.role)] || 'FRONT_DESK') as any,
        status: (updates.is_active === undefined ? undefined : updates.is_active ? 'ACTIVE' : 'INACTIVE') as any,
        joining_date: extras?.joining_date,
        photos: extras?.photos,
      }, () => fallbackStaff);
    }
  }, [activePropertyId, staff]);

  const addShift = useCallback((s: Shift) => setShifts(prev => [...prev, s]), []);
  const updateShift = useCallback((id: string, updates: Partial<Shift>) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: now() } : s));
  }, []);

  const addStaffTask = useCallback((t: StaffTask) => setStaffTasks(prev => [...prev, t]), []);
  const updateStaffTask = useCallback((id: string, updates: Partial<StaffTask>) => {
    setStaffTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updated_at: now() } : t));
  }, []);

  const removeProperty = useCallback(async (id: string) => {
    if (SEED_PROPERTY_IDS.has(id)) {
      AsyncStorage.getItem(HOST_DELETED_SEEDS_KEY).then(raw => {
        const existing: string[] = raw ? JSON.parse(raw) : [];
        const next = [...new Set([...existing, id])];
        AsyncStorage.setItem(HOST_DELETED_SEEDS_KEY, JSON.stringify(next)).catch(() => {});
      });
    }
    // Optimistically remove from local state
    setProperties(prev => {
      const next = prev.filter(p => p.id !== id);
      persistHostProperties(next, (user as { id?: string } | null)?.id);
      return next;
    });
    setRoomTypes(prev => prev.filter(rt => rt.property_id !== id));
    setRooms(prev => prev.filter(r => r.property_id !== id));
    removeMockProperty(id.replace('prop-', ''));
    removeOpsProperty(id);
    // If the deleted property was active, switch to the first remaining one
    if (activePropertyId === id) {
      setProperties(prev => {
        const firstId = prev[0]?.id ?? null;
        setActivePropertyIdState(firstId);
        return prev;
      });
    }
    AsyncStorage.getItem(OPS_DEFAULT_PROPERTY_ID_KEY).then(savedId => {
      if (savedId === id) {
        AsyncStorage.multiRemove([OPS_DEFAULT_PROPERTY_ID_KEY, OPS_DEFAULT_PROPERTY_NAME_KEY]);
      }
    });
    // Then delete from backend — if it fails, show an error
    try {
      await hostApi.deleteProperty(id);
    } catch (e) {
      console.warn('Failed to delete property from server:', e);
      Alert.alert('Delete Failed', 'Could not delete the property from the server. It may still appear in search results.');
    }
  }, [user, activePropertyId]);

  const removeRoomType = useCallback((id: string) => setRoomTypes(prev => prev.filter(rt => rt.id !== id)), []);
  const removeRoom = useCallback((id: string) => {
    // Clean up ops front desk room before removing from host state
    const room = rooms.find(r => r.id === id);
    if (room) {
      removeOpsFrontDeskRoom(room.property_id, room.room_name);
      const pid = room.property_id || activePropertyId || '';
      if (isApiPropertyId(pid) && UUID_RE.test(id)) {
        hostApi.deleteRoom(pid, id);
      }
    }
    setRooms(prev => prev.filter(r => r.id !== id));
  }, [activePropertyId, rooms]);
  const removeRatePlan = useCallback((id: string) => setRatePlans(prev => prev.filter(rp => rp.id !== id)), []);
  const removeDateOverride = useCallback((id: string) => setDateOverrides(prev => prev.filter(d => d.id !== id)), []);
  const removeDiscountCode = useCallback((id: string) => {
    const existing = discountCodes.find(dc => dc.id === id);
    const pid = existing?.property_id || activePropertyId || '';
    if (isApiPropertyId(pid)) hostApi.deleteDiscountCode(pid, id);
    setDiscountCodes(prev => prev.filter(dc => dc.id !== id));
  }, [activePropertyId, discountCodes]);
  const removeSpecialOffer = useCallback((id: string) => {
    const existing = specialOffers.find(so => so.id === id);
    const pid = existing?.property_id || activePropertyId || '';
    if (isApiPropertyId(pid)) hostApi.deleteSpecialOffer(pid, id);
    setSpecialOffers(prev => prev.filter(so => so.id !== id));
  }, [activePropertyId, specialOffers]);
  const removeTaxConfig = useCallback((id: string) => setTaxConfigs(prev => prev.filter(tx => tx.id !== id)), []);
  const removeStaff = useCallback((id: string) => {
    const existing = staff.find(s => s.id === id);
    const pid = existing?.property_id || activePropertyId || '';
    if (isApiPropertyId(pid)) hostApi.deleteStaff(pid, id);
    setStaff(prev => prev.filter(s => s.id !== id));
  }, [activePropertyId, staff]);
  const removeShift = useCallback((id: string) => setShifts(prev => prev.filter(s => s.id !== id)), []);
  const removeStaffTask = useCallback((id: string) => setStaffTasks(prev => prev.filter(t => t.id !== id)), []);

  const getFilteredRooms = useCallback((propertyId: string) => rooms.filter(r => r.property_id === propertyId), [rooms]);
  const getFilteredRoomTypes = useCallback((propertyId: string) => roomTypes.filter(rt => rt.property_id === propertyId), [roomTypes]);
  const getFilteredStaff = useCallback((propertyId: string) => staff.filter(s => s.property_id === propertyId), [staff]);
  const getFilteredBookings = useCallback((propertyId: string) => {
    const api = apiBookings.filter(b => b.property_id === propertyId);
    // If we've already queried the backend for this property, always prefer
    // the API result (even if empty) — never fall back to stale mock data.
    if (bookingsFetchedRef.current.has(propertyId)) return api;
    // For properties we haven't fetched yet (e.g. demo seeds), show mocks
    const mock = bookings.filter(b => b.property_id === propertyId);
    return api.length > 0 ? api : mock;
  }, [bookings, apiBookings]);

  const value: HostContextType = {
    properties, roomTypes, rooms, ratePlans, dateOverrides,
    discountCodes, specialOffers, taxConfigs, staff, shifts, staffTasks, bookings, systemAmenities,
    activePropertyId, setActivePropertyId, isDataLoading, loadedPersisted, syncingToServer, fetchHostData, refreshRooms,

    addProperty, syncPropertyToServer, updateProperty, togglePropertyActivation, removeProperty,
    addRoomType, updateRoomType, removeRoomType,
    addRoom, updateRoom, removeRoom, updateRoomStatus, syncLocalRoomsToServer,
    addRatePlan, updateRatePlan, removeRatePlan,
    addDateOverride, removeDateOverride,
    addDiscountCode, updateDiscountCode, removeDiscountCode,
    addSpecialOffer, updateSpecialOffer, removeSpecialOffer,
    addTaxConfig, updateTaxConfig, removeTaxConfig,
    addStaff, updateStaff, removeStaff,
    addShift, updateShift, removeShift,
    addStaffTask, updateStaffTask, removeStaffTask,

    getFilteredRooms, getFilteredRoomTypes, getFilteredStaff, getFilteredBookings,
    setPropertyCoverPhoto, addPropertyGalleryPhotos, removePropertyGalleryPhoto,
  };

  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}

export function useHost() {
  const context = useContext(HostContext);
  if (!context) throw new Error('useHost must be used within a HostProvider');
  return context;
}

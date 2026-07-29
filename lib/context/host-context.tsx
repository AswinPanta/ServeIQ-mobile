import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/context/auth-context';
import type {
  Property,
  RoomTypeDef,
  ExtraCharge,
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
  CancellationPolicy,
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
import { hostApi } from '@/lib/api/host-api';
import { addMockProperty, updateMockProperty, removeMockProperty } from '@/lib/mock/properties';
import type { Hotel, HotelAmenity, RoomType } from '@/lib/mock/properties';
import { registerOpsProperty, addOpsFrontDeskRoom, removeOpsFrontDeskRoom, removeOpsProperty } from '@/lib/context/frontdesk-context';

/** SA-004: Subscription plan limits enforcement */
export const SUBSCRIPTION_PLANS = {
  free_trial: { label: 'Free Trial', max_properties: 1, max_rooms: 10, max_staff: 3, max_bookings_monthly: 50 },
  basic: { label: 'Basic', max_properties: 1, max_rooms: 25, max_staff: 10, max_bookings_monthly: 200 },
  professional: { label: 'Professional', max_properties: 5, max_rooms: 100, max_staff: 50, max_bookings_monthly: 2000 },
  enterprise: { label: 'Enterprise', max_properties: Infinity, max_rooms: Infinity, max_staff: Infinity, max_bookings_monthly: Infinity },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export function checkPlanLimit(
  plan: SubscriptionPlan,
  currentCount: number,
  limitKey: keyof typeof SUBSCRIPTION_PLANS.free_trial
): { allowed: boolean; limit: number; message?: string } {
  const limit = SUBSCRIPTION_PLANS[plan][limitKey] as number;
  const allowed = currentCount < limit;
  return {
    allowed,
    limit,
    message: allowed ? undefined : `Plan limit reached (${currentCount}/${limit}). Upgrade your plan to add more.`,
  };
}

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
  activePropertyId: string | null;
  setActivePropertyId: (id: string | null) => void;
  isDataLoading: boolean;
  fetchHostData: () => void;
  refreshRooms: (propertyId?: string) => void;

  addProperty: (p: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  togglePropertyActivation: (id: string) => void;
  removeProperty: (id: string) => void;

  addRoomType: (rt: RoomTypeDef) => void;
  updateRoomType: (id: string, updates: Partial<RoomTypeDef>) => void;
  removeRoomType: (id: string) => void;

  addRoom: (r: AdminRoom) => void;
  updateRoom: (id: string, updates: Partial<AdminRoom>) => void;
  removeRoom: (id: string) => void;
  updateRoomStatus: (id: string, status: AdminRoomStatus) => void;

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

  addStaff: (s: StaffMember) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
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

export const OPS_DEFAULT_PROPERTY_ID_KEY = '@stayeasy_default_ops_property_id';
export const OPS_DEFAULT_PROPERTY_NAME_KEY = '@stayeasy_default_ops_property_name';

let _nextId = 100;
function genId(prefix: string) {
  _nextId += 1;
  return `${prefix}-${_nextId}`;
}

export function HostProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, portal, isLoading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([...mockProperties]);
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
  const [activePropertyId, setActivePropertyIdState] = useState<string | null>('prop-1');
  const [isDataLoading, setIsDataLoading] = useState(true);

  const isHostReady = isSignedIn && portal === 'host';

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

  // Transform API property shape to our Property type
  const mapApiProperty = useCallback((p: any): Property => ({
    id: p.id,
    tenant_id: p.tenant_id || '',
    name: p.name || '',
    type: p.type || 'HOTEL',
    description: p.description || '',
    country: p.country || '',
    state: p.state || '',
    city: p.city || '',
    zip_code: p.zip_code || '',
    address: p.address || '',
    latitude: p.latitude ?? 0,
    longitude: p.longitude ?? 0,
    check_in_time_from: p.check_in_time || '2:00 PM',
    check_in_time_to: '12:00 AM',
    check_out_time_from: '12:00 AM',
    check_out_time_to: p.check_out_time || '11:00 AM',
    number_of_floors: p.number_of_floors || 1,
    total_rooms: p.total_rooms || 0,
    year_built: p.year_built || 0,
    amenities: [
      ...(p.system_amenities || []).map((a: any) => a.name),
      ...(p.custom_amenities || []).map((a: any) => a.name),
    ],
    is_active: p.is_active ?? true,
    currency: p.currency || 'USD',
    timezone: p.timezone || 'UTC',
    brand_color: p.brand_color,
    min_rate_floor: p.min_rate_floor || 0,
    logo_url: p.brand_logo_url || null,
    custom_domain: p.custom_domain || null,
    cancellation_policy: p.cancellation_policy || 'MODERATE',
    photos: [
      ...(p.photos?.cover ? [{ id: 'cover', photo_url: p.photos.cover, category: 'cover' }] : []),
      ...(p.photos?.gallery || []).map((url: string, i: number) => ({
        id: `gallery-${i}`, photo_url: url, category: 'gallery',
      })),
    ],
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  }), []);

  // Load real data from backend when host auth is ready, fall back to mock data
  const fetchHostData = useCallback(() => {
    setIsDataLoading(true);
    hostApi.getProperties(() => []).then(apiProps => {
      if (apiProps.length > 0) {
        const mapped = apiProps.map(mapApiProperty);
        setProperties(mapped);
        setActivePropertyIdState(mapped[0].id);
      }
    }).finally(() => setIsDataLoading(false));
  }, [mapApiProperty]);

  useEffect(() => {
    if (isHostReady && !authLoading) {
      fetchHostData();
    }
  }, [isHostReady, authLoading, fetchHostData]);

  // Transform API room to AdminRoom shape
  const mapApiRoom = useCallback((r: any): AdminRoom => ({
    id: r.id,
    property_id: r.property_id || activePropertyId || '',
    room_type_id: r.room_type_id || '',
    room_name: r.room_name || '',
    floor_number: r.floor_number ?? 1,
    max_adults: r.max_adults ?? 2,
    max_children: r.max_children ?? 0,
    max_occupancy: r.max_occupancy ?? (r.max_adults ?? 2) + (r.max_children ?? 0),
    base_rate: parseFloat(r.base_rate) || 0,
    status: r.status || 'AVAILABLE',
    smoking: r.smoking ?? false,
    accessible: r.accessible ?? false,
    cancellation_policy: r.cancellation_policy || 'MODERATE',
    cancellation_notes: r.cancellation_description || null,
    photos: [
      ...(r.photos?.cover ? [r.photos.cover] : []),
      ...(r.photos?.gallery || []),
    ],
    amenities: [
      ...(r.custom_amenities || []).map((a: any) => a.name),
    ],
    blocked_dates: [],
    maintenance_return_date: null,
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at || new Date().toISOString(),
  }), [activePropertyId]);

  const refreshRooms = useCallback((propertyId?: string) => {
    const pid = propertyId || activePropertyId;
    if (!pid) return;
    hostApi.getRooms(pid, () => []).then(apiRooms => {
      if (apiRooms.length > 0) setRooms(apiRooms.map(r => mapApiRoom({ ...r, property_id: pid })));
    });
  }, [activePropertyId, mapApiRoom]);

  useEffect(() => {
    if (activePropertyId) {
      hostApi.getRooms(activePropertyId, () => []).then(apiRooms => {
        if (apiRooms.length > 0) setRooms(apiRooms.map(r => mapApiRoom({ ...r, property_id: activePropertyId })));
      });
      hostApi.getDiscountCodes(activePropertyId, () => []).then(apiCodes => {
        if (apiCodes.length > 0) setDiscountCodes(apiCodes);
      });
      hostApi.getSpecialOffers(activePropertyId, () => []).then(apiOffers => {
        if (apiOffers.length > 0) setSpecialOffers(apiOffers);
      });
      hostApi.getPropertyBookings(activePropertyId, () => []).then(apiData => {
        if (apiData.length > 0) {
          setApiBookings(apiData.map((b: any) => ({
            id: b.id,
            property_id: activePropertyId,
            guest_name: b.guest_name || 'Guest',
            room_name: (b.room_names || []).join(', '),
            check_in: b.checkin_date || '',
            check_out: b.checkout_date || '',
            status: b.status || 'pending',
            total: parseFloat(b.total_amount) || 0,
            created_at: b.created_at || new Date().toISOString(),
          })));
        }
      });
    }
  }, [activePropertyId, mapApiRoom]);

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

  const addProperty = useCallback((p: Property) => {
    hostApi.createProperty(p, () => p).then(created => {
      setProperties(prev => [...prev, created]);
      registerPropertyAcrossPortals(created);
    });
  }, [registerPropertyAcrossPortals]);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    hostApi.updateProperty(id, updates, () => ({ ...updates } as Property)).then(() => {
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
    hostApi.toggleActivation(id, () => ({})).then(() => {
      setProperties(prev => prev.map(p =>
        p.id === id ? { ...p, is_active: !p.is_active, updated_at: now() } : p
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

  const addRoom = useCallback((r: AdminRoom) => {
    setRooms(prev => [...prev, r]);
    // Sync new room to ops portal front desk
    addOpsFrontDeskRoom(r.property_id, r.room_name, r.floor_number);
  }, []);
  const updateRoom = useCallback((id: string, updates: Partial<AdminRoom>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates, updated_at: now() } : r));
    // If room name changed, sync to ops (requires knowing the old name via state)
    // For simplicity, the ops front desk room name is synced on add/remove only.
  }, []);
  const updateRoomStatus = useCallback((id: string, status: AdminRoomStatus) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status, updated_at: now() } : r));
  }, []);

  const addRatePlan = useCallback((rp: RatePlan) => setRatePlans(prev => [...prev, rp]), []);
  const updateRatePlan = useCallback((id: string, updates: Partial<RatePlan>) => {
    setRatePlans(prev => prev.map(rp => rp.id === id ? { ...rp, ...updates, updated_at: now() } : rp));
  }, []);

  const addDateOverride = useCallback((d: DateOverride) => setDateOverrides(prev => [...prev, d]), []);

  const addDiscountCode = useCallback((dc: AdminDiscountCode) => {
    hostApi.createDiscountCode(activePropertyId || 'prop-1', dc, () => dc).then(created => {
      setDiscountCodes(prev => [...prev, created]);
    });
  }, [activePropertyId]);
  const updateDiscountCode = useCallback((id: string, updates: Partial<AdminDiscountCode>) => {
    setDiscountCodes(prev => prev.map(dc => dc.id === id ? { ...dc, ...updates, updated_at: now() } : dc));
  }, []);

  const addSpecialOffer = useCallback((so: SpecialOffer) => {
    hostApi.createSpecialOffers(activePropertyId || 'prop-1', { offers: [so] }, () => so).then((created: any) => {
      setSpecialOffers(prev => [...prev, created]);
    });
  }, [activePropertyId]);
  const updateSpecialOffer = useCallback((id: string, updates: Partial<SpecialOffer>) => {
    setSpecialOffers(prev => prev.map(so => so.id === id ? { ...so, ...updates, updated_at: now() } : so));
  }, []);

  const addTaxConfig = useCallback((tx: TaxConfig) => setTaxConfigs(prev => [...prev, tx]), []);
  const updateTaxConfig = useCallback((id: string, updates: Partial<TaxConfig>) => {
    setTaxConfigs(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates, updated_at: now() } : tx));
  }, []);

  const addStaff = useCallback((s: StaffMember) => setStaff(prev => [...prev, s]), []);
  const updateStaff = useCallback((id: string, updates: Partial<StaffMember>) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: now() } : s));
  }, []);

  const addShift = useCallback((s: Shift) => setShifts(prev => [...prev, s]), []);
  const updateShift = useCallback((id: string, updates: Partial<Shift>) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: now() } : s));
  }, []);

  const addStaffTask = useCallback((t: StaffTask) => setStaffTasks(prev => [...prev, t]), []);
  const updateStaffTask = useCallback((id: string, updates: Partial<StaffTask>) => {
    setStaffTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updated_at: now() } : t));
  }, []);

  const removeProperty = useCallback((id: string) => {
    hostApi.deleteProperty(id);
    setProperties(prev => prev.filter(p => p.id !== id));
    setRoomTypes(prev => prev.filter(rt => rt.property_id !== id));
    setRooms(prev => prev.filter(r => r.property_id !== id));
    // Clean up from guest portal
    removeMockProperty(id.replace('prop-', ''));
    // Clean up from ops portal
    removeOpsProperty(id);
    // Clear AsyncStorage default if this was the default
    AsyncStorage.getItem(OPS_DEFAULT_PROPERTY_ID_KEY).then(savedId => {
      if (savedId === id) {
        AsyncStorage.multiRemove([OPS_DEFAULT_PROPERTY_ID_KEY, OPS_DEFAULT_PROPERTY_NAME_KEY]);
      }
    });
  }, []);

  const removeRoomType = useCallback((id: string) => setRoomTypes(prev => prev.filter(rt => rt.id !== id)), []);
  const removeRoom = useCallback((id: string) => {
    // Clean up ops front desk room before removing from host state
    const room = rooms.find(r => r.id === id);
    if (room) {
      removeOpsFrontDeskRoom(room.property_id, room.room_name);
    }
    setRooms(prev => prev.filter(r => r.id !== id));
  }, [rooms]);
  const removeRatePlan = useCallback((id: string) => setRatePlans(prev => prev.filter(rp => rp.id !== id)), []);
  const removeDateOverride = useCallback((id: string) => setDateOverrides(prev => prev.filter(d => d.id !== id)), []);
  const removeDiscountCode = useCallback((id: string) => setDiscountCodes(prev => prev.filter(dc => dc.id !== id)), []);
  const removeSpecialOffer = useCallback((id: string) => setSpecialOffers(prev => prev.filter(so => so.id !== id)), []);
  const removeTaxConfig = useCallback((id: string) => setTaxConfigs(prev => prev.filter(tx => tx.id !== id)), []);
  const removeStaff = useCallback((id: string) => setStaff(prev => prev.filter(s => s.id !== id)), []);
  const removeShift = useCallback((id: string) => setShifts(prev => prev.filter(s => s.id !== id)), []);
  const removeStaffTask = useCallback((id: string) => setStaffTasks(prev => prev.filter(t => t.id !== id)), []);

  const getFilteredRooms = useCallback((propertyId: string) => rooms.filter(r => r.property_id === propertyId), [rooms]);
  const getFilteredRoomTypes = useCallback((propertyId: string) => roomTypes.filter(rt => rt.property_id === propertyId), [roomTypes]);
  const getFilteredStaff = useCallback((propertyId: string) => staff.filter(s => s.property_id === propertyId), [staff]);
  const getFilteredBookings = useCallback((propertyId: string) => {
    const api = apiBookings.filter(b => b.property_id === propertyId);
    const mock = bookings.filter(b => b.property_id === propertyId);
    return api.length > 0 ? api : mock;
  }, [bookings, apiBookings]);

  const value: HostContextType = {
    properties, roomTypes, rooms, ratePlans, dateOverrides,
    discountCodes, specialOffers, taxConfigs, staff, shifts, staffTasks, bookings,
    activePropertyId, setActivePropertyId, isDataLoading, fetchHostData, refreshRooms,

    addProperty, updateProperty, togglePropertyActivation, removeProperty,
    addRoomType, updateRoomType, removeRoomType,
    addRoom, updateRoom, removeRoom, updateRoomStatus,
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

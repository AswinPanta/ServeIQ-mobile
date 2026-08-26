import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, GRAY } from '@/constants/portal-theme';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';
import { useHost } from '@/lib/context/host-context';
import { useAuth } from '@/lib/context/auth-context';
import { isApiPropertyId } from '@/lib/context/host-utils';
import { hostApi, normalizeTime, normalizePhone, ensureRoomType, ensureBedType } from '@/lib/api/host-api';
import { getStatesForCountry } from '@/lib/mock/country-states';
import { safeGoBack } from '@/lib/utils';
import { validateEmail, validatePropertyPhone, validateName, validateTime } from '@/lib/utils/validation';
import { FadeInView } from '@/components/ui/motion';
import { reverseGeocode } from '@/hooks/use-location';
import { BG, PURPLE } from '@/lib/constants/figma-tokens';
import ListingWizardSteps from '@/components/host/wizard/steps';
import { DEFAULT_OFFERS, ACCENT, AMENITY_OPTIONS, STEP_ORDER } from '@/components/host/wizard/types';
import type { WizardStep, PropertyData, LocationData, Offer, WizardCtx, WizardFieldErrors } from '@/components/host/wizard/types';
import type { CancellationPolicy } from '@/types/api';
import { styles } from '@/components/host/wizard/styles';

// Maps the wizard's display label to the backend CancellationPolicy enum
// (verified against the live OpenAPI spec at stay-easy-sizw.onrender.com).
const toCancellationPolicy = (p?: string): CancellationPolicy => {
  switch ((p || 'Flexible').trim().toLowerCase().replace(/[\s-]+/g, '_')) {
    case 'flexible': return 'FLEXIBLE';
    case 'moderate': return 'MODERATE';
    case 'strict': return 'STRICT';
    case 'non_refundable': return 'NON_REFUNDABLE';
    default: return 'CUSTOM';
  }
};

// Standard room cancellation copy sent to the backend as
// cancellation_title / cancellation_description (RoomBase schema).
const CANCELLATION_DESCRIPTIONS: Record<CancellationPolicy, string> = {
  FLEXIBLE: 'Free cancellation up to 48 hours before check-in.',
  MODERATE: 'Free cancellation up to 7 days before check-in.',
  STRICT: 'Free cancellation up to 30 days before check-in.',
  NON_REFUNDABLE: 'This booking is non-refundable.',
  CUSTOM: 'Custom cancellation policy — see details at the property.',
};

export default function ListingWizard() {
  const { addProperty, addRoom } = useHost();
  const { tokens } = useAuth();
  const isDemoAccount = !!tokens.accessToken?.startsWith('demo-');

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // 'saving' | 'publishing' | null
  const [propertyId, setPropertyId] = useState<string | null>(null); // persisted backend ID

  // Step 1: Type
  const [propertyType, setPropertyType] = useState('');

  // Step 2: Property Details
  const [propData, setPropData] = useState<PropertyData>({
    type: '', name: '', totalRooms: 0, floors: 1, yearBuilt: 0,
    description: '', phone: '', email: '',
  });

  // Step 3: Location
  const [location, setLocation] = useState<LocationData>({
    country: 'Nepal', state: '', city: '', zip: '', street: '', mapLink: '',
    latitude: null, longitude: null,
  });
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Step 4: Photos & Amenities
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [starRating, setStarRating] = useState(0);
  const [customAmenity, setCustomAmenity] = useState('');
  const [amenitySearch, setAmenitySearch] = useState('');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [showLogoPicker, setShowLogoPicker] = useState(false);

  // Step 5: Rooms (floors state from RoomSetup)
  const [floors, setFloors] = useState<any[]>([]);

  // Step 6: Pricing & Offers
  const [offers, setOffers] = useState<Offer[]>(DEFAULT_OFFERS);
  const [checkInTime, setCheckInTime] = useState('15:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [showCustomOffer, setShowCustomOffer] = useState(false);
  const [customOfferData, setCustomOfferData] = useState({ title: '', description: '', badge: 'Custom' });

  // Tracks whether media/amenities sync has failed so Publish can retry it.
  const photosSyncFailedRef = React.useRef(false);

  // Field-level validation errors for the property step
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({});
  const clearFieldError = (field: keyof WizardFieldErrors) => {
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ─── Derived State ────────────────────────────────
  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const progressPercent = Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100);
  const { current: stepNum, total: stepTotal } = (() => {
    const mainSteps: WizardStep[] = ['property', 'location', 'photos', 'rooms', 'pricing', 'review'];
    const idx = mainSteps.indexOf(currentStep);
    return idx === -1 ? { current: 0, total: 6 } : { current: idx + 1, total: 6 };
  })();

  const stepTitles: Record<WizardStep, string> = {
    type: 'Select Your Property Type',
    property: 'Property Details',
    location: 'Location Details',
    photos: 'Photos & Amenities',
    rooms: 'Room Setup',
    pricing: 'Pricing & Offers',
    review: 'Final Review & Launch',
  };

  // ─── Navigation ──────────────────────────────────
  const getNextStep = (): WizardStep | null => {
    const idx = STEP_ORDER.indexOf(currentStep);
    return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
  };
  const getPrevStep = (): WizardStep | null => {
    const idx = STEP_ORDER.indexOf(currentStep);
    return idx > 0 ? STEP_ORDER[idx - 1] : null;
  };

  const toggleAmenity = (name: string) => {
    setAmenities(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };

  const toggleOffer = (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o));
  };

  const addCustomOffer = () => {
    if (!customOfferData.title.trim()) return;
    setOffers(prev => [...prev, {
      id: `custom-${Date.now()}`,
      label: customOfferData.title.trim(),
      badge: customOfferData.badge,
      badgeColor: PURPLE[100],
      badgeText: PURPLE[600],
      desc: customOfferData.description || 'Custom offer',
      enabled: true,
    }]);
    setCustomOfferData({ title: '', description: '', badge: 'Custom' });
    setShowCustomOffer(false);
  };

  // Guards against a slow reverse-geocode response for an older pin overwriting
  // a newer pin's coordinates/address (out-of-order async resolution).
  const lastPinRef = React.useRef<{ lat: number; lng: number } | null>(null);

  /** Picked from the interactive map → store coordinates + auto-fill the address fields via reverse geocoding. */
  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    lastPinRef.current = { lat, lng };
    setLocation(prev => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const geo = await reverseGeocode(lat, lng);
      // Ignore stale responses from an earlier pin.
      if (!lastPinRef.current || lastPinRef.current.lat !== lat || lastPinRef.current.lng !== lng) return;
      setLocation(prev => ({
        ...prev,
        street: geo.street || prev.street || '',
        city: geo.city || prev.city || '',
        state: geo.state || prev.state || '',
        country: geo.country || prev.country || 'Nepal',
        zip: geo.postcode || prev.zip || '',
      }));
    } catch {
      // Coordinates are still saved even if reverse geocoding fails
    }
  }, []);

  /** Upload selected photos, then persist photos + amenities to the backend.
   *  Sequential: requires an existing propertyId. Non-blocking on partial failure. */
  const syncPhotosAndAmenities = useCallback(async (pid: string, photoUris: string[], amenityNames: string[], coverIndex = 0) => {
    const uploaded: string[] = [];
    if (photoUris.length > 0) {
      try {
        const ordered = coverIndex >= 0 && coverIndex < photoUris.length
          ? [photoUris[coverIndex], ...photoUris.filter((_, i) => i !== coverIndex)]
          : photoUris;
        const formData = new FormData();
        ordered.forEach((uri, i) => {
          formData.append('files', { uri, type: 'image/jpeg', name: `photo_${Date.now()}_${i}.jpg` } as any);
        });
        const result = await hostApi.uploadPropertyImages(pid, formData);
        const urls = Array.isArray(result) ? result : (result?.data ?? []);
        if (Array.isArray(urls) && urls.length > 0) uploaded.push(...urls);
      } catch (e) {
        console.warn('Photo upload failed:', e);
      }
    }
    const payload = {
      photos: {
        cover: uploaded[0] || null,
        gallery: uploaded.slice(1),
      },
      amenities: {
        custom_amenities: amenityNames.map((name: string) => ({ name })),
      },
    };
    try {
      await hostApi.createPhotosAndAmenities(pid, payload, () => ({} as any));
      photosSyncFailedRef.current = false;
    } catch (e) {
      console.warn('Failed to save photos/amenities:', e);
      photosSyncFailedRef.current = true;
    }
  }, []);

  /** Upload the property owner logo (single image) and return its URL. */
  const uploadOwnerLogo = useCallback(async (pid: string): Promise<string | null> => {
    if (!logo) return null;
    try {
      const formData = new FormData();
      formData.append('image', { uri: logo, type: 'image/jpeg', name: 'owner_logo.jpg' } as any);
      const result = await hostApi.uploadPropertyImage(pid, formData);
      const url = result?.data || result;
      return typeof url === 'string' && url.length > 0 ? url : null;
    } catch (e) {
      console.warn('Owner logo upload failed:', e);
      return null;
    }
  }, [logo]);

  const handleNext = useCallback(async () => {
    const next = getNextStep();
    if (!next) return;

    // Auto-save current step data before progressing
    if (!propertyId && currentStep !== 'type' && currentStep !== 'property' && currentStep !== 'rooms') {
      // Certain steps need a property ID — we'll save inline below
    }    if (currentStep === 'property') {
      // Comprehensive field validation matching backend Pydantic constraints
      const errs: WizardFieldErrors = {};
      const nameErr = validateName(propData.name, { min: 2, max: 255, label: 'Property name' });
      if (nameErr) errs.name = nameErr;
      const phoneErr = validatePropertyPhone(propData.phone);
      if (phoneErr) errs.phone = phoneErr;
      const emailErr = validateEmail(propData.email);
      if (emailErr) errs.email = emailErr;
      if (propData.totalRooms < 0) errs.totalRooms = 'Total rooms cannot be negative.';
      if (propData.yearBuilt && (propData.yearBuilt < 1800 || propData.yearBuilt > new Date().getFullYear() + 2)) {
        errs.yearBuilt = 'Year built must be between 1800 and ' + (new Date().getFullYear() + 2) + '.';
      }
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});

      setSaving('saving');
      try {
        // Backend schema constraints (GeneralPropertyInfo):
        // - total_rooms: int, ge=1 (must be at least 1)
        // - year_built: Optional[int], ge=1800, le=2100 (don't send 0)
        // - phone_number: str, exactly 10 digits
        // - email: EmailStr (required)
        const payload = {
          name: propData.name || 'My Property',
          type: (propertyType || 'HOTEL').toUpperCase(),
          total_rooms: Math.max(1, propData.totalRooms || 1),
          number_of_floors: propData.floors || 1,
          description: propData.description || '',
          phone_number: normalizePhone(propData.phone),
          email: propData.email || undefined,
          year_built: propData.yearBuilt && propData.yearBuilt >= 1800 ? propData.yearBuilt : undefined,
        };
        if (propertyId) {
          await hostApi.updateProperty(propertyId, payload as any, () => ({} as any));
        } else {
          const created = await hostApi.createGeneralInfo(payload, () => ({
            id: `prop-${Date.now()}`, ...payload,
          } as any));
          if (created?.id) {
            // Verify we got a real backend UUID, not a local fallback
            const isRealBackend = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(created.id);
            if (!isRealBackend) {
              // Backend rejected the request — surface the error and STOP
              Alert.alert(
                'Could not save to server',
                'The property was saved locally but could not be created on the server. This may be because:\n\n' +
                '• Your session may have expired — try signing out and back in\n' +
                '• The server may be temporarily unavailable\n\n' +
                'Please fix the issue and try again.',
                [{ text: 'OK' }]
              );
              setSaving(null);
              return;  // CRITICAL: do not continue with a fake prop-<timestamp> ID
            }
            setPropertyId(created.id);
          }
        }
      } catch (e: any) {
        // Backend returned a specific error message — show it to the user
        const msg = e?.message || 'Failed to save property details.';
        Alert.alert('Server Error', msg.includes('tenant')
          ? 'You need a tenant account to create properties. Please contact support.'
          : msg.includes('422')
            ? 'Some fields have invalid values. Please check your input and try again.'
            : msg);
        setSaving(null);
        return;  // Don't advance to next step on error
      }
      setSaving(null);
    }

    if (currentStep === 'location') {
      // Validate location fields before proceeding (backend Location schema)
      const errs: WizardFieldErrors = {};
      if (!location.country.trim() || location.country.trim().length < 2) errs.country = 'Country is required (min 2 characters).';
      if (!location.state.trim() || location.state.trim().length < 2) errs.state = 'State/Province is required (min 2 characters).';
      if (!location.city.trim() || location.city.trim().length < 2) errs.city = 'City is required (min 2 characters).';
      if (!location.zip.trim() || location.zip.trim().length < 2 || location.zip.trim().length > 10) errs.zip = 'ZIP code must be 2-10 characters.';
      if (!location.street.trim() || location.street.trim().length < 2) errs.street = 'Street address is required (min 2 characters).';
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      if (!propertyId) {
        Alert.alert('Error', 'Property details must be saved first. Please go back and try again.');
        return;
      }
      setFieldErrors({});
    }

    if (currentStep === 'location' && propertyId) {
      setSaving('saving');
      try {
        await hostApi.createLocation(propertyId, {
          country: location.country || 'Nepal',
          state: location.state || '',
          city: location.city || '',
          zip_code: location.zip || '',
          address: location.street || '',
          latitude: location.latitude ?? undefined,
          longitude: location.longitude ?? undefined,
        }, () => ({} as any));
      } catch (e) {
        console.warn('Failed to save location:', e);
      }
      setSaving(null);
    }

    if (currentStep === 'photos' && propertyId) {
      setSaving('saving');
      await syncPhotosAndAmenities(propertyId, photos, amenities, coverPhotoIndex);
      if (photosSyncFailedRef.current) {
        Alert.alert(
          "Couldn't sync photos",
          "We couldn't save your photos to the platform right now. You can continue — they'll be retried when you publish.",
          [{ text: 'OK' }]
        );
      }
      setSaving(null);
    }

    if (currentStep === 'rooms' && propertyId) {
      setSaving('saving');
      const roomErrors: string[] = [];
      try {
        const allRooms = floors.flatMap(f => (f.rooms || []));
        if (allRooms.length === 0) {
          setSaving(null);
          return;
        }
        // The backend stores per-room room_type_id / bed_type_id, so create
        // one room-type and one bed-type record per distinct selection
        // (including free-text custom names) and assign the right ID to each
        // room — instead of collapsing everything into a single default.
        const typeName = (r: any) => (r.roomType || r.type || 'Standard').trim() || 'Standard';
        const bedName = (r: any) => (r.bedConfig || r.bed || 'Standard').trim() || 'Standard';
        const distinctTypes = [...new Set(allRooms.map(typeName))];
        const distinctBeds = [...new Set(allRooms.map(bedName))];
        const rtIdByType: Record<string, string> = {};
        for (const name of distinctTypes) {
          const fallbackId = `rt-${Date.now()}-${name.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'type'}`;
          // The backend ships default room types ("Standard Room", "Deluxe
          // Room", ...) and rejects duplicate names — reuse the default's id
          // when the name matches instead of 400ing on create.
          const id = await ensureRoomType(propertyId, `${name} Room`.slice(0, 100));
          rtIdByType[name] = id || fallbackId;
        }
        const btIdByBed: Record<string, string> = {};
        for (const name of distinctBeds) {
          const fallbackId = `bt-${Date.now()}-${name.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'bed'}`;
          const id = await ensureBedType(propertyId, name.slice(0, 100));
          btIdByBed[name] = id || fallbackId;
        }
        // Try bulk create, fall back to individual if batch fails
        const roomsPayload = allRooms.map((room, idx) => {
          const policy = toCancellationPolicy(room.cancellationPolicy);
          const customNotes = (room.cancellationNotes || '').trim();
          const isCustom = policy === 'CUSTOM';
          return {
            floor_number: parseInt(room.floor || room.roomNumber) || 1,
            room_name: room.name || room.roomNumber || `Room ${idx + 1}`,
            room_type_id: rtIdByType[typeName(room)] || `rt-${Date.now()}`,
            bed_type_id: btIdByBed[bedName(room)] || `bt-${Date.now()}`,
            base_rate: Math.max(1, parseFloat(room.price || room.minRate || '1') || 1),
            max_adults: room.maxAdults || 2,
            max_children: room.maxChildren || 0,
            smoking: room.smoking || false,
            accessible: room.accessible || false,
            cancellation_policy: policy,
            cancellation_title: (isCustom ? (customNotes || 'Custom cancellation policy') : `${room.cancellationPolicy || 'Flexible'} cancellation`).slice(0, 255),
            cancellation_description: (isCustom ? (customNotes || null) : CANCELLATION_DESCRIPTIONS[policy])?.slice(0, 2000) ?? null,
            // Preserve the exact server-side names (types are created as
            // "<name> Room" / reused defaults) so a later local→server sync
            // resolves-or-creates faithfully (ignored by the backend).
            room_type_name: `${typeName(room)} Room`.slice(0, 100),
            bed_name: bedName(room).slice(0, 100),
            _photos: room.photos || [],
          };
        });
        try {
          await hostApi.bulkCreateRooms(propertyId, { rooms: roomsPayload }, () => ({} as any));
        } catch {
          const roomFailures: string[] = [];
          for (const roomData of roomsPayload) {
            try {
              await hostApi.createRoom(propertyId, roomData, () => ({ id: `room-${Date.now()}` } as any));
            } catch (e) {
              roomFailures.push(roomData.room_name || 'Unknown room');
              console.warn('Failed to create room:', roomData.room_name, e);
            }
          }
          if (roomFailures.length > 0) {
            roomErrors.push(`rooms (${roomFailures.join(', ')})`);
          }
        }
        // Add rooms to context state so they appear immediately (survives demo mode)
        for (const rd of roomsPayload) {
          addRoom({
            id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            property_id: propertyId,
            room_type_id: rd.room_type_id,
            bed_type_id: rd.bed_type_id || '',
            room_type_name: rd.room_type_name || '',
            bed_name: rd.bed_name || '',
            room_name: rd.room_name,
            floor_number: rd.floor_number,
            max_adults: rd.max_adults,
            max_children: rd.max_children,
            max_occupancy: rd.max_adults + rd.max_children,
            base_rate: rd.base_rate,
            status: 'AVAILABLE',
            smoking: rd.smoking,
            accessible: rd.accessible,
            amenities: [],
            photos: rd._photos || [],
            blocked_dates: [],
            maintenance_return_date: null,
            cancellation_policy: rd.cancellation_policy || 'MODERATE',
            cancellation_notes: rd.cancellation_description || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { skipBackend: true });
        }
      } catch (e) {
        console.warn('Failed to save rooms:', e);
      }
      setSaving(null);
    }

    if (currentStep === 'pricing') {
      // Validate check-in/out times before proceeding to review
      const errs: WizardFieldErrors = {};
      const checkInErr = validateTime(checkInTime, 'Check-in time');
      if (checkInErr) errs.checkInTime = checkInErr;
      const checkOutErr = validateTime(checkOutTime, 'Check-out time');
      if (checkOutErr) errs.checkOutTime = checkOutErr;
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});
    }

    if (currentStep === 'pricing' && propertyId) {
      setSaving('saving');
      try {
        const enabledOffers = offers.filter(o => o.enabled);
        if (enabledOffers.length > 0) {
          await hostApi.createSpecialOffers(propertyId, {
            offers: enabledOffers.map(o => ({
              title: o.label,
              description: o.desc || o.label,
              discount_percentage: 10,
              start_date: o.startDate || undefined,
              end_date: o.endDate || undefined,
              is_active: true,
            })),
          }, () => ({} as any)).catch(() => {});
        }
      } catch (e) {
        console.warn('Failed to save offers:', e);
      }
      setSaving(null);
    }

    setCurrentStep(next);
  }, [currentStep, propertyId, propData, propertyType, location, amenities, photos, starRating, checkInTime, checkOutTime, floors, offers, coverPhotoIndex, syncPhotosAndAmenities]);

  const handleBack = useCallback(() => {
    const prev = getPrevStep();
    if (prev) setCurrentStep(prev);
  }, [currentStep]);

  const handleGoToStep = (stepIdx: number) => {
    if (stepIdx >= 0 && stepIdx < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[stepIdx]);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setSaving('publishing');
    try {
      // Guard: property must have been created on the server during step 2.
      // Without a real backend UUID, rooms/photos/offers can't be attached.
      if (!propertyId) {
        Alert.alert(
          'Property not saved',
          'Please go back to the Property Details step and save your property before publishing.',
          [{ text: 'OK' }]
        );
        setSaving(null);
        setLoading(false);
        return;
      }

      const totalRooms = floors.reduce((s: number, f: any) => s + (f.rooms?.length || 0), 0);

      const brandLogoUrl = await uploadOwnerLogo(propertyId);
      const failures: string[] = [];
      await Promise.all([
        hostApi.createBrandVisual(propertyId, {
          brand_color: ACCENT,
          ...(brandLogoUrl ? { brand_logo_url: brandLogoUrl } : {}),
        }, () => ({} as any)).catch(() => { failures.push('branding'); }),
        hostApi.createLocalization(propertyId, {
          currency: 'NPR',
          timezone: 'Asia/Kathmandu',
          language: 'English',
          check_in_time: normalizeTime(checkInTime),
          check_out_time: normalizeTime(checkOutTime),
        }, () => ({} as any)).catch(() => { failures.push('localization'); }),
        hostApi.updateProperty(propertyId, {
          name: propData.name || 'My Property',
          description: propData.description || '',
          type: (propertyType || 'HOTEL').toUpperCase(),
          total_rooms: Math.max(1, totalRooms || propData.totalRooms || 1),
          number_of_floors: floors.length || 1,
          phone_number: propData.phone || undefined,
          email: propData.email || undefined,
          country: location.country,
          state: location.state || location.city,
          city: location.city,
          zip_code: location.zip || '00000',
          address: location.street || `${location.city || ''}, ${location.country || ''}`,
          latitude: location.latitude ?? undefined,
          longitude: location.longitude ?? undefined,
          check_in_time: normalizeTime(checkInTime),
          check_out_time: normalizeTime(checkOutTime),
          currency: 'NPR',
          timezone: 'Asia/Kathmandu',
          language: 'English',
        }, () => ({} as any)).catch(() => { failures.push('property details'); }),
        // Retry any photos/amenities that failed to sync during the photos step
        photosSyncFailedRef.current
          ? syncPhotosAndAmenities(propertyId, photos, amenities, coverPhotoIndex).catch(() => { failures.push('photos'); })
          : Promise.resolve(),
      ]);
      // Activate via the dedicated endpoint
      try {
        await hostApi.toggleActivation(propertyId, () => ({} as any));
      } catch {
        failures.push('activation');
      }
      if (failures.length > 0) {
        Alert.alert(
          'Partial Save',
          `Some parts couldn't be saved to the server: ${failures.join(', ')}. You can retry from the property settings.`,
        );
      }

      // Always call addProperty (handles context sync, guest portal registration, fallback).
      // addProperty creates the property on the server unless it already exists
      // there (wizard step 2 created it) — it never creates duplicates.
      const publishedId = propertyId || `prop-${Date.now()}`;
      const finalProperty = await addProperty({
        id: publishedId,
        tenant_id: 'demo-host-1',
        name: propData.name || 'My Property',
        type: propertyType.toUpperCase() as any,
        description: propData.description,
        phone_number: propData.phone || undefined,
        email: propData.email || undefined,
        country: location.country,
        state: location.state || location.city,
        city: location.city,
        zip_code: location.zip || '00000',
        address: location.street || `${location.city || ''}, ${location.country || ''}`,
        latitude: location.latitude ?? 0,
        longitude: location.longitude ?? 0,
        check_in_time_from: checkInTime,
        check_in_time_to: '12:00',
        check_out_time_from: '00:00',
        check_out_time_to: checkOutTime,
        number_of_floors: floors.length || 1,
        total_rooms: Math.max(1, totalRooms || propData.totalRooms || 1),
        year_built: propData.yearBuilt || 2020,
        amenities: amenities,
        is_active: true,
        currency: 'NPR',
        timezone: 'Asia/Kathmandu',
        brand_color: ACCENT,
        min_rate_floor: 0,
        logo_url: logo || null,
        custom_domain: null,
        cancellation_policy: 'FLEXIBLE',
        photos: photos.map((uri, i) => ({
          id: `ph-${Date.now()}-${i}`,
          photo_url: uri,
          category: i === coverPhotoIndex ? 'cover' : 'exterior',
        })),
        // Persist enabled offers on the local property so they survive and can
        // be pushed to the server when the property is synced later.
        special_offers: offers.filter(o => o.enabled).map(o => {
          const today = new Date();
          // Local calendar dates — toISOString() is UTC and would be a day
          // behind in positive-offset timezones (e.g. Nepal +5:45).
          const toLocalDate = (d: Date) => {
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${d.getFullYear()}-${m}-${day}`;
          };
          return {
            id: `so-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            property_id: publishedId,
            title: o.label,
            description: o.desc || o.label,
            discount_percentage: 10,
            start_date: o.startDate || toLocalDate(today),
            end_date: o.endDate || toLocalDate(new Date(today.getTime() + 30 * 864e5)),
            is_active: true,
            is_custom: false,
            conditions: null,
            created_at: today.toISOString(),
            updated_at: today.toISOString(),
          };
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const syncedToServer = isApiPropertyId(finalProperty.id);
      const goToDashboard = { text: 'Go to Dashboard', onPress: () => { try { router.replace('/(host)'); } catch { router.push('/(host)'); } } } as const;
      if (syncedToServer) {
        Alert.alert('Published!', 'Your property is now live and accepting bookings.', [goToDashboard]);
      } else if (isDemoAccount) {
        Alert.alert(
          'Published on this device',
          'You are signed in with a demo account, so this property was saved on this device only — staff invites stay local and no email will be sent. Sign in with a registered host account to publish to the server.',
          [goToDashboard]
        );
      } else {
        Alert.alert(
          'Published on this device',
          'We couldn\u2019t reach the server just now, so this property was saved on this device only — staff invites stay local and no email will be sent. You can retry from the property Staff screen.',
          [goToDashboard]
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to publish property.');
    }
    setSaving(null);
    setLoading(false);
  };

  const handleSaveDraft = async () => {
    setSaving('saving');
    try {
      if (propertyId) {
        // Update existing property with whatever data we have
        await hostApi.updateProperty(propertyId, {
          name: propData.name || 'My Property',
          description: propData.description || '',
          country: location.country,
          state: location.state || location.city,
          city: location.city,
          zip_code: location.zip || '00000',
          address: location.street || '',
          check_in_time: normalizeTime(checkInTime),
          check_out_time: normalizeTime(checkOutTime),
          currency: 'NPR',
          timezone: 'Asia/Kathmandu',
          language: 'English',
        } as any, () => ({} as any)).catch(() => {});
        Alert.alert('Saved!', 'Your property draft has been saved to the cloud.');
      } else if (propData.name) {
        // No backend ID yet — create the property first
        const created = await hostApi.createProperty({
          name: propData.name || 'My Property',
          type: (propertyType || 'HOTEL').toUpperCase() as any,
          total_rooms: Math.max(1, propData.totalRooms || 1),
          description: propData.description || '',
          // Backend requires phone + email on create — without them the request
          // 422s and the property silently stays device-only.
          phone_number: propData.phone || undefined,
          email: propData.email || undefined,
          amenities,
        }, () => ({ id: crypto.randomUUID() } as any)).catch(() => null);
        if (created?.id) {
          setPropertyId(created.id);
        }
        Alert.alert('Saved!', 'Your property draft has been saved.');
      } else {
        Alert.alert('Draft Saved', 'Local draft saved. Fill in more details and save again to persist to cloud.');
      }
    } catch (e) {
      console.warn('Failed to save draft:', e);
      Alert.alert('Saved Locally', 'Could not reach the server. Your data is saved locally.');
    }
    setSaving(null);
  };

  // ─── Profile Strength ─────────────────────────────
  const profileStrength = Math.min(100, Math.round(
    ((propData.name ? 15 : 0) +
    (propData.description ? 15 : 0) +
    (photos.length > 0 ? 20 : 0) +
    (location.street ? 15 : 0) +
    (amenities.length > 0 ? 10 : 0) +
    (floors.length > 0 || propData.totalRooms > 0 ? 15 : 0) +
    (offers.filter(o => o.enabled).length > 0 ? 10 : 0))
  ));

  const fullAddress = [location.street, location.city, location.state, location.country, location.zip].filter(Boolean).join(', ');

  // State options based on selected country
  const stateOptions = getStatesForCountry(location.country);

  const filteredAmenities = AMENITY_OPTIONS.filter(a =>
    a.name.toLowerCase().includes(amenitySearch.toLowerCase())
  );

  // ─── Step content context ─────────────────────────
  const ctx: WizardCtx = {
    currentStep, setCurrentStep,
    loading, saving,
    propertyType, setPropertyType,
    propData, setPropData,
    location, setLocation,
    countrySearch, setCountrySearch,
    showCountryDropdown, setShowCountryDropdown,
    stateSearch, setStateSearch,
    showStateDropdown, setShowStateDropdown,
    stateOptions,
    showMapPicker, setShowMapPicker,
    handleLocationSelect, fullAddress,
    photos, setPhotos, coverPhotoIndex, setCoverPhotoIndex,
    logo, setLogo, showLogoPicker, setShowLogoPicker,
    starRating, setStarRating,
    amenities, setAmenities,
    customAmenity, setCustomAmenity,
    amenitySearch, setAmenitySearch,
    setShowPhotoPicker, filteredAmenities,
    floors, setFloors,
    offers, toggleOffer,
    checkInTime, setCheckInTime,
    checkOutTime, setCheckOutTime,
    showCustomOffer, setShowCustomOffer,
    customOfferData, setCustomOfferData,
    addCustomOffer,
    handleGoToStep, handlePublish, handleSaveDraft,
    stepNum, stepTotal, profileStrength,
    toggleAmenity,
    fieldErrors, setFieldErrors, clearFieldError,
  };

  // ─── Navigation ──────────────────────────────────
  const renderNavigation = () => {
    if (currentStep === 'type' || currentStep === 'review') return null;
    const prev = getPrevStep();
    const next = getNextStep();
    const nextLabel = currentStep === 'rooms' ? 'Continue to Pricing & Offers' : 'Next Step';
    const showSaveDraft = currentStep === 'photos' || currentStep === 'pricing';
    const isSaving = saving === 'saving';
    return (
      <View style={styles.navContainer}>
        <View style={styles.navRow}>
          {prev ? (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.btnBack, isSaving && { opacity: 0.5 }]}
              disabled={isSaving}
            >
              <IconSymbol name="chevron.left" size={16} color={SRS.navy} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: SRS.navy, marginLeft: 4 }}>Previous Step</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {showSaveDraft && (
              <TouchableOpacity
                onPress={handleSaveDraft}
                style={[styles.btnSaveDraftInline, isSaving && { opacity: 0.5 }]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={ACCENT} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>Save as Draft</Text>
                )}
              </TouchableOpacity>
            )}
            {next && (
              <TouchableOpacity
                onPress={handleNext}
                style={[styles.btnNext, isSaving && { opacity: 0.6 }]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={BG.white} />
                ) : (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: BG.white, marginRight: 4 }}>{nextLabel}</Text>
                    <IconSymbol name="chevron.right" size={16} color={BG.white} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };
  return (
    <KeyboardAvoidingView
      style={styles.portalPage}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => { try { router.canGoBack() ? safeGoBack() : router.replace('/(host)'); } catch { router.replace('/(host)'); } }} style={styles.headerBackBtn}>
            <IconSymbol name="close" size={18} color={SRS.navy} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconSymbol name="hotel" size={22} color={SRS.navy} />
            <Text style={styles.headerBrand}>
              Serve<Text style={{ color: ACCENT }}>IQ</Text>
            </Text>
          </View>
        </View>
        {currentStep !== 'type' && (
          <Text style={styles.headerStepText}>Step {stepNum} of {stepTotal}</Text>
        )}
      </View>

      {/* Progress bar (after type step) */}
      {currentStep !== 'type' && currentStep !== 'review' && (
        <View style={styles.progressWrapper}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{stepTitles[currentStep]}</Text>
            <Text style={styles.progressPercent}>{progressPercent}% Complete</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressSteps}>
            {(['Property', 'Location', 'Photos', 'Rooms', 'Pricing', 'Review'] as const).map((label, idx) => {
              const stepNumVal = idx + 1;
              const isCompleted = stepNum > stepNumVal;
              const isCurrent = stepNum === stepNumVal;
              const isUpcoming = stepNum < stepNumVal;
              return (
                <View key={label} style={[styles.progressStep, { flex: 1 }]}>
                  <View style={[
                    styles.progressStepCircle,
                    isCompleted && styles.progressStepCompleted,
                    isCurrent && styles.progressStepCurrent,
                    isUpcoming && styles.progressStepUpcoming,
                  ]}>
                    <Text style={[
                      styles.progressStepNum,
                      (isCompleted || isCurrent) && { color: BG.white },
                    ]}>
                      {isCompleted ? '✓' : stepNumVal}
                    </Text>
                  </View>
                  <Text style={[
                    styles.progressStepLabel,
                    { fontSize: 9 },
                    isCurrent && { color: SRS.navy, fontWeight: '600' },
                    isUpcoming && { color: GRAY[400] },
                  ]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Main content */}
      <ScrollView
        style={styles.portalMain}
        contentContainerStyle={[
          styles.portalMainContent,
          currentStep === 'review' && { gap: 20 },
          currentStep !== 'type' && currentStep !== 'review' && { paddingBottom: 140 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <FadeInView key={currentStep} portal="host" delay={40} duration={280}>
          <ListingWizardSteps ctx={ctx} />
        </FadeInView>
      </ScrollView>

      {/* Bottom navigation */}
      {renderNavigation()}

      {/* Review buttons */}
      {currentStep === 'review' && (
        <View style={styles.navContainer}>
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => handleGoToStep(STEP_ORDER.length - 2)}
              style={[styles.btnBack, saving === 'saving' && { opacity: 0.5 }]}
              disabled={saving === 'saving'}
            >
              <IconSymbol name="chevron.left" size={16} color={SRS.navy} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: SRS.navy, marginLeft: 4 }}>Back to Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveDraft}
              style={[styles.btnSaveDraftInline, saving === 'saving' && { opacity: 0.5 }]}
              disabled={saving === 'saving'}
            >
              {saving === 'saving' ? (
                <ActivityIndicator size="small" color={ACCENT} />
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>Save as Draft</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ImagePickerOverlay
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        multiple
        selectionLimit={Math.max(1, 50 - photos.length)}
        onImagesPicked={(uris) => {
          setPhotos(prev => {
            const next = [...prev, ...uris];
            if (prev.length === 0) setCoverPhotoIndex(0);
            return next;
          });
        }}
      />

      <ImagePickerOverlay
        visible={showLogoPicker}
        onClose={() => setShowLogoPicker(false)}
        onImagePicked={(uri) => {
          setLogo(uri);
        }}
      />
    </KeyboardAvoidingView>
  );
}

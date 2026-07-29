import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image, StyleSheet, Modal, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, GRAY, getAccentColor } from '@/constants/portal-theme';
import { API_BASE_URL } from '@/constants/api-config';
import { RoomSetup } from '@/components/host/RoomSetup';
import { ImagePickerOverlay } from '@/components/host/ImagePickerOverlay';
import { useHost } from '@/lib/context/host-context';
import { hostApi } from '@/lib/api/host-api';
import { safeGoBack } from "@/lib/utils";
import { FadeInView, AnimatedPressable } from '@/components/ui/motion';

// ─── Types ─────────────────────────────────────────
type WizardStep = 'type' | 'property' | 'location' | 'photos' | 'rooms' | 'pricing' | 'review';

type PropertyType = { id: string; label: string; icon: string };

interface PropertyData {
  type: string; name: string; totalRooms: number; floors: number;
  yearBuilt: number; description: string; phone: string; email: string;
}

interface LocationData {
  country: string; state: string; city: string; zip: string; street: string; mapLink: string;
}

interface Offer {
  id: string; label: string; badge: string;
  badgeColor: string; badgeText: string; desc: string;
  enabled: boolean; startDate?: string; endDate?: string;
}

// ─── Constants ─────────────────────────────────────
const PROPERTY_TYPES: PropertyType[] = [
  { id: 'hotel', label: 'Hotel', icon: 'hotel' },
  { id: 'resort', label: 'Resort', icon: 'spa' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { id: 'hostel', label: 'Hostel', icon: 'business' },
  { id: 'apartment', label: 'Apartment', icon: 'house.fill' },
  { id: 'custom', label: 'Add Type', icon: 'add' },
];

const COUNTRIES = ['Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Cambodia','Canada','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','Estonia','Ethiopia','Fiji','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lithuania','Luxembourg','Madagascar','Malaysia','Maldives','Malta','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','North Macedonia','Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tanzania','Thailand','Tunisia','Turkey','UAE','Uganda','Ukraine','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

const AMENITY_OPTIONS = [
  { id: 'wifi', name: 'High-speed WiFi', icon: '📶' },
  { id: 'ac', name: 'Air Conditioning', icon: '❄️' },
  { id: 'washer', name: 'In-unit Washer/Dryer', icon: '👕' },
  { id: 'pool', name: 'Private Pool', icon: '🏊' },
  { id: 'gym', name: 'Gym / Fitness Center', icon: '💪' },
  { id: 'parking', name: 'Free Parking', icon: '🅿️' },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
  { id: 'tv', name: 'Smart TV', icon: '📺' },
  { id: 'balcony', name: 'Balcony', icon: '🌅' },
  { id: 'breakfast', name: 'Breakfast Included', icon: '🥐' },
];

const DEFAULT_OFFERS: Offer[] = [
  { id: 'early', label: 'Early Bird Discount', badge: '10% OFF', badgeColor: '#dcfce7', badgeText: '#16a34a', desc: '10% off for bookings made 30+ days in advance', enabled: false },
  { id: 'last', label: 'Last-Minute Deal', badge: '15% OFF', badgeColor: '#fee2e2', badgeText: '#dc2626', desc: '15% off for bookings made within 48 hours', enabled: false },
  { id: 'long', label: 'Long Stay Discount', badge: '20% OFF', badgeColor: '#dbeafe', badgeText: '#2563eb', desc: '20% off for stays of 7 nights or more', enabled: false },
  { id: 'free', label: 'Free Cancellation', badge: 'Free', badgeColor: '#f3e8ff', badgeText: '#9333ea', desc: 'Full refund if cancelled 48+ hours before', enabled: false },
];

const STEP_ORDER: WizardStep[] = ['type', 'property', 'location', 'photos', 'rooms', 'pricing', 'review'];
const ACCENT = SRS.teal;

// ─── Sub-components ──────────────────────────────────

function CounterInput({ value, onChange, min = 0, max = 99, small = false }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; small?: boolean;
}) {
  return (
    <View style={[cs.counter, small && cs.counterSmall]}>
      <TouchableOpacity onPress={() => onChange(Math.max(min, value - 1))} style={cs.counterBtn}>
        <Text style={[cs.counterBtnText, small && cs.counterBtnTextSmall]}>−</Text>
      </TouchableOpacity>
      <Text style={[cs.counterValue, small && cs.counterValueSmall]}>{value}</Text>
      <TouchableOpacity onPress={() => onChange(Math.min(max, value + 1))} style={cs.counterBtn}>
        <Text style={[cs.counterBtnText, small && cs.counterBtnTextSmall]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function ToggleSwitch({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} style={[cs.toggle, active && cs.toggleActive]} activeOpacity={0.8}>
      <View style={[cs.toggleKnob, active && cs.toggleKnobActive]} />
    </TouchableOpacity>
  );
}

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <TouchableOpacity key={s} onPress={() => onChange(rating === s ? 0 : s)}>
          <IconSymbol name="star" size={28} color={s <= rating ? '#F39C12' : GRAY[300]} />
        </TouchableOpacity>
      ))}
      <Text style={{ fontSize: 13, color: GRAY[500], marginLeft: 8 }}>
        {rating > 0 ? `${rating} Star${rating > 1 ? 's' : ''}` : 'Select rating'}
      </Text>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────

export default function ListingWizard() {
  const { addProperty, addRoom } = useHost();

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
  });
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Step 4: Photos & Amenities
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [starRating, setStarRating] = useState(0);
  const [customAmenity, setCustomAmenity] = useState('');
  const [amenitySearch, setAmenitySearch] = useState('');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // Step 5: Rooms (floors state from RoomSetup)
  const [floors, setFloors] = useState<any[]>([]);

  // Step 6: Pricing & Offers
  const [offers, setOffers] = useState<Offer[]>(DEFAULT_OFFERS);
  const [checkInTime, setCheckInTime] = useState('15:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [showCustomOffer, setShowCustomOffer] = useState(false);
  const [customOfferData, setCustomOfferData] = useState({ title: '', description: '', badge: 'Custom' });

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
      badgeColor: '#f3e8ff',
      badgeText: '#9333ea',
      desc: customOfferData.description || 'Custom offer',
      enabled: true,
    }]);
    setCustomOfferData({ title: '', description: '', badge: 'Custom' });
    setShowCustomOffer(false);
  };

  const handleNext = useCallback(async () => {
    const next = getNextStep();
    if (!next) return;

    // Auto-save current step data before progressing
    if (!propertyId && currentStep !== 'type' && currentStep !== 'property' && currentStep !== 'rooms') {
      // Certain steps need a property ID — we'll save inline below
    }

    if (currentStep === 'property') {
      setSaving('saving');
      try {
        const payload = {
          name: propData.name || 'My Property',
          type: (propertyType || 'HOTEL').toUpperCase(),
          total_rooms: propData.totalRooms || 0,
          number_of_floors: propData.floors || 1,
          year_built: propData.yearBuilt || 0,
          description: propData.description || '',
          phone_number: propData.phone || undefined,
          email: propData.email || undefined,
        };
        if (propertyId) {
          await hostApi.updateProperty(propertyId, payload as any, () => ({} as any));
        } else {
          const created = await hostApi.createGeneralInfo(payload, () => ({
            id: `prop-${Date.now()}`, ...payload,
          } as any));
          if (created?.id) setPropertyId(created.id);
        }
      } catch (e) {
        console.warn('Failed to save property details:', e);
      }
      setSaving(null);
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
        }, () => ({} as any));
      } catch (e) {
        console.warn('Failed to save location:', e);
      }
      setSaving(null);
    }

    if (currentStep === 'photos' && propertyId) {
      setSaving('saving');
      try {
        await hostApi.createPhotosAndAmenities(propertyId, {
          amenities: {
            custom_amenities: amenities.map(a => ({ name: a })),
          },
        }, () => ({} as any));
      } catch (e) {
        console.warn('Failed to save photos/amenities:', e);
      }
      setSaving(null);
    }

    if (currentStep === 'rooms' && propertyId) {
      setSaving('saving');
      try {
        const allRooms = floors.flatMap(f => (f.rooms || []));
        if (allRooms.length === 0) return;
        // Try bulk create rooms — creates a default room type first if needed
        const defaultRoomType = await hostApi.createRoomType(propertyId, {
          room_type_name: (allRooms[0].roomType || allRooms[0].type || 'Standard') + ' Room',
        }, () => ({ id: `rt-${Date.now()}`, room_type_name: 'Standard' } as any)).catch(() => ({ id: `rt-${Date.now()}` } as any));
        const defaultBedType = await hostApi.createBedType(propertyId, {
          bed_name: 'Standard Bed',
        }, () => ({ id: `bt-${Date.now()}`, bed_name: 'Standard' } as any)).catch(() => ({ id: `bt-${Date.now()}` } as any));
        const rtId = defaultRoomType?.id || `rt-${Date.now()}`;
        const btId = defaultBedType?.id || `bt-${Date.now()}`;
        // Try bulk create, fall back to individual if batch fails
        const roomsPayload = allRooms.map(room => ({
          floor_number: parseInt(room.floor || room.roomNumber) || 1,
          room_name: room.name || room.roomNumber || `Room ${allRooms.indexOf(room) + 1}`,
          room_type_id: rtId,
          bed_type_id: btId,
          base_rate: Math.max(1, parseFloat(room.price || room.minRate || '1') || 1),
          max_adults: room.maxAdults || 2,
          max_children: room.maxChildren || 0,
          smoking: room.petsAllowed || false,
          accessible: room.accessible || false,
        }));
        try {
          await hostApi.bulkCreateRooms(propertyId, { rooms: roomsPayload }, () => ({} as any));
        } catch {
          for (const roomData of roomsPayload) {
            await hostApi.createRoom(propertyId, roomData, () => ({ id: `room-${Date.now()}` } as any)).catch(() => {});
          }
        }
        // Add rooms to context state so they appear immediately (survives demo mode)
        for (const rd of roomsPayload) {
          addRoom({
            id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            property_id: propertyId,
            room_type_id: rd.room_type_id,
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
            photos: [],
            blocked_dates: [],
            maintenance_return_date: null,
            cancellation_policy: 'MODERATE',
            cancellation_notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Failed to save rooms:', e);
      }
      setSaving(null);
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
  }, [currentStep, propertyId, propData, propertyType, location, amenities, photos, starRating, checkInTime, checkOutTime, floors, offers]);

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
      const totalRooms = floors.reduce((s: number, f: any) => s + (f.rooms?.length || 0), 0);

      // If we already have a backend property ID, update it and activate
      if (propertyId) {
        await Promise.all([
          hostApi.createBrandVisual(propertyId, {
            brand_color: ACCENT,
          }, () => ({} as any)).catch(() => {}),
          hostApi.createLocalization(propertyId, {
            currency: 'NPR',
            timezone: 'Asia/Kathmandu',
            language: 'English',
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
          }, () => ({} as any)).catch(() => {}),
          hostApi.updateProperty(propertyId, {
            is_active: true,
            check_in_time_from: checkInTime,
            check_out_time_to: checkOutTime,
            cancellation_policy: 'FLEXIBLE',
          }, () => ({ is_active: true } as any)).catch(() => {}),
        ]);
      }

      // Always call addProperty (handles context sync, guest portal registration, fallback)
      addProperty({
        id: propertyId || `prop-${Date.now()}`,
        tenant_id: 'demo-host-1',
        name: propData.name || 'My Property',
        type: propertyType.toUpperCase() as any,
        description: propData.description,
        country: location.country,
        state: location.state || location.city,
        city: location.city,
        zip_code: location.zip || '00000',
        address: location.street || `${location.city || ''}, ${location.country || ''}`,
        latitude: 0,
        longitude: 0,
        check_in_time_from: checkInTime,
        check_in_time_to: '12:00',
        check_out_time_from: '00:00',
        check_out_time_to: checkOutTime,
        number_of_floors: floors.length || 1,
        total_rooms: totalRooms || propData.totalRooms,
        year_built: propData.yearBuilt || 2020,
        amenities: amenities,
        is_active: true,
        currency: 'NPR',
        timezone: 'Asia/Kathmandu',
        brand_color: ACCENT,
        min_rate_floor: 0,
        logo_url: null,
        custom_domain: null,
        cancellation_policy: 'FLEXIBLE',
        photos: photos.map((uri, i) => ({
          id: `ph-${Date.now()}-${i}`,
          photo_url: uri,
          category: 'exterior',
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      Alert.alert('Published!', 'Your property is now live and accepting bookings.', [
        { text: 'Go to Dashboard', onPress: () => { try { router.replace('/(host)'); } catch { router.push('/(host)'); } } },
      ]);
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
          amenities: amenities,
          check_in_time_from: checkInTime,
          check_out_time_to: checkOutTime,
          country: location.country,
          city: location.city,
          address: location.street || '',
        }, () => ({} as any)).catch(() => {});
        Alert.alert('Saved!', 'Your property draft has been saved to the cloud.');
      } else if (propData.name) {
        // No backend ID yet — create the property first
        const created = await hostApi.createProperty({
          name: propData.name || 'My Property',
          type: (propertyType || 'HOTEL').toUpperCase() as any,
          total_rooms: propData.totalRooms || 0,
          description: propData.description || '',
          amenities,
        }, () => ({ id: `prop-${Date.now()}` } as any)).catch(() => null);
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

  const filteredAmenities = AMENITY_OPTIONS.filter(a =>
    a.name.toLowerCase().includes(amenitySearch.toLowerCase())
  );

  // ─── Render Step Content ─────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      // ──────────── STEP: TYPE ────────────
      case 'type':
        return (
          <View style={styles.typeContainer}>
            <View style={styles.typeCard}>
              <Text style={styles.typeTitle}>Select Your Property Type</Text>
              <Text style={styles.typeSubtitle}>
                Choose the category that best describes your property
              </Text>
              <View style={styles.typeGrid}>
                {PROPERTY_TYPES.map(pt => {
                  const selected = propertyType === pt.id;
                  const isCustom = pt.id === 'custom';
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      onPress={() => {
                        setPropertyType(pt.id);
                        if (pt.id !== 'custom') {
                          setTimeout(() => setCurrentStep('property'), 200);
                        }
                      }}
                      style={[
                        styles.typeCardItem,
                        selected && styles.typeCardSelected,
                        isCustom && styles.typeCardCustom,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.typeIconWrap, selected && styles.typeIconSelected]}>
                        <IconSymbol name={pt.icon as any} size={28} color={selected ? '#FFF' : GRAY[500]} />
                      </View>
                      <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );

      // ──────────── STEP: PROPERTY ────────────
      case 'property':
        return (
          <View style={styles.stepContentWrapper}>
            <View style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <Text style={styles.stepCardTitle}>General Information</Text>
                <Text style={styles.stepCardSubtitle}>Provide the foundational details of your property</Text>
              </View>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.formLabel}>Property Name</Text>
                  <TextInput
                    value={propData.name}
                    onChangeText={t => setPropData(p => ({ ...p, name: t }))}
                    placeholder="e.g. Skyline Towers, Sunset Villas"
                    placeholderTextColor={GRAY[400]}
                    style={styles.formInput}
                  />
                  <Text style={styles.formHint}>This will be the display name for your dashboard</Text>
                </View>
                <View style={styles.formRow3}>
                  <View>
                    <Text style={styles.formLabel}>Total Rooms</Text>
                    <TextInput
                      value={String(propData.totalRooms || '')}
                      onChangeText={t => setPropData(p => ({ ...p, totalRooms: parseInt(t) || 0 }))}
                      placeholder="eg.100"
                      placeholderTextColor={GRAY[400]}
                      keyboardType="number-pad"
                      style={styles.formInput}
                    />
                  </View>
                  <View>
                    <Text style={styles.formLabel}>No of Floors</Text>
                    <CounterInput value={propData.floors} onChange={v => setPropData(p => ({ ...p, floors: v }))} min={1} max={50} />
                  </View>
                  <View>
                    <Text style={styles.formLabel}>Year Built</Text>
                    <TextInput
                      value={String(propData.yearBuilt || '')}
                      onChangeText={t => setPropData(p => ({ ...p, yearBuilt: parseInt(t) || 0 }))}
                      placeholder="eg.2018"
                      placeholderTextColor={GRAY[400]}
                      keyboardType="number-pad"
                      style={styles.formInput}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.formLabel}>Property Description</Text>
                  <Text style={styles.formHintInline}>Highlight the best features and neighborhood vibes</Text>
                  <TextInput
                    value={propData.description}
                    onChangeText={t => setPropData(p => ({ ...p, description: t.slice(0, 2500) }))}
                    placeholder="Enter a detailed description of the property..."
                    placeholderTextColor={GRAY[400]}
                    multiline
                    numberOfLines={4}
                    style={[styles.formInput, { minHeight: 100, textAlignVertical: 'top' }]}
                  />
                  <Text style={styles.charCount}>{propData.description.length} / 2500 characters</Text>
                </View>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <IconSymbol name="phone" size={16} color={ACCENT} />
                <Text style={styles.stepCardTitle}>Contact Information</Text>
              </View>
              <View style={styles.formRow2}>
                <View>
                  <Text style={styles.formLabel}>Phone Number</Text>
                  <View style={styles.inputWithIcon}>
                    <IconSymbol name="phone" size={14} color={GRAY[400]} />
                    <TextInput
                      value={propData.phone}
                      onChangeText={t => setPropData(p => ({ ...p, phone: t }))}
                      placeholder="+1 (555) 000-0000"
                      placeholderTextColor={GRAY[400]}
                      keyboardType="phone-pad"
                      style={[styles.formInput, { borderWidth: 0, paddingLeft: 8 }]}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.formLabel}>Official Email</Text>
                  <View style={styles.inputWithIcon}>
                    <IconSymbol name="email" size={14} color={GRAY[400]} />
                    <TextInput
                      value={propData.email}
                      onChangeText={t => setPropData(p => ({ ...p, email: t }))}
                      placeholder="contact@property.com"
                      placeholderTextColor={GRAY[400]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.formInput, { borderWidth: 0, paddingLeft: 8 }]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      // ──────────── STEP: LOCATION ────────────
      case 'location':
        return (
          <View style={styles.stepContentWrapper}>
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Physical Address</Text>
              <View style={styles.formRow2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TouchableOpacity
                    onPress={() => setShowCountryDropdown(!showCountryDropdown)}
                    style={[styles.formInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  >
                    <Text style={{ fontSize: 14, color: location.country ? SRS.navy : GRAY[400] }}>
                      {location.country || 'Select country'}
                    </Text>
                    <Text style={{ fontSize: 12, color: GRAY[400] }}>{showCountryDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {showCountryDropdown && (<>
                    <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -2000, zIndex: 99 }} activeOpacity={1} onPress={() => { setShowCountryDropdown(false); setCountrySearch(''); }} />
                    <View style={styles.countryDropdown}>
                      <TextInput
                        value={countrySearch}
                        onChangeText={setCountrySearch}
                        placeholder="Search countries..."
                        placeholderTextColor={GRAY[400]}
                        style={styles.countrySearchInput}
                        autoFocus
                      />
                      <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                        {COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                          <TouchableOpacity
                            key={c}
                            onPress={() => {
                              setLocation(p => ({ ...p, country: c }));
                              setShowCountryDropdown(false);
                              setCountrySearch('');
                            }}
                            style={[styles.countryDropdownItem, location.country === c && styles.countryDropdownItemActive]}
                          >
                            <Text style={[styles.countryDropdownText, location.country === c && styles.countryDropdownTextActive]}>
                              {c}
                            </Text>
                            {location.country === c && <Text style={{ color: ACCENT, fontSize: 14 }}>✓</Text>}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    </>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>State/Province</Text>
                  <TextInput
                    value={location.state}
                    onChangeText={t => setLocation(p => ({ ...p, state: t }))}
                    placeholder="State"
                    placeholderTextColor={GRAY[400]}
                    style={styles.formInput}
                  />
                </View>
              </View>
              <View style={styles.formRow2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    value={location.city}
                    onChangeText={t => setLocation(p => ({ ...p, city: t }))}
                    placeholder="City"
                    placeholderTextColor={GRAY[400]}
                    style={styles.formInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>ZIP/Postal Code</Text>
                  <TextInput
                    value={location.zip}
                    onChangeText={t => setLocation(p => ({ ...p, zip: t }))}
                    placeholder="Zip Code"
                    placeholderTextColor={GRAY[400]}
                    keyboardType="number-pad"
                    style={styles.formInput}
                  />
                </View>
              </View>
              <View>
                <Text style={styles.formLabel}>Street Address</Text>
                <TextInput
                  value={location.street}
                  onChangeText={t => setLocation(p => ({ ...p, street: t }))}
                  placeholder="e.g. 123 Property Lane"
                  placeholderTextColor={GRAY[400]}
                  style={styles.formInput}
                />
              </View>
              <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: GRAY[200] }}>
                <Text style={{ ...styles.formLabel, marginBottom: 8, color: SRS.navy }}>Embed a map</Text>
                <TextInput
                  value={location.mapLink}
                  onChangeText={t => setLocation(p => ({ ...p, mapLink: t }))}
                  placeholder="Paste your Google Maps share link..."
                  placeholderTextColor={GRAY[400]}
                  style={styles.formInput}
                  autoCapitalize="none"
                />
                <Text style={styles.formHint}>Go to Google Maps → Share → Copy Link</Text>
              </View>
            </View>

            {/* Map Preview */}
            <View style={styles.mapPanel}>
              <View style={styles.mapPanelHeader}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: SRS.navy }}>Map View</Text>
              </View>
              <View style={styles.mapPanelContent}>
                {fullAddress || location.mapLink ? (
                  <View style={styles.mapPlaceholder}>
                    <Text style={{ fontSize: 40, marginBottom: 8 }}>📍</Text>
                    <Text style={{ fontSize: 12, color: GRAY[500], textAlign: 'center' }}>{fullAddress || 'Map link provided'}</Text>
                    <View style={styles.mapMarker}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>Property Location</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Text style={{ fontSize: 40 }}>📍</Text>
                    <Text style={{ fontSize: 13, color: GRAY[500] }}>Enter an address above</Text>
                    <View style={styles.mapMarker}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>Property Location</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        );

      // ──────────── STEP: PHOTOS & AMENITIES ────────────
      case 'photos':
        return (
          <View style={{ gap: 20 }}>
            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.stepCardTitle}>Property Photos</Text>
                <Text style={{ fontSize: 13, color: GRAY[500] }}>{photos.length} / 50 Uploaded</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPhotoPicker(true)}
                style={styles.photoUploadZone}
                activeOpacity={0.7}
              >
                <IconSymbol name="upload" size={32} color={GRAY[400]} />
                <Text style={{ fontSize: 14, color: SRS.navy, marginTop: 8 }}>Tap to upload photos</Text>
                <Text style={{ fontSize: 13, color: ACCENT, marginTop: 4 }}>or browse files from your device</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <View style={styles.hintDot} />
                  <Text style={styles.uploadHint}>High resolution</Text>
                  <View style={styles.hintDot} />
                  <Text style={styles.uploadHint}>JPG, PNG, WEBP</Text>
                  <View style={styles.hintDot} />
                  <Text style={styles.uploadHint}>Up to 20MB</Text>
                </View>
              </TouchableOpacity>
              {photos.length > 0 && (
                <View style={styles.photoPreviewGrid}>
                  {photos.slice(0, 4).map((uri, i) => (
                    <View key={i} style={styles.photoPreviewItem}>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <TouchableOpacity
                        onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        style={styles.photoRemoveBtn}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {photos.length > 4 && (
                    <View style={styles.photoPreviewMore}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: GRAY[600] }}>+{photos.length - 4}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowPhotoPicker(true)}
                    style={styles.photoPreviewAdd}
                  >
                    <IconSymbol name="add" size={20} color={GRAY[400]} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IconSymbol name="star" size={18} color={ACCENT} />
                <Text style={styles.stepCardTitle}>Official Star Rating</Text>
              </View>
              <Text style={styles.formHint}>Select the certified commercial rating of this property</Text>
              <StarRating rating={starRating} onChange={setStarRating} />
            </View>

            {/* Amenities */}
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Amenities</Text>
              <View style={styles.amenitySearchWrap}>
                <IconSymbol name="search" size={14} color={GRAY[400]} />
                <TextInput
                  value={amenitySearch}
                  onChangeText={setAmenitySearch}
                  placeholder="Search amenities..."
                  placeholderTextColor={GRAY[400]}
                  style={{ flex: 1, fontSize: 13, color: SRS.navy, padding: 0 }}
                />
              </View>
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                {filteredAmenities.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => toggleAmenity(a.name)}
                    style={styles.amenityItem}
                  >
                    <View style={[styles.amenityCheckbox, amenities.includes(a.name) && styles.amenityCheckboxActive]}>
                      {amenities.includes(a.name) && <IconSymbol name="check" size={12} color="#FFF" />}
                    </View>
                    <Text style={{ fontSize: 14 }}>{a.icon}</Text>
                    <Text style={{ flex: 1, fontSize: 13, color: SRS.navy }}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.customAmenitySection}>
                <Text style={styles.customAmenityTitle}>Add a custom amenity</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={customAmenity}
                    onChangeText={setCustomAmenity}
                    placeholder="e.g. Private Helipad, Wine Cellar..."
                    placeholderTextColor={GRAY[400]}
                    onSubmitEditing={() => {
                      const t = customAmenity.trim();
                      if (t && !amenities.includes(t)) {
                        setAmenities(p => [...p, t]);
                        setCustomAmenity('');
                      }
                    }}
                    style={[styles.formInput, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const t = customAmenity.trim();
                      if (t && !amenities.includes(t)) {
                        setAmenities(p => [...p, t]);
                        setCustomAmenity('');
                      }
                    }}
                    style={styles.addAmenityBtn}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.customAmenityHint}>
                  Press Enter or tap Add to include an amenity not in the list above.
                </Text>
              </View>
            </View>
          </View>
        );

      // ──────────── STEP: ROOMS ────────────
      case 'rooms':
        return (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ ...TYPOGRAPHY.h2, color: SRS.navy }}>Room Setup</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500] }}>
                Add each room type guests will be able to book at your property
              </Text>
            </View>
            <RoomSetup rooms={floors} onRoomsChange={setFloors} />
          </View>
        );

      // ──────────── STEP: PRICING & OFFERS ────────────
      case 'pricing':
        return (
          <View style={{ gap: 20, maxWidth: 500, alignSelf: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: GRAY[500], marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Step {stepNum} of {stepTotal}
              </Text>
              <Text style={{ ...TYPOGRAPHY.h2, color: SRS.navy }}>Pricing & Offers</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500] }}>
                Set your nightly rate and any special offers for guests
              </Text>
            </View>

            {/* Offers */}
            <View style={styles.stepCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <IconSymbol name="discount" size={18} color={ACCENT} />
                <Text style={styles.stepCardTitle}>Special Offers</Text>
              </View>
              <Text style={{ ...styles.formHint, marginBottom: 16 }}>
                Enable pre-set promotions or create custom offers
              </Text>

              {offers.map(offer => (
                <View key={offer.id} style={[styles.offerItem, offer.enabled && styles.offerItemEnabled]}>
                  <View style={styles.offerContent}>
                    <ToggleSwitch active={offer.enabled} onToggle={() => toggleOffer(offer.id)} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: SRS.navy }}>{offer.label}</Text>
                        <View style={[styles.offerBadge, { backgroundColor: offer.badgeColor }]}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: offer.badgeText }}>{offer.badge}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: GRAY[500] }}>{offer.desc}</Text>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setShowCustomOffer(true)}
                style={styles.addCustomOfferBtn}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>+ Add Custom Offer</Text>
              </TouchableOpacity>
            </View>

            {/* Stay Policies */}
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Stay Policies</Text>
              <Text style={{ ...styles.formHint, marginBottom: 20 }}>
                Define check-in/out windows and preferences
              </Text>
              <View style={styles.formRow2}>
                <View>
                  <Text style={styles.formLabel}>Check-in Time</Text>
                  <TextInput
                    value={checkInTime}
                    onChangeText={setCheckInTime}
                    placeholder="15:00"
                    placeholderTextColor={GRAY[400]}
                    style={styles.formInput}
                  />
                </View>
                <View>
                  <Text style={styles.formLabel}>Check-out Time</Text>
                  <TextInput
                    value={checkOutTime}
                    onChangeText={setCheckOutTime}
                    placeholder="11:00"
                    placeholderTextColor={GRAY[400]}
                    style={styles.formInput}
                  />
                </View>
              </View>
            </View>

            {/* Custom Offer Modal */}
            {showCustomOffer && (
              <Modal transparent visible={showCustomOffer} animationType="fade" onRequestClose={() => setShowCustomOffer(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCustomOffer(false)}>
                  <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                    <View style={styles.modalHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 18 }}>➕</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: SRS.navy }}>Create Custom Offer</Text>
                      </View>
                      <TouchableOpacity onPress={() => setShowCustomOffer(false)}>
                        <IconSymbol name="close" size={18} color={GRAY[500]} />
                      </TouchableOpacity>
                    </View>
                    <View style={{ padding: 24, gap: 16 }}>
                      <View>
                        <Text style={styles.formLabel}>Offer Title *</Text>
                        <TextInput
                          value={customOfferData.title}
                          onChangeText={t => setCustomOfferData(p => ({ ...p, title: t }))}
                          placeholder="e.g. Diwali Festival Special, Summer Sale..."
                          placeholderTextColor={GRAY[400]}
                          style={styles.formInput}
                        />
                      </View>
                      <View>
                        <Text style={styles.formLabel}>Description (optional)</Text>
                        <TextInput
                          value={customOfferData.description}
                          onChangeText={t => setCustomOfferData(p => ({ ...p, description: t }))}
                          placeholder="Briefly describe the offer..."
                          placeholderTextColor={GRAY[400]}
                          multiline
                          numberOfLines={3}
                          style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                        />
                      </View>
                    </View>
                    <View style={styles.modalFooter}>
                      <TouchableOpacity onPress={() => setShowCustomOffer(false)} style={styles.btnCancel}>
                        <Text style={{ fontSize: 13, color: SRS.navy, fontWeight: '500' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={addCustomOffer} style={styles.btnSaveDates}>
                        <IconSymbol name="save" size={14} color="#FFF" />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>Save Offer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
          </View>
        );

      // ──────────── STEP: REVIEW ────────────
      case 'review':
        return (
          <View style={{ gap: 20 }}>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ ...TYPOGRAPHY.h2, color: SRS.navy }}>Final Review & Launch</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500], lineHeight: 21 }}>
                Please review all property details before making your listing live.
              </Text>
            </View>

            {/* Main review content */}
            <View style={{ flex: 1 }}>
              {/* Basic Info */}
              <ReviewCard
                title="Basic Information"
                icon="📋"
                onEdit={() => handleGoToStep(1)}
              >
                <View style={styles.reviewGrid2}>
                  <ReviewField label="PROPERTY NAME" value={propData.name || 'Not set'} />
                  <ReviewField label="PROPERTY TYPE" value={PROPERTY_TYPES.find(t => t.id === propertyType)?.label || 'Not set'} />
                </View>
                {propData.description && (
                  <ReviewField label="DESCRIPTION" value={propData.description} style={{ marginTop: 12 }} />
                )}
                {starRating > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={reviewCs.fieldLabel}>STAR RATING</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <IconSymbol key={s} name="star" size={16} color={s <= starRating ? '#F39C12' : GRAY[300]} />
                      ))}
                      <Text style={{ fontSize: 13, fontWeight: '500', color: SRS.navy, marginLeft: 4 }}>
                        {starRating} Star{starRating > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                )}
              </ReviewCard>

              {/* Location */}
              <ReviewCard
                title="Location Details"
                icon="📍"
                onEdit={() => handleGoToStep(2)}
              >
                <ReviewField label="ADDRESS" value={fullAddress || 'No address set'} />
                {location.mapLink && (
                  <ReviewField label="MAP LINK" value={location.mapLink} style={{ marginTop: 8 }} />
                )}
              </ReviewCard>

              {/* Media & Amenities */}
              <ReviewCard
                title="Media & Amenities"
                icon="📷"
                onEdit={() => handleGoToStep(3)}
              >
                <Text style={reviewCs.fieldLabel}>PHOTOS ({photos.length} UPLOADED)</Text>
                {photos.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    {photos.slice(0, 4).map((uri, i) => (
                      <View key={i} style={styles.reviewPhotoItem}>
                        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </View>
                    ))}
                    {photos.length > 4 && (
                      <View style={[styles.reviewPhotoItem, { backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: GRAY[600] }}>+{photos.length - 4}</Text>
                      </View>
                    )}
                  </View>
                )}
                {amenities.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={reviewCs.fieldLabel}>AMENITIES</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {amenities.slice(0, 8).map(a => (
                        <View key={a} style={styles.reviewAmenityTag}>
                          <Text style={{ fontSize: 11, color: ACCENT }}>{a}</Text>
                        </View>
                      ))}
                      {amenities.length > 8 && (
                        <Text style={{ fontSize: 11, color: GRAY[500], alignSelf: 'center' }}>
                          +{amenities.length - 8} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </ReviewCard>

              {/* Offers & Rooms */}
              <ReviewCard
                title="Offers & Rooms"
                icon="🏷️"
                onEdit={() => handleGoToStep(5)}
              >
                {(() => {
                  const enabled = offers.filter(o => o.enabled);
                  return enabled.length > 0 ? (
                    <View style={{ gap: 6 }}>
                      {enabled.map(o => (
                        <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 13, color: SRS.navy }}>{o.label}</Text>
                          <View style={[styles.offerBadge, { backgroundColor: o.badgeColor }]}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: o.badgeText }}>{o.badge}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : <Text style={{ fontSize: 13, color: GRAY[500] }}>No offers enabled</Text>;
                })()}
                {floors.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={reviewCs.fieldLabel}>ROOMS</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {floors.map(f => (f.rooms || []).map((r: any) => (
                        <View key={r.id} style={styles.reviewRoomTag}>
                          <Text style={{ fontSize: 11, color: SRS.navy }}>
                            {r.roomNumber || r.name} - {r.roomType || 'Standard'}
                          </Text>
                        </View>
                      )))}
                    </View>
                  </View>
                )}
              </ReviewCard>
            </View>

            {/* Sidebar summary */}
            <View style={styles.reviewSidebar}>
              <View style={styles.publishCard}>
                <IconSymbol name="check" size={20} color={SRS.green} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: SRS.navy, marginTop: 8 }}>Ready to Publish</Text>
                <Text style={{ fontSize: 13, color: GRAY[500], textAlign: 'center', lineHeight: 20, marginTop: 4 }}>
                  Your property listing is complete. Once launched, it will be visible on the public portal.
                </Text>
                <TouchableOpacity
                  onPress={handlePublish}
                  disabled={loading || saving === 'publishing'}
                  style={[styles.btnLaunch, (loading || saving === 'publishing') && { opacity: 0.6 }]}
                >
                  {loading || saving === 'publishing' ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <IconSymbol name="check" size={16} color="#FFF" />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>Launch Property</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveDraft}
                  style={[styles.btnSaveDraft, saving === 'saving' && { opacity: 0.5 }]}
                  disabled={saving === 'saving'}
                >
                  {saving === 'saving' ? (
                    <ActivityIndicator size="small" color={ACCENT} />
                  ) : (
                    <>
                      <IconSymbol name="save" size={16} color={ACCENT} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>Save as Draft</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Checklist */}
              <View style={styles.checklistCard}>
                <Text style={styles.checklistTitle}>ONBOARDING CHECKLIST</Text>
                {[
                  { label: 'Core Identity Verified', done: true },
                  { label: 'High-Res Media Loaded', done: photos.length > 0 },
                  { label: 'Address & Geo-tagging', done: !!location.street },
                  { label: 'Regulatory Compliance', done: true },
                ].map(item => (
                  <View key={item.label} style={styles.checklistItem}>
                    <IconSymbol name="check" size={16} color={item.done ? SRS.green : GRAY[300]} />
                    <Text style={{ fontSize: 13, color: item.done ? SRS.navy : GRAY[400], marginLeft: 8 }}>
                      {item.label}
                    </Text>
                  </View>
                ))}
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: GRAY[500] }}>Profile Strength</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: profileStrength >= 80 ? SRS.green : ACCENT }}>
                      {profileStrength}%
                    </Text>
                  </View>
                  <View style={styles.strengthBar}>
                    <View style={[styles.strengthFill, {
                      width: `${profileStrength}%`,
                      backgroundColor: profileStrength >= 80 ? SRS.green : ACCENT,
                    }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
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
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF', marginRight: 4 }}>{nextLabel}</Text>
                    <IconSymbol name="chevron.right" size={16} color="#FFF" />
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
    <View style={styles.portalPage}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => { try { router.canGoBack() ? safeGoBack() : router.replace('/(host)'); } catch { router.replace('/(host)'); } }} style={styles.headerBackBtn}>
            <IconSymbol name="close" size={18} color={SRS.navy} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconSymbol name="hotel" size={22} color={SRS.navy} />
            <Text style={styles.headerBrand}>
              Stay<Text style={{ color: ACCENT }}>Easy</Text>
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
            {['Property Details', 'Room Setup', 'Pricing & Offers'].map((label, idx) => {
              const stepNumVal = idx + 1;
              const isCompleted = stepNum > stepNumVal;
              const isCurrent = stepNum === stepNumVal;
              const isUpcoming = stepNum < stepNumVal;
              return (
                <View key={label} style={styles.progressStep}>
                  <View style={[
                    styles.progressStepCircle,
                    isCompleted && styles.progressStepCompleted,
                    isCurrent && styles.progressStepCurrent,
                    isUpcoming && styles.progressStepUpcoming,
                  ]}>
                    <Text style={[
                      styles.progressStepNum,
                      (isCompleted || isCurrent) && { color: '#FFF' },
                    ]}>
                      {isCompleted ? '✓' : stepNumVal}
                    </Text>
                  </View>
                  <Text style={[
                    styles.progressStepLabel,
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
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView key={currentStep} portal="host" delay={40} duration={280}>
          {renderStep()}
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
        onImagePicked={(uri) => setPhotos(prev => [...prev, uri])}
      />
    </View>
  );
}

// ─── Review Sub-components ──────────────────────────

function ReviewCard({ title, icon, onEdit, children }: {
  title: string; icon?: string; onEdit?: () => void; children: React.ReactNode;
}) {
  return (
    <View style={reviewCs.card}>
      <View style={reviewCs.cardHeader}>
        <Text style={reviewCs.cardTitle}>{icon && <Text>{icon} </Text>}{title}</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={reviewCs.editBtn}>
            <IconSymbol name="edit" size={12} color={ACCENT} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT, marginLeft: 4 }}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

function ReviewField({ label, value, style }: { label: string; value: string; style?: any }) {
  return (
    <View style={[{ marginBottom: 8 }, style]}>
      <Text style={reviewCs.fieldLabel}>{label}</Text>
      <Text style={reviewCs.fieldValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

// ─── Sub-component Styles ──────────────────────────
const reviewCs = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: SRS.navy,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    color: GRAY[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: SRS.navy,
  },
});

// ─── Counter Styles ────────────────────────────────
const cs = StyleSheet.create({
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    overflow: 'hidden',
  },
  counterSmall: { borderRadius: 6 },
  counterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: GRAY[100],
  },
  counterBtnText: { fontSize: 16, color: SRS.navy, fontWeight: '500' },
  counterBtnTextSmall: { fontSize: 14 },
  counterValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: SRS.navy,
    minWidth: 40,
  },
  counterValueSmall: { minWidth: 30 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: GRAY[300],
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: { backgroundColor: ACCENT },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleKnobActive: { alignSelf: 'flex-end' },
});

// ─── Main Styles ───────────────────────────────────
const styles = StyleSheet.create({
  portalPage: {
    flex: 1,
    backgroundColor: GRAY[50],
  },
  portalMain: {
    flex: 1,
  },
  portalMainContent: {
    padding: 24,
    paddingBottom: 120,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: GRAY[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GRAY[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: SRS.navy,
    fontFamily: 'PlayfairDisplay',
  },
  headerStepText: {
    fontSize: 13,
    color: GRAY[500],
    fontWeight: '500',
  },

  // Progress Bar
  progressWrapper: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[100],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: SRS.navy,
  },
  progressPercent: {
    fontSize: 12,
    color: GRAY[500],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: GRAY[200],
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  progressStepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepCompleted: {
    backgroundColor: SRS.green,
  },
  progressStepCurrent: {
    backgroundColor: ACCENT,
  },
  progressStepUpcoming: {
    backgroundColor: GRAY[200],
  },
  progressStepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: GRAY[600],
  },
  progressStepLabel: {
    fontSize: 10,
    color: GRAY[500],
    textAlign: 'center',
  },

  // Step Content
  stepContentWrapper: {
    gap: 20,
  },

  // Type Selector (centered card)
  typeContainer: {
    justifyContent: 'center',
    paddingVertical: 40,
  },
  typeCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  typeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: SRS.navy,
    marginBottom: 8,
  },
  typeSubtitle: {
    fontSize: 14,
    color: GRAY[500],
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 500,
  },
  typeCardItem: {
    width: 140,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: GRAY[200],
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  typeCardSelected: {
    borderColor: ACCENT,
    backgroundColor: getAccentColor(0.05),
  },
  typeCardCustom: {
    borderStyle: 'dashed',
    borderColor: GRAY[300],
  },
  typeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GRAY[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconSelected: {
    backgroundColor: ACCENT,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: SRS.navy,
  },
  typeLabelSelected: {
    color: ACCENT,
    fontWeight: '600',
  },

  // Step Cards
  stepCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 24,
  },
  stepCardHeader: {
    marginBottom: 16,
  },
  stepCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SRS.navy,
    marginBottom: 4,
  },
  stepCardSubtitle: {
    fontSize: 13,
    color: GRAY[500],
  },

  // Form Elements
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: SRS.navy,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: SRS.navy,
  },
  formHint: {
    fontSize: 12,
    color: GRAY[500],
    marginTop: 4,
  },
  formHintInline: {
    fontSize: 12,
    color: GRAY[500],
    marginBottom: 6,
  },
  formRow2: {
    flexDirection: 'row',
    gap: 16,
  },
  formRow3: {
    flexDirection: 'row',
    gap: 16,
  },
  charCount: {
    fontSize: 12,
    color: GRAY[500],
    textAlign: 'right',
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    paddingHorizontal: 12,
  },

  // Select / Chips
  selectWrap: {
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFF',
    maxHeight: 120,
  },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: GRAY[100],
    borderWidth: 1,
    borderColor: GRAY[200],
  },
  countryDropdown: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  countrySearchInput: {
    borderBottomWidth: 1,
    borderBottomColor: GRAY[200],
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: SRS.navy,
  },
  countryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[100],
  },
  countryDropdownItemActive: {
    backgroundColor: getAccentColor(0.06),
  },
  countryDropdownText: {
    fontSize: 14,
    color: SRS.navy,
  },
  countryDropdownTextActive: {
    fontWeight: '600',
    color: ACCENT,
  },

  // Map Panel
  mapPanel: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    overflow: 'hidden',
  },
  mapPanelHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[200],
  },
  mapPanelContent: {
    height: 250,
    backgroundColor: '#e8f4e8',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -12 }],
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  // Photo Upload
  photoUploadZone: {
    borderWidth: 2,
    borderColor: GRAY[300],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: getAccentColor(0.03),
  },
  hintDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GRAY[400],
  },
  uploadHint: {
    fontSize: 12,
    color: GRAY[500],
  },
  photoPreviewGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  photoPreviewItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: GRAY[100],
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(192,57,43,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewMore: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: GRAY[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewAdd: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: GRAY[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Amenities
  amenitySearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[100],
  },
  amenityCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: GRAY[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityCheckboxActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  customAmenitySection: {
    borderTopWidth: 1,
    borderTopColor: GRAY[200],
    paddingTop: 12,
    marginTop: 8,
  },
  customAmenityTitle: {
    fontSize: 12,
    color: GRAY[500],
    marginBottom: 8,
  },
  addAmenityBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAmenityHint: {
    fontSize: 11,
    color: GRAY[400],
    marginTop: 6,
  },

  // Offers
  offerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY[200],
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  offerItemEnabled: {
    backgroundColor: getAccentColor(0.05),
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addCustomOfferBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT + '40',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },

  // Navigation
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: GRAY[100],
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: GRAY[100],
  },
  btnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: ACCENT,
  },
  btnSaveDraftInline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT + '40',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GRAY[200],
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: GRAY[200],
  },
  btnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GRAY[200],
  },
  btnSaveDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: ACCENT,
  },

  // Review Sidebar
  reviewSidebar: {
    gap: 16,
  },
  reviewGrid2: {
    flexDirection: 'row',
    gap: 16,
  },
  reviewPhotoItem: {
    width: 64,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: GRAY[100],
  },
  reviewAmenityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: getAccentColor(0.1),
  },
  reviewRoomTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: GRAY[100],
  },

  // Publish Card
  publishCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  btnLaunch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    marginTop: 12,
  },
  btnSaveDraft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT + '40',
    justifyContent: 'center',
    marginTop: 8,
  },

  // Checklist
  checklistCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 20,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: GRAY[500],
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: GRAY[200],
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
});

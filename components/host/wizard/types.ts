import type { Dispatch, SetStateAction } from 'react';
import { STATUS, RED, BLUE, PURPLE } from '@/lib/constants/figma-tokens';
import { SRS } from '@/constants/portal-theme';

export type WizardStep = 'type' | 'property' | 'location' | 'photos' | 'rooms' | 'pricing' | 'review';

export type PropertyType = { id: string; label: string; icon: string };

export interface PropertyData {
  type: string; name: string; totalRooms: number; floors: number;
  yearBuilt: number; description: string; phone: string; email: string;
}

export interface LocationData {
  country: string; state: string; city: string; zip: string; street: string; mapLink: string;
  latitude: number | null; longitude: number | null;
}

export interface Offer {
  id: string; label: string; badge: string;
  badgeColor: string; badgeText: string; desc: string;
  enabled: boolean; startDate?: string; endDate?: string;
}

// ─── Constants ─────────────────────────────────────
export const PROPERTY_TYPES: PropertyType[] = [
  { id: 'hotel', label: 'Hotel', icon: 'hotel' },
  { id: 'resort', label: 'Resort', icon: 'spa' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { id: 'hostel', label: 'Hostel', icon: 'business' },
  { id: 'apartment', label: 'Apartment', icon: 'house.fill' },
  { id: 'custom', label: 'Add Type', icon: 'add' },
];

export const COUNTRIES = ['Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Cambodia','Canada','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','Estonia','Ethiopia','Fiji','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lithuania','Luxembourg','Madagascar','Malaysia','Maldives','Malta','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','North Macedonia','Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tanzania','Thailand','Tunisia','Turkey','UAE','Uganda','Ukraine','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

export const AMENITY_OPTIONS = [
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

export const DEFAULT_OFFERS: Offer[] = [
  { id: 'early', label: 'Early Bird Discount', badge: '10% OFF', badgeColor: STATUS.badgeGreen, badgeText: STATUS.activeGreenDark, desc: '10% off for bookings made 30+ days in advance', enabled: false },
  { id: 'last', label: 'Last-Minute Deal', badge: '15% OFF', badgeColor: RED[100], badgeText: RED[600], desc: '15% off for bookings made within 48 hours', enabled: false },
  { id: 'long', label: 'Long Stay Discount', badge: '20% OFF', badgeColor: BLUE[100], badgeText: BLUE[600], desc: '20% off for stays of 7 nights or more', enabled: false },
  { id: 'free', label: 'Free Cancellation', badge: 'Free', badgeColor: PURPLE[100], badgeText: PURPLE[600], desc: 'Full refund if cancelled 48+ hours before', enabled: false },
];

export const STEP_ORDER: WizardStep[] = ['type', 'property', 'location', 'photos', 'rooms', 'pricing', 'review'];
export const ACCENT = SRS.teal;

// ─── Shared Wizard Context ─────────────────────────
export interface WizardFieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  country?: string;
  state?: string;
  city?: string;
  zip?: string;
  street?: string;
  description?: string;
  totalRooms?: string;
  yearBuilt?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface WizardCtx {
  currentStep: WizardStep;
  setCurrentStep: Dispatch<SetStateAction<WizardStep>>;
  loading: boolean;
  saving: string | null;
  propertyType: string;
  setPropertyType: Dispatch<SetStateAction<string>>;
  propData: PropertyData;
  setPropData: Dispatch<SetStateAction<PropertyData>>;
  location: LocationData;
  setLocation: Dispatch<SetStateAction<LocationData>>;
  countrySearch: string;
  setCountrySearch: Dispatch<SetStateAction<string>>;
  showCountryDropdown: boolean;
  setShowCountryDropdown: Dispatch<SetStateAction<boolean>>;
  stateSearch: string;
  setStateSearch: Dispatch<SetStateAction<string>>;
  showStateDropdown: boolean;
  setShowStateDropdown: Dispatch<SetStateAction<boolean>>;
  stateOptions: string[];
  showMapPicker: boolean;
  setShowMapPicker: Dispatch<SetStateAction<boolean>>;
  handleLocationSelect: (lat: number, lng: number) => void;
  fullAddress: string;
  photos: string[];
  setPhotos: Dispatch<SetStateAction<string[]>>;
  coverPhotoIndex: number;
  setCoverPhotoIndex: Dispatch<SetStateAction<number>>;
  logo: string | null;
  setLogo: Dispatch<SetStateAction<string | null>>;
  showLogoPicker: boolean;
  setShowLogoPicker: Dispatch<SetStateAction<boolean>>;
  starRating: number;
  setStarRating: Dispatch<SetStateAction<number>>;
  amenities: string[];
  setAmenities: Dispatch<SetStateAction<string[]>>;
  customAmenity: string;
  setCustomAmenity: Dispatch<SetStateAction<string>>;
  amenitySearch: string;
  setAmenitySearch: Dispatch<SetStateAction<string>>;
  setShowPhotoPicker: Dispatch<SetStateAction<boolean>>;
  filteredAmenities: typeof AMENITY_OPTIONS;
  floors: any[];
  setFloors: Dispatch<SetStateAction<any[]>>;
  offers: Offer[];
  toggleOffer: (id: string) => void;
  toggleAmenity: (id: string) => void;
  checkInTime: string;
  setCheckInTime: Dispatch<SetStateAction<string>>;
  checkOutTime: string;
  setCheckOutTime: Dispatch<SetStateAction<string>>;
  showCustomOffer: boolean;
  setShowCustomOffer: Dispatch<SetStateAction<boolean>>;
  customOfferData: { title: string; description: string; badge: string };
  setCustomOfferData: Dispatch<SetStateAction<{ title: string; description: string; badge: string }>>;
  addCustomOffer: () => void;
  handleGoToStep: (stepIdx: number) => void;
  handlePublish: () => void;
  handleSaveDraft: () => void;
  stepNum: number;
  stepTotal: number;
  profileStrength: number;
  fieldErrors: WizardFieldErrors;
  setFieldErrors: Dispatch<SetStateAction<WizardFieldErrors>>;
  clearFieldError: (field: keyof WizardFieldErrors) => void;
}

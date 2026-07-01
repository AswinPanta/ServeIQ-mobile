/**
 * Amenities Constants
 * Defines all available hotel amenities with icons and categories
 */

export interface AmenityItem {
  id: string;
  name: string;
  icon: string;
  category: 'room' | 'facility' | 'service';
  description?: string;
}

// Room Amenities
export const ROOM_AMENITIES: AmenityItem[] = [
  {
    id: 'wifi',
    name: 'Free WiFi',
    icon: 'wifi',
    category: 'room',
    description: 'High-speed internet access',
  },
  {
    id: 'ac',
    name: 'Air Conditioning',
    icon: 'wind',
    category: 'room',
    description: 'Climate control',
  },
  {
    id: 'tv',
    name: 'Flat Screen TV',
    icon: 'tv',
    category: 'room',
    description: 'Entertainment system',
  },
  {
    id: 'minibar',
    name: 'Minibar',
    icon: 'bottle',
    category: 'room',
    description: 'In-room beverages',
  },
  {
    id: 'safe',
    name: 'Safe',
    icon: 'lock',
    category: 'room',
    description: 'Valuables storage',
  },
  {
    id: 'workspace',
    name: 'Work Desk',
    icon: 'briefcase',
    category: 'room',
    description: 'Dedicated workspace',
  },
  {
    id: 'bathrobe',
    name: 'Bathrobe',
    icon: 'shirt',
    category: 'room',
    description: 'Luxury amenities',
  },
  {
    id: 'slippers',
    name: 'Slippers',
    icon: 'shoe-prints',
    category: 'room',
    description: 'Guest slippers',
  },
  {
    id: 'toiletries',
    name: 'Premium Toiletries',
    icon: 'droplets',
    category: 'room',
    description: 'High-quality bath products',
  },
  {
    id: 'hairdryer',
    name: 'Hair Dryer',
    icon: 'wind',
    category: 'room',
    description: 'Personal grooming',
  },
  {
    id: 'phone',
    name: 'Telephone',
    icon: 'phone',
    category: 'room',
    description: 'In-room communication',
  },
  {
    id: 'alarm',
    name: 'Alarm Clock',
    icon: 'clock',
    category: 'room',
    description: 'Wake-up service',
  },
];

// Facility Amenities
export const FACILITY_AMENITIES: AmenityItem[] = [
  {
    id: 'pool',
    name: 'Swimming Pool',
    icon: 'waves',
    category: 'facility',
    description: 'Outdoor or indoor pool',
  },
  {
    id: 'gym',
    name: 'Fitness Center',
    icon: 'dumbbell',
    category: 'facility',
    description: 'Gym and exercise equipment',
  },
  {
    id: 'spa',
    name: 'Spa',
    icon: 'sparkles',
    category: 'facility',
    description: 'Wellness and relaxation',
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: 'utensils',
    category: 'facility',
    description: 'On-site dining',
  },
  {
    id: 'bar',
    name: 'Bar',
    icon: 'wine-glass',
    category: 'facility',
    description: 'Beverage service',
  },
  {
    id: 'cafe',
    name: 'Café',
    icon: 'coffee',
    category: 'facility',
    description: 'Coffee and light meals',
  },
  {
    id: 'parking',
    name: 'Parking',
    icon: 'car',
    category: 'facility',
    description: 'Vehicle parking available',
  },
  {
    id: 'garden',
    name: 'Garden',
    icon: 'leaf',
    category: 'facility',
    description: 'Outdoor gardens',
  },
  {
    id: 'terrace',
    name: 'Terrace',
    icon: 'sun',
    category: 'facility',
    description: 'Outdoor terrace area',
  },
  {
    id: 'lounge',
    name: 'Lounge',
    icon: 'sofa',
    category: 'facility',
    description: 'Common lounge area',
  },
  {
    id: 'library',
    name: 'Library',
    icon: 'book',
    category: 'facility',
    description: 'Book collection',
  },
  {
    id: 'game_room',
    name: 'Game Room',
    icon: 'gamepad2',
    category: 'facility',
    description: 'Recreation games',
  },
];

// Service Amenities
export const SERVICE_AMENITIES: AmenityItem[] = [
  {
    id: '24_hour_reception',
    name: '24-Hour Reception',
    icon: 'clock',
    category: 'service',
    description: 'Round-the-clock front desk',
  },
  {
    id: 'room_service',
    name: 'Room Service',
    icon: 'bell',
    category: 'service',
    description: 'In-room dining service',
  },
  {
    id: 'concierge',
    name: 'Concierge',
    icon: 'info',
    category: 'service',
    description: 'Guest assistance service',
  },
  {
    id: 'housekeeping',
    name: 'Daily Housekeeping',
    icon: 'sparkles',
    category: 'service',
    description: 'Room cleaning service',
  },
  {
    id: 'laundry',
    name: 'Laundry Service',
    icon: 'shirt',
    category: 'service',
    description: 'Clothing cleaning service',
  },
  {
    id: 'airport_transfer',
    name: 'Airport Transfer',
    icon: 'car',
    category: 'service',
    description: 'Transportation service',
  },
  {
    id: 'tour_desk',
    name: 'Tour Desk',
    icon: 'map',
    category: 'service',
    description: 'Tour and activity booking',
  },
  {
    id: 'business_center',
    name: 'Business Center',
    icon: 'briefcase',
    category: 'service',
    description: 'Business facilities',
  },
  {
    id: 'meeting_rooms',
    name: 'Meeting Rooms',
    icon: 'door-open',
    category: 'service',
    description: 'Conference facilities',
  },
  {
    id: 'multilingual_staff',
    name: 'Multilingual Staff',
    icon: 'globe',
    category: 'service',
    description: 'Language support',
  },
  {
    id: 'pet_friendly',
    name: 'Pet Friendly',
    icon: 'paw-print',
    category: 'service',
    description: 'Pets allowed',
  },
  {
    id: 'wheelchair_accessible',
    name: 'Wheelchair Accessible',
    icon: 'accessibility',
    category: 'service',
    description: 'Accessibility features',
  },
];

// All amenities combined
export const ALL_AMENITIES: AmenityItem[] = [
  ...ROOM_AMENITIES,
  ...FACILITY_AMENITIES,
  ...SERVICE_AMENITIES,
];

// Amenity categories for filtering
export const AMENITY_CATEGORIES = [
  { id: 'room', label: 'Room Amenities', count: ROOM_AMENITIES.length },
  { id: 'facility', label: 'Facilities', count: FACILITY_AMENITIES.length },
  { id: 'service', label: 'Services', count: SERVICE_AMENITIES.length },
];

// Get amenities by category
export const getAmenitiesByCategory = (category: 'room' | 'facility' | 'service') => {
  return ALL_AMENITIES.filter((a) => a.category === category);
};

// Get amenity by ID
export const getAmenityById = (id: string): AmenityItem | undefined => {
  return ALL_AMENITIES.find((a) => a.id === id);
};

// Get amenities by IDs
export const getAmenitiesByIds = (ids: string[]): AmenityItem[] => {
  return ids
    .map((id) => getAmenityById(id))
    .filter((a): a is AmenityItem => a !== undefined);
};

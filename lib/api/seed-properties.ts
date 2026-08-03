/**
 * Property Seeding Utility
 * Creates sample properties in the backend via the setup wizard endpoints.
 */

import { API_ENDPOINTS } from '@/constants/api-config';
import { hostApi } from '@/lib/api/host-api';

const PHOTOS = {
  hostel: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
  hostelGallery: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
  ],
  villa: 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=800&h=600&fit=crop',
  villaGallery: [
    'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=400&h=300&fit=crop',
  ],
  apartment: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
  apartmentGallery: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
  ],
  boutique: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop',
  boutiqueGallery: [
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
  ],
};

interface SeedProperty {
  general: {
    name: string;
    type: string;
    description: string;
    total_rooms: number;
    number_of_floors: number;
    year_built: number;
    phone_number: string;
    email: string;
  };
  location: {
    country: string;
    state: string;
    city: string;
    zip_code: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  localization: {
    currency: string;
    timezone: string;
    check_in_time: string;
    check_out_time: string;
  };
  brand: {
    brand_color: string;
    brand_logo_url: string | null;
  };
  photos: {
    cover: string;
    gallery: string[];
  };
  amenities: {
    custom_amenities: { name: string }[];
  };
}

const SEED_PROPERTIES: SeedProperty[] = [
  {
    general: {
      name: 'Thamel Backpackers Hostel',
      type: 'HOSTEL',
      description: 'A vibrant backpacker hostel in the heart of Thamel, Kathmandu. Perfect for solo travellers and groups exploring Nepal. Modern dorms and private rooms, a rooftop café with mountain views, and a communal kitchen. Walking distance to Durbar Square, Thamel shopping, and local momo joints.',
      total_rooms: 24,
      number_of_floors: 4,
      year_built: 2019,
      phone_number: '+977-1-4700123',
      email: 'info@thamelbackpackers.com',
    },
    location: {
      country: 'Nepal',
      state: 'Bagmati',
      city: 'Kathmandu',
      zip_code: '44600',
      address: 'Thamel Marg, Thamel, Kathmandu 44600, Nepal',
      latitude: 27.7152,
      longitude: 85.3126,
    },
    localization: {
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
      check_in_time: '14:00',
      check_out_time: '11:00',
    },
    brand: { brand_color: '#F59E0B', brand_logo_url: null },
    photos: { cover: PHOTOS.hostel, gallery: PHOTOS.hostelGallery },
    amenities: {
      custom_amenities: [
        { name: 'Free WiFi' }, { name: 'Rooftop Café' }, { name: 'Communal Kitchen' },
        { name: 'Lockers' }, { name: 'Laundry' }, { name: 'Travel Desk' },
        { name: 'Bicycle Rental' }, { name: 'Board Games' }, { name: 'Airport Shuttle' },
      ],
    },
  },
  {
    general: {
      name: 'Phewa Lake View Villa',
      type: 'VILLA',
      description: 'A stunning lakeside villa overlooking Phewa Lake with panoramic views of the Annapurna range and Machhapuchhre (Fishtail). Private garden, modern kitchen, and a terrace perfect for morning yoga. Located just minutes from Lakeside restaurants, paragliding launch sites, and the World Peace Pagoda.',
      total_rooms: 6,
      number_of_floors: 2,
      year_built: 2021,
      phone_number: '+977-61-523789',
      email: 'info@phewalakevilla.com',
    },
    location: {
      country: 'Nepal',
      state: 'Gandaki',
      city: 'Pokhara',
      zip_code: '33700',
      address: 'Lakeside Road, Pokhara 33700, Nepal',
      latitude: 28.2096,
      longitude: 83.9856,
    },
    localization: {
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
      check_in_time: '15:00',
      check_out_time: '11:00',
    },
    brand: { brand_color: '#0D9488', brand_logo_url: null },
    photos: { cover: PHOTOS.villa, gallery: PHOTOS.villaGallery },
    amenities: {
      custom_amenities: [
        { name: 'Lake View' }, { name: 'Mountain View' }, { name: 'Private Garden' },
        { name: 'Free WiFi' }, { name: 'Full Kitchen' }, { name: 'Kayak Rental' },
        { name: 'Yoga Terrace' }, { name: 'Parking' }, { name: 'Airport Shuttle' },
      ],
    },
  },
  {
    general: {
      name: 'Lalitpur Modern Apartment',
      type: 'APARTMENT',
      description: 'A sleek, modern apartment in the culturally rich city of Lalitpur (Patan). Featuring contemporary design with Newari architectural touches, this apartment offers a fully equipped kitchen, workspace, and city views. Steps away from Patan Durbar Square, Golden Temple, and the vibrant Patan market.',
      total_rooms: 3,
      number_of_floors: 1,
      year_built: 2022,
      phone_number: '+977-1-5520456',
      email: 'stay@lalitpurapartment.com',
    },
    location: {
      country: 'Nepal',
      state: 'Bagmati',
      city: 'Lalitpur',
      zip_code: '44700',
      address: 'Jawalakhel, Lalitpur 44700, Nepal',
      latitude: 27.6644,
      longitude: 85.3188,
    },
    localization: {
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
      check_in_time: '14:00',
      check_out_time: '10:00',
    },
    brand: { brand_color: '#7C3AED', brand_logo_url: null },
    photos: { cover: PHOTOS.apartment, gallery: PHOTOS.apartmentGallery },
    amenities: {
      custom_amenities: [
        { name: 'Free WiFi' }, { name: 'Full Kitchen' }, { name: 'Washer/Dryer' },
        { name: 'Workspace' }, { name: 'Air Conditioning' }, { name: 'Smart TV' },
        { name: 'City View' }, { name: 'Elevator' }, { name: 'Secure Entry' },
      ],
    },
  },
  {
    general: {
      name: 'Bhaktapur Heritage Boutique Hotel',
      type: 'HOTEL',
      description: 'A boutique hotel nestled in the ancient city of Bhaktapur, a UNESCO World Heritage Site. Restored from a traditional Newari merchant house, this property features carved wooden windows, a central courtyard, and rooftop dining overlooking the temple-studded skyline. Experience Nepal living history with modern luxury.',
      total_rooms: 12,
      number_of_floors: 3,
      year_built: 2018,
      phone_number: '+977-1-6610789',
      email: 'reservations@bhaktapurheritage.com',
    },
    location: {
      country: 'Nepal',
      state: 'Bagmati',
      city: 'Bhaktapur',
      zip_code: '44800',
      address: 'Durbar Square, Bhaktapur 44800, Nepal',
      latitude: 27.6722,
      longitude: 85.4298,
    },
    localization: {
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
      check_in_time: '14:00',
      check_out_time: '11:00',
    },
    brand: { brand_color: '#B45309', brand_logo_url: null },
    photos: { cover: PHOTOS.boutique, gallery: PHOTOS.boutiqueGallery },
    amenities: {
      custom_amenities: [
        { name: 'Free WiFi' }, { name: 'Rooftop Restaurant' }, { name: 'Courtyard' },
        { name: 'Breakfast Included' }, { name: 'Travel Desk' }, { name: 'Bicycle Rental' },
        { name: 'Heritage Architecture' }, { name: 'City View' }, { name: 'Parking' },
        { name: 'Spa Treatments' }, { name: 'Airport Shuttle' }, { name: 'Laundry Service' },
      ],
    },
  },
];

function logProgress(onProgress: ((msg: string) => void) | undefined, msg: string) {
  console.log(`[seed] ${msg}`);
  onProgress?.(msg);
}

export async function seedSampleProperties(
  onProgress?: (msg: string) => void,
): Promise<{ success: boolean; created: number; errors: string[] }> {
  // hostApi methods handle auth token internally via the api client interceptor

  let created = 0;
  const errors: string[] = [];

  for (const prop of SEED_PROPERTIES) {
    onProgress?.(`Creating "${prop.general.name}"...`);
    console.log(`\n[seed] === ${prop.general.name} ===`);

    try {
      // Step1: Create general info via hostApi
      logProgress(onProgress, `Creating "${prop.general.name}"...`);
      const createdProp = await hostApi.createGeneralInfo(prop.general, () => null);
      if (!createdProp?.id) { errors.push(`${prop.general.name}: general info failed`); continue; }
      const propertyId = createdProp.id;

      // Step2: Location
      await hostApi.createLocation(propertyId, prop.location as any, () => null);

      // Step3: Localization
      await hostApi.createLocalization(propertyId, prop.localization as any, () => null);

      // Step4: Brand visual
      await hostApi.createBrandVisual(propertyId, prop.brand as any, () => null);

      // Step5: Photos AND amenities in a single call (backend expects both)
      await hostApi.createPhotosAndAmenities(propertyId, {
        photos: prop.photos,
        amenities: prop.amenities,
      }, () => null);

      created++;
      logProgress(onProgress, `Created "${prop.general.name}" (${propertyId})`);
    } catch (err: any) {
      errors.push(`${prop.general.name}: ${err.message}`);
      console.error(`[seed] Error creating ${prop.general.name}:`, err);
    }
  }

  onProgress?.(`Done: ${created} properties created, ${errors.length} errors`);
  return { success: created > 0, created, errors };
}

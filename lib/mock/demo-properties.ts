/**
 * Additional Demo Properties
 * 4 new fully-featured properties: Hostel, Villa, Apartment, Guesthouse
 * Each with 5 rooms, full details, images, reviews, and discount codes
 */

import type { Hotel, HotelAmenity, RoomType } from './properties';

function am(name: string, icon: string): HotelAmenity {
  return { name, icon };
}

function rt(
  id: string, name: string, price: number, occ: number, bed: string, desc: string, avail: number,
  amenities: string[], image: string, extra?: Partial<RoomType>
): RoomType {
  return {
    id, name, price, currency: 'NPR', occupancy: occ, bed, description: desc, available: avail,
    amenities, image, ...extra,
  };
}

export const DEMO_PROPERTIES: Hotel[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. HOSTEL — Kathmandu Backpacker's Hub
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '11', name: "Kathmandu Backpacker's Hub", location: 'Thamel, Kathmandu, Nepal',
    city: 'Kathmandu', country: 'Nepal', address: 'Thamel Marg 12, Kathmandu 44600, Nepal',
    rating: 4.72, review_count: 489, starRating: 2, price: 18, currency: 'NPR',
    property_type: 'HOSTEL', brandColor: '#F59E0B',
    description: "The beating heart of Kathmandu's backpacker scene. Nestled in the labyrinthine lanes of Thamel, this lively hostel brings together travellers from every corner of the globe. A rooftop with sweeping Himalayan views, nightly communal dinners, and a travel desk that books everything from Everest Base Camp treks to white-water rafting on the Trisuli — this isn't just a bed, it's a launchpad.",
    shortDescription: 'Social hostel in Thamel with rooftop Himalayan views and trek booking',
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Free WiFi', '📶'), am('Rooftop Terrace', '🌅'), am('Communal Kitchen', '🍳'),
      am('Travel Desk', '🗺️'), am('Lockers', '🔐'), am('Laundry', '👔'),
      am('Bar', '🍸'), am('Tour Bookings', '🚌'), am('Hot Showers', '🚿'),
      am('24h Reception', '🛎️'), am('Luggage Storage', '🧳'), am('Bicycle Rental', '🚴'),
    ],
    roomTypes: [
      rt('h1', '8-Bed Dorm', 18, 1, 'Single Bunk', 'Clean, airy dorm with personal locker, reading light, and power outlet per bed. Curtains for privacy.', 8,
        ['WiFi', 'Locker', 'Reading Light'], 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop',
        { totalRooms: 8, roomNumbers: ['D1-1', 'D1-2', 'D1-3', 'D1-4', 'D1-5', 'D1-6', 'D1-7', 'D1-8'], bedType: 'Single Bunk', areaSqFt: 200, bathrooms: 2, bedrooms: 0, beds: 8, maxGuests: 1, bathroomAmenities: ['Shared shower', 'Towels'], roomFacilities: ['Personal locker', 'Reading light', 'Power outlet', 'Curtain'], cancellationPolicy: 'Free cancellation 24h before' }
      ),
      rt('h2', '4-Bed Dorm (Women Only)', 25, 1, 'Single Bunk', 'Women-only dorm with extra security, lockers, and en-suite bathroom. Quiet and comfortable.', 4,
        ['WiFi', 'Locker', 'AC', 'Ensuite'], 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
        { totalRooms: 4, roomNumbers: ['W1', 'W2', 'W3', 'W4'], bedType: 'Single Bunk', areaSqFt: 160, bathrooms: 1, bedrooms: 0, beds: 4, maxGuests: 1, bathroomAmenities: ['Ensuite shower', 'Towels', 'Toiletries'], roomFacilities: ['Personal locker', 'Reading light', 'Power outlet', 'Curtain', 'AC'], cancellationPolicy: 'Free cancellation 24h before' }
      ),
      rt('h3', 'Private Twin', 45, 2, '2 Single', 'Private room with two single beds, shared bathroom, and window overlooking the garden courtyard.', 3,
        ['WiFi', 'Locker', 'Hot Water'], 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop',
        { totalRooms: 3, roomNumbers: ['PT1', 'PT2', 'PT3'], bedType: '2 Single', areaSqFt: 140, bathrooms: 1, bedrooms: 1, beds: 2, maxGuests: 2, bathroomAmenities: ['Shared shower', 'Towels'], roomFacilities: ['Garden view', 'Window', 'Lock'], cancellationPolicy: 'Free cancellation 24h before' }
      ),
      rt('h4', 'Private Double', 55, 2, 'Queen', 'Cosy private room with queen bed, bedside tables, and garden view. Great for couples on a budget.', 2,
        ['WiFi', 'Locker', 'AC', 'Hot Water'], 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300&fit=crop',
        { totalRooms: 2, roomNumbers: ['PD1', 'PD2'], bedType: 'Queen', areaSqFt: 150, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, bathroomAmenities: ['Shared shower', 'Towels', 'Toiletries'], roomFacilities: ['Garden view', 'Window', 'Lock', 'Air conditioning'], cancellationPolicy: 'Free cancellation 24h before' }
      ),
      rt('h5', 'Family Room', 75, 4, '2 Queens', 'Spacious room with two queen beds, private bathroom, perfect for families or small groups.', 1,
        ['WiFi', 'AC', 'Ensuite', 'Hot Water'], 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
        { totalRooms: 1, roomNumbers: ['FR1'], bedType: '2 Queens', areaSqFt: 220, bathrooms: 1, bedrooms: 1, beds: 2, maxGuests: 4, bathroomAmenities: ['Ensuite shower', 'Towels', 'Toiletries', 'Hairdryer'], roomFacilities: ['Garden view', 'Air conditioning', 'Mini fridge', 'Desk'], cancellationPolicy: 'Free cancellation 24h before' }
      ),
    ],
    reviews: [
      { id: 'r40', author: 'Jake M.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'June 2026', comment: 'Best hostel in Thamel! The rooftop views are incredible and the staff organized an amazing Everest Base Camp trek for us.', helpful: 45 },
      { id: 'r41', author: 'Sophie L.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop', rating: 4, date: 'May 2026', comment: 'Great atmosphere, met amazing people. The communal dinners are a highlight. Would come back!', helpful: 32 },
      { id: 'r42', author: 'Raj P.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop', rating: 5, date: 'April 2026', comment: 'Clean, safe, and the staff are incredibly helpful. The travel desk saved us so much hassle.', helpful: 28 },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: '14:00', checkOutTime: '11:00', phone: '+977-1-4987654', email: 'stay@kathmanduhub.com',
    coordinates: { lat: 27.715, lng: 85.312 }, lat: 27.715, lng: 85.312, availableRooms: 18,
    tags: ['Hostel', 'Social', 'Budget', 'Trekking'],
    hostName: 'Pemba Tamang', hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
    hostJoined: 'January 2020', hostReviews: 467, category: 'hostel',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. VILLA — Santorini Cliffside Villa
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '12', name: 'Santorini Cliffside Villa', location: 'Oia, Santorini, Greece',
    city: 'Santorini', country: 'Greece', address: 'Oia, Santorini 847 02, Greece',
    rating: 4.96, review_count: 278, starRating: 5, price: 650, currency: 'EUR',
    property_type: 'VILLA', brandColor: '#1D4ED8',
    description: "Carved into the volcanic cliff of Oia, this whitewashed villa is a Santorini dream realised. Cave-style architecture meets contemporary luxury — a private infinity plunge pool overlooking the caldera, a sun-drenched terrace for sunset cocktails, and interiors inspired by the Aegean Sea. Steps lead to the famous Oia blue domes and the path to Ammoudi Bay's waterfront restaurants.",
    shortDescription: 'Whitewashed cliff villa with private plunge pool and caldera sunset views',
    images: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Infinity Plunge Pool', '🏊'), am('Caldera View', '🌊'), am('Private Terrace', '🌅'),
      am('Free WiFi', '📶'), am('Air Conditioning', '❄️'), am('Kitchen', '🍳'),
      am('Hot Tub', '♨️'), am('Concierge', '🛎️'), am('Airport Transfer', '🚐'),
      am('Breakfast Included', '🍳'), am('Sunset View', '🌇'), am('Wine Cellar', '🍷'),
    ],
    roomTypes: [
      rt('v1', 'Caldera Cave Room', 650, 2, 'King', 'Sculpted cave room with king bed, private terrace, and direct caldera views. Whitewashed walls, volcanic stone accents.', 2,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'], 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300', 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300', 'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300'], totalRooms: 3, roomNumbers: ['CV1', 'CV2'], bedType: 'King', areaSqFt: 450, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bedComfortRating: 9.6, bedComfortReviews: 245, bathroomAmenities: ['Rain shower', 'Greek toiletries', 'Bathrobe', 'Towels', 'Slippers'], roomFacilities: ['Caldera view', 'Private terrace', 'Air conditioning', 'Free WiFi', 'Mini bar', 'Safe'], cancellationPolicy: 'Free cancellation 7 days before' }
      ),
      rt('v2', 'Sunset Suite', 890, 4, 'King + Twin', 'Two-level suite with rooftop plunge pool, sunset-facing terrace, and separate living area with Aegean-inspired decor.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Private Pool'], 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300', 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300'], totalRooms: 2, roomNumbers: ['SS1'], bedType: 'King + Twin', areaSqFt: 780, bathrooms: 2, bedrooms: 2, beds: 3, maxGuests: 4, breakfastIncluded: true, bedComfortRating: 9.8, bedComfortReviews: 189, bathroomAmenities: ['Soaking tub', 'Rain shower', 'Greek toiletries', 'Bathrobe', 'Towels', 'Slippers', 'Hairdryer'], roomFacilities: ['Rooftop pool', 'Sunset view', 'Living area', 'Air conditioning', 'Free WiFi', 'Mini bar', 'Safe', 'Kitchenette'], cancellationPolicy: 'Free cancellation 7 days before' }
      ),
      rt('v3', 'Honeymoon Cave', 1100, 2, 'King', 'Romantic cave suite with heart-shaped jacuzzi, private garden, and unobstructed sunset views. Champagne on arrival.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Jacuzzi'], 'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300', 'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300'], totalRooms: 1, roomNumbers: ['HC1'], bedType: 'King', areaSqFt: 520, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bedComfortRating: 9.9, bedComfortReviews: 156, bathroomAmenities: ['Jacuzzi', 'Rain shower', 'Luxury toiletries', 'Bathrobe', 'Towels', 'Slippers', 'Champagne flutes'], roomFacilities: ['Private garden', 'Sunset view', 'Jacuzzi', 'Air conditioning', 'Free WiFi', 'Mini bar', 'Safe', 'Romantic lighting'], cancellationPolicy: 'Free cancellation 7 days before' }
      ),
      rt('v4', 'Family Villa', 1400, 6, 'King + 2 Queens', 'Expansive two-bedroom villa with full kitchen, private pool, and panoramic caldera views. Ideal for families.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Kitchen', 'Private Pool'], 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300', 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300', 'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300'], totalRooms: 1, roomNumbers: ['FV1'], bedType: 'King + 2 Queens', areaSqFt: 1200, bathrooms: 3, bedrooms: 2, beds: 3, maxGuests: 6, breakfastIncluded: true, bedComfortRating: 9.7, bedComfortReviews: 98, bathroomAmenities: ['Soaking tub', 'Rain shower', 'Luxury toiletries', 'Bathrobe', 'Towels', 'Slippers', 'Hairdryer', 'Kids toiletries'], roomFacilities: ['Full kitchen', 'Private pool', 'Caldera view', 'Air conditioning', 'Free WiFi', 'Washer/dryer', 'Dining area', 'Living room', 'Kids play area'], cancellationPolicy: 'Free cancellation 7 days before' }
      ),
      rt('v5', 'Luxe Penthouse', 2200, 8, 'King + 2 Queens + 2 Singles', 'The ultimate Santorini experience. Rooftop infinity pool, outdoor cinema, wine cellar, and 360° sunset views. Butler service included.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Kitchen', 'Private Pool', 'Butler'], 'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300', 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300', 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300'], totalRooms: 1, roomNumbers: ['LP1'], bedType: 'King + 2 Queens + 2 Singles', areaSqFt: 2000, bathrooms: 4, bedrooms: 3, beds: 5, maxGuests: 8, breakfastIncluded: true, bedComfortRating: 9.9, bedComfortReviews: 67, bathroomAmenities: ['Soaking tub', 'Rain shower', 'Luxury toiletries', 'Bathrobe', 'Towels', 'Slippers', 'Hairdryer', 'Champagne', 'Omakase toiletries'], roomFacilities: ['Rooftop infinity pool', 'Outdoor cinema', 'Wine cellar', 'Full kitchen', 'Butler service', 'Caldera view', 'Air conditioning', 'Free WiFi', 'Washer/dryer', 'Dining room', 'Living room', 'Office'], cancellationPolicy: 'Free cancellation 14 days before' }
      ),
    ],
    reviews: [
      { id: 'r43', author: 'Elena K.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop', rating: 5, date: 'May 2026', comment: 'The sunset from our private pool was the most magical moment of our lives. Pure Santorini perfection.', helpful: 38 },
      { id: 'r44', author: 'Marco P.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'April 2026', comment: 'Exquisite attention to detail. The cave architecture is stunning and the views are unbeatable.', helpful: 29 },
    ],
    cancellationPolicy: 'Free cancellation up to 7 days before check-in.',
    checkInTime: '15:00', checkOutTime: '11:00', phone: '+30-22860-71234', email: 'reservations@santorinivilla.gr',
    coordinates: { lat: 36.4614, lng: 25.3753 }, lat: 36.4614, lng: 25.3753, availableRooms: 5,
    tags: ['Villa', 'Luxury', 'Romantic', 'Pool', 'Sunset'],
    isSuperhost: true, category: 'villa', tag: 'Guest favourite',
    hostName: 'Nikolaos Papadopoulos', hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    hostJoined: 'March 2018', hostReviews: 265,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. APARTMENT — NYC Brooklyn Loft
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '13', name: 'NYC Brooklyn Industrial Loft', location: 'Williamsburg, Brooklyn, New York',
    city: 'New York', country: 'United States', address: '142 N 6th St, Brooklyn, NY 11249',
    rating: 4.83, review_count: 356, starRating: 4, price: 320, currency: 'USD',
    property_type: 'APARTMENT', brandColor: '#7C3AED',
    description: "A converted warehouse loft in the heart of Williamsburg, where exposed brick meets curated design. Floor-to-ceiling windows flood the open-plan space with natural light, while a rooftop deck offers skyline views of the Manhattan bridge. Steps from Bedford Avenue's cafés, vintage shops, and some of Brooklyn's best restaurants.",
    shortDescription: 'Converted warehouse loft in Williamsburg with Manhattan skyline views',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Manhattan View', '🏙️'), am('Free WiFi', '📶'), am('Full Kitchen', '🍳'),
      am('Washer/Dryer', '👔'), am('Workspace', '💼'), am('Rooftop Deck', '🌅'),
      am('Air Conditioning', '❄️'), am('Smart TV', '📺'), am('Espresso Machine', '☕'),
      am('Elevator', '🛗'), am('Gym Access', '💪'), am('Doorman', '🛎️'),
    ],
    roomTypes: [
      rt('a1', 'Studio Loft', 320, 2, 'Queen', 'Open-plan studio with exposed brick, concrete floors, and floor-to-ceiling windows. Sleeps 2 comfortably.', 3,
        ['WiFi', 'AC', 'TV', 'Kitchen'], 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300'], totalRooms: 4, roomNumbers: ['S1', 'S2', 'S3'], bedType: 'Queen', areaSqFt: 480, bathrooms: 1, bedrooms: 0, beds: 1, maxGuests: 2, bathroomAmenities: ['Rain shower', 'NYC toiletries', 'Hairdryer', 'Towels'], roomFacilities: ['Exposed brick', 'Floor-to-ceiling windows', 'Air conditioning', 'Free WiFi', 'Full kitchen', 'Espresso machine', 'Smart TV', 'Workspace'], cancellationPolicy: 'Free cancellation 48h before' }
      ),
      rt('a2', '1BR Loft', 420, 3, 'Queen', 'One-bedroom loft with separate sleeping area, full kitchen, and city views. Perfect for solo travellers or couples.', 2,
        ['WiFi', 'AC', 'TV', 'Kitchen', 'Washer'], 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300'], totalRooms: 3, roomNumbers: ['1L', '2L', '3L'], bedType: 'Queen', areaSqFt: 650, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 3, bathroomAmenities: ['Rain shower', 'NYC toiletries', 'Hairdryer', 'Towels', 'Bathrobe'], roomFacilities: ['City view', 'Exposed brick', 'Air conditioning', 'Free WiFi', 'Full kitchen', 'Washer/dryer', 'Smart TV', 'Workspace'], cancellationPolicy: 'Free cancellation 48h before' }
      ),
      rt('a3', '2BR Loft (Williamsburg)', 580, 5, 'King + 2 Queens', 'Spacious two-bedroom loft with open-plan living, dining for 6, and rooftop deck access. Brooklyn at its finest.', 2,
        ['WiFi', 'AC', 'TV', 'Kitchen', 'Washer', 'Rooftop'], 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300'], totalRooms: 2, roomNumbers: ['2B1', '2B2'], bedType: 'King + 2 Queens', areaSqFt: 950, bathrooms: 2, bedrooms: 2, beds: 3, maxGuests: 5, bathroomAmenities: ['Rain shower', 'NYC toiletries', 'Hairdryer', 'Towels', 'Bathrobe'], roomFacilities: ['Rooftop access', 'City view', 'Exposed brick', 'Air conditioning', 'Free WiFi', 'Full kitchen', 'Washer/dryer', 'Smart TV', 'Workspace', 'Dining area'], cancellationPolicy: 'Free cancellation 48h before' }
      ),
      rt('a4', 'Penthouse Loft', 750, 4, 'King', 'Top-floor penthouse with wraparound terrace, private outdoor dining, and panoramic Manhattan skyline views.', 1,
        ['WiFi', 'AC', 'TV', 'Kitchen', 'Washer', 'Rooftop', 'Terrace'], 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=400&h=300', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300'], totalRooms: 1, roomNumbers: ['PH'], bedType: 'King', areaSqFt: 1100, bathrooms: 2, bedrooms: 1, beds: 1, maxGuests: 4, bathroomAmenities: ['Soaking tub', 'Rain shower', 'NYC toiletries', 'Hairdryer', 'Towels', 'Bathrobe'], roomFacilities: ['Wraparound terrace', 'Manhattan skyline view', 'Outdoor dining', 'Air conditioning', 'Free WiFi', 'Full kitchen', 'Washer/dryer', 'Smart TV', 'Workspace', 'Fireplace'], cancellationPolicy: 'Free cancellation 48h before' }
      ),
      rt('a5', 'Artist Studio (Long Stay)', 260, 2, 'Queen', 'Cozy artist studio with skylight, perfect for long stays. Includes workspace, kitchenette, and free laundry.', 4,
        ['WiFi', 'AC', 'TV', 'Kitchen', 'Washer'], 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=400&h=300'], totalRooms: 4, roomNumbers: ['AS1', 'AS2', 'AS3', 'AS4'], bedType: 'Queen', areaSqFt: 380, bathrooms: 1, bedrooms: 0, beds: 1, maxGuests: 2, bathroomAmenities: ['Shower', 'NYC toiletries', 'Towels'], roomFacilities: ['Skylight', 'Workspace', 'Kitchenette', 'Air conditioning', 'Free WiFi', 'Smart TV', 'Free laundry'], cancellationPolicy: 'Free cancellation 48h before' }
      ),
    ],
    reviews: [
      { id: 'r45', author: 'Aisha T.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=48&h=48&fit=crop', rating: 5, date: 'June 2026', comment: 'The loft is gorgeous — exposed brick, amazing light, and the Manhattan view from the roof is incredible.', helpful: 34 },
      { id: 'r46', author: 'Chris B.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop', rating: 4, date: 'May 2026', comment: 'Perfect Williamsburg location. Walked everywhere. The rooftop is amazing for sunset drinks.', helpful: 27 },
    ],
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
    checkInTime: '15:00', checkOutTime: '11:00', phone: '+1-718-555-0123', email: 'stay@brooklynloft.com',
    coordinates: { lat: 40.7143, lng: -73.9614 }, lat: 40.7143, lng: -73.9614, availableRooms: 12,
    tags: ['Loft', 'Urban', 'Design', 'Brooklyn'],
    isSuperhost: true, category: 'city', tag: 'Guest favourite',
    hostName: 'Jordan Kim', hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop',
    hostJoined: 'August 2019', hostReviews: 342,
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. GUESTHOUSE — Kyoto Bamboo Guesthouse
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '14', name: 'Kyoto Bamboo Guesthouse', location: 'Higashiyama, Kyoto, Japan',
    city: 'Kyoto', country: 'Japan', address: 'Higashiyama-ku, Kyoto 605-0821, Japan',
    rating: 4.91, review_count: 198, starRating: 3, price: 15000, currency: 'JPY',
    property_type: 'GUESTHOUSE', brandColor: '#059669',
    description: "A lovingly restored machiya townhouse tucked behind a bamboo-lined lane in Higashiyama. Tatami-floored rooms, a zen garden courtyard, and a communal tea room where guests gather for morning matcha. Five minutes' walk to Kiyomizu-dera and the geisha district of Gion — this is old Kyoto, alive and welcoming.",
    shortDescription: 'Restored machiya townhouse in Higashiyama with zen garden and tea room',
    images: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Zen Garden', '🌿'), am('Free WiFi', '📶'), am('Tea Room', '🍵'),
      am('Air Conditioning', '❄️'), am('Bicycle Rental', '🚴'), am('Laundry', '👔'),
      am('Cultural Experiences', '🎭'), am('Temple Nearby', '⛩️'), am('Traditional Architecture', '🏯'),
      am('Complimentary Matcha', '🍵'), am('Hot Springs Info', '♨️'), am('Airport Shuttle', '🚐'),
    ],
    roomTypes: [
      rt('j1', 'Tatami Room (Standard)', 15000, 2, 'Futon', 'Traditional tatami room with futon bedding, shoji screens, and garden view. Authentic Japanese experience.', 4,
        ['WiFi', 'AC', 'Safe'], 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=300'], totalRooms: 6, roomNumbers: ['TR1', 'TR2', 'TR3', 'TR4'], bedType: 'Futon', areaSqFt: 250, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: false, bathroomAmenities: ['Ofuro bath', 'Japanese toiletries', 'Towels', 'Yukata robe'], roomFacilities: ['Tatami floor', 'Shoji screens', 'Garden view', 'Air conditioning', 'Free WiFi', 'Tea set', 'Low table'], cancellationPolicy: 'Free cancellation 7 days before' }
      ),
      rt('j2', 'Tatami Suite (Garden View)', 22000, 3, 'Futon + Single', 'Suite with private engawa (veranda), garden view, and en-suite ofuro bathtub. Premium tatami experience.', 2,
        ['WiFi', 'AC', 'Safe', 'Ofuro'], 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300', 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=300'], totalRooms: 2, roomNumbers: ['TS1', 'TS2'], bedType: 'Futon + Single', areaSqFt: 350, bathrooms: 1, bedrooms: 1, beds: 2, maxGuests: 3, bathroomAmenities: ['Ofuro bathtub', 'Japanese toiletries', 'Towels', 'Yukata robe', 'Hairdryer'], roomFacilities: ['Engawa veranda', 'Garden view', 'Tatami floor', 'Shoji screens', 'Air conditioning', 'Free WiFi', 'Tea set', 'Low table', 'Ofuro bath'], cancellationPolicy: 'Free cancellation 7 days before' }
      ),
      rt('j3', 'Western Room', 18000, 2, 'Queen', 'Modern Western-style room with queen bed, desk, and garden view. For guests who prefer a bed over futons.', 3,
        ['WiFi', 'AC', 'TV', 'Safe'], 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=300', 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300'], totalRooms: 3, roomNumbers: ['WR1', 'WR2', 'WR3'], bedType: 'Queen', areaSqFt: 200, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, bathroomAmenities: ['Shower', 'Japanese toiletries', 'Towels', 'Hairdryer'], roomFacilities: ['Garden view', 'Desk', 'Air conditioning', 'Free WiFi', 'TV', 'Safe'], cancellationPolicy: 'Free cancellation 7 days before' }
      ),
      rt('j4', 'Family Tatami', 30000, 5, '3 Futons', 'Large family room with three futon sets, shared garden access, and space for children to play. Traditional and spacious.', 1,
        ['WiFi', 'AC', 'Safe'], 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=300', 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300'], totalRooms: 1, roomNumbers: ['FT1'], bedType: '3 Futons', areaSqFt: 450, bathrooms: 1, bedrooms: 1, beds: 3, maxGuests: 5, bathroomAmenities: ['Ofuro bath', 'Japanese toiletries', 'Towels', 'Yukata robe', 'Kids toiletries'], roomFacilities: ['Garden access', 'Tatami floor', 'Shoji screens', 'Air conditioning', 'Free WiFi', 'Tea set', 'Low table', 'Play area'], cancellationPolicy: 'Free cancellation 7 days before' }
      ),
      rt('j5', 'Machiya Entire House', 45000, 8, '4 Futons + 2 Queens', 'Rent the entire machiya! Two floors, zen garden, full kitchen, 4 tatami rooms, and a private tea ceremony space. Perfect for groups.', 1,
        ['WiFi', 'AC', 'Kitchen', 'Garden', 'Tea Room'], 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300', 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300'], totalRooms: 1, roomNumbers: ['MH1'], bedType: '4 Futons + 2 Queens', areaSqFt: 1200, bathrooms: 3, bedrooms: 4, beds: 6, maxGuests: 8, bathroomAmenities: ['Ofuro baths (3)', 'Japanese toiletries', 'Towels', 'Yukata robe', 'Hairdryer'], roomFacilities: ['Entire house', 'Zen garden', 'Full kitchen', 'Tea ceremony room', 'Air conditioning', 'Free WiFi', 'Washer', 'Dining area', 'Living room', '2 floors'], cancellationPolicy: 'Free cancellation 14 days before' }
      ),
    ],
    reviews: [
      { id: 'r47', author: 'Akiko M.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=48&h=48&fit=crop', rating: 5, date: 'May 2026', comment: 'The most authentic Kyoto experience. Waking up to the zen garden and drinking matcha in the tea room was unforgettable.', helpful: 31 },
      { id: 'r48', author: 'David L.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'April 2026', comment: 'Beautiful machiya, incredibly warm hosts. The location near Kiyomizu-dera is perfect. We rented bicycles and explored all day.', helpful: 24 },
    ],
    cancellationPolicy: 'Free cancellation up to 7 days before check-in.',
    checkInTime: '15:00', checkOutTime: '10:00', phone: '+81-75-555-0456', email: 'info@kyotobambooguesthouse.jp',
    coordinates: { lat: 34.9975, lng: 135.7848 }, lat: 34.9975, lng: 135.7848, availableRooms: 10,
    tags: ['Guesthouse', 'Cultural', 'Traditional', 'Temple'],
    isSuperhost: true, category: 'cultural', tag: 'Guest favourite',
    hostName: 'Yuki Watanabe', hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop',
    hostJoined: 'June 2018', hostReviews: 187,
  },
];

// Discount codes for the demo properties
export const DEMO_DISCOUNT_CODES = [
  // Hostel codes
  { id: 'dc-11', property_id: '11', code: 'BACKPACK10', type: 'PERCENTAGE', discount_value: 10, min_amount: 500, max_uses: 200, used_count: 45, valid_from: '2026-01-01', valid_to: '2026-12-31', applicable_room_types: [], combinable: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'dc-12', property_id: '11', code: 'TREK20', type: 'PERCENTAGE', discount_value: 20, min_amount: 2000, max_uses: 50, used_count: 12, valid_from: '2026-06-01', valid_to: '2026-08-31', applicable_room_types: [], combinable: false, is_active: true, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  // Villa codes
  { id: 'dc-13', property_id: '12', code: 'SUNSET15', type: 'PERCENTAGE', discount_value: 15, min_amount: 3000, max_uses: 100, used_count: 28, valid_from: '2026-01-01', valid_to: '2026-12-31', applicable_room_types: [], combinable: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'dc-14', property_id: '12', code: 'HONEYMOON', type: 'PERCENTAGE', discount_value: 10, min_amount: 5000, max_uses: 30, used_count: 8, valid_from: '2026-01-01', valid_to: '2026-12-31', applicable_room_types: [], combinable: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  // Apartment codes
  { id: 'dc-15', property_id: '13', code: 'BROOKLYN20', type: 'PERCENTAGE', discount_value: 20, min_amount: 2000, max_uses: 150, used_count: 67, valid_from: '2026-01-01', valid_to: '2026-12-31', applicable_room_types: [], combinable: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'dc-16', property_id: '13', code: 'STAY7FLAT50', type: 'FIXED', discount_value: 50, min_amount: 1500, max_uses: 80, used_count: 23, valid_from: '2026-01-01', valid_to: '2026-12-31', applicable_room_types: [], combinable: true, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  // Guesthouse codes
  { id: 'dc-17', property_id: '14', code: 'KYOTO15', type: 'PERCENTAGE', discount_value: 15, min_amount: 10000, max_uses: 100, used_count: 34, valid_from: '2026-01-01', valid_to: '2026-12-31', applicable_room_types: [], combinable: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'dc-18', property_id: '14', code: 'MACHIYA10', type: 'PERCENTAGE', discount_value: 10, min_amount: 20000, max_uses: 50, used_count: 11, valid_from: '2026-06-01', valid_to: '2026-09-30', applicable_room_types: [], combinable: false, is_active: true, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
];

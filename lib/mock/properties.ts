/**
 * Mock Property Data
 * Comprehensive demo hotel data for the StayEasy app
 * Ref: Rich 10-hotel dataset from my-react-app
 */

export interface HotelAmenity {
  name: string;
  icon: string;
}

export interface RoomType {
  id: string;
  name: string;
  price: number;
  currency: string;
  occupancy: number;
  bed: string;
  description: string;
  available: number;
  amenities: string[];
  image: string;
  gallery?: string[];
  totalRooms?: number;
  roomNumbers?: string[];
  bedType?: string;
  areaSqFt?: number;
  bathroomAmenities?: string[];
  roomFacilities?: string[];
  smokingPolicy?: string;
  cancellationPolicy?: string;
  breakfastIncluded?: boolean;
  bedComfortRating?: number;
  bedComfortReviews?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  maxGuests?: number;
}

export interface HotelReview {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  helpful?: number;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  address: string;
  rating: number;
  review_count: number;
  starRating: number;
  price: number;
  currency: string;
  description: string;
  shortDescription: string;
  images: string[];
  amenities: HotelAmenity[];
  roomTypes: RoomType[];
  reviews: HotelReview[];
  cancellationPolicy: string;
  checkInTime: string;
  checkOutTime: string;
  phone: string;
  email: string;
  website?: string;
  coordinates?: { lat: number; lng: number };
  availableRooms: number;
  brandColor?: string;
  logoUrl?: string;
  tags: string[];
  isSuperhost?: boolean;
  category?: string;
  hostName?: string;
  hostAvatar?: string;
  hostJoined?: string;
  hostReviews?: number;
  lat?: number;
  lng?: number;
  tag?: string;
}

export const reviewSamples = [
  { id: 1, author: "James R.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format", date: "May 2026", rating: 5, text: "Absolutely incredible stay. The views were even better than the photos. Our host was responsive and welcoming from day one. Would return every year if I could." },
  { id: 2, author: "Priya M.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&auto=format", date: "April 2026", rating: 5, text: "One of the best travel experiences of my life. The property is immaculate, the amenities are top-tier, and the location is unbeatable. Already recommended to all my friends." },
  { id: 3, author: "Thomas H.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&auto=format", date: "March 2026", rating: 4, text: "Beautiful place with great character. Check-in was smooth and the host gave us great local tips. Only minor note: the WiFi dipped occasionally, but everything else was excellent." },
  { id: 4, author: "Yuki S.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=48&h=48&fit=crop&auto=format", date: "February 2026", rating: 5, text: "Magical. We stayed for our anniversary and every detail was perfect — from the welcome champagne to the sunset views. We didn't want to leave." },
];

function am(name: string, icon: string): HotelAmenity {
  return { name, icon };
}

function rt(
  id: string, name: string, price: number, occ: number, bed: string, desc: string, avail: number,
  amenities: string[], image: string, extra?: Partial<RoomType>
): RoomType {
  return {
    id, name, price, currency: 'NPR', occupancy: occ, bed, description: desc, available: avail, amenities, image,
    ...extra,
  };
}

export const MOCK_PROPERTIES: Hotel[] = [
  {
    id: '1', name: 'Himalayan Lakeview Resort', location: 'Lakeside, Pokhara, Nepal', city: 'Pokhara', country: 'Nepal',
    address: 'Lakeside Road, Pokhara 33700, Nepal', rating: 4.94, review_count: 267, starRating: 5, price: 180,
    currency: 'NPR', brandColor: '#0891B2',
    description: 'Set on the tranquil shores of Phewa Lake with uninterrupted views of the Annapurna and Machhapuchhre peaks, this resort blends traditional Newari architecture with contemporary comfort. Wake to birdsong and the sight of paragliders drifting across a mirror-still lake. Enjoy farm-to-table dining on a lantern-lit terrace, or take a complimentary kayak out at dawn — Pokhara\'s magic is right at your doorstep.',
    shortDescription: 'Lakefront resort with Annapurna views and kayak rentals',
    images: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Free WiFi', '📶'), am('Lake View', '🌊'), am('Mountain View', '🏔️'), am('Restaurant', '🍽️'),
      am('Bar', '🍸'), am('Kayak Rental', '🚣'), am('Garden', '🌿'), am('Yoga Terrace', '🧘'),
      am('Spa Treatments', '✨'), am('Airport Shuttle', '🚐'), am('Breakfast Included', '🍳'), am('Parking', '🅿️'),
      am('Air Conditioning', '❄️'), am('Room Service', '🛎️'),
    ],
    roomTypes: [
      rt('std-1', 'Lakeview Room', 180, 2, 'Queen', 'Cosy room overlooking Phewa Lake with private balcony. Watch the sunrise paint the Annapurna range gold from your window.', 4,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'], 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300'], totalRooms: 6, roomNumbers: ['101', '102', '103', '104'], bedType: 'Queen', areaSqFt: 320, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bedComfortRating: 9.1, bedComfortReviews: 198, bathroomAmenities: ['Rain shower', 'Organic toiletries', 'Slippers', 'Hairdryer', 'Towels', 'Toilet paper'], roomFacilities: ['Lake view', 'Private balcony', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Tea/Coffee maker', 'Desk', 'Safe'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation before 2:00 PM on check-in date' }
      ),
      rt('dlx-1', 'Mountain Suite', 320, 4, 'King + Single', 'Spacious suite with panoramic mountain and lake views from both bedrooms and a shared terrace.', 2,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Balcony'], 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300', 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=300', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300'], totalRooms: 3, roomNumbers: ['201', '202'], bedType: 'King + Single', areaSqFt: 580, bathrooms: 1, bedrooms: 2, beds: 2, maxGuests: 4, breakfastIncluded: true, bedComfortRating: 9.4, bedComfortReviews: 143, bathroomAmenities: ['Rain shower', 'Organic toiletries', 'Slippers', 'Hairdryer', 'Towels', 'Bathrobe', 'Toilet paper'], roomFacilities: ['Mountain view', 'Lake view', 'Private terrace', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Tea/Coffee maker', 'Desk', 'Sitting area'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation before 2:00 PM on check-in date' }
      ),
      rt('prem-1', 'Annapurna Penthouse', 520, 6, 'King + 2 Single', 'Top-floor penthouse with wraparound terrace offering 270° views of the Annapurna range and Phewa Lake.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Balcony', 'Jacuzzi'], 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=300', 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300'], totalRooms: 1, roomNumbers: ['301'], bedType: 'King + 2 Single', areaSqFt: 980, bathrooms: 2, bedrooms: 3, beds: 4, maxGuests: 6, breakfastIncluded: true, bedComfortRating: 9.7, bedComfortReviews: 86, bathroomAmenities: ['Soaking tub', 'Rain shower', 'Organic toiletries', 'Slippers', 'Hairdryer', 'Towels', 'Bathrobe', 'Toilet paper'], roomFacilities: ['Panoramic view', 'Rooftop terrace', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Tea/Coffee maker', 'Living room', 'Dining area', 'Safe', 'Butler service'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation before 2:00 PM on check-in date' }
      ),
    ],
    reviews: [
      { id: 'r1', author: 'James R.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'May 2026', comment: 'Absolutely incredible stay. The views were even better than the photos.', helpful: 32 },
      { id: 'r2', author: 'Priya M.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop', rating: 5, date: 'April 2026', comment: 'One of the best travel experiences of my life. The property is immaculate.', helpful: 28 },
      { id: 'r3', author: 'Thomas H.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop', rating: 4, date: 'March 2026', comment: 'Beautiful place with great character. Check-in was smooth.', helpful: 15 },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in. Cancellations within 24 hours incur a 1-night charge.',
    checkInTime: '14:00', checkOutTime: '11:00', phone: '+977-61-523456', email: 'info@himalayanlakeview.com',
    coordinates: { lat: 28.21, lng: 83.99 }, lat: 28.21, lng: 83.99, availableRooms: 10, tags: ['Lake View', 'Mountain View', 'Luxury', 'Spa'],
    isSuperhost: true, category: 'mountain', tag: 'Guest favourite',
    hostName: 'Raj Gurung', hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop', hostJoined: 'March 2019', hostReviews: 254,
  },
  {
    id: '2', name: 'Durbar Square Heritage Haveli', location: 'Thamel, Kathmandu, Nepal', city: 'Kathmandu', country: 'Nepal',
    address: 'Thamel Marg, Kathmandu 44600, Nepal', rating: 4.87, review_count: 334, starRating: 4, price: 95,
    currency: 'NPR', brandColor: '#B45309',
    description: 'Tucked within the lively streets of Thamel, this restored 19th-century Newari merchant\'s house is a peaceful haven amid Kathmandu\'s vibrant chaos. Carved wooden windows, a central brick courtyard, and a rooftop terrace overlooking the city\'s temple spires transport you to another era. Steps away from Kathmandu Durbar Square, boutique shops, and some of the best momo joints in the valley.',
    shortDescription: 'Restored 19th-century haveli near Durbar Square with rooftop terrace',
    images: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Free WiFi', '📶'), am('Heritage Architecture', '🏛️'), am('Courtyard', '🌿'), am('Rooftop Terrace', '🌅'),
      am('Breakfast Included', '🍳'), am('Air Conditioning', '❄️'), am('Bicycle Rental', '🚴'), am('Travel Desk', '🗺️'),
      am('Laundry Service', '👔'), am('Rooftop Restaurant', '🍽️'), am('City View', '🌆'), am('Parking', '🅿️'),
    ],
    roomTypes: [
      rt('std-2', 'Courtyard Room', 95, 2, 'Queen', 'Charming room overlooking the central brick courtyard with traditional Newari woodwork and handwoven textiles.', 3,
        ['WiFi', 'AC', 'TV', 'Safe'], 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300', 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300'], totalRooms: 5, roomNumbers: ['C1', 'C2', 'C3'], bedType: 'Queen', areaSqFt: 280, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bedComfortRating: 8.9, bedComfortReviews: 246, bathroomAmenities: ['Rain shower', 'Herbal toiletries', 'Slippers', 'Hairdryer', 'Towels', 'Toilet paper'], roomFacilities: ['Courtyard view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Tea/Coffee maker', 'Desk', 'Safe'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation before 12:00 PM on check-in date' }
      ),
      rt('dlx-2', 'Heritage Suite', 180, 3, 'King + Single', 'A larger suite with a separate sitting area, original carved windows, and a private balcony overlooking the neighbourhood temple.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Balcony'], 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300', 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=300'], totalRooms: 2, roomNumbers: ['H1'], bedType: 'King + Single', areaSqFt: 480, bathrooms: 1, bedrooms: 1, beds: 2, maxGuests: 3, breakfastIncluded: true, bedComfortRating: 9.0, bedComfortReviews: 178, bathroomAmenities: ['Rain shower', 'Herbal toiletries', 'Slippers', 'Hairdryer', 'Towels', 'Bathrobe', 'Toilet paper'], roomFacilities: ['Balcony', 'Temple view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Tea/Coffee maker', 'Desk', 'Sitting area'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation before 12:00 PM on check-in date' }
      ),
    ],
    reviews: [
      { id: 'r4', author: 'Sarah M.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop', rating: 5, date: 'June 2026', comment: 'An absolute gem! The location is perfect for exploring Kathmandu.', helpful: 22 },
      { id: 'r5', author: 'David W.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop', rating: 4, date: 'May 2026', comment: 'Beautiful haveli with amazing architecture. The rooftop views are stunning.', helpful: 18 },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: '14:00', checkOutTime: '12:00', phone: '+977-1-4912345', email: 'stay@heritagehaveli.com',
    coordinates: { lat: 27.72, lng: 85.32 }, lat: 27.72, lng: 85.32, availableRooms: 6, tags: ['Heritage', 'Cultural', 'Boutique', 'City'],
    hostName: 'Maya Shrestha', hostAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop', hostJoined: 'August 2017', hostReviews: 311,
  },
  {
    id: '3', name: 'Serenity Beachfront Villa', location: 'Maldives, South Malé Atoll', city: 'South Malé Atoll', country: 'Maldives',
    address: 'South Malé Atoll, Maldives', rating: 4.97, review_count: 312, starRating: 5, price: 420,
    currency: 'USD', brandColor: '#0D9488',
    description: 'Wake up to the sound of gentle waves in this stunning overwater villa perched above the crystal-clear lagoon. This exclusive retreat blends natural Maldivian craftsmanship with modern luxury — think handwoven rattan ceilings, a private infinity pool, and a direct-access ladder into the Indian Ocean. Ideal for couples seeking seclusion and unforgettable sunsets.',
    shortDescription: 'Overwater villa with private pool and direct lagoon access',
    images: [
      'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Private Pool', '🏊'), am('Ocean View', '🌊'), am('Free WiFi', '📶'), am('Air Conditioning', '❄️'),
      am('Kitchen', '🍳'), am('Spa Bath', '✨'), am('Beach Access', '🏖️'), am('Snorkelling Gear', '🤿'),
      am('Kayaks', '🚣'), am('Room Service', '🛎️'), am('Parking', '🅿️'), am('Breakfast Included', '🍳'),
    ],
    roomTypes: [
      rt('std-3', 'Standard Villa', 420, 2, 'King', 'Overwater villa with lagoon views. Floor-to-ceiling windows open onto a private deck with direct lagoon access.', 3,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'], 'https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=400&h=300', 'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300', 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300'], totalRooms: 5, roomNumbers: ['101', '102', '103'], bedType: 'King', areaSqFt: 480, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bedComfortRating: 9.2, bedComfortReviews: 281, bathroomAmenities: ['Rain shower', 'Luxury toiletries', 'Slippers', 'Hairdryer', 'Towels', 'Toilet paper'], roomFacilities: ['Private entrance', 'Air conditioning', 'Free WiFi', 'Mini bar', 'Safe', 'Flat-screen TV', 'Desk', 'Sitting area', 'Tea/Coffee maker', 'Wake-up service'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation before 6:00 PM on check-in date' }
      ),
      rt('dlx-3', 'Deluxe Villa', 620, 4, 'King + Twin', 'Premium overwater villa with private infinity pool, lavish living area, and master bathroom with soaking tub.', 2,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Private Pool'], 'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300', 'https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=400&h=300', 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300'], totalRooms: 3, roomNumbers: ['201', '202'], bedType: 'King + Twin', areaSqFt: 720, bathrooms: 2, bedrooms: 2, beds: 2, maxGuests: 4, breakfastIncluded: true, bedComfortRating: 9.5, bedComfortReviews: 187, bathroomAmenities: ['Soaking tub', 'Rain shower', 'Luxury toiletries', 'Slippers', 'Hairdryer', 'Towels', 'Bathrobe', 'Toilet paper'], roomFacilities: ['Private pool', 'Private entrance', 'Air conditioning', 'Free WiFi', 'Mini bar', 'Safe', 'Flat-screen TV', 'Desk', 'Living area', 'Tea/Coffee maker', 'Wake-up service', 'Ocean view'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation before 6:00 PM on check-in date' }
      ),
    ],
    reviews: [
      { id: 'r6', author: 'Aisha R.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop', rating: 5, date: 'April 2026', comment: 'Paradise on earth! The overwater villa exceeded every expectation.', helpful: 35 },
      { id: 'r7', author: 'Mark T.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'March 2026', comment: 'Incredible experience. The private pool and direct ocean access were amazing.', helpful: 27 },
    ],
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
    checkInTime: '15:00', checkOutTime: '12:00', phone: '+960-334-5678', email: 'reservations@serenitymv.com',
    coordinates: { lat: 3.8, lng: 73.5 }, lat: 3.8, lng: 73.5, availableRooms: 8, tags: ['Beachfront', 'Luxury', 'Romantic', 'Pool'],
    isSuperhost: true, category: 'beachfront', tag: 'Guest favourite',
    hostName: 'Aisha Rasheed', hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', hostJoined: 'March 2018', hostReviews: 289,
  },
  {
    id: '4', name: 'The Grand Alpine Chalet', location: 'Zermatt, Switzerland', city: 'Zermatt', country: 'Switzerland',
    address: 'Zermatt, Switzerland', rating: 4.89, review_count: 204, starRating: 5, price: 580,
    currency: 'CHF', brandColor: '#1D4ED8',
    description: 'Nestled at the foot of the iconic Matterhorn, this traditional Swiss chalet offers panoramic mountain views, a wood-panelled interior with a roaring fireplace, and direct ski-in/ski-out access. After a day on the slopes, unwind in the outdoor hot tub with the Alps stretching endlessly before you.',
    shortDescription: 'Traditional Swiss chalet with Matterhorn views and ski-in/ski-out',
    images: [
      'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Ski-in/ski-out', '⛷️'), am('Hot Tub', '♨️'), am('Fireplace', '🔥'), am('Mountain View', '🏔️'),
      am('Free WiFi', '📶'), am('Kitchen', '🍳'), am('Heated Floors', '🔥'), am('Sauna', '🧖'),
      am('Ski Storage', '🎿'), am('Parking', '🅿️'), am('Air Conditioning', '❄️'), am('Pet Friendly', '🐾'),
    ],
    roomTypes: [
      rt('std-4', 'Standard Chalet', 580, 4, 'Queen + Single', 'Cosy mountain-view room with traditional Swiss wood panelling.', 5,
        ['WiFi', 'AC', 'TV', 'Safe'], 'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=400&h=300', 'https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=400&h=300', 'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300'], totalRooms: 8, bedType: 'Queen + Single', areaSqFt: 550, bathrooms: 2, bedrooms: 2, beds: 3, maxGuests: 4, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Toiletries', 'Towels'], roomFacilities: ['Mountain view', 'Heated floors', 'Free WiFi'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 48 hours before check-in' }
      ),
      rt('dlx-4', 'Deluxe Chalet', 780, 6, 'King + 2 Single', 'Spacious suite with hot tub access and panoramic Matterhorn views.', 2,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'], 'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300', 'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=400&h=300', 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=400&h=300'], totalRooms: 4, bedType: 'King + 2 Single', areaSqFt: 850, bathrooms: 2, bedrooms: 3, beds: 4, maxGuests: 6, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Hot tub access', 'Toiletries'], roomFacilities: ['Mountain view', 'Hot tub', 'Free WiFi', 'Mini bar'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 48 hours before check-in' }
      ),
    ],
    reviews: [
      { id: 'r8', author: 'Hans M.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'January 2026', comment: 'The Matterhorn view from the hot tub is unforgettable!', helpful: 20 },
      { id: 'r9', author: 'Elena K.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop', rating: 5, date: 'December 2025', comment: 'Perfect ski holiday. The chalet is warm, cosy, and perfectly located.', helpful: 16 },
    ],
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
    checkInTime: '15:00', checkOutTime: '11:00', phone: '+41-27-967-1234', email: 'info@grandalpinechalet.ch',
    coordinates: { lat: 46.02, lng: 7.75 }, lat: 46.02, lng: 7.75, availableRooms: 10, tags: ['Skiing', 'Mountain', 'Luxury', 'Winter'],
    isSuperhost: true, category: 'skiing',
    hostName: 'Hans Müller', hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop', hostJoined: 'January 2016', hostReviews: 198,
  },
  {
    id: '6', name: 'Bali Jungle Pool Villa', location: 'Ubud, Bali, Indonesia', city: 'Ubud', country: 'Indonesia',
    address: 'Ubud, Bali, Indonesia', rating: 4.93, review_count: 451, starRating: 5, price: 195,
    currency: 'USD', brandColor: '#059669',
    description: 'Hidden within Ubud\'s lush rice-paddy terraces, this open-air villa channels traditional Balinese architecture — teak pavilions, hand-carved stone altars, and alang-alang thatch roofs. The 12-metre infinity pool seemingly merges with the jungle canopy below. A private chef, resident butler, and daily Balinese offerings make every moment feel ceremonial.',
    shortDescription: 'Open-air villa with infinity pool in Ubud\'s rice terraces',
    images: [
      'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Infinity Pool', '🏊'), am('Jungle View', '🌴'), am('Private Chef', '👨‍🍳'), am('Free WiFi', '📶'),
      am('Air Conditioning', '❄️'), am('Butler Service', '🛎️'), am('Rice Paddy View', '🌾'), am('Yoga Deck', '🧘'),
      am('Outdoor Shower', '🚿'), am('Bicycle Rental', '🚴'), am('Spa Treatments', '✨'), am('Airport Transfer', '🚐'),
    ],
    roomTypes: [
      rt('std-6', 'Jungle Room', 195, 2, 'Queen', 'Garden-view room with outdoor shower and traditional Balinese decor.', 3,
        ['WiFi', 'AC', 'TV', 'Safe'], 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300', 'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300', 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300'], totalRooms: 5, bedType: 'Queen', areaSqFt: 380, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bathroomAmenities: ['Outdoor shower', 'Organic toiletries', 'Towels'], roomFacilities: ['Garden view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 24 hours before check-in' }
      ),
      rt('dlx-6', 'Pool Villa', 350, 4, 'King + Single', 'Villa with private infinity pool overlooking the jungle canopy.', 2,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Private Pool'], 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300', 'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300', 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300'], totalRooms: 3, bedType: 'King + Single', areaSqFt: 680, bathrooms: 2, bedrooms: 2, beds: 2, maxGuests: 4, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Organic toiletries', 'Towels', 'Bathrobe'], roomFacilities: ['Private pool', 'Jungle view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Outdoor shower'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 24 hours before check-in' }
      ),
    ],
    reviews: [
      { id: 'r10', author: 'Wayan S.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop', rating: 5, date: 'May 2026', comment: 'The most magical stay of our lives. The private pool overlooking the jungle is incredible!', helpful: 40 },
      { id: 'r11', author: 'Sarah L.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop', rating: 5, date: 'April 2026', comment: 'Ubud at its finest. The private chef prepared the most amazing Balinese feast.', helpful: 31 },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: '14:00', checkOutTime: '12:00', phone: '+62-361-971-234', email: 'reservations@balijunglevilla.com',
    coordinates: { lat: -8.52, lng: 115.27 }, lat: -8.52, lng: 115.27, availableRooms: 8, tags: ['Villa', 'Jungle', 'Pool', 'Luxury'],
    isSuperhost: true, category: 'villa',
    hostName: 'Wayan Suartha', hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop', hostJoined: 'April 2017', hostReviews: 430,
  },
  {
    id: '7', name: 'Tokyo Tower-View Penthouse', location: 'Minato, Tokyo, Japan', city: 'Tokyo', country: 'Japan',
    address: 'Minato, Tokyo, Japan', rating: 4.88, review_count: 267, starRating: 5, price: 475,
    currency: 'JPY', brandColor: '#DC2626',
    description: 'On the 38th floor of a glass tower in Minato, this minimalist penthouse frames Tokyo Tower in every window. Polished concrete, bespoke Japanese joinery, and a 180° city panorama define this space. Walk to Roppongi\'s galleries and restaurants, or spend an evening watching the city lights from the wraparound terrace.',
    shortDescription: '38th-floor penthouse with Tokyo Tower views and wraparound terrace',
    images: [
      'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('City View', '🌆'), am('Tokyo Tower View', '🗼'), am('Free WiFi', '📶'), am('Air Conditioning', '❄️'),
      am('Full Kitchen', '🍳'), am('Rooftop Terrace', '🌅'), am('Concierge', '🛎️'), am('Gym Access', '💪'),
      am('Smart Home', '🏠'), am('Washer/Dryer', '👔'), am('Workspace', '💼'), am('EV Parking', '🚗'),
    ],
    roomTypes: [
      rt('std-7', 'City Room', 475, 2, 'Queen', 'Elegant room with Tokyo Tower view and minimalist Japanese design.', 4,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'], 'https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=400&h=300', 'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=400&h=300', 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300'], totalRooms: 6, bedType: 'Queen', areaSqFt: 420, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: false, bathroomAmenities: ['Rain shower', 'Japanese toiletries', 'Hairdryer', 'Towels'], roomFacilities: ['Tokyo Tower view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Workspace'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 24 hours before check-in' }
      ),
      rt('dlx-7', 'Penthouse Suite', 720, 4, 'King', 'Corner suite with wraparound city views and separate living area.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Balcony'], 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=400&h=300', 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300', 'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=400&h=300'], totalRooms: 2, bedType: 'King', areaSqFt: 720, bathrooms: 2, bedrooms: 2, beds: 2, maxGuests: 4, breakfastIncluded: false, bathroomAmenities: ['Rain shower', 'Deep soaking tub', 'Japanese toiletries', 'Towels', 'Bathrobe'], roomFacilities: ['Wraparound view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Living area', 'Workspace'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 24 hours before check-in' }
      ),
    ],
    reviews: [
      { id: 'r12', author: 'Yuki T.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=48&h=48&fit=crop', rating: 5, date: 'March 2026', comment: 'Unbeatable views of Tokyo Tower. The apartment is sleek and perfectly located.', helpful: 25 },
      { id: 'r13', author: 'James K.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 4, date: 'February 2026', comment: 'Amazing penthouse with stunning night views. Easy access to Roppongi.', helpful: 19 },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: '15:00', checkOutTime: '11:00', phone: '+81-3-1234-5678', email: 'stay@tokyopenthouse.jp',
    coordinates: { lat: 35.66, lng: 139.75 }, lat: 35.66, lng: 139.75, availableRooms: 6, tags: ['City', 'Luxury', 'Modern', 'View'],
    category: 'city',
    hostName: 'Yuki Tanaka', hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop', hostJoined: 'September 2020', hostReviews: 241,
  },
  {
    id: '8', name: 'Amalfi Coastal Retreat', location: 'Positano, Italy', city: 'Positano', country: 'Italy',
    address: 'Positano, Italy', rating: 4.91, review_count: 389, starRating: 5, price: 290,
    currency: 'EUR', brandColor: '#DB2777',
    description: 'Terraced into the ochre-and-white cliffs of Positano, this sun-drenched retreat offers an al-fresco dining terrace, a saltwater pool, and direct steps down to a private beach cove. Hand-painted majolica tiles, lemon groves, and the scent of bougainvillea set the unmistakable Amalfi mood.',
    shortDescription: 'Cliffside retreat with saltwater pool and private beach cove',
    images: [
      'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Private Beach', '🏖️'), am('Sea View', '🌊'), am('Saltwater Pool', '🏊'), am('Free WiFi', '📶'),
      am('Air Conditioning', '❄️'), am('Lemon Grove', '🍋'), am('Outdoor Dining', '🍽️'), am('Vespa Rental', '🛵'),
      am('Boat Tours', '⛵'), am('Breakfast Included', '🍳'), am('Daily Cleaning', '🧹'), am('Wine Cellar', '🍷'),
    ],
    roomTypes: [
      rt('std-8', 'Sea-View Room', 290, 2, 'Queen', 'Bright room with sea views and classic Amalfi decor.', 3,
        ['WiFi', 'AC', 'TV', 'Safe'], 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300', 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300', 'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?w=400&h=300'], totalRooms: 5, bedType: 'Queen', areaSqFt: 350, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Majolica tiles', 'Toiletries', 'Towels'], roomFacilities: ['Sea view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Minibar'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 48 hours before check-in' }
      ),
      rt('dlx-8', 'Terrace Suite', 450, 4, 'King', 'Suite with private al-fresco terrace overlooking the Mediterranean.', 2,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Balcony'], 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=300', 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300', 'https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=400&h=300'], totalRooms: 3, bedType: 'King', areaSqFt: 520, bathrooms: 1, bedrooms: 2, beds: 2, maxGuests: 4, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Bidet', 'Toiletries', 'Towels', 'Bathrobe'], roomFacilities: ['Private terrace', 'Sea view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Outdoor dining'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 48 hours before check-in' }
      ),
    ],
    reviews: [
      { id: 'r14', author: 'Marco E.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'June 2026', comment: 'Positano perfection! The private beach cove is a dream.', helpful: 30 },
      { id: 'r15', author: 'Sophie L.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop', rating: 5, date: 'May 2026', comment: 'The lemon grove and saltwater pool made our anniversary unforgettable.', helpful: 22 },
    ],
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
    checkInTime: '15:00', checkOutTime: '11:00', phone: '+39-089-875-432', email: 'info@amalficoastalretreat.it',
    coordinates: { lat: 40.63, lng: 14.49 }, lat: 40.63, lng: 14.49, availableRooms: 8, tags: ['Beachfront', 'Coastal', 'Romantic', 'Luxury'],
    category: 'beachfront', tag: 'Guest favourite',
    hostName: 'Marco Esposito', hostAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop', hostJoined: 'May 2015', hostReviews: 367,
  },
  {
    id: '9', name: 'Tuscany Countryside Estate', location: 'Siena, Tuscany, Italy', city: 'Siena', country: 'Italy',
    address: 'Siena, Tuscany, Italy', rating: 4.96, review_count: 143, starRating: 5, price: 350,
    currency: 'EUR', brandColor: '#CA8A04',
    description: 'A restored 16th-century farmhouse surrounded by 20 acres of olive groves and vineyards between Siena and San Gimignano. Stone-vaulted ceilings, original terracotta floors, and a frescoed dining hall recall Tuscany\'s Renaissance grandeur. The heated outdoor pool, truffle-hunting excursions, and private wine cellar ensure a stay beyond the ordinary.',
    shortDescription: '16th-century farmhouse with vineyards, pool, and truffle hunting',
    images: [
      'https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Vineyard View', '🍇'), am('Heated Pool', '🏊'), am('Free WiFi', '📶'), am('Air Conditioning', '❄️'),
      am('Full Kitchen', '🍳'), am('Wine Cellar', '🍷'), am('Truffle Hunting', '🐖'), am('Olive Grove', '🫒'),
      am('BBQ', '🔥'), am('Parking', '🅿️'), am('Fireplace', '🔥'), am('Pet Friendly', '🐾'),
    ],
    roomTypes: [
      rt('std-9', 'Countryside Room', 350, 2, 'Queen', 'Charming room with vineyard views and original terracotta floors.', 3,
        ['WiFi', 'AC', 'TV', 'Safe'], 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=300', 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300', 'https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=400&h=300'], totalRooms: 4, bedType: 'Queen', areaSqFt: 400, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Natural toiletries', 'Towels'], roomFacilities: ['Vineyard view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Tea/Coffee maker'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 48 hours before check-in' }
      ),
      rt('dlx-9', 'Estate Suite', 550, 6, 'King', 'Suite with olive grove access and private wine cellar tour.', 2,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'], 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300', 'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=400&h=300', 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300'], totalRooms: 3, bedType: 'King', areaSqFt: 680, bathrooms: 2, bedrooms: 3, beds: 4, maxGuests: 6, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Natural toiletries', 'Towels', 'Bathrobe'], roomFacilities: ['Olive grove view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Sitting area'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 48 hours before check-in' }
      ),
    ],
    reviews: [
      { id: 'r16', author: 'Giulia B.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop', rating: 5, date: 'April 2026', comment: 'Truffle hunting was unforgettable! The estate is straight out of a movie.', helpful: 28 },
      { id: 'r17', author: 'Robert F.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'March 2026', comment: 'A true Tuscan dream. The wine cellar is extraordinary.', helpful: 20 },
    ],
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
    checkInTime: '15:00', checkOutTime: '11:00', phone: '+39-0577-123-456', email: 'info@tuscanyestate.it',
    coordinates: { lat: 43.32, lng: 11.33 }, lat: 43.32, lng: 11.33, availableRooms: 7, tags: ['Countryside', 'Vineyard', 'Luxury', 'Romantic'],
    isSuperhost: true, category: 'countryside',
    hostName: 'Giulia Bianchi', hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', hostJoined: 'February 2014', hostReviews: 139,
  },
  {
    id: '10', name: 'Parisian Haussmann Apartment', location: '7th Arrondissement, Paris', city: 'Paris', country: 'France',
    address: '7th Arrondissement, Paris, France', rating: 4.85, review_count: 521, starRating: 4, price: 220,
    currency: 'EUR', brandColor: '#7C3AED',
    description: 'On the third floor of a classic Haussmann building in the 7th arrondissement, this elegantly proportioned apartment features parquet herringbone floors, ornate plasterwork cornices, and tall French windows with Juliet balconies overlooking a tree-lined boulevard. The Eiffel Tower is a 12-minute walk; Musée d\'Orsay is just around the corner.',
    shortDescription: 'Classic Haussmann apartment near Eiffel Tower with Juliet balconies',
    images: [
      'https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590675560125-0d832b9d719e?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('City View', '🌆'), am('Eiffel Tower Nearby', '🗼'), am('Free WiFi', '📶'), am('Air Conditioning', '❄️'),
      am('Full Kitchen', '🍳'), am('Washer/Dryer', '👔'), am('Workspace', '💼'), am('Espresso Machine', '☕'),
      am('Elevator', '🛗'), am('Secure Entry', '🔒'), am('Metro Nearby', '🚇'), am('Daily Baguette Delivery', '🥖'),
    ],
    roomTypes: [
      rt('std-10', 'Classic Room', 220, 2, 'Queen', 'Elegant Parisian room with herringbone floors and city views.', 2,
        ['WiFi', 'AC', 'TV', 'Safe'], 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300', 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=400&h=300', 'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=400&h=300'], totalRooms: 4, bedType: 'Queen', areaSqFt: 320, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: false, bathroomAmenities: ['Rain shower', 'French toiletries', 'Hairdryer', 'Towels'], roomFacilities: ['City view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Espresso machine', 'Workspace'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 24 hours before check-in' }
      ),
      rt('dlx-10', 'Family Suite', 380, 4, 'King', 'Spacious suite with separate living area and Juliet balcony.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'], 'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300', 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300', 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?w=400&h=300'], totalRooms: 2, bedType: 'King', areaSqFt: 580, bathrooms: 1, bedrooms: 2, beds: 3, maxGuests: 4, breakfastIncluded: false, bathroomAmenities: ['Rain shower', 'French toiletries', 'Hairdryer', 'Towels', 'Bathrobe'], roomFacilities: ['Juliet balcony', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Living area', 'Espresso machine'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 24 hours before check-in' }
      ),
    ],
    reviews: [
      { id: 'r18', author: 'Claire D.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop', rating: 5, date: 'May 2026', comment: 'The perfect Parisian apartment! Steps from the Eiffel Tower and full of character.', helpful: 35 },
      { id: 'r19', author: 'Thomas B.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 4, date: 'April 2026', comment: 'Beautiful apartment in an excellent location. The daily baguette delivery was a lovely touch.', helpful: 24 },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: '15:00', checkOutTime: '11:00', phone: '+33-1-4567-8901', email: 'stay@parisianhaussmann.fr',
    coordinates: { lat: 48.86, lng: 2.32 }, lat: 48.86, lng: 2.32, availableRooms: 4, tags: ['City', 'Paris', 'Eiffel Tower', 'Boutique'],
    category: 'city',
    hostName: 'Claire Dubois', hostAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop', hostJoined: 'October 2013', hostReviews: 498,
  },
  {
    id: '11', name: 'Santorini Cliffside Suite', location: 'Oia, Santorini, Greece', city: 'Oia', country: 'Greece',
    address: 'Oia, Santorini, Greece', rating: 4.95, review_count: 178, starRating: 5, price: 340,
    currency: 'EUR', brandColor: '#2563EB',
    description: 'Carved into the volcanic cliffs of Oia, this iconic blue-domed suite delivers Santorini\'s most celebrated views — the caldera, the Aegean Sea, and sunsets that seem painted by hand. White-washed walls, vaulted ceilings, and hand-picked Cycladic antiques create an intimate, timeless atmosphere. A private terrace with a plunge pool completes the picture.',
    shortDescription: 'Cliffside suite with caldera view and private plunge pool in Oia',
    images: [
      'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=800&h=600&fit=crop',
    ],
    amenities: [
      am('Caldera View', '🌅'), am('Plunge Pool', '🏊'), am('Free WiFi', '📶'), am('Air Conditioning', '❄️'),
      am('Terrace', '🌿'), am('Espresso Machine', '☕'), am('Concierge', '🛎️'), am('Breakfast Included', '🍳'),
      am('Wine Cellar', '🍷'), am('Daily Housekeeping', '🧹'), am('Airport Transfer', '🚐'), am('Turndown Service', '🌙'),
    ],
    roomTypes: [
      rt('std-11', 'Cliffside Room', 340, 2, 'Queen', 'Cozy room with caldera view and traditional Cycladic design.', 4,
        ['WiFi', 'AC', 'TV', 'Mini Bar'], 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300', 'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300', 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300'], totalRooms: 6, bedType: 'Queen', areaSqFt: 320, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Natural toiletries', 'Towels'], roomFacilities: ['Caldera view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Terrace'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 48 hours before check-in' }
      ),
      rt('dlx-11', 'Suite with Plunge Pool', 520, 2, 'King', 'Spacious suite with private plunge pool and panoramic caldera views.', 1,
        ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Private Pool'], 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300&fit=crop',
        { gallery: ['https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=400&h=300', 'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&h=300', 'https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?w=400&h=300'], totalRooms: 3, bedType: 'King', areaSqFt: 480, bathrooms: 1, bedrooms: 1, beds: 1, maxGuests: 2, breakfastIncluded: true, bathroomAmenities: ['Rain shower', 'Natural toiletries', 'Towels', 'Bathrobe'], roomFacilities: ['Private plunge pool', 'Caldera view', 'Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Mini bar', 'Private terrace'], smokingPolicy: 'No smoking', cancellationPolicy: 'Free cancellation 48 hours before check-in' }
      ),
    ],
    reviews: [
      { id: 'r20', author: 'Elena P.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop', rating: 5, date: 'June 2026', comment: 'The sunset from our plunge pool was the most romantic moment of our lives!', helpful: 40 },
      { id: 'r21', author: 'Nikos K.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop', rating: 5, date: 'May 2026', comment: 'Santorini at its finest. The caldera view is worth every penny.', helpful: 32 },
    ],
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
    checkInTime: '15:00', checkOutTime: '11:00', phone: '+30-2286-12345', email: 'reservations@santorinicliffside.gr',
    coordinates: { lat: 36.46, lng: 25.38 }, lat: 36.46, lng: 25.38, availableRooms: 8, tags: ['Caldera View', 'Luxury', 'Romantic', 'Pool'],
    category: 'luxury', tag: 'Rare find',
    hostName: 'Elena Papadopoulos', hostAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop', hostJoined: 'June 2019', hostReviews: 162,
  },
];

/**
 * Add a new property to the shared guest-facing property list
 * (called from host-context when a host creates a new property)
 */
export function addMockProperty(hotel: Hotel): void {
  MOCK_PROPERTIES.push(hotel);
}

/** Update a guest-facing Hotel entry when the host edits a property */
export function updateMockProperty(id: string, updates: Partial<Hotel>): void {
  const idx = MOCK_PROPERTIES.findIndex(h => h.id === id);
  if (idx !== -1) {
    MOCK_PROPERTIES[idx] = { ...MOCK_PROPERTIES[idx], ...updates };
  }
}

/** Remove a guest-facing Hotel entry when the host deletes a property */
export function removeMockProperty(id: string): void {
  const idx = MOCK_PROPERTIES.findIndex(h => h.id === id);
  if (idx !== -1) {
    MOCK_PROPERTIES.splice(idx, 1);
  }
}

export function getHotelById(id: string): Hotel | undefined {
  return MOCK_PROPERTIES.find((h) => h.id === id);
}

export function searchHotels(params: {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}): Hotel[] {
  let results = [...MOCK_PROPERTIES];

  if (params.location) {
    const query = params.location.toLowerCase();
    results = results.filter(
      (h) =>
        h.city.toLowerCase().includes(query) ||
        h.location.toLowerCase().includes(query) ||
        h.name.toLowerCase().includes(query)
    );
  }

  return results;
}

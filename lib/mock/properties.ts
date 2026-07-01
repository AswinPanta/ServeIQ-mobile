/**
 * Mock Property Data
 * Comprehensive demo hotel data for the StayEasy app
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
  images: any[];
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
  tags: string[];
}

const hotelImages = {
  hotel1: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
  ],
  hotel2: [
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
  ],
  hotel3: [
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop',
  ],
};

export const MOCK_PROPERTIES: Hotel[] = [
  {
    id: '1',
    name: 'Grand Hotel Kathmandu',
    location: 'Thamel, Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    address: 'Thamel Marg, Kathmandu 44600, Nepal',
    rating: 4.8,
    review_count: 342,
    starRating: 5,
    price: 8000,
    currency: 'NPR',
    description:
      'Experience luxury and comfort at our 5-star hotel in the heart of Kathmandu. Located in the vibrant Thamel district, we offer world-class amenities and exceptional service. Our hotel features a rooftop restaurant with panoramic views of the Himalayas, a spa and wellness center, and modern conference facilities. Whether you are visiting for business or leisure, our dedicated staff ensures your stay is memorable.',
    shortDescription: '5-star luxury in the heart of Thamel with rooftop dining and spa',
    images: hotelImages.hotel1,
    amenities: [
      { name: 'Free WiFi', icon: '📶' },
      { name: 'Swimming Pool', icon: '🏊' },
      { name: 'Fitness Center', icon: '💪' },
      { name: 'Restaurant', icon: '🍽️' },
      { name: 'Parking', icon: '🅿️' },
      { name: 'Spa', icon: '✨' },
      { name: 'Air Conditioning', icon: '❄️' },
      { name: 'Room Service', icon: '🛎️' },
      { name: 'Laundry', icon: '👔' },
      { name: 'Airport Shuttle', icon: '🚐' },
    ],
    roomTypes: [
      {
        id: 'standard-1',
        name: 'Standard Room',
        price: 8000,
        currency: 'NPR',
        occupancy: 2,
        bed: 'Double Bed',
        description: 'Comfortable room with city views, featuring modern amenities and a cozy atmosphere. Perfect for solo travelers or couples.',
        available: 5,
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe'],
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
      },
      {
        id: 'deluxe-1',
        name: 'Deluxe Room',
        price: 12000,
        currency: 'NPR',
        occupancy: 2,
        bed: 'King Bed',
        description: 'Spacious room with premium amenities, mountain views, and a separate seating area. Includes complimentary breakfast.',
        available: 3,
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Balcony', 'Coffee Maker'],
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
      },
      {
        id: 'suite-1',
        name: 'Executive Suite',
        price: 20000,
        currency: 'NPR',
        occupancy: 4,
        bed: 'King Bed + Sofa Bed',
        description: 'Luxury suite with separate living room, panoramic mountain views, and exclusive lounge access. Perfect for families or extended stays.',
        available: 2,
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Balcony', 'Jacuzzi', 'Living Room'],
        image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'r1',
        author: 'Sarah Mitchell',
        rating: 5,
        date: '2026-06-15',
        comment: 'Absolutely stunning hotel! The rooftop restaurant has breathtaking views of the mountains. Staff went above and beyond to make our anniversary special.',
        helpful: 24,
      },
      {
        id: 'r2',
        author: 'Raj Patel',
        rating: 4,
        date: '2026-06-10',
        comment: 'Great location in Thamel, walking distance to shops and restaurants. The spa was excellent. Only minor issue was slow WiFi during peak hours.',
        helpful: 18,
      },
      {
        id: 'r3',
        author: 'Emma Thompson',
        rating: 5,
        date: '2026-05-28',
        comment: 'Best hotel we stayed at during our Nepal trip. The breakfast buffet had both local and international options. Highly recommend!',
        helpful: 31,
      },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in. Cancellations within 24 hours incur a 1-night charge.',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    phone: '+977-1-4123456',
    email: 'reservations@grandhotelnepal.com',
    website: 'https://grandhotelnepal.com',
    coordinates: { lat: 27.7172, lng: 85.324 },
    availableRooms: 10,
    tags: ['Luxury', 'Mountain View', 'Spa', 'Restaurant'],
  },
  {
    id: '2',
    name: 'Pokhara Lakeside Resort',
    location: 'Lakeside, Pokhara',
    city: 'Pokhara',
    country: 'Nepal',
    address: 'Lakeside Road, Pokhara 33700, Nepal',
    rating: 4.6,
    review_count: 218,
    starRating: 4,
    price: 6500,
    currency: 'NPR',
    description:
      'Escape to our lakeside resort offering stunning views of Phewa Lake and the Annapurna range. Our resort combines traditional Nepali hospitality with modern comforts. Enjoy kayaking on the lake, relax by the infinity pool, or explore the vibrant Lakeside area. Perfect for adventure seekers and relaxation enthusiasts alike.',
    shortDescription: 'Lakeside resort with Annapurna views and infinity pool',
    images: hotelImages.hotel2,
    amenities: [
      { name: 'Free WiFi', icon: '📶' },
      { name: 'Lake View', icon: '🌊' },
      { name: 'Infinity Pool', icon: '🏊' },
      { name: 'Restaurant', icon: '🍽️' },
      { name: 'Garden', icon: '🌿' },
      { name: 'Kayaking', icon: '🚣' },
      { name: 'Free Parking', icon: '🅿️' },
      { name: 'Bicycle Rental', icon: '🚴' },
    ],
    roomTypes: [
      {
        id: 'lakeview-1',
        name: 'Lake View Room',
        price: 6500,
        currency: 'NPR',
        occupancy: 2,
        bed: 'Queen Bed',
        description: 'Wake up to stunning lake views. Modern room with private balcony overlooking Phewa Lake.',
        available: 4,
        amenities: ['WiFi', 'AC', 'TV', 'Balcony', 'Lake View'],
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
      },
      {
        id: 'premium-2',
        name: 'Premium Lake Suite',
        price: 11000,
        currency: 'NPR',
        occupancy: 3,
        bed: 'King Bed',
        description: 'Spacious suite with panoramic lake and mountain views. Includes separate seating area and premium amenities.',
        available: 2,
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Lake View', 'Coffee Maker'],
        image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=400&h=300&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'r4',
        author: 'Michael Chen',
        rating: 5,
        date: '2026-06-12',
        comment: 'The lake view from our room was absolutely incredible. Woke up every morning to the sight of the Annapurna range. Staff organized a amazing paragliding trip for us.',
        helpful: 15,
      },
      {
        id: 'r5',
        author: 'Lisa Anderson',
        rating: 4,
        date: '2026-05-20',
        comment: 'Beautiful resort, great food. The infinity pool overlooking the lake is magical at sunset. Would definitely come back!',
        helpful: 12,
      },
    ],
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Cancellations within 48 hours incur a 50% charge.',
    checkInTime: '13:00',
    checkOutTime: '11:00',
    phone: '+977-61-523456',
    email: 'info@pokhararesort.com',
    coordinates: { lat: 28.2096, lng: 83.9856 },
    availableRooms: 6,
    tags: ['Lake View', 'Mountain View', 'Adventure', 'Pool'],
  },
  {
    id: '3',
    name: 'Heritage Boutique Hotel',
    location: 'Boudha, Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    address: 'Boudhanath, Kathmandu 44600, Nepal',
    rating: 4.9,
    review_count: 156,
    starRating: 4,
    price: 4500,
    currency: 'NPR',
    description:
      'A charming boutique hotel near the UNESCO World Heritage Site of Boudhanath Stupa. Our hotel showcases traditional Newari architecture with modern comforts. Each room is uniquely decorated with local art and crafts. Experience authentic Nepali hospitality while being just steps away from one of the largest stupas in the world.',
    shortDescription: 'Boutique charm near Boudhanath Stupa with Newari architecture',
    images: hotelImages.hotel3,
    amenities: [
      { name: 'Free WiFi', icon: '📶' },
      { name: 'Rooftop Terrace', icon: '🌅' },
      { name: 'Restaurant', icon: '🍽️' },
      { name: 'Garden', icon: '🌿' },
      { name: 'Cultural Tours', icon: '🏛️' },
      { name: 'Yoga Classes', icon: '🧘' },
      { name: 'Free Parking', icon: '🅿️' },
    ],
    roomTypes: [
      {
        id: 'heritage-1',
        name: 'Heritage Room',
        price: 4500,
        currency: 'NPR',
        occupancy: 2,
        bed: 'Double Bed',
        description: 'Traditional Newari-style room with handcrafted furniture and local artwork. Cozy and authentic.',
        available: 3,
        amenities: ['WiFi', 'AC', 'TV', 'Garden View'],
        image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
      },
      {
        id: 'stupa-2',
        name: 'Stupa View Room',
        price: 7000,
        currency: 'NPR',
        occupancy: 2,
        bed: 'Queen Bed',
        description: 'Premium room with stunning views of Boudhanath Stupa. Watch the prayer flags flutter from your private balcony.',
        available: 1,
        amenities: ['WiFi', 'AC', 'TV', 'Balcony', 'Stupa View', 'Mini Bar'],
        image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=300&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'r6',
        author: 'David Wilson',
        rating: 5,
        date: '2026-06-08',
        comment: 'An absolute gem! The location is perfect for exploring Boudhanath. The rooftop terrace has amazing stupa views. Staff arranged a wonderful monastery visit for us.',
        helpful: 22,
      },
      {
        id: 'r7',
        author: 'Priya Sharma',
        rating: 5,
        date: '2026-05-15',
        comment: 'Loved the traditional architecture and warm hospitality. The yoga sessions at sunrise were magical. Will definitely return!',
        helpful: 19,
      },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    phone: '+977-1-4912345',
    email: 'stay@heritagehotel.com',
    coordinates: { lat: 27.7215, lng: 85.362 },
    availableRooms: 4,
    tags: ['Heritage', 'Cultural', 'Boutique', 'Stupa View'],
  },
];

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

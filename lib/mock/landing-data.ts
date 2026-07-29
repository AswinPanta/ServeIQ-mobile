export const PROPERTY_TYPES = [
  { type: 'Hotels', subtitle: 'Comfort & convenience', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&auto=format' },
  { type: 'Apartments', subtitle: 'Private spaces, just like home', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop&auto=format' },
  { type: 'Villa', subtitle: 'Luxury and comfort', imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop&auto=format' },
  { type: 'Resort', subtitle: 'Relax & unwind', imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&auto=format' },
  { type: 'Others', subtitle: 'Unique & one-of-a-kind', imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop&auto=format' },
];

export const HERO_HOTELS = [
  { id: 1, location: 'Santorini, Greece', tagline: 'Sea view villas', price: 198, rating: 4.8, image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&h=300&fit=crop&auto=format' },
  { id: 2, location: 'Bali, Indonesia', tagline: 'Jungle retreats', price: 112, rating: 4.7, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop&auto=format' },
  { id: 3, location: 'Kyoto, Japan', tagline: 'Traditional stays', price: 156, rating: 4.9, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop&auto=format' },
];

export const VIBES = [
  { label: 'All', icon: 'grid' as const },
  { label: 'Beach', icon: 'compass' as const },
  { label: 'Mountains', icon: 'mountain' as const },
  { label: 'City', icon: 'building' as const },
  { label: 'Countryside', icon: 'tree' as const },
  { label: 'Design', icon: 'home' as const },
  { label: 'Trending', icon: 'trending' as const },
];

export const TRENDING_DESTINATIONS = [
  { id: '1', name: 'The Annapurna Lodge', location: 'Pokhara, Nepal', rating: 4.8, reviews: 2453, price: 180, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format', type: 'Mountain Lodge' },
  { id: '2', name: 'Heritage Garden Hotel', location: 'Kathmandu, Nepal', rating: 4.5, reviews: 1876, price: 95, image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&h=300&fit=crop&auto=format', type: 'Heritage Hotel' },
  { id: '3', name: 'Himalayan Eco Resort', location: 'Chitwan, Nepal', rating: 4.7, reviews: 3102, price: 420, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop&auto=format', type: 'Eco Resort' },
  { id: '4', name: 'Mountain View Chalets', location: 'Nagarkot, Nepal', rating: 4.9, reviews: 2891, price: 580, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop&auto=format', type: 'Mountain Chalet' },
  { id: '5', name: 'Caldera Sunset Villas', location: 'Santorini, Greece', rating: 4.9, reviews: 1245, price: 340, image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop&auto=format', type: 'Luxury Villa' },
  { id: '6', name: 'Bali Jungle Retreat', location: 'Ubud, Bali', rating: 4.6, reviews: 1567, price: 195, image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&h=300&fit=crop&auto=format', type: 'Jungle Retreat' },
  { id: '7', name: 'Tokyo Sky Tower Hotel', location: 'Tokyo, Japan', rating: 4.8, reviews: 987, price: 475, image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400&h=300&fit=crop&auto=format', type: 'City Hotel' },
  { id: '8', name: 'Amalfi Coast Residence', location: 'Amalfi, Italy', rating: 4.7, reviews: 1123, price: 290, image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&h=300&fit=crop&auto=format', type: 'Coastal Residence' },
];

export const POPULAR_DESTINATIONS = [
  { city: 'Kathmandu', country: 'Nepal', countryCode: 'NP', rating: 4.8, price: 65, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=600&fit=crop&auto=format', properties: 420 },
  { city: 'Santorini', country: 'Greece', countryCode: 'GR', rating: 4.7, price: 189, image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&h=600&fit=crop&auto=format', properties: 324 },
  { city: 'Kyoto', country: 'Japan', countryCode: 'JP', rating: 4.9, price: 176, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=600&fit=crop&auto=format', properties: 412 },
  { city: 'Cinque Terre', country: 'Italy', countryCode: 'IT', rating: 4.7, price: 182, image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&h=600&fit=crop&auto=format', properties: 567 },
  { city: 'Queenstown', country: 'New Zealand', countryCode: 'NZ', rating: 4.8, price: 185, image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400&h=600&fit=crop&auto=format', properties: 189 },
  { city: 'Zürich', country: 'Switzerland', countryCode: 'CH', rating: 4.7, price: 192, image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&h=600&fit=crop&auto=format', properties: 245 },
  { city: 'Dubai', country: 'UAE', countryCode: 'AE', rating: 4.8, price: 186, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=600&fit=crop&auto=format', properties: 678 },
  { city: 'Bali', country: 'Indonesia', countryCode: 'ID', rating: 4.6, price: 145, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=600&fit=crop&auto=format', properties: 890 },
  { city: 'Malé', country: 'Maldives', countryCode: 'MV', rating: 4.9, price: 320, image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=600&fit=crop&auto=format', properties: 156 },
  { city: 'Bangkok', country: 'Thailand', countryCode: 'TH', rating: 4.7, price: 78, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=600&fit=crop&auto=format', properties: 1240 },
  { city: 'Paris', country: 'France', countryCode: 'FR', rating: 4.8, price: 210, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=600&fit=crop&auto=format', properties: 980 },
  { city: 'Barcelona', country: 'Spain', countryCode: 'ES', rating: 4.7, price: 155, image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=600&fit=crop&auto=format', properties: 756 },
];

export const TRUST_BADGES = [
  { title: 'Best Price Guarantee', description: "Find a lower price? We'll match it and give you 10% off." },
  { title: 'Safe & Secure', description: 'Book with confidence. 24/7 support.' },
  { title: 'Flexible Booking', description: 'Free cancellation on most reservations.' },
  { title: '24/7 Support', description: 'Always here whenever you need us.' },
];

export const TESTIMONIALS = [
  { id: 1, name: 'Jenny Wilson', role: 'Travel enthusiast', quote: 'StayEasy made our trip so simple! The booking process was quick, easy, and stress-free.' },
  { id: 2, name: 'Lola Alexander', role: 'Frequent traveler', quote: 'From booking to check out, everything was seamless and stress-free. Absolutely loved it!' },
  { id: 3, name: 'Robert Fox', role: 'Digital nomad', quote: 'Amazing customer service and great hotel options. Highly recommended!' },
  { id: 4, name: 'Sarah Chen', role: 'Adventure seeker', quote: "Found the perfect hidden gem thanks to StayEasy. Will definitely book again!" },
  { id: 5, name: 'Michael Brown', role: 'Family traveler', quote: "The best travel experience we've had. Everything was organized perfectly." },
  { id: 6, name: 'Emma Davis', role: 'Solo traveler', quote: 'Quick bookings, great prices, and wonderful customer support. 10/10!' },
];

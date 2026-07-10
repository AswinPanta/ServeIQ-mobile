export interface Destination {
  id: string;
  name: string;
  image: string;
  hotelCount: number;
  experiences: string[];
}

export const destinations: Destination[] = [
  {
    id: '1',
    name: 'Kathmandu',
    image: 'https://images.unsplash.com/photo-1529094344530-42b4571ac6b8?w=600&h=400&fit=crop',
    hotelCount: 120,
    experiences: ['Temple Hopping', 'Street Food', 'Heritage Walk', 'Boudhanath Stupa', 'Pashupatinath'],
  },
  {
    id: '2',
    name: 'Pokhara',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=400&fit=crop',
    hotelCount: 85,
    experiences: ['Paragliding', 'Phewa Lake', 'Sunrise Views', 'Zip-lining', 'Annapurna Views'],
  },
  {
    id: '3',
    name: 'Bhaktapur',
    image: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=600&h=400&fit=crop',
    hotelCount: 25,
    experiences: ['Heritage', 'Photography', 'Pottery Square', 'Newari Culture', 'Durbar Square'],
  },
  {
    id: '4',
    name: 'Chitwan',
    image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=600&h=400&fit=crop',
    hotelCount: 35,
    experiences: ['Wildlife Safari', 'Elephant Ride', 'Jungle Walk', 'Canoe Ride', 'Rhino Spotting'],
  },
  {
    id: '5',
    name: 'Lumbini',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=400&fit=crop',
    hotelCount: 15,
    experiences: ['Pilgrimage', 'Peace Pagoda', 'Sacred Garden', 'Mayadevi Temple', 'Meditation'],
  },
  {
    id: '6',
    name: 'Namche Bazaar',
    image: 'https://images.pexels.com/photos/37100095/pexels-photo-37100095.jpeg?w=600&h=400&fit=crop',
    hotelCount: 20,
    experiences: ['Everest Trek', 'Sherpa Culture', 'Mountain Views', 'Sherpa Museum', 'Acclimatization Hike'],
  },
  {
    id: '7',
    name: 'Nagarkot',
    image: 'https://images.pexels.com/photos/32132398/pexels-photo-32132398.jpeg?w=600&h=400&fit=crop',
    hotelCount: 18,
    experiences: ['Himalayan Sunrise', 'Hiking', 'Village Walk', '8 Mountain Ranges', 'Changu Narayan'],
  },
  {
    id: '8',
    name: 'Patan',
    image: 'https://images.pexels.com/photos/30954090/pexels-photo-30954090.jpeg?w=600&h=400&fit=crop',
    hotelCount: 12,
    experiences: ['Art & Architecture', 'Museums', 'Newari Culture', 'Krishna Mandir', 'Golden Temple'],
  },
];

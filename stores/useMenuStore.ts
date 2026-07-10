import { create } from 'zustand';
import type { MenuItem } from '@/types/api';

interface MenuStore {
  items: MenuItem[];
  categories: string[];
  isLoading: boolean;
  setItems: (items: MenuItem[]) => void;
  getItemsByCategory: (category: string) => MenuItem[];
  getItem: (id: string) => MenuItem | undefined;
  toggleAvailability: (itemId: string) => void;
}

const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil', price: 550, category: 'Food', is_veg: true, is_available: true, prep_time: 15, tags: ['pizza', 'italian'], modifiers: [{ id: 'mod-size', name: 'Size', options: [{ label: 'Regular', price: 0 }, { label: 'Large', price: 200 }, { label: 'Extra Large', price: 400 }] }, { id: 'mod-crust', name: 'Crust', options: [{ label: 'Standard', price: 0 }, { label: 'Thin Crust', price: 50 }, { label: 'Stuffed', price: 100 }] }] },
  { id: 'm2', name: 'Chicken Burger', description: 'Grilled chicken patty with lettuce, tomato, mayo', price: 450, category: 'Food', is_veg: false, is_available: true, prep_time: 12, tags: ['burger', 'grill'], modifiers: [{ id: 'mod-spice', name: 'Spice Level', options: [{ label: 'Mild', price: 0 }, { label: 'Medium', price: 0 }, { label: 'Hot', price: 0 }] }] },
  { id: 'm3', name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, caesar dressing', price: 380, category: 'Food', is_veg: true, is_available: true, prep_time: 8, tags: ['salad', 'healthy'] },
  { id: 'm4', name: 'Mixed Grill Platter', description: 'Assorted grilled meats with sides', price: 1200, category: 'Food', is_veg: false, is_available: true, prep_time: 25, tags: ['grill', 'premium'], modifiers: [{ id: 'mod-portion', name: 'Portion', options: [{ label: 'Single', price: 0 }, { label: 'Double', price: 800 }] }] },
  { id: 'm5', name: 'French Fries', description: 'Crispy golden fries with ketchup', price: 180, category: 'Food', is_veg: true, is_available: true, prep_time: 8, tags: ['sides', 'snack'] },
  { id: 'm6', name: 'Pasta Alfredo', description: 'Creamy white sauce pasta with mushrooms', price: 420, category: 'Food', is_veg: true, is_available: true, prep_time: 14, tags: ['pasta', 'italian'], modifiers: [{ id: 'mod-addon', name: 'Add-ons', options: [{ label: 'Extra Cheese', price: 60 }, { title: 'Grilled Chicken', price: 120 } as any] }] },
  { id: 'm7', name: 'Iced Tea', description: 'Fresh brewed iced tea with lemon', price: 120, category: 'Beverages', is_veg: true, is_available: true, prep_time: 3, tags: ['drink', 'cold'] },
  { id: 'm8', name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 180, category: 'Beverages', is_veg: true, is_available: true, prep_time: 4, tags: ['juice', 'fresh'] },
  { id: 'm9', name: 'Espresso', description: 'Double shot espresso', price: 150, category: 'Beverages', is_veg: true, is_available: true, prep_time: 3, tags: ['coffee', 'hot'] },
  { id: 'm10', name: 'Mango Lassi', description: 'Creamy yogurt mango drink', price: 200, category: 'Beverages', is_veg: true, is_available: true, prep_time: 4, tags: ['drink', 'traditional'] },
  { id: 'm11', name: 'Chocolate Brownie', description: 'Warm chocolate brownie with ice cream', price: 320, category: 'Desserts', is_veg: true, is_available: true, prep_time: 10, tags: ['chocolate', 'warm'] },
  { id: 'm12', name: 'Gulab Jamun', description: 'Traditional milk dumplings in rose syrup', price: 180, category: 'Desserts', is_veg: true, is_available: true, prep_time: 5, tags: ['traditional', 'sweet'] },
  { id: 'm13', name: 'Tiramisu', description: 'Classic Italian coffee dessert', price: 350, category: 'Desserts', is_veg: false, is_available: true, prep_time: 5, tags: ['italian', 'coffee'] },
  { id: 'm14', name: 'Mineral Water', description: '1L bottled water', price: 60, category: 'Beverages', is_veg: true, is_available: true, prep_time: 1, tags: ['water'] },
  { id: 'm15', name: 'Club Sandwich', description: 'Grilled triple-layer sandwich with fries', price: 380, category: 'Food', is_veg: false, is_available: true, prep_time: 12, tags: ['sandwich', 'grill'] },
  { id: 'm16', name: 'Butter Chicken', description: 'Creamy tomato butter chicken with naan', price: 520, category: 'Food', is_veg: false, is_available: true, prep_time: 20, tags: ['curry', 'indian'], modifiers: [{ id: 'mod-spice2', name: 'Spice Level', options: [{ label: 'Mild', price: 0 }, { label: 'Medium', price: 0 }, { label: 'Hot', price: 0 }] }] },
];

export const useMenuStore = create<MenuStore>((set, get) => ({
  items: INITIAL_MENU_ITEMS,
  categories: ['Food', 'Beverages', 'Desserts'],
  isLoading: false,

  setItems: (items) => set({ items }),

  getItemsByCategory: (category) => get().items.filter((item) => item.category === category && item.is_available),

  getItem: (id) => get().items.find((item) => item.id === id),

  toggleAvailability: (itemId) => set((state) => ({
    items: state.items.map((item) => item.id === itemId ? { ...item, is_available: !item.is_available } : item),
  })),
}));

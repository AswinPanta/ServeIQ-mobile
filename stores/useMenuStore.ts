import { create } from 'zustand';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
  is_veg: boolean;
  tags: string[];
  modifiers?: { id: string; name: string; type: string; options: { label: string; price: number }[] }[];
}

interface MenuStore {
  items: MenuItem[];
  toggleAvailability: (itemId: string) => void;
}

const DEFAULT_ITEMS: MenuItem[] = [
  { id: 'f1', name: 'Butter Chicken', price: 450, category: 'Food', is_available: true, is_veg: false, tags: ['curry', 'chicken'], modifiers: [{ id: 'm1', name: 'Spice Level', type: 'single', options: [{ label: 'Mild', price: 0 }, { label: 'Medium', price: 0 }, { label: 'Spicy', price: 0 }] }] },
  { id: 'f2', name: 'Dal Makhani', price: 350, category: 'Food', is_available: true, is_veg: true, tags: ['curry', 'veg'] },
  { id: 'f3', name: 'Naan (2 pcs)', price: 80, category: 'Food', is_available: true, is_veg: true, tags: ['bread'] },
  { id: 'f4', name: 'Biryani', price: 420, category: 'Food', is_available: true, is_veg: false, tags: ['rice'] },
  { id: 'f5', name: 'Paneer Tikka', price: 380, category: 'Food', is_available: true, is_veg: true, tags: ['starter'] },
  { id: 'f6', name: 'Chicken Curry', price: 400, category: 'Food', is_available: true, is_veg: false, tags: ['curry', 'chicken'] },
  { id: 'b1', name: 'Masala Chai', price: 60, category: 'Beverages', is_available: true, is_veg: true, tags: ['tea', 'coffee'] },
  { id: 'b2', name: 'Fresh Lime Soda', price: 120, category: 'Beverages', is_available: true, is_veg: true, tags: ['juice', 'drink'] },
  { id: 'b3', name: 'Mango Lassi', price: 150, category: 'Beverages', is_available: true, is_veg: true, tags: ['juice', 'drink'] },
  { id: 'b4', name: 'Mineral Water', price: 40, category: 'Beverages', is_available: true, is_veg: true, tags: ['water'] },
  { id: 'b5', name: 'Soft Drink', price: 80, category: 'Beverages', is_available: true, is_veg: true, tags: ['drink'] },
  { id: 'd1', name: 'Gulab Jamun (2 pcs)', price: 120, category: 'Desserts', is_available: true, is_veg: true, tags: ['dessert'] },
  { id: 'd2', name: 'Ice Cream (1 scoop)', price: 100, category: 'Desserts', is_available: true, is_veg: true, tags: ['dessert'] },
  { id: 'd3', name: 'Kheer', price: 140, category: 'Desserts', is_available: true, is_veg: true, tags: ['dessert'] },
  { id: 'd4', name: 'Brownie', price: 200, category: 'Desserts', is_available: true, is_veg: true, tags: ['dessert'] },
];

export const useMenuStore = create<MenuStore>((set) => ({
  items: DEFAULT_ITEMS,

  toggleAvailability: (itemId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, is_available: !i.is_available } : i
      ),
    })),
}));

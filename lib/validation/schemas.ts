import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required').regex(/^\+?[\d\s-]{7,15}$/, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/\d/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/\d/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const guestInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required').regex(/^\+?[\d\s-]{7,15}$/, 'Invalid phone number'),
  country: z.string().min(1, 'Country is required'),
  specialRequests: z.string().optional(),
});

export const propertyGeneralInfoSchema = z.object({
  name: z.string().min(2, 'Property name must be at least 2 characters'),
  type: z.string().min(1, 'Property type is required'),
  description: z.string().optional(),
  total_rooms: z.number().min(1, 'Must have at least 1 room'),
  number_of_floors: z.number().min(1, 'Must have at least 1 floor'),
  year_built: z.number().optional(),
  phone_number: z.string().min(1, 'Phone is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const propertyLocationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const discountCodeSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(50),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  discount_value: z.number().min(0.01, 'Discount must be greater than 0'),
  min_amount: z.number().min(0).optional(),
  max_uses: z.number().min(1).optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
}).refine((data) => {
  if (data.type === 'PERCENTAGE') return data.discount_value <= 100;
  return true;
}, { message: 'Percentage discount cannot exceed 100%', path: ['discount_value'] });

export const specialOfferSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  discount_percentage: z.number().min(1, 'Must be at least 1%').max(100, 'Cannot exceed 100%'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  is_active: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type PropertyGeneralInfoInput = z.infer<typeof propertyGeneralInfoSchema>;
export type PropertyLocationInput = z.infer<typeof propertyLocationSchema>;
export type DiscountCodeInput = z.infer<typeof discountCodeSchema>;
export type SpecialOfferInput = z.infer<typeof specialOfferSchema>;

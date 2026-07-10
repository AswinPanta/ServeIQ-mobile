import { api, handleResponse } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api-config';
import type {
  Property, RoomTypeDef, AdminRoom, AdminDiscountCode, SpecialOffer, AdminRoomStatus,
} from '@/types/api';

async function apiGet<T>(endpoint: string, fallback: () => T): Promise<T> {
  try {
    const response = await api.get(endpoint);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch {
    return fallback();
  }
}

async function apiPost<T, D>(endpoint: string, data: D, fallback: () => T): Promise<T> {
  try {
    const response = await api.post(endpoint, data);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch {
    return fallback();
  }
}

async function apiPatch<T, D>(endpoint: string, data: D, fallback: () => T): Promise<T> {
  try {
    const response = await api.patch(endpoint, data);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch {
    return fallback();
  }
}

async function apiDelete(endpoint: string): Promise<boolean> {
  try {
    const response = await api.delete(endpoint);
    return response.ok;
  } catch {
    return false;
  }
}

export const hostApi = {
  getProperties: (fallback: () => Property[]) =>
    apiGet<Property[]>(API_ENDPOINTS.PROPERTIES.GET_ALL, fallback),

  createProperty: (data: Partial<Property>, fallback: () => Property) =>
    apiPost<Property, Partial<Property>>(API_ENDPOINTS.PROPERTIES.CREATE, data, fallback),

  updateProperty: (id: string, data: Partial<Property>, fallback: () => Property) =>
    apiPatch<Property, Partial<Property>>(API_ENDPOINTS.PROPERTIES.UPDATE(id), data, fallback),

  deleteProperty: (id: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.DELETE(id)),

  getRooms: (propertyId: string, fallback: () => AdminRoom[]) =>
    apiGet<AdminRoom[]>(API_ENDPOINTS.PROPERTIES.GET_ROOMS(propertyId), fallback),

  createRoom: (propertyId: string, data: Partial<AdminRoom>, fallback: () => AdminRoom) =>
    apiPost<AdminRoom, Partial<AdminRoom>>(API_ENDPOINTS.PROPERTIES.CREATE_ROOM(propertyId), data, fallback),

  updateRoom: (propertyId: string, roomId: string, data: Partial<AdminRoom>, fallback: () => AdminRoom) =>
    apiPatch<AdminRoom, Partial<AdminRoom>>(API_ENDPOINTS.PROPERTIES.UPDATE_ROOM(propertyId, roomId), data, fallback),

  deleteRoom: (propertyId: string, roomId: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.DELETE_ROOM(propertyId, roomId)),

  getAmenities: (fallback: () => string[]) =>
    apiGet<string[]>(API_ENDPOINTS.PROPERTIES.GET_AMENITIES, fallback),

  getDiscountCodes: (propertyId: string, fallback: () => AdminDiscountCode[]) =>
    apiGet<AdminDiscountCode[]>(`/pms/properties/${propertyId}/discount-codes/`, fallback),

  createDiscountCode: (propertyId: string, data: Partial<AdminDiscountCode>, fallback: () => AdminDiscountCode) =>
    apiPost<AdminDiscountCode, Partial<AdminDiscountCode>>(`/pms/properties/${propertyId}/discount-codes/`, data, fallback),

  updateDiscountCode: (propertyId: string, discountId: string, data: Partial<AdminDiscountCode>, fallback: () => AdminDiscountCode) =>
    apiPatch<AdminDiscountCode, Partial<AdminDiscountCode>>(`/pms/properties/${propertyId}/discount-codes/${discountId}`, data, fallback),

  deleteDiscountCode: (propertyId: string, discountId: string) =>
    apiDelete(`/pms/properties/${propertyId}/discount-codes/${discountId}`),

  getSpecialOffers: (propertyId: string, fallback: () => SpecialOffer[]) =>
    apiGet<SpecialOffer[]>(`/pms/${propertyId}/special-offers`, fallback),

  createSpecialOffer: (propertyId: string, data: Partial<SpecialOffer>, fallback: () => SpecialOffer) =>
    apiPost<SpecialOffer, Partial<SpecialOffer>>(`/pms/${propertyId}/special-offers`, data, fallback),

  updateSpecialOffer: (propertyId: string, offerId: string, data: Partial<SpecialOffer>, fallback: () => SpecialOffer) =>
    apiPatch<SpecialOffer, Partial<SpecialOffer>>(`/pms/${propertyId}/special-offers/${offerId}`, data, fallback),

  deleteSpecialOffer: (propertyId: string, offerId: string) =>
    apiDelete(`/pms/${propertyId}/special-offers/${offerId}`),
};

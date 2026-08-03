# StayEasy — API Contracts

> Source of Truth v1.0 — July 2026
> Backend: FastAPI at `https://stay-easy-sizw.onrender.com/api/v1`

---

## API Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GUEST API          HOST API           OPERATIONS API      SUPERADMIN API   │
│  ─────────          ────────           ──────────────      ──────────────   │
│  /auth/*            /pms/*             /pms/check-in       /tenants/*       │
│  /search/*          /properties/*      /pms/check-out      /platform/*      │
│  /bookings/*        /rooms/*           /pms/hk-tasks       /system/*        │
│  /reviews/*         /discount-codes/*  /pms/pos/*          /admin/*         │
│  /guest/*           /special-offers/*  /pms/kds/*          /support/*       │
│                     /rate-plans/*      /pms/analytics                       │
│                     /staff/*           /pms/folios                           │
│                     /shifts/*          /pms/payments                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication API

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "phone": "string",
  "nationality": "string",
  "portal": "guest" | "host" | "operations" | "superadmin"
}
```

**Response (201):**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "portal": "guest",
    "is_verified": false,
    "created_at": "2026-07-24T10:00:00Z"
  }
}
```

**Errors:**
- `400` — Invalid input / email already exists
- `422` — Validation error

---

### POST /auth/login
Authenticate user and receive tokens.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "portal": "guest" | "host" | "operations" | "superadmin"
}
```

**Response (200):**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "string",
    "portal": "string"
  }
}
```

**Errors:**
- `401` — Invalid credentials
- `403` — Account suspended

---

### POST /auth/verify-otp
Verify email/phone OTP.

**Request:**
```json
{
  "email": "string",
  "otp": "string"
}
```

**Response (200):**
```json
{
  "verified": true,
  "message": "Email verified successfully"
}
```

---

### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refresh_token": "string"
}
```

**Response (200):**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

---

### POST /auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 2. Property API (Host Portal)

### GET /pms/properties/
List all properties for the authenticated host.

**Headers:** `Authorization: Bearer <host_token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |
| `search` | string | Search by name |
| `type` | PropertyType | Filter by type |
| `is_active` | boolean | Filter by status |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "name": "Grand Himalaya Hotel",
      "type": "HOTEL",
      "city": "Kathmandu",
      "country": "Nepal",
      "total_rooms": 48,
      "is_active": true,
      "brand_color": "#2563EB",
      "logo_url": "https://...",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

---

### POST /pms/properties/
Create a new property.

**Request:**
```json
{
  "name": "string",
  "type": "HOTEL",
  "description": "string",
  "country": "Nepal",
  "state": "Bagmati",
  "city": "Kathmandu",
  "zip_code": "44600",
  "address": "Thamel, Kathmandu",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "check_in_time_from": "14:00",
  "check_in_time_to": "12:00",
  "check_out_time_from": "00:00",
  "check_out_time_to": "11:00",
  "number_of_floors": 3,
  "total_rooms": 48,
  "year_built": 2020,
  "amenities": ["WiFi", "Parking", "Restaurant"],
  "currency": "NPR",
  "timezone": "Asia/Kathmandu",
  "cancellation_policy": "MODERATE"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Grand Himalaya Hotel",
  "created_at": "2026-07-24T10:00:00Z"
}
```

---

### PATCH /pms/properties/{id}
Update a property.

**Request:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "brand_color": "#2563EB (optional)",
  "logo_url": "https://... (optional)",
  "is_active": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "updated_at": "2026-07-24T12:00:00Z"
}
```

---

### DELETE /pms/properties/{id}
Soft-delete a property.

**Response (200):**
```json
{
  "message": "Property deleted successfully"
}
```

---

## 3. Room Type API

### GET /pms/properties/{property_id}/room-types
List room types for a property.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "property_id": "uuid",
      "room_type_name": "Deluxe",
      "description": "Spacious room with mountain view",
      "max_occupancy": 3,
      "bed_configuration": "King + Twin",
      "view_type": "Mountain",
      "amenities": ["WiFi", "AC", "Mini Bar"],
      "base_rate": 4999,
      "extra_charges": [
        {
          "id": "uuid",
          "name": "Late Check-out",
          "price": 1000,
          "charge_type": "one_time"
        }
      ]
    }
  ]
}
```

---

### POST /pms/properties/{property_id}/room-types
Create a room type.

**Request:**
```json
{
  "room_type_name": "Suite",
  "description": "Luxury suite with panoramic view",
  "max_occupancy": 5,
  "bed_configuration": "King + 2 Twin",
  "view_type": "Panoramic",
  "amenities": ["WiFi", "AC", "Mini Bar", "Jacuzzi"],
  "base_rate": 9999,
  "rate_plan": "Standard Rate"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "room_type_name": "Suite",
  "created_at": "2026-07-24T10:00:00Z"
}
```

---

### PATCH /pms/properties/{property_id}/room-types/{id}
Update a room type.

---

### DELETE /pms/properties/{property_id}/room-types/{id}
Delete a room type.

---

## 4. Room API

### GET /pms/properties/{property_id}/rooms
List all rooms for a property.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | AdminRoomStatus | Filter by status |
| `floor` | number | Filter by floor |
| `room_type_id` | uuid | Filter by type |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "property_id": "uuid",
      "room_type_id": "uuid",
      "room_name": "Room 101",
      "floor_number": 1,
      "max_adults": 2,
      "max_children": 1,
      "base_rate": 2499,
      "status": "AVAILABLE",
      "smoking": false,
      "accessible": true,
      "blocked_dates": []
    }
  ]
}
```

---

### POST /pms/properties/{property_id}/rooms
Create a room.

**Request:**
```json
{
  "room_type_id": "uuid",
  "room_name": "Room 101",
  "floor_number": 1,
  "max_adults": 2,
  "max_children": 1,
  "base_rate": 2499,
  "smoking": false,
  "accessible": false
}
```

---

### PATCH /pms/properties/{property_id}/rooms/{id}
Update a room (status, blocked dates, etc.).

**Request:**
```json
{
  "status": "MAINTENANCE",
  "blocked_dates": [
    {
      "start": "2026-08-01",
      "end": "2026-08-15",
      "reason": "Renovation"
    }
  ]
}
```

---

## 5. Discount Code API

### GET /pms/properties/{property_id}/discount-codes
List discount codes.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "SUMMER2026",
      "type": "PERCENTAGE",
      "discount_value": 15,
      "min_amount": 5000,
      "max_uses": 100,
      "used_count": 23,
      "valid_from": "2026-06-01",
      "valid_to": "2026-08-31",
      "applicable_room_types": ["Standard", "Deluxe"],
      "is_active": true
    }
  ]
}
```

---

### POST /pms/properties/{property_id}/discount-codes
Create a discount code.

**Request:**
```json
{
  "code": "WELCOME20",
  "type": "PERCENTAGE",
  "discount_value": 20,
  "min_amount": 3000,
  "max_uses": 50,
  "valid_from": "2026-07-01",
  "valid_to": "2026-12-31",
  "applicable_room_types": ["Standard", "Deluxe", "Suite"],
  "combinable": false
}
```

---

### PATCH /pms/properties/{property_id}/discount-codes/{id}
Update a discount code.

---

### DELETE /pms/properties/{property_id}/discount-codes/{id}
Delete a discount code.

---

## 6. Special Offer API

### GET /pms/{property_id}/special-offers
List special offers.

---

### POST /pms/{property_id}/special-offers
Create a special offer.

**Request:**
```json
{
  "title": "Early Bird Discount",
  "description": "Book 30 days in advance and save 15%",
  "discount_percentage": 15,
  "start_date": "2026-07-01",
  "end_date": "2026-09-30",
  "conditions": {
    "advance_days": 30,
    "min_nights": 2
  }
}
```

---

### PATCH /pms/{property_id}/special-offers/{id}
Update a special offer.

---

### DELETE /pms/{property_id}/special-offers/{id}
Delete a special offer.

---

## 7. Guest Search API

### GET /search/hotels
Search for available hotels.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `destination` | string | City/country search |
| `check_in` | date | Check-in date |
| `check_out` | date | Check-out date |
| `guests` | number | Guest count |
| `rooms` | number | Room count |
| `children` | number | Children count |
| `min_price` | number | Minimum price |
| `max_price` | number | Maximum price |
| `star_rating` | number[] | Star ratings |
| `property_type` | string[] | Property types |
| `amenities` | string[] | Required amenities |
| `free_cancellation` | boolean | Free cancellation only |
| `sort_by` | string | price, rating, distance |
| `page` | number | Page number |
| `limit` | number | Results per page |

**Response (200):**
```json
{
  "hotels": [
    {
      "id": "uuid",
      "name": "Grand Himalaya Hotel",
      "location": "Thamel, Kathmandu",
      "city": "Kathmandu",
      "country": "Nepal",
      "rating": 4.8,
      "review_count": 342,
      "starRating": 5,
      "price": 2499,
      "currency": "NPR",
      "images": ["https://..."],
      "amenities": ["WiFi", "Restaurant", "Spa"],
      "cancellationPolicy": "Free cancellation up to 24 hours before check-in",
      "availableRooms": 12,
      "tags": ["Mountain View", "Luxury"]
    }
  ],
  "totalCount": 48,
  "filters": {
    "priceRange": [1500, 15000],
    "starRating": [3, 4, 5],
    "propertyType": ["Hotel", "Resort"]
  }
}
```

---

### GET /search/hotels/{id}
Get hotel detail with room types.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Grand Himalaya Hotel",
  "description": "Luxury hotel in the heart of Thamel...",
  "location": "Thamel, Kathmandu",
  "coordinates": { "lat": 27.7172, "lng": 85.3240 },
  "rating": 4.8,
  "review_count": 342,
  "starRating": 5,
  "images": ["https://..."],
  "photos": [
    { "url": "https://...", "caption": "Lobby", "category": "exterior" }
  ],
  "amenities": [
    { "name": "WiFi", "icon": "wifi", "category": "facility" }
  ],
  "roomTypes": [
    {
      "id": "uuid",
      "name": "Deluxe",
      "price": 4999,
      "max_occupancy": 3,
      "bed_configuration": "King + Twin",
      "amenities": ["WiFi", "AC"],
      "photos": ["https://..."]
    }
  ],
  "reviews": [
    {
      "author": "Alice J.",
      "rating": 5,
      "date": "2026-07-01",
      "comment": "Excellent stay!"
    }
  ],
  "cancellationPolicy": "Free cancellation up to 24 hours before check-in",
  "checkInTime": "14:00",
  "checkOutTime": "11:00"
}
```

---

## 8. Booking API (Guest Portal)

### POST /bookings/
Create a new booking.

**Request:**
```json
{
  "hotel_id": "uuid",
  "room_type_id": "uuid",
  "check_in_date": "2026-08-01",
  "check_out_date": "2026-08-05",
  "number_of_guests": 2,
  "number_of_rooms": 1,
  "guest_name": "Alice Johnson",
  "guest_email": "alice@email.com",
  "guest_phone": "+977-9841234567",
  "special_requests": "Non-smoking room please",
  "promo_code": "SUMMER2026",
  "add_ons": [
    { "name": "Airport Transfer", "price": 800, "quantity": 1 }
  ]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "booking_reference": "BK-1001",
  "hotel_id": "uuid",
  "room_type_id": "uuid",
  "guest_id": "uuid",
  "check_in_date": "2026-08-01",
  "check_out_date": "2026-08-05",
  "number_of_guests": 2,
  "status": "confirmed",
  "total_price": 19996,
  "currency": "NPR",
  "pricing_breakdown": {
    "base_price": 19996,
    "taxes": 2599,
    "discount": -3000,
    "add_ons": 800,
    "total": 20395
  },
  "payment_status": "pending",
  "confirmation_code": "SE-ABC123",
  "created_at": "2026-07-24T10:00:00Z"
}
```

---

### GET /bookings/
List guest's bookings.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status |
| `page` | number | Page number |
| `limit` | number | Results per page |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "booking_reference": "BK-1001",
      "hotel_name": "Grand Himalaya Hotel",
      "hotel_city": "Kathmandu",
      "room_type": "Deluxe",
      "check_in": "2026-08-01",
      "check_out": "2026-08-05",
      "status": "upcoming",
      "total_price": 19996,
      "created_at": "2026-07-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3
  }
}
```

---

### GET /bookings/{id}
Get booking detail.

**Response (200):**
```json
{
  "id": "uuid",
  "booking_reference": "BK-1001",
  "hotel": {
    "id": "uuid",
    "name": "Grand Himalaya Hotel",
    "city": "Kathmandu",
    "phone": "+977-61-523456",
    "email": "info@grandhimalaya.com"
  },
  "room_type": "Deluxe",
  "room_number": "201",
  "check_in": "2026-08-01",
  "check_out": "2026-08-05",
  "guests": { "adults": 2, "children": 0 },
  "status": "upcoming",
  "total_price": 19996,
  "pricing_breakdown": {
    "base_price": 19996,
    "taxes": 2599,
    "discount": -3000,
    "add_ons": 800,
    "total": 20395
  },
  "payment_status": "paid",
  "special_requests": "Non-smoking room please",
  "confirmation_code": "SE-ABC123",
  "qr_code": "https://...",
  "folio": [
    {
      "id": "ch_001",
      "description": "Room charge (4 nights)",
      "amount": 19996,
      "category": "room",
      "posted_at": "2026-08-01T14:00:00Z"
    }
  ]
}
```

---

### PATCH /bookings/{id}
Modify a booking.

**Request:**
```json
{
  "check_in_date": "2026-08-02",
  "check_out_date": "2026-08-06",
  "room_type_id": "uuid (optional)",
  "special_requests": "Updated request"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "confirmed",
  "total_price": 22496,
  "pricing_breakdown": { "..." }
}
```

---

### DELETE /bookings/{id}
Cancel a booking.

**Request:**
```json
{
  "reason": "Change of plans"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "cancelled",
  "refund_amount": 19996,
  "refund_policy": "Full refund — cancelled more than 48 hours before check-in",
  "penalty": 0
}
```

---

### POST /bookings/{id}/check-in
Self check-in (guest portal).

**Request:**
```json
{
  "id_document_type": "passport",
  "id_document_number": "P123456",
  "id_document_url": "https://..."
}
```

**Response (200):**
```json
{
  "status": "checked_in",
  "room_number": "201",
  "wifi_code": "Guest2026",
  "digital_key_url": "https://..."
}
```

---

### POST /bookings/{id}/check-out
Self check-out (guest portal).

**Response (200):**
```json
{
  "status": "checked_out",
  "folio_total": 20395,
  "receipt_url": "https://..."
}
```

---

## 9. Operations API (Front Desk)

### GET /pms/rooms/
List rooms for operations.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `property_id` | uuid | Required |
| `status` | string | Filter by status |
| `floor` | number | Filter by floor |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "room_number": "101",
      "floor": 1,
      "status": "available",
      "room_type": "Standard",
      "guest_name": null,
      "booking_ref": null
    }
  ]
}
```

---

### GET /pms/bookings/
List bookings for operations.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `property_id` | uuid | Required |
| `status` | string | Filter by status |
| `date` | date | Filter by check-in/out date |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "ref": "BK-1001",
      "guest_name": "Alice Johnson",
      "email": "alice@email.com",
      "phone": "+977-9841234567",
      "room_type": "Deluxe",
      "room_number": "201",
      "checkin": "2026-07-24",
      "checkout": "2026-07-28",
      "status": "checked_in",
      "adults": 2,
      "children": 0,
      "balance": 0,
      "source": "online"
    }
  ]
}
```

---

### POST /pms/check-in
Check in a guest (front desk).

**Request:**
```json
{
  "booking_ref": "BK-1001",
  "room_number": "201"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Guest checked in successfully",
  "room_status": "occupied",
  "timeline_event": {
    "type": "checked_in",
    "description": "Alice Johnson checked in to Room 201"
  }
}
```

**Errors:**
- `400` — Room not available
- `400` — Booking not found
- `400` — Booking status invalid for check-in

---

### POST /pms/check-out
Check out a guest (front desk).

**Request:**
```json
{
  "booking_ref": "BK-1001",
  "payment_method": "card"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Guest checked out successfully",
  "folio": {
    "subtotal": 19996,
    "tax": 2599,
    "discount": 0,
    "total": 22595,
    "settled": true
  },
  "room_status": "dirty",
  "timeline_event": {
    "type": "checked_out",
    "description": "Alice Johnson checked out from Room 201"
  }
}
```

---

### POST /pms/bookings/
Create a booking (front desk).

**Request:**
```json
{
  "guest_name": "Bob Williams",
  "email": "bob@email.com",
  "phone": "+977-9847654321",
  "nationality": "UK",
  "room_type": "Suite",
  "check_in": "2026-07-25",
  "check_out": "2026-07-28",
  "adults": 2,
  "children": 1,
  "special_requests": "Late check-out if possible",
  "source": "phone",
  "company": "Williams Corp"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "ref": "BK-1012",
  "guest_name": "Bob Williams",
  "room_type": "Suite",
  "checkin": "2026-07-25",
  "checkout": "2026-07-28",
  "status": "confirmed",
  "total": 0,
  "balance": 0
}
```

---

## 10. Housekeeping API

### GET /pms/hk-tasks/
List housekeeping tasks.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `property_id` | uuid | Required |
| `status` | string | Filter by status |
| `floor` | number | Filter by floor |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "room_name": "Room 102",
      "status": "dirty",
      "assigned_cleaner": "Sita",
      "priority": "high",
      "due_date": "2026-07-24",
      "notes": ""
    }
  ]
}
```

---

### PATCH /pms/hk-tasks/{id}
Update a housekeeping task.

**Request:**
```json
{
  "status": "in_progress",
  "assigned_to": "Rajesh",
  "notes": "Started cleaning at 10:30"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "in_progress",
  "assigned_cleaner": "Rajesh",
  "updated_at": "2026-07-24T10:30:00Z"
}
```

---

## 11. Payment API

### POST /pms/payments/
Record a payment.

**Request:**
```json
{
  "booking_ref": "BK-1001",
  "amount": 22595,
  "method": "card",
  "reference": "TXN-123456",
  "processed_by": "Sita Gurung"
}
```

**Response (201):**
```json
{
  "id": "pay-001",
  "booking_ref": "BK-1001",
  "type": "payment",
  "method": "card",
  "amount": 22595,
  "status": "completed",
  "reference": "TXN-123456",
  "processed_at": "2026-07-24T14:30:00Z"
}
```

---

### POST /pms/payments/split
Process split payment.

**Request:**
```json
{
  "booking_ref": "BK-1001",
  "splits": [
    { "method": "cash", "amount": 10000 },
    { "method": "card", "amount": 12595, "reference": "TXN-789" }
  ],
  "processed_by": "Sita Gurung"
}
```

**Response (201):**
```json
{
  "transactions": [
    { "id": "pay-002", "method": "cash", "amount": 10000, "status": "completed" },
    { "id": "pay-003", "method": "card", "amount": 12595, "status": "completed" }
  ],
  "total_settled": 22595,
  "outstanding": 0
}
```

---

### POST /pms/refunds/
Process a refund.

**Request:**
```json
{
  "booking_ref": "BK-1001",
  "amount": 5000,
  "reason": "Service issue compensation",
  "processed_by": "Manager"
}
```

**Response (201):**
```json
{
  "id": "ref-001",
  "booking_ref": "BK-1001",
  "type": "refund",
  "amount": -5000,
  "status": "completed",
  "processed_at": "2026-07-24T15:00:00Z"
}
```

---

## 12. POS API

### GET /pms/pos/menu
Get menu items for a property.

**Response (200):**
```json
{
  "data": [
    {
      "id": "f1",
      "name": "Butter Chicken",
      "price": 450,
      "category": "Food",
      "is_available": true,
      "is_veg": false,
      "modifiers": [
        {
          "id": "m1",
          "name": "Spice Level",
          "type": "single",
          "options": [
            { "label": "Mild", "price": 0 },
            { "label": "Spicy", "price": 0 }
          ]
        }
      ]
    }
  ]
}
```

---

### GET /pms/pos/tables
Get table layout.

**Response (200):**
```json
{
  "sections": [
    {
      "name": "Indoor",
      "tables": [
        { "id": "T1", "number": "1", "capacity": 2, "status": "Free" },
        { "id": "T2", "number": "2", "capacity": 4, "status": "Occupied" }
      ]
    }
  ]
}
```

---

### POST /pms/pos/orders
Place an order.

**Request:**
```json
{
  "table_id": "T1",
  "items": [
    { "menu_item_id": "f1", "name": "Butter Chicken", "quantity": 2, "unit_price": 450 },
    { "menu_item_id": "f3", "name": "Naan", "quantity": 4, "unit_price": 80 }
  ],
  "notes": "Extra spicy"
}
```

**Response (201):**
```json
{
  "id": "ORD-006",
  "table_id": "T1",
  "status": "submitted",
  "subtotal": 1220,
  "created_at": "2026-07-24T19:00:00Z"
}
```

---

### GET /pms/pos/kds-tickets
Get KDS tickets.

**Response (200):**
```json
{
  "data": [
    {
      "id": "1",
      "order_id": "ORD-006",
      "table_number": "T1",
      "items": [
        { "name": "Butter Chicken", "qty": 2 },
        { "name": "Naan", "qty": 4 }
      ],
      "status": "pending",
      "elapsed_seconds": 120
    }
  ]
}
```

---

### PATCH /pms/pos/kds-tickets/{id}
Update KDS ticket status.

**Request:**
```json
{
  "status": "in_progress"
}
```

---

## 13. Tenant API (SuperAdmin)

### GET /tenants/
List all tenants.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Grand Himalaya Hotels",
      "brand_name": "Grand Himalaya",
      "properties": 3,
      "users": 12,
      "bookings": 342,
      "revenue": 980000,
      "status": "Active",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET /tenants/{id}
Get tenant detail.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Grand Himalaya Hotels",
  "brand_name": "Grand Himalaya",
  "owner_email": "owner@grandhimalaya.com",
  "properties": [
    { "id": "uuid", "name": "Grand Himalaya Kathmandu", "rooms": 48 },
    { "id": "uuid", "name": "Grand Himalaya Pokhara", "rooms": 32 }
  ],
  "users": 12,
  "bookings": 342,
  "revenue": 980000,
  "status": "Active",
  "subscription": "Enterprise",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### PATCH /tenants/{id}
Update tenant (suspend/activate).

**Request:**
```json
{
  "status": "Suspended",
  "reason": "Payment overdue"
}
```

---

### DELETE /tenants/{id}
Delete a tenant.

---

## 14. Staff API

### GET /pms/staff/
List staff for a property.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "Sita",
      "last_name": "Gurung",
      "email": "sita@grandhimalaya.com",
      "role": "front_desk",
      "property_id": "uuid",
      "is_active": true,
      "pos_discount_limit": 10
    }
  ]
}
```

---

### POST /pms/staff/
Invite a staff member.

**Request:**
```json
{
  "email": "newstaff@grandhimalaya.com",
  "first_name": "Hari",
  "last_name": "Thapa",
  "phone": "+977-9841000003",
  "role": "housekeeping",
  "property_id": "uuid"
}
```

---

### PATCH /pms/staff/{id}
Update staff member.

---

### DELETE /pms/staff/{id}
Remove staff member.

---

## 15. Timeline/Audit API

### GET /pms/timeline/{booking_ref}
Get timeline for a booking.

**Response (200):**
```json
{
  "data": [
    {
      "id": "tl-001",
      "booking_ref": "BK-1001",
      "type": "created",
      "description": "Booking created for Alice Johnson — Deluxe",
      "old_value": null,
      "new_value": "confirmed",
      "performed_by": "Front Desk",
      "timestamp": "2026-07-24T10:00:00Z"
    },
    {
      "id": "tl-002",
      "booking_ref": "BK-1001",
      "type": "checked_in",
      "description": "Alice Johnson checked in to Room 201",
      "old_value": "confirmed",
      "new_value": "checked_in",
      "performed_by": "Front Desk",
      "timestamp": "2026-07-24T14:00:00Z"
    }
  ]
}
```

---

### POST /pms/timeline/
Add a timeline event.

**Request:**
```json
{
  "booking_ref": "BK-1001",
  "type": "note_added",
  "description": "Guest requested extra towels",
  "performed_by": "Sita Gurung"
}
```

---

## 16. Approval API

### GET /pms/approvals/
List pending approvals.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | pending, approved, rejected |
| `type` | ApprovalType | Filter by type |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "discount_override",
      "requested_by": "Sita Gurung",
      "booking_ref": "BK-1001",
      "details": "Apply 25% discount for VIP guest",
      "old_value": "0%",
      "new_value": "25%",
      "status": "pending",
      "created_at": "2026-07-24T10:00:00Z"
    }
  ]
}
```

---

### POST /pms/approvals/{id}/approve
Approve a request.

**Request:**
```json
{
  "reviewed_by": "Manager",
  "notes": "Approved for VIP guest"
}
```

---

### POST /pms/approvals/{id}/reject
Reject a request.

**Request:**
```json
{
  "reviewed_by": "Manager",
  "reason": "Discount exceeds policy limit"
}
```

---

## 17. Notification API

### POST /notifications/register-push
Register push notification token.

**Request:**
```json
{
  "token": "ExpoPushToken[xxxxxxxxxx]",
  "portal": "guest",
  "user_id": "uuid"
}
```

---

### GET /notifications/
Get user notifications.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Booking Confirmed",
      "body": "Your booking at Grand Himalaya Hotel is confirmed",
      "type": "booking_confirmed",
      "read": false,
      "created_at": "2026-07-24T10:00:00Z"
    }
  ]
}
```

---

### PATCH /notifications/{id}/read
Mark notification as read.

---

## API Error Response Format

```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## API Authentication

### Token Format
```
Authorization: Bearer <access_token>
```

### Token Expiry
- Access token: 30 minutes
- Refresh token: 7 days

### Rate Limiting
- Guest API: 100 requests/minute
- Host API: 60 requests/minute
- Operations API: 120 requests/minute
- SuperAdmin API: 200 requests/minute

---

## API Implementation Status

| Endpoint Group | Status | Notes |
|----------------|--------|-------|
| Auth (register, login, OTP) | ✅ | Working against live backend |
| Properties CRUD | ✅ | Working against live backend |
| Rooms CRUD | ✅ | Working against live backend |
| Discount Codes CRUD | ✅ | Working against live backend |
| Special Offers CRUD | ✅ | Working against live backend |
| Guest Search | 📋 | Mock data, API pending |
| Bookings | 📋 | Mock data, API pending |
| Check-in/Check-out | 📋 | Mock data, API pending |
| Housekeeping | 📋 | Mock data, API pending |
| POS/KDS | 📋 | Mock data, API pending |
| Payments | 📋 | Mock data, API pending |
| Tenants (SuperAdmin) | ✅ | Working against live backend |
| Staff | 📋 | Mock data, API pending |

**Key:** ✅ Implemented · 📋 Designed/Planned

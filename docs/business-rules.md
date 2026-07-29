# StayEasy — Business Rules

> Source of Truth v1.0 — July 2026

---

## 1. Reservation Rules

### Booking Creation Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-001 | Check-out must be after check-in | ERROR | `check_out > check_in` |
| BR-002 | Minimum stay is 1 night | ERROR | `nights >= 1` |
| BR-003 | Maximum stay is 365 nights | WARNING | `nights <= 365` |
| BR-004 | Check-in cannot be in the past | ERROR | `check_in >= today` |
| BR-005 | Maximum advance booking is 365 days | WARNING | `check_in <= today + 365` |
| BR-006 | Friday check-in requires minimum 2 nights on weekends | WARNING | `check_in.day != Friday OR nights >= 2` |
| BR-007 | Guest count must not exceed room capacity | ERROR | `adults + children <= room.max_occupancy` |
| BR-008 | At least 1 adult required | ERROR | `adults >= 1` |
| BR-009 | Maximum 9 adults per booking | ERROR | `adults <= 9` |
| BR-010 | Maximum 6 children per booking | ERROR | `children <= 6` |

### Room Assignment Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-011 | Room must be AVAILABLE for check-in | ERROR | `room.status == 'AVAILABLE'` |
| BR-012 | Room type must match reservation type | ERROR | `room.room_type_id == reservation.room_type_id` |
| BR-013 | Room cannot be assigned if blocked for dates | ERROR | `room.blocked_dates ∩ reservation.dates == ∅` |
| BR-014 | Room cannot be assigned if under maintenance | ERROR | `room.status != 'MAINTENANCE'` |
| BR-015 | VIP guests get priority room assignment | INFO | `guest.vip == true → prefer higher floor/better view` |

### Cancellation Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-016 | Cannot cancel a completed reservation | ERROR | `reservation.status != 'completed'` |
| BR-017 | Cannot cancel an already cancelled reservation | ERROR | `reservation.status != 'cancelled'` |
| BR-018 | Cannot cancel after check-out | ERROR | `reservation.status not in ['checked_out', 'completed']` |
| BR-019 | Cancellation before 48h: Full refund | INFO | `hours_until_checkin >= 48 → refund = 100%` |
| BR-020 | Cancellation 24-48h: 50% refund | INFO | `24 <= hours_until_checkin < 48 → refund = 50%` |
| BR-021 | Cancellation 12-24h: 25% refund | INFO | `12 <= hours_until_checkin < 24 → refund = 25%` |
| BR-022 | Cancellation <12h: No refund | INFO | `hours_until_checkin < 12 → refund = 0%` |
| BR-023 | No-show: No refund, room released after 24h | INFO | `status = 'no_show' after 24h past check-in` |

### Modification Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-024 | Cannot modify a cancelled reservation | ERROR | `reservation.status != 'cancelled'` |
| BR-025 | Cannot modify a completed reservation | ERROR | `reservation.status != 'completed'` |
| BR-026 | Date changes require availability check | ERROR | `new_dates must have available room` |
| BR-027 | Room type upgrade requires rate recalculation | INFO | `new_rate = max(old_rate, new_type_rate)` |
| BR-028 | Modifications create audit trail entry | INFO | Every change logged to TimelineEvent |

---

## 2. Payment Rules

### Payment Collection Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-030 | Deposit must be paid before guaranteeing reservation | ERROR | `deposit.paid >= deposit.amount` |
| BR-031 | Full payment due at check-out (unless pre-paid) | ERROR | `balance = 0 at checkout` |
| BR-032 | Split payment sums must equal total charged | ERROR | `∑(split.amount) == totalCharged` |
| BR-033 | Refund cannot exceed total paid minus previous refunds | ERROR | `refund <= totalPaid - totalRefunded` |
| BR-034 | Cash payments complete immediately | INFO | `method = 'cash' → status = 'completed'` |
| BR-035 | Card payments require authorization | INFO | `method = 'card' → status = 'pending' until auth` |
| BR-036 | Bank transfers may take 1-3 days to clear | INFO | `method = 'bank_transfer' → pending for up to 3 days` |

### Deposit Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-037 | Deposit percentage configured per property | INFO | Default: 30% |
| BR-038 | Deposit due date is 14 days before check-in | INFO | `dueDate = checkIn - 14 days` |
| BR-039 | Non-refundable bookings skip deposit | INFO | `cancellation_policy = 'STRICT' → deposit = 100%` |

### Discount Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-040 | Front desk cannot apply discounts > their limit | ERROR | `discount <= staff.pos_discount_limit` |
| BR-041 | Discounts >20% require manager approval | INFO | `discount > 20% → approval_request` |
| BR-042 | Discounts >50% require GM approval | INFO | `discount > 50% → escalation` |
| BR-043 | Discount codes must be within valid date range | ERROR | `today ∈ [valid_from, valid_to]` |
| BR-044 | Discount codes must meet minimum amount | ERROR | `booking.total >= discount.min_amount` |
| BR-045 | Discount codes must not exceed max uses | ERROR | `used_count < max_uses` |
| BR-046 | Discount codes must apply to booked room type | ERROR | `room_type ∈ applicable_room_types` |
| BR-047 | Non-combinable discounts cannot stack | ERROR | `if !combinable → only one discount per booking` |

---

## 3. Room Rules

### Availability Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-050 | Room must be AVAILABLE to be booked | ERROR | `room.status == 'AVAILABLE'` |
| BR-051 | Room cannot be double-booked for overlapping dates | ERROR | `existing_bookings ∩ new_dates == ∅` |
| BR-052 | Blocked rooms excluded from search | INFO | `room.blocked_dates.filter(d => d ∩ search_dates)` |
| BR-053 | Maintenance rooms excluded from search | INFO | `room.status != 'MAINTENANCE'` |

### Room Status Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-054 | Room automatically becomes DIRTY on check-out | INFO | `checkout → room.status = 'DIRTY'` |
| BR-055 | DIRTY room triggers housekeeping task creation | INFO | `dirty → create_hk_task` |
| BR-056 | Room must be INSPECTED before returning to AVAILABLE | ERROR | `status must pass through 'INSPECTED'` |
| BR-057 | Failed inspection returns room to DIRTY | INFO | `inspection_failed → status = 'DIRTY'` |

### Room Capacity Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-058 | Standard room: max 2 guests | ERROR | `adults + children <= 2` |
| BR-059 | Deluxe room: max 3 guests | ERROR | `adults + children <= 3` |
| BR-060 | Suite: max 5 guests | ERROR | `adults + children <= 5` |
| BR-061 | Extra bed adds 1 to capacity | INFO | `extra_bed → max_occupancy + 1` |

---

## 4. Housekeeping Rules

### Task Creation Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-070 | DIRTY room automatically creates HK task | INFO | `checkout → hk_task created` |
| BR-071 | VIP guest checkout creates HIGH priority task | INFO | `guest.vip = true → priority = 'High'` |
| BR-072 | Same-day arrival creates HIGH priority task | INFO | `next_reservation.checkin = today → priority = 'High'` |

### Task Assignment Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-073 | Each cleaner can have max 8 active tasks | WARNING | `active_tasks <= 8` |
| BR-074 | High priority tasks must be completed within 2 hours | INFO | `priority = 'High' → sla = 2h` |
| BR-075 | Medium priority tasks must be completed within 4 hours | INFO | `priority = 'Medium' → sla = 4h` |
| BR-076 | Low priority tasks must be completed within 24 hours | INFO | `priority = 'Low' → sla = 24h` |

### Inspection Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-077 | Only supervisors/managers can inspect | ERROR | `role ∈ ['manager', 'front_desk']` |
| BR-078 | Failed inspection must include notes | ERROR | `if status = 'DIRTY' after inspection → notes required` |
| BR-079 | Inspection failure increments retry count | INFO | `retry_count++ → alert if > 2` |

---

## 5. Staff Rules

### Role-Based Access Control

| Role | Can Create Booking | Can Modify Booking | Can Cancel | Can Check-in | Can Check-out | Can Approve Discount | Can View Reports |
|------|-------------------|-------------------|------------|-------------|--------------|---------------------|-----------------|
| Front Desk | ✅ (own property) | ✅ (own property) | ✅ (own property) | ✅ | ✅ | ❌ | Basic |
| Housekeeping | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| POS Staff | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| KDS Staff | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manager | ✅ | ✅ (all) | ✅ (all) | ✅ | ✅ | ✅ (≤20%) | Full |
| Host | ✅ (own properties) | ✅ (own properties) | ✅ (own properties) | ❌ | ❌ | ✅ (≤50%) | Full (own) |
| SuperAdmin | ✅ | ✅ (all) | ✅ (all) | ❌ | ❌ | ✅ (unlimited) | Full (all) |

### Shift Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-080 | Staff cannot clock in before shift start | ERROR | `now >= shift.start_time` |
| BR-081 | Staff cannot clock out after shift end + 2h | WARNING | `now <= shift.end_time + 2h` |
| BR-082 | Absent marking requires manager approval | INFO | `mark_absent → manager approval` |
| BR-083 | Minimum 2 front desk staff during peak hours | WARNING | `peak_hours (9-11, 14-16) → front_desk_count >= 2` |

### POS Discount Rules

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-084 | Waiter max 5% discount | ERROR | `discount <= 5` |
| BR-085 | Front desk max 10% discount | ERROR | `discount <= 10` |
| BR-086 | Manager max 20% discount | ERROR | `discount <= 20` |
| BR-087 | Discounts >20% require GM approval | INFO | `discount > 20 → approval_request` |

---

## 6. Loyalty Rules

### Points Earning

| Rule ID | Rule | Points |
|---------|------|--------|
| BR-090 | Base earning: 1 point per NPR 100 spent | `floor(total / 100)` |
| BR-091 | Gold tier bonus: +25% points | `points * 1.25` |
| BR-092 | Platinum tier bonus: +50% points | `points * 1.5` |
| BR-093 | Review bonus: 50 points per review | `+50` |
| BR-094 | Referral bonus: 200 points per referral | `+200` |

### Points Redemption

| Rule ID | Rule | Value |
|---------|------|-------|
| BR-095 | 100 points = NPR 10 discount | `points / 10` |
| BR-096 | Maximum 50% of booking can be paid with points | `points_value <= total * 0.5` |
| BR-097 | Points cannot be redeemed for cash | `points_value → discount only` |

### Tier Progression

| Tier | Points Required | Benefits |
|------|-----------------|----------|
| BRONZE | 0 | Base rate |
| SILVER | 500 | 5% discount, priority check-in |
| GOLD | 2,000 | 10% discount, room upgrade, late checkout |
| PLATINUM | 5,000 | 15% discount, suite upgrade, free breakfast, concierge |

### Tier Maintenance

| Rule ID | Rule | Severity | Validation |
|---------|------|----------|------------|
| BR-098 | Tier reviewed every 12 months | INFO | `annual_review` |
| BR-099 | Downgrade if points < threshold for 6 months | WARNING | `points < threshold for 6m → downgrade` |

---

## 7. Audit Rules

### What Gets Logged

| Action | Logged | Details |
|--------|--------|---------|
| Reservation created | ✅ | Guest name, room type, dates, source |
| Reservation modified | ✅ | Field changes (old → new) |
| Reservation cancelled | ✅ | Reason, refund amount |
| Check-in | ✅ | Room assigned, time |
| Check-out | ✅ | Folio total, payment method |
| Payment processed | ✅ | Amount, method, reference |
| Refund processed | ✅ | Amount, reason, approved by |
| Discount applied | ✅ | Amount, code, approved by |
| Room status change | ✅ | Old status → new status |
| Housekeeping task | ✅ | Assignment, status changes |
| Approval requested | ✅ | Type, requested by, details |
| Approval decision | ✅ | Approved/rejected, reviewed by |

### Audit Retention

| Rule ID | Rule | Retention |
|---------|------|-----------|
| BR-100 | Reservation audit: 7 years | Legal requirement |
| BR-101 | Financial audit: 10 years | Tax/regulatory |
| BR-102 | Operational audit: 2 years | Performance review |

---

## 8. Notification Rules

### Email Notifications

| Event | Template | Recipients | Timing |
|-------|----------|------------|--------|
| Booking confirmed | booking_confirmed | Guest | Immediate |
| Deposit received | deposit_received | Guest | Immediate |
| Booking cancelled | booking_cancelled | Guest + Host | Immediate |
| Check-in reminder | checkin_reminder | Guest | 24h before |
| Check-out reminder | checkout_reminder | Guest | 12h before |
| Thank you | thank_you | Guest | 1h after checkout |
| Review request | review_request | Guest | 24h after checkout |
| Approval needed | approval_needed | Manager | Immediate |
| Approval decided | approval_decided | Requester | Immediate |
| Waitlist offer | waitlist_offer | Guest | When room available |

### Push Notifications

| Event | Recipients | Timing |
|-------|------------|--------|
| New booking | Front Desk | Immediate |
| Check-in ready | Guest | 2h before |
| Room ready | Guest | When inspected |
| Approval pending | Manager | Immediate |
| High priority HK task | Housekeeping | Immediate |

---

## 9. Validation Patterns

### Frontend Validation (Immediate)

```typescript
// All fields validated on blur/change
const validationRules = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-]{10,15}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  name: /^.{2,100}$/,
  roomNumber: /^[A-Z]?\d{2,4}$/,
};
```

### Backend Validation (API Layer)

```typescript
// All mutations validated server-side
const apiValidation = {
  checkIn: { required: true, type: 'date', min: 'today' },
  checkOut: { required: true, type: 'date', after: 'checkIn' },
  adults: { required: true, type: 'number', min: 1, max: 9 },
  children: { required: false, type: 'number', min: 0, max: 6 },
  roomType: { required: true, type: 'enum', values: ['Standard', 'Deluxe', 'Suite'] },
};
```

### Database Constraints

```sql
-- Unique constraints
ALTER TABLE reservations ADD UNIQUE (property_id, room_id, check_in, check_out);
ALTER TABLE discount_codes ADD UNIQUE (property_id, code);

-- Check constraints
ALTER TABLE reservations ADD CHECK (check_out > check_in);
ALTER TABLE reservations ADD CHECK (adults >= 1);
ALTER TABLE payments ADD CHECK (amount != 0);

-- Foreign keys
ALTER TABLE reservations ADD FOREIGN KEY (property_id) REFERENCES properties(id);
ALTER TABLE reservations ADD FOREIGN KEY (guest_id) REFERENCES guests(id);
ALTER TABLE reservations ADD FOREIGN KEY (room_id) REFERENCES rooms(id);
```

---

## 10. Business Rule Implementation Matrix

| Rule Category | Frontend | Backend | Database |
|---------------|----------|---------|----------|
| Reservation creation | Form validation | API validation | Constraints |
| Room assignment | Availability check | Double-booking prevention | Unique index |
| Cancellation | Policy display | Refund calculation | Audit log |
| Payment | Split validation | Authorization | Transaction |
| Discount | Code validation | Usage limit check | Atomic increment |
| Approval | Permission check | Workflow engine | Status machine |
| Audit | Timeline display | Event logging | Append-only table |
| Loyalty | Points display | Tier calculation | Points balance |

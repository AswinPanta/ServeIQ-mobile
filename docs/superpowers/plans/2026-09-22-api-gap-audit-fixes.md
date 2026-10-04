# API Gap Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all API mismatches between the ServeIQ mobile app and the StayEasy backend — broken endpoints, unwired features, and mock data replacements.

**Architecture:** Three independent workstreams: (1) Backend fixes — add missing settle/waive folio endpoints, fix malformed room image routes, (2) Mobile app — wire notifications to backend API, wire superadmin to backend API, (3) Mobile app — wire remaining missing endpoints (task bulk-assign, staff-work-summary, guest reviews, system room types).

**Tech Stack:** React Native/Expo (mobile), FastAPI + SQLAlchemy (backend), PostgreSQL, Redis

## Global Constraints

- Backend repo: `/tmp/StayEasy2` (anilghatan6/Stay-Easy)
- Mobile repo: `/Users/admin/Desktop/ServeIQ`
- Mobile API base: `https://stay-easy-sizw.onrender.com/api/v1`
- All API calls via `lib/api/client.ts` (`api.get/post/patch/delete`)
- Backend uses `StandardResponse` envelope: `{ success, data, meta }`
- Backend auth: JWT Bearer tokens, `CurrentStaff` dependency injection
- Mobile auth: `lib/api/client.ts` auto-injects Bearer token, handles 401 refresh

---

## Phase 1: Backend Fixes (anilghatan6/Stay-Easy)

### Task 1: Add settle/waive folio endpoints

**Files:**
- Modify: `/tmp/StayEasy2/app/modules/folio/router.py`
- Modify: `/tmp/StayEasy2/app/modules/folio/schemas.py` (if response schema needed)

**Interfaces:**
- Consumes: `FolioService.settle_folio()`, `FolioService.waive_folio()` (already exist in service layer)
- Produces: Two new POST endpoints on the folio router

- [ ] **Step 1: Add settle endpoint to folio router**

Add after the existing `pay_folio` endpoint (after line 163):

```python
@router.post(
    "/folios/{folio_id}/settle",
    response_model=StandardResponse[FolioDetailResponse],
    status_code=status.HTTP_200_OK,
    summary="Settle a folio (mark as fully paid)",
    dependencies=[
        Depends(bypass_global_limit),
        Depends(RateLimiter(max_requests=20, window_seconds=60, scope="folio/settle")),
    ],
)
async def settle_folio(
    folio_id: uuid.UUID,
    staff: CurrentStaff,
    folio_service: FolioService = Depends(get_folio_service),
):
    verify_tenant(staff)
    await folio_service.folio_repo.settle_folio(folio_id)
    result = await folio_service.get_folio(folio_id=folio_id, staff_user=staff)
    return StandardResponse(data=FolioDetailResponse(**result))
```

- [ ] **Step 2: Add waive endpoint to folio router**

Add immediately after the settle endpoint:

```python
@router.post(
    "/folios/{folio_id}/waive",
    response_model=StandardResponse[FolioDetailResponse],
    status_code=status.HTTP_200_OK,
    summary="Waive a folio (forgive outstanding balance)",
    dependencies=[
        Depends(bypass_global_limit),
        Depends(RateLimiter(max_requests=20, window_seconds=60, scope="folio/waive")),
    ],
)
async def waive_folio(
    folio_id: uuid.UUID,
    staff: CurrentStaff,
    folio_service: FolioService = Depends(get_folio_service),
):
    verify_tenant(staff)
    await folio_service.folio_repo.waive_folio(folio_id)
    result = await folio_service.get_folio(folio_id=folio_id, staff_user=staff)
    return StandardResponse(data=FolioDetailResponse(**result))
```

- [ ] **Step 3: Add import for `verify_tenant` if not already present**

Check line 25 — `from app.utils.validation import verify_tenant` is already imported.

- [ ] **Step 4: Commit**

```bash
cd /tmp/StayEasy2
git add app/modules/folio/router.py
git commit -m "feat(folio): add settle and waive endpoints"
```

---

### Task 2: Fix malformed room image upload routes

**Files:**
- Modify: `/tmp/StayEasy2/app/modules/pms/routers/` (find the room image router)

**Interfaces:**
- The mobile app already has fallback logic for these routes — fixing the backend means the well-formed path will work

- [ ] **Step 1: Find the malformed routes**

```bash
grep -rn "properties{property_id}" /tmp/StayEasy2/app/modules/pms/routers/ --include="*.py"
```

- [ ] **Step 2: Fix the missing slash in route paths**

Change `/properties{property_id}/rooms/{room_id}/cleaning_status/images` to `/properties/{property_id}/rooms/{room_id}/cleaning_status/images` (add the `/` after `properties`).

Do the same for the maintenance images route.

- [ ] **Step 3: Commit**

```bash
cd /tmp/StayEasy2
git add -A
git commit -m "fix(pms): add missing slash in room image upload routes"
```

---

## Phase 2: Wire Notifications (Mobile App)

### Task 3: Add notification API endpoints to api-config

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/constants/api-config.ts`

**Interfaces:**
- Consumes: Backend notification endpoints at `/notifications`, `/notifications/unread-count`, `/notifications/{id}/read`, `/notifications/read-all`
- Produces: `API_ENDPOINTS.NOTIFICATIONS` object

- [ ] **Step 1: Add notification endpoints to API_ENDPOINTS**

Find the existing endpoint definitions in `constants/api-config.ts` and add a `NOTIFICATIONS` section:

```typescript
NOTIFICATIONS: {
  LIST: (propertyId: string) => `/notifications?property_id=${propertyId}`,
  UNREAD_COUNT: (propertyId: string) => `/notifications/unread-count?property_id=${propertyId}`,
  MARK_READ: (notifId: string, propertyId: string) => `/notifications/${notifId}/read?property_id=${propertyId}`,
  MARK_ALL_READ: (propertyId: string) => `/notifications/read-all?property_id=${propertyId}`,
},
```

- [ ] **Step 2: Commit**

```bash
git add constants/api-config.ts
git commit -m "feat(api): add notification endpoint constants"
```

---

### Task 4: Create notification API service

**Files:**
- Create: `/Users/admin/Desktop/ServeIQ/lib/api/notifications-api.ts`

**Interfaces:**
- Consumes: `API_ENDPOINTS.NOTIFICATIONS` from api-config, `api.get/patch` from client.ts
- Produces: `notificationsApi` object with `list()`, `unreadCount()`, `markRead()`, `markAllRead()`

- [ ] **Step 1: Create the notifications API module**

```typescript
import { api } from './client';
import { API_ENDPOINTS } from '@/constants/api-config';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  property_id?: string;
}

interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export const notificationsApi = {
  list: async (propertyId: string, skip = 0, limit = 20, unreadOnly = false) => {
    const url = `${API_ENDPOINTS.NOTIFICATIONS.LIST(propertyId)}&skip=${skip}&limit=${limit}&unread_only=${unreadOnly}`;
    return api.get<{ data: NotificationListResponse }>(url);
  },

  unreadCount: async (propertyId: string) => {
    return api.get<{ data: { unread_count: number } }>(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT(propertyId)
    );
  },

  markRead: async (notifId: string, propertyId: string) => {
    return api.patch<{ data: { message: string; unread_count: number } }>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notifId, propertyId)
    );
  },

  markAllRead: async (propertyId: string) => {
    return api.patch<{ data: { message: string; unread_count: number } }>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ(propertyId)
    );
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/api/notifications-api.ts
git commit -m "feat(api): add notifications API service"
```

---

### Task 5: Wire notification context to backend

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/lib/context/notification-context.tsx`

**Interfaces:**
- Consumes: `notificationsApi` from Task 4
- Produces: Updated `NotificationProvider` that fetches from backend instead of mock data

- [ ] **Step 1: Replace mock data with API calls in notification-context.tsx**

The current context uses `AsyncStorage` with hardcoded mock data. Replace `refreshNotifications` to call `notificationsApi.list()`, `markAsRead` to call `notificationsApi.markRead()`, `markAllAsRead` to call `notificationsApi.markAllRead()`.

Key changes:
- Import `notificationsApi` 
- In `refreshNotifications`: call `notificationsApi.list(propertyId)` and merge with existing
- In `markAsRead`: call `notificationsApi.markRead(id, propertyId)` then update local state
- In `markAllAsRead`: call `notificationsApi.markAllRead(propertyId)` then update local state
- Keep `unreadCount` derived from state (or use `notificationsApi.unreadCount()` for accuracy)

- [ ] **Step 2: Commit**

```bash
git add lib/context/notification-context.tsx
git commit -m "feat(notifications): wire notification context to backend API"
```

---

### Task 6: Update notification screens to use real data

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/app/(host)/notifications.tsx`
- Modify: `/Users/admin/Desktop/ServeIQ/app/(operations)/front-desk/notifications.tsx`
- Modify: `/Users/admin/Desktop/ServeIQ/app/(superadmin)/support/notifications.tsx`

**Interfaces:**
- Consumes: `useNotifications()` hook from notification-context (already exists)
- Produces: Screens that render real API data instead of `INITIAL_NOTIFICATIONS` mock arrays

- [ ] **Step 1: Update host notifications screen**

Replace the `buildNotifications()` mock data generator and `INITIAL_NOTIFICATIONS` with `useNotifications()` hook. The screen should call `refreshNotifications()` on mount and render from context state.

- [ ] **Step 2: Update operations front-desk notifications screen**

Same pattern — replace mock data with `useNotifications()`.

- [ ] **Step 3: Update superadmin notifications screen**

Same pattern — replace mock data with `useNotifications()`.

- [ ] **Step 4: Commit**

```bash
git add app/\(host\)/notifications.tsx app/\(operations\)/front-desk/notifications.tsx app/\(superadmin\)/support/notifications.tsx
git commit -m "feat(notifications): replace mock data with backend API in all notification screens"
```

---

## Phase 3: Wire SuperAdmin (Mobile App)

### Task 7: Add superadmin API endpoints to api-config

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/constants/api-config.ts`

**Interfaces:**
- Consumes: Backend superadmin endpoints at `/superadmin/*`
- Produces: `API_ENDPOINTS.SUPERADMIN` object

- [ ] **Step 1: Add superadmin endpoints to API_ENDPOINTS**

```typescript
SUPERADMIN: {
  ME: '/superadmin/me',
  ADMINS: {
    LIST: '/superadmin/admins',
    CREATE: '/superadmin/admins',
    GET: (id: string) => `/superadmin/admins/${id}`,
    UPDATE: (id: string) => `/superadmin/admins/${id}`,
    DELETE: (id: string) => `/superadmin/admins/${id}`,
    AUDIT: (id: string) => `/superadmin/admins/${id}/audit`,
    IMPERSONATE: (id: string) => `/superadmin/admins/${id}/impersonate`,
  },
  AUDIT_LOGS: '/superadmin/audit-logs',
  PLANS: {
    LIST: '/superadmin/plans',
    CREATE: '/superadmin/plans',
    GET: (id: string) => `/superadmin/plans/${id}`,
    UPDATE: (id: string) => `/superadmin/plans/${id}`,
    DELETE: (id: string) => `/superadmin/plans/${id}`,
  },
  SUBSCRIPTIONS: {
    ASSIGN: (tenantId: string) => `/superadmin/tenants/${tenantId}/subscription`,
    GET: (tenantId: string) => `/superadmin/tenants/${tenantId}/subscription`,
  },
  FEATURE_FLAGS: {
    LIST: '/superadmin/feature-flags',
    CREATE: '/superadmin/feature-flags',
    UPDATE: (id: string) => `/superadmin/feature-flags/${id}`,
    DELETE: (id: string) => `/superadmin/feature-flags/${id}`,
  },
  ANNOUNCEMENTS: {
    LIST: '/superadmin/announcements',
    CREATE: '/superadmin/announcements',
    DELETE: (id: string) => `/superadmin/announcements/${id}`,
  },
  DASHBOARD: '/superadmin/dashboard',
  HEALTH: '/superadmin/health',
},
```

- [ ] **Step 2: Commit**

```bash
git add constants/api-config.ts
git commit -m "feat(api): add superadmin endpoint constants"
```

---

### Task 8: Create superadmin API service

**Files:**
- Create: `/Users/admin/Desktop/ServeIQ/lib/api/superadmin-api.ts`

**Interfaces:**
- Consumes: `API_ENDPOINTS.SUPERADMIN` from api-config, `api.get/post/patch/delete` from client.ts
- Produces: `superadminApi` object with methods for all superadmin operations

- [ ] **Step 1: Create the superadmin API module**

```typescript
import { api } from './client';
import { API_ENDPOINTS } from '@/constants/api-config';

const EP = API_ENDPOINTS.SUPERADMIN;

export interface SuperAdminProfile {
  id: string;
  email: string;
  name: string;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  is_active: boolean;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_tenants: number;
  total_users: number;
  active_subscriptions: number;
  revenue: number;
}

export const superadminApi = {
  // Profile
  getMe: () => api.get<{ data: SuperAdminProfile }>(EP.ME),

  // Admins
  listAdmins: () => api.get<{ data: AdminAccount[] }>(EP.ADMINS.LIST),
  createAdmin: (data: { email: string; name: string; role: string }) =>
    api.post<{ data: AdminAccount }>(EP.ADMINS.CREATE, data),
  getAdmin: (id: string) => api.get<{ data: AdminAccount }>(EP.ADMINS.GET(id)),
  updateAdmin: (id: string, data: Partial<AdminAccount>) =>
    api.patch<{ data: AdminAccount }>(EP.ADMINS.UPDATE(id), data),
  deleteAdmin: (id: string) => api.delete(EP.ADMINS.DELETE(id)),
  getAuditTrail: (id: string) => api.get<{ data: any[] }>(EP.ADMINS.AUDIT(id)),
  impersonate: (id: string) => api.post<{ data: { token: string } }>(EP.ADMINS.IMPERSONATE(id)),
  getAuditLogs: () => api.get<{ data: any[] }>(EP.AUDIT_LOGS),

  // Plans
  listPlans: () => api.get<{ data: SubscriptionPlan[] }>(EP.PLANS.LIST),
  createPlan: (data: Omit<SubscriptionPlan, 'id'>) =>
    api.post<{ data: SubscriptionPlan }>(EP.PLANS.CREATE, data),
  updatePlan: (id: string, data: Partial<SubscriptionPlan>) =>
    api.patch<{ data: SubscriptionPlan }>(EP.PLANS.UPDATE(id), data),
  deletePlan: (id: string) => api.delete(EP.PLANS.DELETE(id)),

  // Subscriptions
  assignSubscription: (tenantId: string, planId: string) =>
    api.post(EP.SUBSCRIPTIONS.ASSIGN(tenantId), { plan_id: planId }),
  getSubscription: (tenantId: string) =>
    api.get(EP.SUBSCRIPTIONS.GET(tenantId)),

  // Feature Flags
  listFeatureFlags: () => api.get<{ data: FeatureFlag[] }>(EP.FEATURE_FLAGS.LIST),
  createFeatureFlag: (data: Omit<FeatureFlag, 'id'>) =>
    api.post<{ data: FeatureFlag }>(EP.FEATURE_FLAGS.CREATE, data),
  updateFeatureFlag: (id: string, data: Partial<FeatureFlag>) =>
    api.patch<{ data: FeatureFlag }>(EP.FEATURE_FLAGS.UPDATE(id), data),
  deleteFeatureFlag: (id: string) => api.delete(EP.FEATURE_FLAGS.DELETE(id)),

  // Announcements
  listAnnouncements: () => api.get<{ data: Announcement[] }>(EP.ANNOUNCEMENTS.LIST),
  createAnnouncement: (data: Omit<Announcement, 'id' | 'created_at'>) =>
    api.post<{ data: Announcement }>(EP.ANNOUNCEMENTS.CREATE, data),
  deleteAnnouncement: (id: string) => api.delete(EP.ANNOUNCEMENTS.DELETE(id)),

  // Dashboard & Health
  getDashboard: () => api.get<{ data: DashboardMetrics }>(EP.DASHBOARD),
  getHealth: () => api.get<{ data: any }>(EP.HEALTH),
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/api/superadmin-api.ts
git commit -m "feat(api): add superadmin API service"
```

---

### Task 9: Wire superadmin context to backend

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/lib/context/superadmin-context.tsx`

**Interfaces:**
- Consumes: `superadminApi` from Task 8
- Produces: Updated `SuperAdminProvider` that fetches from backend instead of mock data

- [ ] **Step 1: Add state for real data**

Add state for `admins`, `plans`, `featureFlags`, `announcements`, `dashboardMetrics`, `healthStatus` alongside the existing mock state.

- [ ] **Step 2: Add fetch functions**

Create `fetchAdmins()`, `fetchPlans()`, `fetchFeatureFlags()`, `fetchAnnouncements()`, `fetchDashboard()`, `fetchHealth()` that call `superadminApi` methods and update state.

- [ ] **Step 3: Call fetch functions on mount**

In a `useEffect`, call all fetch functions when the provider mounts (if user is authenticated as superadmin).

- [ ] **Step 4: Expose new state and functions via context**

Add `admins`, `plans`, `featureFlags`, `announcements`, `dashboardMetrics`, `healthStatus`, and the fetch/mutate functions to the context value.

- [ ] **Step 5: Commit**

```bash
git add lib/context/superadmin-context.tsx
git commit -m "feat(superadmin): wire superadmin context to backend API"
```

---

### Task 10: Update superadmin screens to use real data

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/app/(superadmin)/index.tsx` (dashboard)
- Modify: `/Users/admin/Desktop/ServeIQ/app/(superadmin)/admin/roles.tsx` (admin list)
- Modify: `/Users/admin/Desktop/ServeIQ/app/(superadmin)/commerce/plans.tsx` (plans)
- Modify: `/Users/admin/Desktop/ServeIQ/app/(superadmin)/platform/feature-flags.tsx` (flags)
- Modify: `/Users/admin/Desktop/ServeIQ/app/(superadmin)/support/announcements.tsx` (announcements)
- Modify: `/Users/admin/Desktop/ServeIQ/app/(superadmin)/system/health.tsx` (health)
- Modify: `/Users/admin/Desktop/ServeIQ/app/(superadmin)/system/audit-logs.tsx` (audit)

**Interfaces:**
- Consumes: `useSuperAdmin()` hook from superadmin-context (already exists)
- Produces: Screens that render real API data instead of mock arrays

- [ ] **Step 1: Update dashboard screen**

Replace `MOCK_STATS` and `MOCK_RECENT_ACTIVITY` with data from `useSuperAdmin()` — `dashboardMetrics`, `admins.length`, etc.

- [ ] **Step 2: Update admin/roles screen**

Replace `MOCK_ROLES` with `admins` from context. Map admin data to role display format.

- [ ] **Step 3: Update plans screen**

Replace `MOCK_PLANS` with `plans` from context.

- [ ] **Step 4: Update feature flags screen**

Replace `MOCK_FLAGS` with `featureFlags` from context.

- [ ] **Step 5: Update announcements screen**

Replace `MOCK_ANNOUNCEMENTS` with `announcements` from context.

- [ ] **Step 6: Update health screen**

Replace `MOCK_HEALTH` with `healthStatus` from context.

- [ ] **Step 7: Update audit logs screen**

Replace `MOCK_AUDIT_LOGS` with `auditLogs` fetched via `superadminApi.getAuditLogs()`.

- [ ] **Step 8: Commit**

```bash
git add app/\(superadmin\)/**
git commit -m "feat(superadmin): replace mock data with backend API in all superadmin screens"
```

---

## Phase 4: Remaining Missing Endpoints (Mobile App)

### Task 11: Wire task bulk-assign and staff-work-summary

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/lib/api/host-api.ts`
- Modify: `/Users/admin/Desktop/ServeIQ/lib/api/operations-api.ts`

**Interfaces:**
- Consumes: `BULK_ASSIGN_TASKS` from api-config (already defined)
- Produces: `hostApi.bulkAssignTasks()`, `hostApi.getStaffWorkSummary()`

- [ ] **Step 1: Add bulkAssignTasks to hostApi**

```typescript
bulkAssignTasks: async (propertyId: string, taskIds: string[], staffIds: string[]) => {
  return apiPost<any>(`${API_ENDPOINTS.TASKS.BULK_ASSIGN(propertyId)}`, { task_ids: taskIds, staff_ids: staffIds });
},
```

- [ ] **Step 2: Add getStaffWorkSummary to hostApi**

```typescript
getStaffWorkSummary: async (propertyId: string, fallback: () => any) => {
  return isValidUuid(propertyId)
    ? apiGet<any>(`/properties/${propertyId}/tasks/staff-work-summary`, fallback)
    : Promise.resolve(fallback());
},
```

- [ ] **Step 3: Add to api-config if not present**

Add `STAFF_WORK_SUMMARY: (id: string) => `/properties/${id}/tasks/staff-work-summary`` to the TASKS section.

- [ ] **Step 4: Commit**

```bash
git add lib/api/host-api.ts constants/api-config.ts
git commit -m "feat(api): add task bulk-assign and staff-work-summary endpoints"
```

---

### Task 12: Add guest reviews endpoint

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/constants/api-config.ts`
- Modify: `/Users/admin/Desktop/ServeIQ/lib/api/host-api.ts`

**Interfaces:**
- Consumes: Backend `GET /properties/me/reviews`
- Produces: `hostApi.getMyReviews()`

- [ ] **Step 1: Add endpoint to api-config**

```typescript
MY_REVIEWS: '/properties/me/reviews',
```

- [ ] **Step 2: Add getMyReviews to hostApi**

```typescript
getMyReviews: async (fallback: () => any) => {
  return apiGet<any>(API_ENDPOINTS.REVIEWS.MY_REVIEWS, fallback);
},
```

- [ ] **Step 3: Commit**

```bash
git add constants/api-config.ts lib/api/host-api.ts
git commit -m "feat(api): add guest my-reviews endpoint"
```

---

### Task 13: Wire system room types fetch

**Files:**
- Modify: `/Users/admin/Desktop/ServeIQ/lib/api/search.ts`

**Interfaces:**
- Consumes: `SYSTEM_ROOM_TYPES` from api-config (already defined)
- Produces: `searchApi.getSystemRoomTypes()`

- [ ] **Step 1: Add getSystemRoomTypes to searchApi**

```typescript
getSystemRoomTypes: async () => {
  return api.get(API_ENDPOINTS.SEARCH.SYSTEM_ROOM_TYPES);
},
```

- [ ] **Step 2: Commit**

```bash
git add lib/api/search.ts
git commit -m "feat(api): add system room types fetch to search API"
```

---

## Verification Checklist

After all tasks are complete:

1. **Folio settle/waive**: Test in app — settle button should call `POST /staff/folios/{id}/settle` and get a 200 response
2. **Notifications**: Open any notification screen — should load real data from backend, mark as read should persist
3. **SuperAdmin dashboard**: Open superadmin dashboard — should show real tenant/user counts from backend
4. **Task bulk-assign**: Test assigning multiple tasks to staff — should hit `POST /properties/{id}/tasks/bulk-assign`
5. **My reviews**: Guest profile → reviews should load from `GET /properties/me/reviews`
6. **System room types**: Search filters should populate from `GET /search/system-room-types`
7. **Room image uploads**: Upload cleaning/maintenance images — well-formed path should now work without fallback

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-22-api-gap-audit-fixes.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

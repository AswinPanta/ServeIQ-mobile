--- Page 1 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
STAYEASY
Hotel & Restaurant Management SaaS
SOFTWARE REQUIREMENTS SPECIFICATION
(SRS Document)
Document Information
Version 1.0.0
Date June 2026
Status Final Draft — For Team Distribution
Prepared By Product & Architecture Team
Scope Full-stack SaaS — SuperAdmin / Admin / Staff / Guest Portals
Stack React (Next.js) · Node.js (Express) · PostgreSQL · Redis · AWS
Confidential | June 2026 | Page 1 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 2 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
1. Introduction
1.1 Purpose
This Software Requirements Specification (SRS) defines the complete functional and non-functional
requirements for StayEasy — a multi-tenant SaaS platform designed to serve as an end-to-end Hotel
and Restaurant Management System with an integrated booking portal.
This document is intended for developers, UI/UX designers, QA engineers, DevOps engineers, and
stakeholders involved in building, testing, and maintaining the platform.
1.2 Product Overview
StayEasy enables hospitality businesses — hotels, resorts, restaurants, and mixed-use properties — to
manage their entire operations from a single, cloud-based dashboard. The platform supports a tiered
user hierarchy: SuperAdmin controls the overall SaaS instance; Admins (property owners/companies)
manage their individual properties; Staff handle day-to-day operations; and Guests make reservations
through the public-facing booking portal.
1.3 Scope
• Multi-tenant SaaS architecture with property-level data isolation
• Property management: hotels, resorts, restaurants, boutique stays
• Room & table inventory management with real-time availability
• Dynamic pricing engine with seasonal rates, discounts, and promotions
• End-to-end booking lifecycle: search → reserve → check-in → check-out → invoice
• Staff management: roles, shifts, task assignments, and attendance
• Restaurant POS with menu management, order tracking, and kitchen display
• Analytics dashboards and financial reporting at property and SaaS levels
• Guest CRM: profiles, preferences, loyalty points, and communication logs
• Payment gateway integration (Stripe, Razorpay, and others)
Confidential | June 2026 | Page 2 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 3 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
1.4 Definitions & Acronyms
Term Definition Context
SaaS Software as a Service — cloud-hosted, Platform model
subscription-based software
SuperAdmin Platform-level administrator with global access StayEasy ops team
Admin Company/property owner registered on the Customer of SaaS
platform
Staff Employees added by Admin — receptionists, Property operations
waiters, housekeepers, managers
Guest End-user who books rooms or dining via the Customer of property
portal
PMS Property Management System — core hotel ops Industry term
module
POS Point of Sale — restaurant billing and order Industry term
module
OTA Online Travel Agency — external booking Channel management
aggregator
ARR Average Room Rate — revenue metric Analytics
RevPAR Revenue Per Available Room — performance Analytics
metric
DFD Data Flow Diagram — system design artifact Architecture
JWT JSON Web Token — authentication standard Security
RBAC Role-Based Access Control — permission model Security
CDN Content Delivery Network — media distribution Infrastructure
API Application Programming Interface — service Integration
contract
1.5 Document Conventions
Each functional requirement is prefixed with a module code (e.g., SA-001 for SuperAdmin, AD-001 for
Admin). Priority levels are: P1 = Must Have, P2 = Should Have, P3 = Nice to Have. All API endpoints
follow REST conventions with JSON payloads. Data flow diagrams are described textually in Section 6
and visually referenced in the attached DFD supplement.
Confidential | June 2026 | Page 3 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 4 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
2. Stakeholders & User Roles
StayEasy operates on a four-tier role hierarchy. Each role has a distinct set of permissions, UI surfaces,
and data access scopes as described below.
2.1 Role Hierarchy
Role Description & Responsibilities
SuperAdmin Anthropic-equivalent ops team. Manages the entire SaaS platform:
onboarding admins, subscription billing, platform analytics, feature
flags, tenant isolation, and support escalations.
Admin (Property Owner) Company or individual who owns/operates one or more properties.
Manages property setup, staff, rooms, pricing, discounts, reporting,
and payment configuration for their properties.
Manager (Staff Role) Senior staff member with elevated permissions within a property.
Can approve bookings, manage shifts, view financial reports, and
override rates within Admin-defined limits.
Front Desk / Receptionist Handles walk-in and pre-booked check-ins/check-outs, room
assignments, payment collection, and guest communication.
Housekeeping Staff Receives room cleaning tasks, updates room status
(dirty/clean/inspected), and reports maintenance issues.
Restaurant Staff / Waiter Takes table orders via POS, manages order lifecycle, and processes
bills.
Kitchen Staff Views orders on Kitchen Display System (KDS), updates preparation
status.
Guest (Public User) Searches for availability, makes bookings, manages their
reservations, and processes payments through the public-facing
portal.
Confidential | June 2026 | Page 4 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 5 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
2.2 Permission Matrix
The table below maps key platform actions to the roles permitted to execute them. A tick indicates full
access; "Limited" means scoped to own property/data.
Action SuperAdmin / Admin Manager / Staff
Create/delete properties SuperAdmin only No
Add/remove staff members Admin Manager (view only)
Configure room types & pricing Admin Manager (edit rates within
limits)
View all bookings (property) Admin Manager + Front Desk
Create/cancel bookings Admin + Manager Front Desk
Process check-in / check-out Admin + Manager Front Desk
Issue refunds Admin Manager (up to defined limit)
Manage menu items Admin Manager
Take table orders (POS) No Waiter + Front Desk
View Kitchen Display No Kitchen Staff + Manager
View financial reports Admin Manager
Create discount codes Admin Manager
Access guest CRM profiles Admin + Manager Front Desk (limited)
Platform billing & subscriptions SuperAdmin only No
Feature flag management SuperAdmin only No
Confidential | June 2026 | Page 5 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 6 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
3. System Architecture
3.1 Architecture Overview
StayEasy is built as a cloud-native, multi-tenant SaaS using a modular monolith backend that can
evolve into microservices. The architecture separates concerns across presentation, application, and
data layers, with tenant isolation enforced at the database row level (schema-per-tenant for large
enterprise clients is supported via configuration).
3.2 Technology Stack
Layer Technology Rationale
Frontend Next.js 14 (React 18) + TypeScript SSR for SEO on booking portal,
CSR for dashboards
UI Library shadcn/ui + Tailwind CSS Accessible, customizable
component system
State Management Zustand + React Query (TanStack Lightweight state + server-state
Query) caching
Backend Node.js (Express.js) + TypeScript Mature ecosystem, easy team
onboarding
API Style RESTful JSON API + WebSocket REST for CRUD, WS for real-time
(Socket.io) status updates
Database PostgreSQL 15 (primary) + Redis 7 ACID compliance, robust JSON
(cache/sessions) support
ORM Prisma ORM Type-safe DB access, easy
migrations
Authentication JWT (access + refresh tokens) + bcrypt Stateless auth, secure password
hashing
File Storage AWS S3 + CloudFront CDN Scalable media storage and
delivery
Email Resend (transactional) + templates via Reliable delivery, modern
React Email templating
SMS/WhatsApp Twilio Booking confirmations, OTP
Payment Stripe + Razorpay (configurable per Global + India-specific payment
property) support
Caching Redis (rate limiting, sessions, Sub-millisecond cache reads
availability cache)
Search PostgreSQL full-text search + pg_trgm Avoids external dependency for
extension MVP
Background Jobs BullMQ (Redis-based queues) Email, reports, reminders, channel
sync
Confidential | June 2026 | Page 6 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 7 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Layer Technology Rationale
Deployment AWS (ECS Fargate + RDS + Managed, auto-scaling
ElastiCache) infrastructure
CI/CD GitHub Actions + Docker Automated testing and deployment
pipeline
Monitoring Sentry (errors) + Datadog (APM) + Full observability stack
CloudWatch (infra)
3.3 High-Level Component Diagram (Textual)
The system is organized into the following top-level components:
• Public Booking Portal (Next.js SSR) — accessible at property-specific subdomain or custom
domain
• SuperAdmin Dashboard (Next.js CSR SPA) — platform ops panel
• Admin Dashboard (Next.js CSR SPA) — property management panel
• Staff Tablet App (React PWA) — optimized for touchscreen POS, housekeeping, and KDS use
cases
• API Gateway (Express Router) — validates JWT, enforces RBAC, routes to module controllers
• Module Services — PMS, Booking Engine, POS, CRM, Analytics, Channel Manager,
Notification
• Database Layer — PostgreSQL (persistent data) + Redis (cache + queues)
• External Integrations — Payment gateways, OTAs, SMS/Email providers, Calendar exports
3.4 Multi-Tenancy Strategy
Each Admin (property owner) represents a tenant. Tenancy is enforced via:
1. Every database table includes a tenant_id (UUID) column indexed for fast filtering.
2. All API requests pass through a tenant resolution middleware that extracts tenant context from
the JWT.
3. Row-Level Security (RLS) policies in PostgreSQL enforce that queries never leak cross-tenant
data even if application logic fails.
4. File storage is organized under tenant-namespaced S3 prefixes:
s3://stayeasy-media/{tenant_id}/...
5. Redis keys are prefixed with tenant_id to prevent cache collisions.
6. SuperAdmin bypasses tenant isolation with explicit super-scope JWT claims.
Confidential | June 2026 | Page 7 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 8 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
4. Functional Requirements
4.1 SuperAdmin Module
Req. ID Requirement
SA-001 SuperAdmin can log in via MFA-protected credentials and access a
global platform dashboard.
SA-002 View total registered tenants, active subscriptions, MRR, and churn
rate on the main dashboard.
SA-003 Create, suspend, and permanently delete Admin accounts with full
audit trail.
SA-004 Assign subscription plans (Free Trial, Basic, Professional,
Enterprise) to Admin accounts.
SA-005 Set and modify platform-wide feature flags (e.g., enable/disable
restaurant module, channel manager).
SA-006 View and export platform usage reports: API call volumes, storage
consumption, booking counts per tenant.
SA-007 Access a support ticket console to view escalated issues from Admin
users.
SA-008 Send platform-wide announcements via in-app notification and email
to all or selected Admins.
SA-009 Configure global payment gateway credentials (Stripe, Razorpay)
and allow Admins to use their own accounts.
SA-010 Monitor real-time system health: server uptime, error rates, queue
depth, and cache hit ratios.
SA-011 Impersonate any Admin account for support purposes (logged,
auditable action).
SA-012 Manage and update subscription pricing plans and feature
entitlements.
Confidential | June 2026 | Page 8 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 9 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
4.2 Admin / Property Owner Module
4.2.1 Onboarding & Property Setup
Req. ID Requirement
AD-001 Admin can self-register with email/password or Google OAuth and
complete an onboarding wizard.
AD-002 During onboarding, Admin selects property type: Hotel, Resort,
Restaurant, Hostel, or Mixed.
AD-003 Admin can add multiple properties (subject to subscription plan
limits).
AD-004 Each property has: Name, Address, GPS coordinates, contact info,
description, star rating, photos (up to 50), amenities list, and
cancellation policy.
AD-005 Admin can upload property photos and organize them into galleries
(exterior, rooms, dining, amenities).
AD-006 Admin can configure property-level currency, timezone, and
language settings.
AD-007 Admin can set check-in / check-out default times and grace period
policies.
AD-008 Admin can connect a custom domain or use
property-name.stayeasy.com subdomain for the booking portal.
AD-009 Admin can configure a brand color and upload a logo for the property
booking portal.
Confidential | June 2026 | Page 9 of 44 Pravidhi Digital Innovations Nepal Pvt Ltd
--- Page 10 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
4.2.2 Room & Inventory Management
Req. ID Requirement
RM-001 Admin can create room types (e.g., Standard, Deluxe, Suite) with:
name, description, max occupancy, bed configuration, floor, view
type, and amenities.
RM-002 Admin can add individual room units under a type, each with a
unique room number and floor assignment.
RM-003 Admin can set room-level attributes: smoking/non-smoking,
accessible (wheelchair), connected rooms.
RM-004 Admin can upload up to 20 photos per room type.
RM-005 Admin can view a visual floor map of all rooms with real-time status
indicators (Available / Occupied / Dirty / Under Maintenance).
RM-006 Admin or Manager can manually change room status (e.g., mark
under maintenance with expected return date).
RM-007 System auto-updates room to Dirty on guest check-out;
Housekeeping staff marks it Clean → Inspected → Available.
RM-008 Admin can create rate plans (e.g., Room Only, Bed & Breakfast, Full
Board) and attach them to room types.
RM-009 Admin can configure extra charges: extra bed, rollaway, late
check-out, early check-in fees.
RM-010 Admin can block rooms for a date range (maintenance, personal
use) removing them from available inventory.
Confidential | June 2026 | Page 10 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 11 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
4.2.3 Pricing & Revenue Management
Req. ID Requirement
PR-001 Admin can set a base nightly rate per room type and rate plan.
PR-002 Admin can create date-range overrides for seasonal pricing (e.g.,
peak summer, festival periods).
PR-003 Admin can set day-of-week pricing rules (weekday vs weekend
rates).
PR-004 Admin can define minimum and maximum stay requirements per
date range.
PR-005 Admin can create discount codes: percentage off, fixed amount off,
or free night offers.
PR-006 Discount codes can be configured with: validity period, maximum
uses, minimum booking amount, applicable room types, and
combinability rules.
PR-007 Admin can set early-bird discounts (e.g., 15% off for bookings made
30+ days in advance).
PR-008 Admin can set last-minute deals (e.g., 20% off for bookings within 3
days of arrival).
PR-009 Admin can configure length-of-stay discounts (e.g., 3-night = 10%
off, 7-night = 20% off).
PR-010 Admin can view a pricing calendar showing rates for any date range
across all room types.
PR-011 System enforces that applied discounts do not reduce rate below
Admin-defined minimum rate floor.
PR-012 Admin can configure taxes: percentage-based (GST, VAT) and
flat-rate, with tax-inclusive or exclusive display.
4.2.4 Staff Management
Req. ID Requirement
ST-001 Admin can invite staff by email; system sends invitation with
temporary password.
ST-002 Admin can assign staff to roles: Manager, Front Desk,
Housekeeping, Waiter, Kitchen, Maintenance.
ST-003 Admin can assign staff to specific properties (relevant for
multi-property Admins).
ST-004 Admin can create and manage shift schedules per staff member.
ST-005 Staff can clock in/out via the dashboard; system records attendance
timestamps.
ST-006 Admin can view shift coverage calendar and identify understaffed
periods.
Confidential | June 2026 | Page 11 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 12 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Req. ID Requirement
ST-007 Admin can create and assign tasks to staff with due dates and
priority levels.
ST-008 Staff can mark tasks as in-progress or complete; system notifies
Manager on completion.
ST-009 Admin can deactivate staff accounts while retaining their historical
activity logs.
ST-010 Admin can set per-staff-role POS access limits (e.g., Waiter can
discount up to 10%).
4.3 Booking Engine
4.3.1 Guest-Facing Search & Availability
Req. ID Requirement
BK-001 Guest can search for available rooms by: check-in date, check-out
date, number of adults, number of children, and room count.
BK-002 Search results display room types with: photos, description,
amenities, occupancy, price per night, and total stay price.
BK-003 Guest can filter results by: price range, room type, bed type, and
amenities.
BK-004 Availability is calculated in real-time from confirmed bookings and
blocked dates; no overbooking is possible.
BK-005 Guest can apply a discount code at the search or checkout stage;
system validates and shows updated pricing.
BK-006 Guest can view a rate breakdown: base rate × nights, taxes,
discount, and total.
BK-007 System displays a "Hurry, only 2 left!" indicator when available
inventory is ≤3 for any room type.
BK-008 System supports multi-room booking in a single reservation for
groups.
Confidential | June 2026 | Page 12 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 13 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
4.3.2 Booking Lifecycle
Req. ID Requirement
BK-009 Guest can create an account or book as a guest (email required for
confirmation).
BK-010 Booking flow: Search → Room Selection → Guest Details →
Add-ons → Review → Payment → Confirmation.
BK-011 Rooms are held in a soft lock for 10 minutes during checkout to
prevent concurrent booking conflicts.
BK-012 Guest can add dining packages, airport transfers, or other
property-configured extras during booking.
BK-013 Payment is processed via configured gateway; booking is confirmed
only upon successful payment authorization.
BK-014 Guest receives a booking confirmation email and SMS with a unique
reference number, QR code, and policy summary.
BK-015 Admin and Manager receive a real-time notification on new bookings
via dashboard bell and email.
BK-016 Guest can request to modify dates or room type; modifications
trigger re-pricing and difference payment.
BK-017 Guest can cancel a booking; system enforces cancellation policy
(free cancellation window, penalty amounts).
BK-018 Refunds for cancellations are auto-processed to original payment
method within policy-defined timelines.
BK-019 Admin can create manual bookings (walk-in or phone reservations)
from the dashboard with cash or terminal payment.
BK-020 System generates a unique folio (guest invoice) per booking that
accumulates charges through the stay.
Confidential | June 2026 | Page 13 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 14 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
4.3.3 Check-in & Check-out
Req. ID Requirement
CI-001 Front Desk can look up bookings by: booking reference, guest name,
phone number, or arrival date.
CI-002 Check-in process: verify identity, confirm room, collect any balance,
issue room key, and update booking status to Checked In.
CI-003 System auto-suggests room assignment based on booked room
type; staff can override with specific room number.
CI-004 Guests with registered accounts can use self-service check-in via the
portal (uploads ID, confirms details, receives digital key code).
CI-005 Check-out process: display final folio with all charges, collect
payment, generate receipt, and update room status to Dirty.
CI-006 Staff can post ad-hoc charges to a guest folio during stay: minibar,
room service, laundry, etc.
CI-007 System auto-notifies housekeeping via their dashboard when a room
is checked out.
CI-008 System sends a post-stay review request email to guest 2 hours
after check-out.
Confidential | June 2026 | Page 14 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 15 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
4.4 Restaurant & POS Module
4.4.1 Table & Section Management
Req. ID Requirement
RS-001 Admin can create sections (e.g., Main Dining, Rooftop, Bar, Private)
and add tables with: number, capacity, and shape.
RS-002 Admin can view a visual floor plan of the restaurant with real-time
table status (Available, Occupied, Reserved, Needs Cleaning).
RS-003 Guests can make dining reservations via the portal by selecting date,
time, party size, and seating preference.
RS-004 Staff can manage walk-in seating and table assignments from the
floor plan view.
RS-005 System supports table-turn timers to alert staff when a table has
been occupied beyond expected duration.
4.4.2 Menu Management
Req. ID Requirement
MN-001 Admin can create menu categories (e.g., Starters, Mains, Desserts,
Drinks) and sub-categories.
MN-002 Each menu item has: name, description, price, photo, dietary tags
(Veg/Vegan/Gluten-Free/Spicy), prep time, and availability toggle.
MN-003 Admin can create modifiers (e.g., size, extra toppings, cooking
preference) with price adjustments.
MN-004 Admin can configure time-based menus (Breakfast Menu 7–11am,
Lunch Menu 12–3pm, Dinner Menu 6–11pm).
MN-005 Admin can mark items as "out of stock" which immediately hides
them from the ordering interface.
MN-006 Admin can set happy hour pricing for specific items on defined days
and time windows.
4.4.3 Order Lifecycle & POS
Req. ID Requirement
PO-001 Waiter opens a table, selects items, adds modifiers, and submits
order via touchscreen POS interface.
PO-002 Order is instantly displayed on the Kitchen Display System (KDS)
with item details, table number, and timestamp.
PO-003 Kitchen staff can mark individual items as: In Progress, Ready, and
Served.
Confidential | June 2026 | Page 15 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 16 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Req. ID Requirement
PO-004 Waiter receives in-app notification when items are marked Ready for
pickup.
PO-005 Waiter can add more items to an existing open order; additional
items are sent to KDS as a supplement.
PO-006 Waiter can apply a staff discount (within permitted limits) to the order.
PO-007 At checkout, system presents itemized bill; guest can split by item,
by percentage, or equally.
PO-008 Payment methods accepted at POS: cash, card, UPI, room charge
(for hotel guests), and loyalty points.
PO-009 System prints or emails the receipt; digital receipts support QR-code
verification.
PO-010 All POS transactions are recorded with staff ID, timestamp, table,
and payment method for audit.
PO-011 Admin can view daily, weekly, and monthly sales reports per
category and item.
4.5 Guest CRM
Req. ID Requirement
CR-001 System automatically creates a guest profile on first booking (name,
email, phone, nationality).
CR-002 Guest profile aggregates all stay history, dining history, preferences,
and communication logs.
CR-003 Admin/Front Desk can add notes to guest profiles (e.g., "Prefers high
floor," "Allergic to nuts").
CR-004 System computes a guest tier (Bronze/Silver/Gold/Platinum) based
on total spend and visit frequency.
CR-005 Guest earns loyalty points on each booking; points can be redeemed
as a discount on future stays.
CR-006 Admin can send targeted promotions to guest segments (e.g., guests
who stayed in last 6 months).
CR-007 Guest can manage their own profile, view booking history, and
download invoices from the portal account.
CR-008 Guest can submit a review via post-stay email link; reviews are
displayed on the property booking page.
Confidential | June 2026 | Page 16 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 17 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
4.6 Analytics & Reporting
Req. ID Requirement
AN-001 Admin dashboard shows real-time KPIs: Occupancy Rate, ARR,
RevPAR, Total Revenue, Bookings Today, and Arrivals/Departures
today.
AN-002 Revenue reports filterable by date range, room type, rate plan, and
booking channel.
AN-003 Booking source report: Direct (portal), Walk-in, OTA, Phone — with
conversion metrics.
AN-004 Occupancy forecast chart: next 30/60/90 days projected occupancy
based on confirmed bookings.
AN-005 Restaurant sales report: revenue by category, top-selling items, peak
hours, covers per day.
AN-006 Cancellation report: cancellation rate, revenue lost, cancellation
timing distribution.
AN-007 Staff performance report: check-ins handled, orders processed per
staff member.
AN-008 Admin can schedule automated reports (PDF/Excel) to be emailed at
daily/weekly/monthly intervals.
AN-009 SuperAdmin sees platform-wide aggregated reports: total tenants,
bookings, and revenue across all properties.
AN-010 All reports can be exported as CSV, PDF, or Excel.
Confidential | June 2026 | Page 17 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 18 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
5. Non-Functional Requirements
5.1 Performance
Metric Target
Booking portal page load < 2.5 seconds on 4G connection
(LCP)
Availability search API < 500ms at P95 under 500 concurrent users
response
Admin dashboard initial load < 3 seconds (CDN-cached assets)
POS order submission latency < 300ms end-to-end to KDS
Real-time room status update < 1 second via WebSocket push
Database query P99 < 200ms for all OLTP queries
Payment processing handoff < 100ms from confirm click to gateway redirect
Concurrent users per tenant Support up to 500 concurrent sessions per property
Platform-wide concurrent Target 50,000 — scale horizontally via ECS auto-scaling
users
5.2 Security
• All data in transit encrypted via TLS 1.3; all data at rest encrypted via AES-256.
• JWT tokens: access token expiry 15 minutes; refresh token expiry 7 days; stored in HttpOnly
cookies.
• RBAC enforced at both API middleware level and database row level (PostgreSQL RLS).
• All password fields hashed with bcrypt (cost factor ≥ 12).
• Rate limiting: 100 requests/minute per IP on public API; 1000/minute on authenticated API.
• OWASP Top 10 mitigations: SQL injection prevented via parameterized queries (Prisma), XSS
via CSP headers and output encoding, CSRF via SameSite cookies + CSRF tokens.
• PCI-DSS compliance: no card data stored on StayEasy servers; all card data handled by
Stripe/Razorpay.
• Multi-Factor Authentication (MFA) mandatory for SuperAdmin; optional but encouraged for
Admin and Manager roles.
• Full audit log for all sensitive actions: login, booking creation/cancellation, staff changes, pricing
changes, admin impersonation.
• Penetration testing to be conducted before production launch and annually thereafter.
5.3 Availability & Reliability
• Platform SLA: 99.9% uptime (allows ~8.7 hours downtime per year) for Professional/Enterprise
tiers.
Confidential | June 2026 | Page 18 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 19 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
• Database: Multi-AZ PostgreSQL with automated failover; RTO < 2 minutes, RPO < 1 minute.
• Automated database backups: daily full backup, point-in-time recovery for last 30 days.
• Application deployments via blue-green strategy to achieve zero-downtime deployments.
• Health checks every 30 seconds; auto-restart of failed containers via ECS health check
integration.
5.4 Scalability
• Stateless API servers enable horizontal auto-scaling via ECS Fargate based on CPU/memory
utilization.
• Database read replicas added for reporting queries and analytics workloads.
• Redis Cluster for cache and queue scaling as tenant count grows.
• Background job queue (BullMQ) scales independently from API servers.
• Asset delivery via CloudFront CDN with global edge locations for low-latency photo delivery.
5.5 Usability
• Admin dashboard: maximum 3 clicks to reach any primary workflow (e.g., create booking, check
availability, add staff).
• POS interface: designed for touchscreen use on 10" tablets; minimum tap target 44×44px.
• All forms include inline validation with clear error messages in plain language.
• Platform supports English, Hindi, and Nepali as initial languages; i18n framework in place for
future expansion.
• WCAG 2.1 AA accessibility compliance for the public booking portal.
5.6 Maintainability
• Codebase organized by feature modules (not layers) to minimize cross-cutting dependencies.
• API versioning via URL prefix (/api/v1/...) to support non-breaking incremental updates.
• Automated test coverage: ≥ 80% unit test coverage for service layer; ≥ 60% integration test
coverage for API routes.
• All environment variables managed via AWS Parameter Store; no secrets in codebase.
• Dependency updates automated via Dependabot with weekly PR cadence.
Confidential | June 2026 | Page 19 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 20 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
6. Data Flow Diagrams (DFD)
This section describes data flows using Yourdon-DeMarco notation. Context, Level-0, and Level-1
DFDs are documented for the three primary flows. Visual DFD diagrams accompany this document as
a separate supplement file.
6.1 Context Diagram (Level 0) — System Boundary
External entities and their interactions with the StayEasy system:
External Entity Data Flow To/From StayEasy
Guest (End User) TO: Search query, booking request, payment, cancellation request |
FROM: Availability results, booking confirmation, invoice, review
prompt
Admin (Property Owner) TO: Property config, pricing rules, staff data, room inventory | FROM:
Booking notifications, revenue reports, analytics, staff tasks
Staff Member TO: Task updates, room status updates, POS orders | FROM: Task
assignments, room dirty alerts, order tickets (KDS)
SuperAdmin TO: Plan assignments, feature flags, support actions | FROM:
Platform health metrics, tenant reports, audit logs
Payment Gateway TO: Payment authorization request, refund request | FROM:
Payment result, transaction ID, webhook confirmation
Email/SMS Provider TO: Notification payloads (booking confirmations, OTP) | FROM:
Delivery status, bounce/failure callbacks
OTA Partners (future) TO: Availability sync, booking push | FROM: OTA bookings, rate
parity sync
Accounting Software (opt.) TO: Invoice export trigger | FROM: Invoice PDF, transaction
summary
6.2 Level-1 DFD — Booking Flow
This diagram expands the booking process into sub-processes:
7. Guest submits search (dates, guests, property) → Process 1.1 Availability Calculator reads
Booking records + Blocked dates from Room Inventory Store → returns available room types
with pricing.
8. Guest selects room and enters details → Process 1.2 Booking Creator validates guest session;
creates a pending booking record in Booking Store with a soft lock on room inventory (TTL: 10
min).
9. Guest submits payment → Process 1.3 Payment Processor sends authorization request to
Payment Gateway → Gateway returns transaction token → Booking status updated to
Confirmed in Booking Store.
Confidential | June 2026 | Page 20 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 21 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
10. Process 1.4 Notification Dispatcher reads confirmed booking from Booking Store → sends
email/SMS to Guest (confirmation) → sends push notification to Admin/Manager (new booking
alert).
11. Process 1.5 Folio Creator initializes a guest folio record in Folio Store linked to the confirmed
booking for in-stay charge accumulation.
6.3 Level-1 DFD — Check-in & Check-out Flow
12. Front Desk searches booking by reference → Process 2.1 Booking Lookup queries Booking
Store → returns booking + guest profile from Guest Store.
13. Staff confirms identity and assigns room unit → Process 2.2 Room Assignment writes
room_number to booking; updates room status in Room Inventory Store to Occupied.
14. Process 2.3 Folio Manager activates the folio; any in-stay charges (minibar, room service) are
posted to Folio Store by staff throughout the stay.
15. On check-out, Process 2.4 Folio Finalizer aggregates all charges, applies taxes, and computes
final balance.
16. Process 2.5 Payment Collector processes balance payment via POS terminal or gateway →
updates Folio Store to Settled.
17. Process 2.6 Room Status Updater sets room to Dirty in Room Inventory Store → Housekeeping
notification dispatched → staff updates status through Dirty → Clean → Inspected → Available.
6.4 Level-1 DFD — Restaurant POS Flow
18. Waiter opens table on POS → Process 3.1 Table Manager sets table status to Occupied in
Table Store; opens an Order record in Order Store.
19. Waiter selects menu items and modifiers → Process 3.2 Order Builder reads Menu Store for
item pricing and modifier rules; writes order line items to Order Store.
20. Order submitted → Process 3.3 KDS Dispatcher reads order from Order Store and pushes to
Kitchen Display System via WebSocket in real-time.
21. Kitchen marks items ready → Process 3.4 Order Status Updater writes item status to Order
Store; sends WebSocket notification to waiter POS.
22. Waiter closes bill → Process 3.5 Bill Calculator reads all order items + applicable discounts +
taxes; presents final bill to guest.
23. Payment collected → Process 3.6 Payment Processor records transaction in Transaction Store;
updates Order to Paid; sets table back to Available in Table Store.
Confidential | June 2026 | Page 21 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 22 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
6.5 Data Stores Summary
Data Store Primary Entities Technology
User Store users, roles, permissions, sessions, PostgreSQL
audit_logs
Property Store properties, property_photos, amenities, PostgreSQL + S3
policies
Room Inventory Store room_types, room_units, room_status, PostgreSQL
blocked_dates, rate_plans
Pricing Store base_rates, date_overrides, PostgreSQL
discount_codes, tax_configs
Booking Store bookings, booking_rooms, cancellations, PostgreSQL
modification_requests
Folio Store folios, folio_charges, folio_payments, PostgreSQL
invoices
Guest Store guest_profiles, stay_history, preferences, PostgreSQL
loyalty_points, reviews
Menu Store categories, menu_items, modifiers, PostgreSQL
time_menus
Order Store orders, order_items, item_status, PostgreSQL
table_sessions
Table Store sections, tables, table_status, reservations PostgreSQL
Transaction Store payments, refunds, gateway_logs PostgreSQL
Notification Queue email_jobs, sms_jobs, push_jobs Redis (BullMQ)
Session Cache JWT refresh tokens, soft-lock tokens, search Redis
result cache
Media Store property_photos, room_photos, AWS S3 + CDN
menu_photos, guest_ids
Analytics Store booking_events, revenue_events PostgreSQL (partitioned)
(append-only event log)
Confidential | June 2026 | Page 22 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 23 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
7. Database Schema Design
All tables include: id (UUID, PK), tenant_id (UUID, FK to tenants), created_at (TIMESTAMPTZ),
updated_at (TIMESTAMPTZ), and deleted_at (TIMESTAMPTZ, soft-delete). Only key domain-specific
columns are listed below.
7.1 Core Tables
Table Key Columns Notes
tenants name, slug, plan, status, custom_domain, logo_url, One record per
currency, timezone Admin/property group
users tenant_id, email, password_hash, role, first_name, All user types except
last_name, phone, is_active, mfa_enabled guests
guests tenant_id, email, phone, first_name, last_name, End-customers of
nationality, loyalty_tier, total_points properties
properties tenant_id, name, type, address, lat, lng, Hotel, Resort,
star_rating, check_in_time, check_out_time Restaurant, etc.
room_types property_id, name, description, max_occupancy, Template for room units
bed_type, base_rate, photos[]
room_units property_id, room_type_id, room_number, floor, Physical room instances
status, smoking, accessible
rate_plans property_id, room_type_id, name, Pricing tiers per room
includes_breakfast, includes_dinner, type
price_per_night
date_overrides property_id, room_type_id, rate_plan_id, Seasonal pricing
start_date, end_date, override_price
discount_codes property_id, code, type, value, min_amount, Promo codes
max_uses, used_count, valid_from, valid_to
bookings property_id, guest_id, status, checkin_date, Master booking record
checkout_date, total_amount, ref_number
booking_rooms booking_id, room_unit_id, room_type_id, Rooms within a booking
rate_plan_id, nightly_rate, nights
folios booking_id, guest_id, status, subtotal, tax, Financial account per
discount, total, settled_at stay
folio_charges folio_id, description, amount, category, posted_by, Individual charges on
posted_at folio
sections property_id, name, floor, capacity Restaurant dining areas
tables section_id, property_id, table_number, capacity, Individual tables
shape, status
menu_items property_id, category_id, name, price, is_veg, Restaurant menu items
is_available, prep_time_mins, photos[]
Confidential | June 2026 | Page 23 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 24 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Table Key Columns Notes
orders property_id, table_id, waiter_id, status, total, Restaurant order
payment_method, paid_at header
order_items order_id, menu_item_id, quantity, unit_price, Line items in an order
modifiers, item_status
staff_shifts property_id, user_id, start_time, end_time, role, Shift scheduling
status
tasks property_id, assigned_to, title, description, priority, Staff task management
status, due_at
reviews property_id, guest_id, booking_id, rating, Guest reviews
comment, is_published
audit_logs tenant_id, user_id, action, entity_type, entity_id, Immutable audit trail
old_value, new_value, ip_address
Confidential | June 2026 | Page 24 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 25 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
8. API Design
8.1 General Conventions
• Base URL: https://api.stayeasy.com/api/v1/
• Authentication: Bearer {JWT_access_token} in Authorization header
• All responses: { success: boolean, data: object|array, meta?: { total, page, limit }, error?: { code,
message } }
• HTTP methods: GET (read), POST (create), PUT (full update), PATCH (partial update),
DELETE (soft delete)
• Pagination: ?page=1&limit=20 on all list endpoints
• Filtering: ?field=value syntax; sorting via ?sort=created_at&order=desc
• Error codes: 400 Validation Error, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409
Conflict, 422 Business Logic Error, 429 Rate Limited, 500 Internal Error
8.2 Key API Endpoints
Method + Endpoint Auth Role Description
POST /auth/register Public Admin self-registration
POST /auth/login Public Login; returns access + refresh tokens
POST /auth/refresh Refresh token Exchange refresh token for new access token
POST /auth/logout Any auth Revoke refresh token
GET /properties Admin List own properties
POST /properties Admin Create new property
GET /properties/:id Admin/Staff Get property details
PATCH /properties/:id Admin Update property settings
GET /properties/:id/room-types Admin/Staff List room types with rates
POST /properties/:id/room-types Admin Create room type
GET /properties/:id/room-units Admin/Staff List all room units with live status
PATCH Admin/Staff Update room status (Dirty/Clean/Maintenance)
/properties/:id/room-units/:uid/sta
tus
GET /properties/:id/availability Public Search available rooms (dates + guests)
GET Admin View rate calendar by date range
/properties/:id/pricing-calendar
POST /properties/:id/rate-plans Admin Create rate plan
POST Admin Set seasonal price override
/properties/:id/date-overrides
Confidential | June 2026 | Page 25 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 26 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Method + Endpoint Auth Role Description
POST Admin Create discount code
/properties/:id/discount-codes
POST Public Validate a discount code against booking
/properties/:id/discount-codes/val
idate
POST /bookings Public/Auth Create booking (guest or manual by Admin)
GET /properties/:id/bookings Admin/Staff List bookings with filters
GET /bookings/:ref Admin/Guest Get booking by reference
PATCH /bookings/:ref/checkin Admin/Staff Perform check-in
PATCH /bookings/:ref/checkout Admin/Staff Perform check-out
POST /bookings/:ref/cancel Admin/Guest Cancel booking; triggers refund workflow
GET /bookings/:ref/folio Admin/Staff Get guest folio with all charges
POST Admin/Staff Post ad-hoc charge to folio
/bookings/:ref/folio/charges
POST Admin/Staff Record folio payment; finalize checkout
/bookings/:ref/folio/payment
GET /properties/:id/tables Admin/Staff Get table floor plan with live status
POST /properties/:id/orders Staff Create new POS order
PATCH Staff Update KDS item status
/orders/:id/items/:itemId/status
POST /orders/:id/payment Staff Collect payment and close order
POST /properties/:id/staff/invite Admin Invite staff by email
GET /properties/:id/staff Admin/Manager List staff members
POST /properties/:id/tasks Admin/Manager Create task for staff
GET Admin/Manager Real-time KPI dashboard data
/properties/:id/analytics/overview
GET Admin/Manager Revenue report with filters
/properties/:id/analytics/revenue
GET Admin/Manager Occupancy forecast + history
/properties/:id/analytics/occupan
cy
GET /superadmin/tenants SuperAdmin List all tenants with stats
POST SuperAdmin Suspend tenant
/superadmin/tenants/:id/suspend
POST SuperAdmin Issue impersonation token (audited)
/superadmin/tenants/:id/imperso
nate
GET /superadmin/analytics SuperAdmin Platform-wide metrics
Confidential | June 2026 | Page 26 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 27 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Confidential | June 2026 | Page 27 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 28 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
9. UI/UX Design Specifications
9.1 Design System
Element Specification
Typography Font: Inter (UI text), Playfair Display (portal headings). Scale:
12/14/16/20/24/32/48px. Line height: 1.5 for body, 1.2 for headings.
Color — Primary #1A3C5E (navy) — used for primary actions, headings, and
navigation backgrounds.
Color — Accent #2E86AB (teal) — used for CTAs, links, highlights, and status
badges.
Color — Success #1E8449 (green) — available status, successful payments,
confirmed badges.
Color — Warning #D35400 (orange) — pending actions, caution states, dirty room
status.
Color — Danger #C0392B (red) — errors, cancellations, maintenance status,
destructive actions.
Spacing Scale 4px base grid. Standard spacings: 4, 8, 12, 16, 24, 32, 48, 64, 96px.
Border Radius Cards: 8px. Buttons: 6px. Badges: 4px. Modals: 12px.
Shadow Cards: 0 2px 8px rgba(0,0,0,0.08). Modals: 0 8px 32px
rgba(0,0,0,0.16).
Breakpoints Mobile: 375px. Tablet: 768px. Desktop: 1280px. Wide: 1440px.
Icon Library Lucide Icons (consistent, MIT-licensed, 24px default).
Component Base shadcn/ui with Radix UI primitives for accessibility compliance.
9.2 Application Surfaces
Surface Primary Users Key Design Considerations
Public Booking Portal Guests Conversion-optimized. Clean, photo-forward layout.
Mobile-first. Fast search form above fold. Trust
signals: reviews, star rating, photos. Minimal form
fields.
Admin Dashboard Admin/Manager Information density balanced with clarity. Sidebar
(Web) navigation. Data-table heavy with inline actions.
Modal forms for CRUD. Charts via Recharts.
Front Desk Panel (Web) Receptionist Quick-access buttons for common tasks. Large
booking search bar prominent. Color-coded room
grid. Clock-in/out widget. Print-ready folio view.
Confidential | June 2026 | Page 28 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 29 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Surface Primary Users Key Design Considerations
POS Interface (Tablet) Waiter/Cashier Full touchscreen. Large tap targets (min 48px).
Category tabs + item grid. Quick add to cart. Number
pad for quantities. Split-bill interface.
KDS (Kitchen Display) Kitchen Staff Dark background (reduces eye strain). Large item
text. Color-coded by ticket age (green → yellow →
red). Single-tap mark ready. Auto-sound alert for new
tickets.
Housekeeping App Housekeeping Simple task list view. One-tap status updates. Photo
(Mobile) upload for maintenance issues. Offline-capable
(PWA with service worker sync).
SuperAdmin Portal Platform Ops Data-dense, no aesthetic frills. Sortable data tables.
(Web) Charts for platform health. Tenant search with instant
results. Action confirmation dialogs.
9.3 Critical User Journeys
Journey 1: Guest Books a Room
24. Landing page → hero search form (dates + guests + room count)
25. Results grid → room cards with photo carousel, price, and amenities
26. Room detail sheet → full description, policies, photo lightbox
27. Booking form → guest details (name, email, phone) + special requests
28. Add-ons page → dining packages, transfers, early check-in
29. Review summary → itemized pricing, cancellation policy confirmation
30. Payment → gateway redirect or embedded card form
31. Confirmation page → booking reference, QR code, add-to-calendar button
Journey 2: Admin Sets Up Property
32. Registration → onboarding wizard → property type selection
33. Basic info → name, address, contact, photos upload
34. Room setup → add room types → add room units with numbers
35. Pricing setup → base rates per room type → seasonal overrides
36. Staff invitation → add staff emails → assign roles
37. Preview portal → review public-facing booking page before going live
38. Go live → confirm subdomain → first booking notification
Journey 3: Waiter Takes an Order
39. POS home → select table from floor plan grid
40. Menu → tap category → tap item → select modifiers
41. Order summary → review items → add note for kitchen → submit
42. KDS ticket appears → kitchen marks items ready → waiter notified
43. Bill → auto-calculated total → select payment method → process
Confidential | June 2026 | Page 29 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 30 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
44. Table cleared → status auto-resets to Available
Confidential | June 2026 | Page 30 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 31 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
10. Frontend Architecture
10.1 Application Structure
The frontend is a Next.js 14 monorepo with App Router, organized into three sub-applications sharing a
common component library:
• apps/portal — Public-facing booking portal (SSR + SSG for SEO)
• apps/dashboard — Admin and Staff management panel (CSR SPA behind auth)
• apps/superadmin — SuperAdmin platform control panel (CSR SPA behind MFA auth)
• packages/ui — Shared shadcn/ui-based component library
• packages/api-client — Type-safe API client generated from OpenAPI spec
• packages/types — Shared TypeScript types and Zod validation schemas
10.2 State Management Strategy
State Type Tool & Approach
Server State (API data) TanStack Query (React Query). All API responses cached with
stale-while-revalidate. Optimistic updates for UX responsiveness
(e.g., room status changes).
UI State (modals, tabs, forms) React local state (useState/useReducer). No global store for pure UI
state.
Global Client State Zustand. Used for: auth user context, active property context,
sidebar collapse, notification count, POS cart state.
Form State React Hook Form + Zod resolver. Schema validation at field and
form level with TypeScript type inference.
Real-time State Socket.io client. Room status, booking notifications, KDS updates,
and table status managed via WebSocket events updating
Zustand/React Query cache.
URL State nuqs (Next.js URL state). Search filters, pagination, and selected
date ranges serialized to URL for shareability and back-button
behavior.
10.3 Key Frontend Modules
Module Components & Behavior
Room Grid (Dashboard) Visual floor-plan grid with color-coded room cards. Real-time status
via WebSocket. Click-to-detail drawer. Drag-to-assign (future).
Booking Calendar Monthly view with occupancy overlay. Date cells show booking count
+ availability %. Click date to open day view with booking list.
Pricing Calendar Editable grid: rows = room types, columns = dates. Inline edit on cell
click. Bulk edit via date range selection.
Confidential | June 2026 | Page 31 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 32 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Module Components & Behavior
POS Interface Split-screen: left = menu grid with search; right = running order with
quantity controls. Sticky total bar. Keyboard shortcuts for common
actions.
KDS Display Auto-refreshing ticket grid. Tickets sorted by age. Color urgency
coding. Sound alert on new ticket via Web Audio API.
Booking Flow (Portal) Multi-step form with progress indicator. Step state persisted in
sessionStorage for back-navigation. Cart held via Zustand + server
soft-lock.
Analytics Charts Recharts library. Occupancy line chart, revenue bar chart, booking
source donut chart, average daily rate trend. All filterable by date
range.
Notification Center Bell icon with badge count. Dropdown list with mark-as-read. Full
notification page with filter by type. Real-time updates via
WebSocket.
10.4 Performance Optimization
• Booking portal pages use Next.js SSR for initial HTML; client hydrates with React Query for live
availability.
• Images served via next/image with WebP conversion and responsive srcsets; hosted on
CloudFront CDN.
• Dashboard code-split per route; heavy modules (charts, rich text editor) lazy-loaded on demand.
• Web Workers used for heavy client-side computations (e.g., multi-month availability parsing).
• Service Worker (Workbox) caches static assets for offline access in housekeeping PWA.
• Virtual scrolling (TanStack Virtual) for large data tables (bookings list, guest list) to avoid DOM
size issues.
Confidential | June 2026 | Page 32 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 33 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
11. Backend Architecture
11.1 Project Structure
The Express.js API is organized as a modular monolith with clear domain boundaries:
• src/modules/{domain}/ — Each module contains: router, controller, service, repository, and
schema files
• src/middleware/ — auth, rbac, tenant-resolver, rate-limiter, error-handler, request-logger
• src/shared/ — utilities, constants, base repository, database client (Prisma), Redis client
• src/jobs/ — BullMQ job definitions and processors (email, SMS, reports, sync)
• src/sockets/ — Socket.io namespace handlers (bookings, rooms, orders)
• src/config/ — Environment config with Zod validation; separate configs for dev/staging/prod
11.2 Request Lifecycle
45. Request arrives at API Gateway (Nginx reverse proxy) → routed to Express app
46. Rate Limiter middleware checks IP/user rate against Redis counters
47. Request Logger middleware logs method, path, IP, and user-agent to structured log
48. Auth middleware validates JWT signature and expiry; extracts user and tenant context
49. Tenant Resolver middleware reads tenant_id from JWT; loads tenant config from Redis cache
(or DB on miss)
50. RBAC middleware checks user role against endpoint permission map; 403 if insufficient
51. Zod Request Validator validates body/query/params against schema; 400 on failure
52. Controller calls Service; Service orchestrates Repository calls and business logic
53. Repository executes Prisma queries with automatic tenant_id scoping
54. Response serialized to JSON; error handler catches and formats any exceptions
11.3 Key Backend Services
Service Responsibilities
AvailabilityService Queries room units minus confirmed bookings minus blocked dates
for a date range. Uses Redis cache with 60-second TTL to reduce
DB load. Cache invalidated on new booking or block.
BookingService Manages the full booking lifecycle. Uses database transactions to
atomically create booking + update inventory + initialize folio.
Enforces soft-lock via Redis with TTL.
PricingService Computes final rate for a given room type, rate plan, and date range.
Evaluates: base rate → date overrides → day-of-week rules →
discount code → length-of-stay discount. Returns itemized
breakdown.
PaymentService Abstracts Stripe and Razorpay behind a common interface. Handles:
create payment intent, confirm payment, capture, void, and refund.
Listens to gateway webhooks for async confirmations.
Confidential | June 2026 | Page 33 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 34 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Service Responsibilities
FolioService Manages in-stay charges. Accepts charge postings from any staff,
calculates running totals, finalizes folio on checkout, generates
invoice PDF via pdf-lib, uploads to S3.
NotificationService Dispatches jobs to BullMQ queues for email (Resend), SMS (Twilio),
and in-app push (Socket.io). Templates stored in DB; merged with
data context at dispatch time. Handles retries.
ChannelManagerService Synchronizes availability and rates to connected OTAs via their APIs.
Receives OTA bookings via webhook and creates internal bookings.
(Enabled on Professional+ plans.)
ReportingService Aggregates booking and revenue data for dashboard KPIs and
exports. Uses read replica to avoid impacting OLTP performance.
Heavy reports queued as background jobs.
RealTimeService Manages Socket.io rooms (namespaced by property_id).
Broadcasts: new booking events, room status changes, order tickets,
KDS updates, and notification alerts.
11.4 Background Job Queues
Queue Name Job Types Retry Policy
email-queue booking-confirmation, checkout-receipt, 3 retries, exponential
review-request, staff-invite, report-delivery backoff, 30min max delay
sms-queue booking-otp, check-in-reminder, 3 retries, 5min fixed delay
payment-confirmation
payment-queue refund-processing, payment-void, 5 retries, exponential
webhook-confirmation backoff, idempotent keys
report-queue daily-summary, weekly-revenue, 2 retries, no backoff
occupancy-forecast, export-csv
sync-queue ota-availability-push, ota-rate-push, 5 retries, circuit breaker on
ota-booking-pull OTA API failures
maintenance-queue dead-booking-cleanup, 1 retry, low priority
expired-softlock-release, loyalty-recalculation
Confidential | June 2026 | Page 34 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 35 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
12. Integrations & Notifications
12.1 Payment Gateway Integration
Gateway Use Case & Configuration
Stripe Primary gateway for international properties. Admin connects own
Stripe account via OAuth (Stripe Connect). StayEasy takes platform
fee via application_fee_amount on each charge. Supports: cards,
Apple/Google Pay, PaymentIntents API, webhooks for async
confirmation, Refunds API.
Razorpay Primary gateway for South Asian properties. Admin provides
Razorpay Key ID and Secret in property settings. Supports: UPI,
NetBanking, Cards, Wallets. Order API used for payment creation;
webhook verifies payment_captured event.
12.2 Notification Flows
Trigger Event Recipient(s) Channels
Booking confirmed Guest + Admin Email + SMS to Guest; In-app push to
Admin/Manager
Booking cancelled Guest + Admin Email + SMS to Guest; In-app push to
Admin
Refund processed Guest Email + SMS
Check-in reminder (T-24h) Guest Email + WhatsApp (if opted in)
Checkout receipt Guest Email (with invoice PDF attachment)
Post-stay review request Guest Email (2 hours after checkout)
New POS order ticket Kitchen Staff KDS WebSocket push + audio alert
Room checkout (dirty status) Housekeeping In-app push + SMS
Supervisor
Task assigned Staff Member In-app push + Email
Low availability alert (≤3) Admin In-app push (configurable threshold)
Staff invite Invited Staff Email with onboarding link
Subscription renewal Admin Email (7 days and 1 day before)
Platform alert All Admins Email + In-app announcement banner
12.3 Calendar & Export Integrations
Confidential | June 2026 | Page 35 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 36 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
• Guests can add booking to Google Calendar or iCal via .ics file download from confirmation
page and email.
• Admin can export booking calendar as .ics feed (subscribed URL) for integration with
Google/Outlook Calendar.
• Invoices exported as PDF (generated server-side via pdf-lib); downloadable from folio view and
guest account.
• Reports exported as CSV or Excel (.xlsx via ExcelJS library) from the analytics module.
Confidential | June 2026 | Page 36 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 37 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
13. Subscription Plans & Limits
Feature Free Trial (14 Basic Professional Enterprise
days)
Properties 1 1 Up to 5 Unlimited
Rooms per property Up to 10 Up to 25 Up to 100 Unlimited
Staff accounts 3 10 50 Unlimited
Bookings/month 50 200 2,000 Unlimited
Restaurant/POS No Yes (1 outlet) Yes (3 outlets) Yes (unlimited)
Channel Manager No No Yes Yes
Custom Domain No No Yes Yes
Analytics Basic (7 days) Standard Advanced Advanced + Raw
export
Email Reports No Weekly Daily/Weekly Custom schedule
SLA Uptime Best effort 99.5% 99.9% 99.95%
Support Community Email (48h) Email (8h) Dedicated
account manager
Price/month Free $49 $149 Custom
Confidential | June 2026 | Page 37 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 38 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
14. Implementation Roadmap
14.1 Phase 1 — Foundation (Weeks 1–2)
• Project scaffold: Next.js monorepo, Express API, PostgreSQL + Prisma, Redis, Docker
Compose local dev
• Auth system: registration, login, JWT, refresh, MFA scaffold, RBAC middleware
• Multi-tenancy: tenant model, tenant resolver middleware, RLS policies in PostgreSQL
• Property setup: CRUD for properties, room types, and room units
• Design system: Tailwind config, shadcn/ui setup, shared UI components
• CI/CD pipeline: GitHub Actions for lint, test, build, and Docker push
14.2 Phase 2 — Core Booking (Weeks 2–4)
• Availability engine: date-range query with room inventory, Redis cache, soft-lock
• Pricing engine: base rates, date overrides, day-of-week rules, discount codes
• Booking flow: full guest checkout, payment integration (Stripe), confirmation
• Admin booking management: list, search, manual booking creation
• Check-in / Check-out flow: room assignment, folio initialization, status updates
• Email notifications: confirmation, cancellation, checkout receipt via Resend
14.3 Phase 3 — Hotel Operations (Weeks 4–5)
• Room status management: housekeeping workflow, WebSocket real-time updates
• Staff management: invitations, roles, shifts, task assignments
• Guest CRM: guest profiles, stay history, loyalty points, preferences
• Folio management: ad-hoc charges, tax computation, invoice PDF generation
• Admin analytics dashboard: KPI widgets, occupancy chart, revenue reports
• Admin portal customization: logo, brand color, custom domain CNAME setup
14.4 Phase 4 — Restaurant Module (Weeks 5–7)
• Table and section management: floor plan with live status
• Menu management: categories, items, modifiers, time-based menus
• POS interface: touchscreen-optimized order creation and management
• Kitchen Display System: WebSocket-driven ticket board with audio alerts
• POS payment: cash, card, room charge, split billing
• Restaurant analytics: sales by item, peak hours, daily/weekly reports
Confidential | June 2026 | Page 38 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 39 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
14.5 Phase 5 — SuperAdmin, Polish & Launch (Weeks 7–10)
• SuperAdmin portal: tenant management, platform analytics, subscription billing, feature flags
• Subscription enforcement: plan limits for rooms, staff, bookings, features
• Channel Manager integration (Professional+ tier)
• Performance optimization: query analysis, caching tuning, CDN configuration
• Security audit: penetration testing, OWASP scan, RLS validation
• Load testing: simulate 10,000 concurrent users; identify and resolve bottlenecks
• Beta release with 10 pilot properties; feedback collection and bug fix sprint
• Public launch with documentation, onboarding video library, and support portal
Confidential | June 2026 | Page 39 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 40 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
15. Testing Strategy
Test Type Scope & Tools Coverage Target
Unit Tests Service layer business logic (e.g., PricingService, ≥ 80% line coverage
AvailabilityService). Tool: Vitest with mocked
repositories.
Integration Tests API routes end-to-end with test PostgreSQL ≥ 60% of endpoints
database. Tool: Supertest + testcontainers.
Component Tests UI components in isolation. Tool: React Testing All shared UI
Library + Vitest. components
E2E Tests Critical user flows: guest booking, admin check-in, Top 10 user journeys
POS order. Tool: Playwright.
Performance Tests Load test availability search and booking creation P95 < 500ms at target
under 500 concurrent users. Tool: k6. load
Security Tests OWASP ZAP automated scan on staging; manual Zero P1/P2 OWASP
pen test pre-launch. issues
Accessibility Tests Booking portal against WCAG 2.1 AA. Tool: Zero critical a11y issues
axe-core + manual screen reader testing.
Database Tests RLS policy validation: verify cross-tenant data 100% of tenant-scoped
isolation under adversarial queries. tables
All tests run automatically in the GitHub Actions CI pipeline on every pull request. Merges to main
branch are blocked if any test suite fails or if code coverage drops below the defined thresholds.
Confidential | June 2026 | Page 40 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 41 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
16. Deployment & DevOps
16.1 Infrastructure Overview
Component AWS Service & Configuration
API Servers ECS Fargate tasks; auto-scaling 2–20 tasks based on CPU ≥ 70%
trigger; Application Load Balancer with sticky sessions disabled.
Database (Primary) RDS PostgreSQL 15; db.t3.medium to start; Multi-AZ standby;
automated backups 30-day retention; encryption at rest.
Database (Read) RDS Read Replica for analytics queries; same AZ as primary for low
replication lag.
Cache & Queues ElastiCache Redis Cluster; 2 shards, 1 replica each; in-transit and
at-rest encryption.
Object Storage S3 (us-east-1); versioning enabled; lifecycle policy: delete originals
after 90 days if CDN copy exists.
CDN CloudFront distribution in front of S3; price class 200 (US/EU/Asia);
cache-control headers set per asset type.
DNS Route 53; health-check-based failover; ALIAS records for ALB.
Secrets AWS Parameter Store (SSM) for all environment variables; accessed
at container startup via init script.
Log Aggregation CloudWatch Logs; structured JSON logs; 90-day retention; Datadog
agent for APM and dashboard.
Error Tracking Sentry (frontend + backend); environment-tagged; alert rules for P1
issues to Slack.
SSL AWS Certificate Manager; auto-renewal; applied at ALB and
CloudFront.
16.2 Deployment Pipeline
55. Developer pushes branch → GitHub Actions: lint → unit tests → build Docker image.
56. PR opened → integration tests run on ephemeral test environment (testcontainers).
57. PR approved and merged to main → Docker image pushed to ECR with git SHA tag.
58. Deploy to Staging (auto): ECS service updated; smoke tests run via Playwright.
59. Deploy to Production (manual approval): blue-green deployment via ECS rolling update; health
checks confirm before shifting traffic.
60. Post-deployment: Sentry deployment marker created; Datadog deployment tracking activated.
61. Rollback: one-click revert to previous task definition revision in ECS if metrics degrade.
Confidential | June 2026 | Page 41 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 42 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
17. Risks & Mitigations
Risk Impact Mitigation Strategy
Double booking (race Critical — destroys Redis soft-lock with atomic SET NX;
condition) guest trust database-level unique constraint on room_unit ×
date range; booking service uses DB
transaction.
Payment gateway downtime High — blocks all Support multiple gateways (Stripe + Razorpay);
revenue auto-failover configuration; webhook retry queue
handles delayed confirmations.
Cross-tenant data leak Critical — legal and Prisma-level tenant_id scoping on all queries;
trust risk PostgreSQL RLS as second layer; automated
RLS tests in CI.
Staff app unusable on slow High — affects Service Worker for offline PWA; POS can queue
internet POS and orders locally and sync on reconnect; critical
housekeeping data pre-loaded.
Scope creep extending Medium — delay Strict MVP feature set for Phase 1-3; feature
timeline and budget overrun requests go to backlog; weekly scope review
with stakeholders.
Third-party API rate limits Medium — delayed BullMQ with configurable concurrency limits;
(Twilio) notifications exponential backoff retries; in-app notifications
as primary channel.
Database performance High — slow Read replicas for analytics; Redis caching for
degradation dashboards and availability; regular EXPLAIN ANALYZE audits;
portal pgBouncer for connection pooling.
Admin churns early in trial Medium — revenue Guided onboarding wizard; in-app tooltips;
risk proactive email sequence; dedicated onboarding
call for Professional+ signups.
Confidential | June 2026 | Page 42 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 43 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
18. Appendices
Appendix A: Booking Status State Machine
Bookings transition through the following states:
• PENDING_PAYMENT — created but payment not yet confirmed (soft lock active, 10 min TTL)
• CONFIRMED — payment successful; room inventory deducted
• CHECKED_IN — guest arrived; room assigned; folio active
• CHECKED_OUT — guest departed; folio settled; room set to Dirty
• CANCELLED — cancelled by guest or Admin before check-in; refund triggered
• NO_SHOW — guest did not arrive by check-out date +1 day; no-show policy applied
• EXPIRED — PENDING_PAYMENT soft lock expired without payment; room released
Appendix B: Room Status State Machine
• AVAILABLE — ready for booking and check-in
• OCCUPIED — guest currently checked in
• DIRTY — checked out; awaiting housekeeping
• CLEANING — housekeeping in progress
• INSPECTED — cleaned and inspected; pending final approval
• MAINTENANCE — out of service; not available for booking
• BLOCKED — Admin-blocked for personal use or events; not available for booking
Appendix C: Order Status State Machine (Restaurant POS)
• OPEN — table seated; order not yet submitted
• SUBMITTED — order sent to kitchen KDS
• IN_PROGRESS — at least one item being prepared
• READY — all items marked ready by kitchen
• SERVED — items delivered to table by waiter
• BILLED — bill presented; awaiting payment
• PAID — payment collected; order closed; table freed
• VOIDED — order cancelled before payment (Manager approval required)
Appendix D: Glossary of API Error Codes
Error Code HTTP Status Meaning
VALIDATION_ERROR 400 Request body/params failed Zod schema validation
UNAUTHORIZED 401 Missing or expired JWT token
FORBIDDEN 403 Authenticated but insufficient role for this action
Confidential | June 2026 | Page 43 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd
--- Page 44 ---
StayEasy — Hotel & Restaurant Management SaaS SRS v1.0.0
Error Code HTTP Status Meaning
NOT_FOUND 404 Requested resource does not exist or belongs to
another tenant
CONFLICT 409 Booking conflict — room already reserved for dates
ROOM_UNAVAILABLE 422 Room type has no available units for the requested
period
SOFT_LOCK_EXPIRED 422 Checkout session expired; user must restart booking
DISCOUNT_INVALID 422 Discount code not found, expired, exhausted, or not
applicable
PAYMENT_FAILED 422 Payment gateway declined the transaction
RATE_LIMITED 429 Too many requests; retry after specified seconds
INTERNAL_ERROR 500 Unexpected server error; check Sentry for details
— End of Document —
StayEasy SRS v1.0.0 | June 2026 | Confidential
Confidential | June 2026 | Page 44 of 44 Pravidhi Digital Innovations Nepal Pvt
Ltd

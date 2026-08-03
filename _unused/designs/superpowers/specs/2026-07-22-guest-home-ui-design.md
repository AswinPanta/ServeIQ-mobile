# Guest Home UI Design — Mobile Replication

## Overview
Replicate the web StayEasy guest homepage for mobile with creative enhancements.

## Sections
1. **Hero with Search** — Full-bleed hero image, animated search bar, gradient overlay
2. **Browse by Property Type** — Horizontal scroll icon cards (Hotel, Apartment, Resort, Villa, Cottage)
3. **Stays Nearby** — Horizontal hotel cards with real images, price, rating, scarcity badge
4. **Trending Destinations** — 2-column grid of destination cards with gradient overlay
5. **Popular Destinations** — Horizontal scroll of rounded city cards
6. **What Travelers Say** — Testimonial cards with avatar, rating, horizontal scroll
7. **Ready for Adventure CTA** — Newsletter signup with gradient background
8. **Footer** — Links grid, social icons, copyright

## Creative Twists
- Parallax hero image
- Staggered card animations on scroll
- Pull-to-refresh data from API
- Skeleton loading placeholders
- Smooth scale/fade transitions on press

## Files to Modify
- `app/(tabs)/index.tsx` — Main home screen
- `components/feature/hero-section.tsx` — Enhanced hero
- `components/guest/Testimonials.tsx` — Enhanced testimonials
- `components/guest/WhyStayEasy.tsx` — Trust badges
- `components/guest/OtherHotels.tsx` — Related hotels
- New: `components/guest/PropertyTypeBrowser.tsx`
- New: `components/guest/TrendingDestinations.tsx`
- New: `components/guest/PopularDestinations.tsx`
- New: `components/guest/NewsletterCTA.tsx`
- New: `components/guest/GuestFooter.tsx`

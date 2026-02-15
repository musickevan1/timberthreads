# Roadmap: Timber & Threads Retreat - Website Update + Promo Video

## Overview

This roadmap transforms the Timber & Threads Retreat website from a broken gallery system and static content into a polished, video-enhanced site that makes quilters and crafters want to book a stay. The journey moves from fixing core infrastructure (broken gallery persistence), to migrating gallery images to Cloudinary CDN, integrating professionally shot promo video (hero + dedicated section), optimizing performance for rural Missouri audiences, and delivering a client invoice. All work completes within one week of the Feb 15 shoot (by Feb 22), staying within $400-600 budget.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Infrastructure** - Fix broken gallery persistence, set up Cloudinary + Upstash Redis
- [ ] **Phase 2: Gallery Migration** - Migrate images to Cloudinary, update admin UI
- [ ] **Phase 3: Video Integration** - Add hero background video + dedicated promo section (depends on Feb 15 shoot)
- [ ] **Phase 4: Performance Optimization** - Lazy loading, Lighthouse scores, bundle optimization
- [ ] **Phase 5: Invoice** - Generate PDF invoice for client ($400-600 range)

## Phase Details

### Phase 1: Infrastructure
**Goal**: Fix broken gallery persistence in production and establish cloud infrastructure for images and videos
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Gallery metadata persists across Vercel deployments (no data loss on redeploy)
  2. Cloudinary account configured with signed uploads (secure admin access)
  3. Next.js Image component enabled and configured for Cloudinary (images.unoptimized: false)
  4. Upstash Redis database operational and accessible from API routes
  5. Admin can upload test image to Cloudinary and retrieve metadata from Upstash Redis
**Plans**: TBD

Plans:
- [ ] 01-01-PLAN.md — Set up Upstash Redis and migrate gallery metadata from file system (Wave 1)
- [ ] 01-02-PLAN.md — Configure Cloudinary SDK with signed upload security (Wave 1, parallel to 01-01)
- [ ] 01-03-PLAN.md — Migrate gallery uploads to Cloudinary and enable Next.js Image optimization (Wave 2, depends on 01-01 + 01-02)

### Phase 2: Gallery Migration
**Goal**: Migrate existing gallery to Cloudinary with full admin functionality working in production
**Depends on**: Phase 1
**Requirements**: GALL-01, GALL-02, GALL-03, GALL-04, GALL-05, GALL-06
**Success Criteria** (what must be TRUE):
  1. All existing gallery images are hosted on Cloudinary CDN
  2. Admin can upload new images via gallery management UI with changes persisting
  3. Admin can reorder, edit captions, and soft-delete images with changes persisting in production
  4. Gallery displays images with automatic format optimization (WebP/AVIF based on browser)
  5. Gallery implements lazy loading (first 6 images eager, rest lazy)
  6. No broken image links or 404 errors after migration
**Plans**: 2 plans in 2 waves

Plans:
- [ ] 02-01-PLAN.md — Migrate gallery to Cloudinary and update display components
- [ ] 02-02-PLAN.md — Enable admin management with Cloudinary uploads (Wave 2, depends on 02-01)

### Phase 3: Video Integration
**Goal**: Add professionally shot promo video to homepage (hero background + dedicated section)
**Depends on**: Phase 1 (infrastructure), Feb 15 video shoot completion
**Requirements**: VID-01, VID-02, VID-03, VID-04, VID-05, VID-06, VID-07
**Success Criteria** (what must be TRUE):
  1. Hero section displays muted autoplay background video clip (selected from drone footage)
  2. Hero video has visible pause/play control and high-quality poster fallback
  3. Dedicated video section displays full promo video with playback controls
  4. All videos are self-hosted (no YouTube/Vimeo branding)
  5. Video files are compressed to under 10MB total across all versions
  6. Videos automatically disable on slow connections (3G) showing poster image instead
  7. Videos work on both desktop and mobile (iOS Safari, Android Chrome)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Performance Optimization
**Goal**: Optimize site performance for rural Missouri audience with mobile-first delivery
**Depends on**: Phase 2, Phase 3
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. Page loads in under 3 seconds on Fast 3G throttled connection
  2. Lighthouse mobile performance score is 80 or higher
  3. Gallery images use responsive sizing via Cloudinary transforms (different sizes per breakpoint)
  4. No unused packages in production bundle (dead code eliminated)
  5. All images and videos are fully optimized with appropriate compression and formats
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Enable Next.js image optimization and implement responsive sizing
- [ ] 04-02-PLAN.md — Bundle cleanup and performance verification

### Phase 5: Invoice
**Goal**: Generate professional PDF invoice for client with itemized charges
**Depends on**: Nothing (can execute anytime)
**Requirements**: INV-01, INV-02, INV-03
**Success Criteria** (what must be TRUE):
  1. PDF invoice generated with itemized line items (video shoot, video editing, website updates)
  2. Invoice includes Evan Musick as provider and Timber & Threads Retreat contact info as client
  3. Invoice total is in the $400-600 range
  4. Invoice format is professional and ready to send
**Plans**: 1 plan

Plans:
- [ ] 05-01-PLAN.md — Verify invoice completeness and readiness for client delivery

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

Note: Phase 5 (Invoice) is independent and can execute at any point.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure | 0/TBD | Not started | - |
| 2. Gallery Migration | 0/2 | Planned | - |
| 3. Video Integration | 0/TBD | Blocked (awaiting Feb 15 shoot) | - |
| 4. Performance Optimization | 0/2 | Planned | - |
| 5. Invoice | 0/1 | Ready (invoice exists) | - |

---
*Roadmap created: 2026-02-14*
*Last updated: 2026-02-14*

# Requirements: Timber & Threads Retreat — Website Update + Promo Video

**Defined:** 2026-02-14
**Core Value:** The promo video and site improvements must make the retreat feel warm, inviting, and real — showcasing the unique island property in a way that makes quilters and crafters want to book a stay.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: Gallery metadata persists across Vercel deployments (replace broken db.json with Vercel KV)
- [ ] **INFRA-02**: Gallery images stored on Cloudinary CDN (not local filesystem)
- [ ] **INFRA-03**: Cloudinary configured with signed uploads for admin security
- [ ] **INFRA-04**: next.config.js image optimization enabled (remove `images.unoptimized: true`)
- [ ] **INFRA-05**: next.config.js remotePatterns allows res.cloudinary.com

### Gallery

- [ ] **GALL-01**: Admin can upload images to Cloudinary via gallery management UI
- [ ] **GALL-02**: Admin can reorder gallery images with changes persisting in production
- [ ] **GALL-03**: Admin can edit captions with changes persisting in production
- [ ] **GALL-04**: Admin can soft-delete and restore images in production
- [ ] **GALL-05**: Gallery displays images from Cloudinary with automatic format optimization (WebP/AVIF)
- [ ] **GALL-06**: Gallery images lazy-load below the fold (first 6 eager, rest lazy)

### Video

- [ ] **VID-01**: Homepage has a hero background video clip (muted, autoplay, loop, playsInline)
- [ ] **VID-02**: Hero video has a high-quality poster image fallback
- [ ] **VID-03**: Hero video has a visible pause/play control for accessibility
- [ ] **VID-04**: Dedicated video section on the page with full promo video and playback controls
- [ ] **VID-05**: Promo video is self-hosted (no YouTube/Vimeo branding)
- [ ] **VID-06**: Video files compressed to <10MB total across all versions
- [ ] **VID-07**: Video disabled on slow connections (3G) with poster image shown instead

### Performance

- [ ] **PERF-01**: Page loads in under 3 seconds on Fast 3G throttled connection
- [ ] **PERF-02**: Lighthouse mobile score >= 80
- [ ] **PERF-03**: Images served with responsive sizing via Cloudinary transforms
- [ ] **PERF-04**: No unused Cloudinary packages in bundle (remove or complete integration)

### Invoice

- [ ] **INV-01**: PDF invoice generated with itemized line items (shoot, edit, web updates)
- [ ] **INV-02**: Invoice includes Evan Musick as provider and Timber & Threads as client
- [ ] **INV-03**: Invoice total is in the $400-600 range

## v1.1 Requirements — Promo Video Edit

Requirements for processing raw shoot footage into web-ready deliverables.

### Video Processing

- [ ] **PROC-01**: All raw clips are cataloged with thumbnails, duration, codec, and resolution metadata
- [ ] **PROC-02**: Interior Canon clips are analyzed for silence/dead air and trimmed segments exported
- [ ] **PROC-03**: Reusable FFmpeg compression scripts exist for hero (720p, <5MB) and promo (1080p, <10MB) with correct web flags
- [ ] **PROC-04**: Corrupt DJI_0018.MP4 is identified and skipped gracefully in all batch operations

### Hero Background Video

- [ ] **HERO-01**: A single hero background video loop (15-30s) is compressed to <5MB, 720p, H.264, muted
- [ ] **HERO-02**: Hero video has `-movflags +faststart` and `-pix_fmt yuv420p` for universal browser playback
- [ ] **HERO-03**: A poster frame is extracted from the hero video as a static fallback image
- [ ] **HERO-04**: 2-3 hero loop candidates are prepared for client selection before final choice

### Full Promo Video

- [ ] **PROMO-01**: A 1-2 minute promo video is assembled with drone + interior footage, music, and ambient audio
- [ ] **PROMO-02**: Promo video is compressed to <10MB, 1080p, H.264 with AAC audio
- [ ] **PROMO-03**: Promo video has `-movflags +faststart` and `-pix_fmt yuv420p` for universal playback
- [ ] **PROMO-04**: A poster frame is extracted from the promo video as a preview image
- [ ] **PROMO-05**: Additional quality levels (480p, 720p) are generated for slow-connection fallback

### Creative Editing

- [ ] **EDIT-01**: All footage is color graded with warm tones in DaVinci Resolve
- [ ] **EDIT-02**: Music track (acoustic/gentle piano) is synced with visual pacing
- [ ] **EDIT-03**: Master exports are ProRes or DNxHR (not H.264) to avoid double compression
- [ ] **EDIT-04**: Timeline versions (v1, v2, FINAL) are maintained for iteration

## v2 Requirements

### Enhancements

- **ENH-01**: Progressive blur-up placeholders for gallery images during loading
- **ENH-02**: Gallery image zoom/lightbox with swipe navigation on mobile
- **ENH-03**: Video testimonials section (requires collecting guest content)
- **ENH-04**: Virtual tour section combining drone + interior footage
- **ENH-05**: Video analytics tracking (play rate, completion rate)

### Security

- **SEC-01**: Admin authentication via server-side sessions with httpOnly cookies
- **SEC-02**: Rate limiting on /api/auth and /api/contact endpoints
- **SEC-03**: HTML sanitization on contact form to prevent email injection

## Out of Scope

| Feature | Reason |
|---------|--------|
| Booking/payment system | Not requested, contact form sufficient |
| Workshop registration | Not requested |
| Visual redesign | Client is happy with current look |
| Mobile app | Web only |
| Next.js 15 upgrade | Works fine on 14, no breaking benefit |
| 360-degree photo tours | High production cost, validate need first |
| Unmuted autoplay video | Accessibility nightmare, browsers block it |
| Auto-advancing gallery carousel | Accessibility issues, motion sickness risk |
| Infinite scroll gallery | Hard to reach footer, accessibility issues |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| GALL-01 | Phase 2 | Pending |
| GALL-02 | Phase 2 | Pending |
| GALL-03 | Phase 2 | Pending |
| GALL-04 | Phase 2 | Pending |
| GALL-05 | Phase 2 | Pending |
| GALL-06 | Phase 2 | Pending |
| VID-01 | Phase 3 | Pending |
| VID-02 | Phase 3 | Pending |
| VID-03 | Phase 3 | Pending |
| VID-04 | Phase 3 | Pending |
| VID-05 | Phase 3 | Pending |
| VID-06 | Phase 3 | Pending |
| VID-07 | Phase 3 | Pending |
| PERF-01 | Phase 4 | Pending |
| PERF-02 | Phase 4 | Pending |
| PERF-03 | Phase 4 | Pending |
| PERF-04 | Phase 4 | Pending |
| INV-01 | Phase 5 | Pending |
| INV-02 | Phase 5 | Pending |
| INV-03 | Phase 5 | Pending |

**v1 Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

**v1.1 Coverage:**
- v1.1 requirements: 17 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 17 ⚠️

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-16 after milestone v1.1 requirements defined*

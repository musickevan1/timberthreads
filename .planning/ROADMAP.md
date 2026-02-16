# Roadmap: Timber & Threads Retreat - Website Update + Promo Video

## Overview

This roadmap transforms the Timber & Threads Retreat website from a broken gallery system and static content into a polished, video-enhanced site that makes quilters and crafters want to book a stay. The journey moves from fixing core infrastructure (broken gallery persistence), to migrating gallery images to Cloudinary CDN, integrating professionally shot promo video (hero + dedicated section), optimizing performance for rural Missouri audiences, and delivering a client invoice. All work completes within one week of the Feb 15 shoot (by Feb 22), staying within $400-600 budget.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

**v1.0 (Website Update):**
- [ ] **Phase 1: Infrastructure** - Fix broken gallery persistence, set up Cloudinary + Vercel KV
- [ ] **Phase 2: Gallery Migration** - Migrate images to Cloudinary, update admin UI
- [ ] **Phase 3: Video Integration** - Add hero background video + dedicated promo section (depends on Feb 15 shoot)
- [ ] **Phase 4: Performance Optimization** - Lazy loading, Lighthouse scores, bundle optimization
- [ ] **Phase 5: Invoice** - Generate PDF invoice for client ($400-600 range)

**v1.1 (Promo Video Edit):**
- [x] **Phase 6: Video Processing Infrastructure** - CLI setup, cataloging, silence detection, trimming ✓
- [ ] **Phase 7: Creative Video Editing** - DaVinci Resolve editing with human action checkpoints
- [ ] **Phase 8: Web Compression & Deployment** - FFmpeg final compression, poster frames, deploy to public/assets/videos/

## Phase Details

### Phase 1: Infrastructure
**Goal**: Fix broken gallery persistence in production and establish cloud infrastructure for images and videos
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Gallery metadata persists across Vercel deployments (no data loss on redeploy)
  2. Cloudinary account configured with signed uploads (secure admin access)
  3. Next.js Image component enabled and configured for Cloudinary (images.unoptimized: false)
  4. Vercel KV database operational and accessible from API routes
  5. Admin can upload test image to Cloudinary and retrieve metadata from Vercel KV
**Plans**: 4 plans (3 original + 1 gap closure)

Plans:
- [x] 01-01-PLAN.md — Enable Next.js Image optimization and fix image loading strategy (Wave 1)
- [x] 01-02-PLAN.md — Redis persistence for gallery metadata (Wave 1)
- [x] 01-03-PLAN.md — Cloudinary CDN Integration (Wave 2)
- [ ] 01-04-PLAN.md — Implement Cloudinary image deletion in DELETE handler (gap closure)

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
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

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
**Plans**: 3 plans in 2 waves

Plans:
- [ ] 03-01-PLAN.md — Compress video files and extract poster images (Wave 1, human action checkpoint)
- [ ] 03-02-PLAN.md — Update Hero component with video background and connection detection (Wave 2, depends on 03-01)
- [ ] 03-03-PLAN.md — Create VideoSection and verify integration (Wave 2, depends on 03-01)

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
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Invoice
**Goal**: Generate professional PDF invoice for client with itemized charges
**Depends on**: Nothing (can execute anytime)
**Requirements**: INV-01, INV-02, INV-03
**Success Criteria** (what must be TRUE):
  1. PDF invoice generated with itemized line items (video shoot, video editing, website updates)
  2. Invoice includes Evan Musick as provider and Timber & Threads Retreat contact info as client
  3. Invoice total is in the $400-600 range
  4. Invoice format is professional and ready to send
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Video Processing Infrastructure
**Goal**: Establish CLI video processing toolchain and preprocess raw footage into cataloged, trimmed segments ready for creative editing
**Depends on**: Nothing (v1.1 first phase)
**Requirements**: PROC-01, PROC-02, PROC-03, PROC-04
**Success Criteria** (what must be TRUE):
  1. All raw clips (drone + Canon) are cataloged with thumbnails, duration, codec, and resolution metadata visible in file browser
  2. Corrupt DJI_0018.MP4 is identified and documented as unrecoverable, skipped gracefully in all batch operations
  3. Canon interior clips are analyzed with silence/dead air timestamps exported to processing notes
  4. Reusable FFmpeg compression scripts exist for hero (720p, <5MB target) and promo (1080p, <10MB target) with correct browser compatibility flags (-movflags +faststart, -pix_fmt yuv420p)
  5. Trimmed segments are exported to processing/trimmed/ preserving DJI metadata for Resolve import
**Plans**: 2 plans in 2 waves

Plans:
- [x] 06-01-PLAN.md — Catalog all raw footage + analyze Canon audio for silence (Wave 1) ✓
- [x] 06-02-PLAN.md — Compression scripts + prepare trimmed segments for Resolve (Wave 2, depends on 06-01) ✓

### Phase 7: Creative Video Editing
**Goal**: Manually assemble, color grade, and export master video files in DaVinci Resolve based on preprocessed clips from Phase 6
**Depends on**: Phase 6 (requires cataloged, trimmed clips)
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, HERO-04
**Success Criteria** (what must be TRUE):
  1. DaVinci Resolve project exists with organized bins (Drone, Canon, Audio, Graphics)
  2. 2-3 hero loop candidates (15-30s each) are assembled with warm color grading and seamless start/end matching tested for 3+ loop cycles
  3. Full promo video timeline (1-2min) is assembled with drone + interior footage, music track synced to visual pacing, and ambient audio mixed
  4. All footage is color graded with warm tones (increased oranges, reduced blues) matching peaceful/cozy aesthetic
  5. Master exports (ProRes 422 or DNxHR HQ) are saved to exports/ directory with timeline versions maintained (v1, v2, FINAL)
**Plans**: 2 plans in 2 waves

**Note**: This phase involves MANUAL human work. Plans include human action checkpoints where user must perform creative editing tasks in DaVinci Resolve. Claude Code prepares inputs and processes outputs, but cannot perform creative decisions.

Plans:
- [ ] 07-01-PLAN.md — Project setup, hero loop duration decision, and hero loop candidates in DaVinci Resolve (Wave 1, checkpoints)
- [ ] 07-02-PLAN.md — Promo video assembly with music and master export validation (Wave 2, depends on 07-01)

### Phase 8: Web Compression & Deployment
**Goal**: Compress master exports into web-optimized deliverables and deploy to website public directory
**Depends on**: Phase 7 (requires master exports)
**Requirements**: HERO-01, HERO-02, HERO-03, PROMO-01, PROMO-02, PROMO-03, PROMO-04, PROMO-05
**Success Criteria** (what must be TRUE):
  1. Selected hero video is compressed to <5MB, 720p H.264, muted (-an flag), with -movflags +faststart and -pix_fmt yuv420p for universal browser playback
  2. Hero video poster frame is extracted as static fallback image (1280x720, high-quality JPEG)
  3. Full promo video is compressed to <10MB, 1080p H.264 with AAC 128kbps audio, -movflags +faststart, -pix_fmt yuv420p
  4. Promo video poster frame is extracted as preview image (1920x1080, high-quality JPEG)
  5. Additional quality levels (480p, 720p) are generated for slow-connection fallback with appropriate bitrate targeting
  6. All compressed videos and poster frames are deployed to public/assets/videos/ and verified playable in Safari/iOS and Chrome/Android
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**

**v1.0 (Website Update):**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

Note: Phase 5 (Invoice) is independent and can execute at any point.

**v1.1 (Promo Video Edit):**
Phases execute in numeric order: 6 → 7 → 8

Phase 6 must complete before Phase 7 (creative editing needs cataloged clips).
Phase 7 must complete before Phase 8 (web compression needs master exports).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| **v1.0 (Website Update)** | | | |
| 1. Infrastructure | 3/4 | Gap closure planned | - |
| 2. Gallery Migration | 0/TBD | Not started | - |
| 3. Video Integration | 0/3 | Planned | - |
| 4. Performance Optimization | 0/TBD | Not started | - |
| 5. Invoice | 0/TBD | Not started | - |
| **v1.1 (Promo Video Edit)** | | | |
| 6. Video Processing Infrastructure | 2/2 | ✓ Complete | 2026-02-16 |
| 7. Creative Video Editing | 0/2 | Planned | - |
| 8. Web Compression & Deployment | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-14*
*Last updated: 2026-02-16 (Phase 1 gap closure planned)*

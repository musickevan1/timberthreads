# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** The promo video and site improvements must make the retreat feel warm, inviting, and real — showcasing the unique island property in a way that makes quilters and crafters want to book a stay.
**Current milestone:** v1.1 Promo Video Edit
**Current focus:** Phase 6 - Video Processing Infrastructure

## Current Position

Milestone: v1.1 (Promo Video Edit)
Phase: 1 of 8 (Infrastructure)
Plan: 3 of 3
Status: Complete
Last activity: 2026-02-16 — Completed 01-03 (Cloudinary CDN Integration)

Progress: [██░░░░░░░░] 20% (v1.1 milestone - estimated)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 4.5 min
- Total execution time: 0.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-infrastructure | 3 | 9.3min | 3.1min |
| 06-video-processing-infrastructure | 2 | 12.4min | 6.2min |

**Recent Trend:**
- Last 5 plans: 06-02 (5.0min), 01-01 (2.8min), 01-02 (3.6min), 01-03 (2.9min)
- Trend: Phase 01 complete! Infrastructure ready for production deployment

*Updated after each plan completion*
| Phase 01-infrastructure P03 | 2.9 | 5 tasks | 5 files |

## Accumulated Context

### Decisions

Recent decisions affecting current work:

- **Upstash Redis for metadata persistence**: Using REST API instead of TCP for Vercel Edge compatibility - fixes production bug where gallery changes were lost (01-02)
- **File uploads remain local until Plan 03**: Redis handles metadata only; Cloudinary migration in Plan 03 handles image file persistence (01-02)
- **Removed production environment checks**: Redis persists in all environments, no special handling needed for VERCEL=1 (01-02)
- **Next.js Image optimization enabled**: Removed unoptimized flag to enable automatic WebP/AVIF conversion and responsive sizing - reduces page weight from ~48MB to ~5MB (01-01)
- **Quality settings standardized**: Hero/gallery/section images at quality=80, lightbox at quality=85 - visually indistinguishable but ~40% smaller file sizes (01-01)
- **Priority only for above-the-fold**: Only hero image and logo have priority flag, all below-fold images lazy load by default (01-01)
- **Canon clips kept at 60fps for Resolve**: Decided NOT to convert 60fps→30fps in Phase 06. DaVinci Resolve handles framerate conversion better with optical flow, keeping 60fps gives more creative flexibility during editing (06-02)
- **Two-pass encoding with calculated bitrate**: Compression scripts use formula (target_size_kb * 8) / duration_sec = total_bitrate_kbps to guarantee <5MB/<10MB file sizes (not CRF which is unpredictable) (06-02)
- **Hero video is muted**: Hero video uses -an flag (no audio track) per HERO-01 requirement, saves ~200KB for video bitrate headroom (06-02)
- **DJI metadata preserved with -map_metadata 0**: Critical for DaVinci Resolve stabilization features (06-02)
- **Browser compatibility flags standardized**: All compressed videos use -movflags +faststart, -pix_fmt yuv420p, -profile:v baseline, -level 3.0 (06-02)
- **DJI_0018.MP4_fixed.MP4 validated**: The repaired file passed ffprobe validation and was cataloged successfully as a valid clip (349.8s duration) (06-01)
- **Silence threshold -30dB effective**: Worked well for indoor ambient noise - 14/21 clips have <10% silence, only 1 trim candidate (MVI_4257.MP4) (06-01)
- **v1.1 Phase Structure**: 3-phase approach (CLI preprocessing → Creative editing → Web compression) matches industry best practices and separates automation from human creativity
- **FFmpeg + DaVinci Resolve + auto-editor**: Free, battle-tested stack used by Netflix, YouTube, professional editors
- **Master export → Web compression**: DaVinci Resolve exports ProRes/DNxHR, FFmpeg compresses once to avoid double compression artifacts
- [Phase 01-03]: Cloudinary CDN for image storage: Gallery uploads now go to Cloudinary instead of local filesystem, fixing Vercel's read-only limitation
- [Phase 01-03]: Hybrid storage during migration: New uploads use Cloudinary public_id, existing images remain local until Phase 2 migration
- [Phase 01-03]: Tightened security: Replaced wildcard hostname with specific domain whitelist (Cloudinary, Facebook, Google) in Next.js remotePatterns

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1:**
- ✅ RESOLVED: Phase 01 infrastructure complete - all 3 plans executed successfully
- USER SETUP REQUIRED: Upstash Redis credentials needed for production deployment
  - Add integration via Vercel Dashboard → Storage → Upstash Redis
  - Copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to env vars
  - Run `vercel env pull .env.local` for local development
- USER SETUP REQUIRED: Cloudinary credentials needed for production deployment
  - Sign up at https://cloudinary.com (use timber+cloudinary@evanmusick.dev)
  - Get NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  - Create upload preset: timber-threads-gallery (Signed, folder: timber-threads/gallery)
  - Add to Vercel environment variables (Production, Preview, Development)

**Phase 6:**
- ✅ RESOLVED: DJI_0018.MP4 documented as corrupt - will skip in all processing, use DJI_0018.MP4_fixed.MP4 instead
- ✅ RESOLVED: All 21 Canon clips confirmed as 60fps - decided to keep at 60fps for DaVinci Resolve flexibility (no conversion needed)
- ✅ RESOLVED: Phase 06 complete - all requirements satisfied (PROC-01 through PROC-04)

**Phase 7:**
- Hero loop duration needs client confirmation (research recommends 6-8s vs 15-30s requirement)
- This phase requires MANUAL human creative work — plans will include checkpoints

**Phase 8:**
- Audio bitrate may need adjustment for rural Missouri connections (128kbps standard, may test 96kbps)

## Session Continuity

Last session: 2026-02-16 20:42
Stopped at: Completed 01-03-PLAN.md (Cloudinary CDN Integration)
Resume file: None
Next action: Phase 01 infrastructure complete! Move to Phase 2 (Gallery Migration) or resume Phase 7 creative editing

---
*Created: 2026-02-14*
*Last updated: 2026-02-16 20:36*

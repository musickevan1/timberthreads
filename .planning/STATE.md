# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** The promo video and site improvements must make the retreat feel warm, inviting, and real — showcasing the unique island property in a way that makes quilters and crafters want to book a stay.
**Current milestone:** v1.1 Promo Video Edit
**Current focus:** Phase 6 - Video Processing Infrastructure

## Current Position

Milestone: v1.1 (Promo Video Edit)
Phase: 6 of 8 (Video Processing Infrastructure)
Plan: 2 of 2
Status: Complete
Last activity: 2026-02-16 — Completed 06-02 (Video Compression Scripts & Resolve Prep)

Progress: [██░░░░░░░░] 20% (v1.1 milestone - estimated)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 5.3 min
- Total execution time: 0.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-infrastructure | 1 | 2.8min | 2.8min |
| 06-video-processing-infrastructure | 2 | 12.4min | 6.2min |

**Recent Trend:**
- Last 5 plans: 06-01 (7.4min), 06-02 (5.0min), 01-01 (2.8min)
- Trend: Phase 01 started - image optimization complete

*Updated after each plan completion*

## Accumulated Context

### Decisions

Recent decisions affecting current work:

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

### Pending Todos

None yet.

### Blockers/Concerns

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

Last session: 2026-02-16 20:36
Stopped at: Completed 01-01-PLAN.md (Enable Next.js Image Optimization)
Resume file: None
Next action: Continue Phase 01 infrastructure improvements (plans 02-03), or resume Phase 7 creative editing

---
*Created: 2026-02-14*
*Last updated: 2026-02-16 20:36*

# Timber & Threads Retreat — Website Update + Promo Video

## What This Is

A website refresh and promo video production for Timber & Threads Retreat Center — a quilting/crafting retreat on a small island surrounded by a lake in rural Clinton, MO. The project covers shooting drone + camera footage on-site (Feb 15, 2026), editing a polished promo video, integrating it into the existing Next.js website, fixing the broken gallery system, optimizing performance, and delivering a client invoice.

## Current Milestone: v1.1 Promo Video Edit

**Goal:** Process raw Feb 15 shoot footage into two compressed, web-ready video deliverables for website integration.

**Target deliverables:**
- Hero background video (15-30s looping drone, muted, <5MB, 720p H.264)
- Full promo video (1-2 min property tour with music, <10MB, 1080p H.264)

## Core Value

The promo video and site improvements must make the retreat feel warm, inviting, and real — showcasing the unique island property in a way that makes quilters and crafters want to book a stay.

## Requirements

### Validated

- ✓ Homepage with hero, about, workshops, accommodations, calendar, gallery, contact, and map sections — existing
- ✓ Admin gallery management with upload, reorder, edit, delete — existing (broken in production)
- ✓ Contact form with email delivery via Nodemailer — existing
- ✓ Admin authentication — existing

### Active

- [ ] Shoot promo video (drone + camera) on-site at Timber & Threads Retreat
- [ ] Edit promo video — warm, slow-paced, calm and inviting feel
- [ ] Add hero background video clip (selected from drone footage post-shoot)
- [ ] Add dedicated video section on the page with self-hosted full promo video
- [ ] Complete Cloudinary integration for gallery (replace broken file-based storage)
- [ ] Optimize site performance (image loading, bundle size, caching)
- [ ] Generate PDF invoice — itemized: shoot, edit, website updates ($400-600 range)

### Out of Scope

- Full visual redesign — client is happy with the current look
- Mobile app — web only
- Booking/payment system — not requested
- Workshop registration — not requested
- New content sections — existing sections are sufficient

## Context

**Existing site:** Next.js 14, deployed on Vercel, Tailwind CSS. The site is live at timberandthreadsretreat.com. Original build was $300.

**Gallery problem:** The gallery uses a local JSON file (`db.json`) as its database. Vercel's read-only filesystem means all admin changes (uploads, reorders, captions) are lost on redeploy. Cloudinary SDK is in the dependencies but integration was left incomplete (commented out). Finishing this integration solves persistence, CDN delivery, and image optimization in one move.

**Video shoot:** Sunday Feb 15, 2026. DJI Mavic Air (4K @ 30fps, 1 battery, ~21 min flight time). Separate camera for interiors. Full shoot guide exists at `Timber-Threads-Shoot-Guide.docx`. Two drone sessions with battery charge between. Interior/exterior camera coverage during charge time.

**Edit direction:** Warm, slow-paced editing. Hold drone shots 8-10 seconds. Warm acoustic / gentle piano music. Target audience (quilters, crafters, families) responds to peaceful, cozy vibes. Ambient audio (birds, water) if captured.

**Video hosting:** Self-hosted — no YouTube/Vimeo branding. Needs compression and potentially multiple quality levels to avoid slow page loads.

**Invoice:** Evan Musick, freelance. Itemized line items: video shoot, video editing, website updates. Total range $400-600. Client: Timber & Threads Retreat, (417) 343-1473, timberandthreads24@gmail.com. PDF format.

**Timeline:** Within one week of the shoot (by Feb 22).

## Constraints

- **Equipment:** 1 drone battery — limits total aerial footage to ~42 minutes across 2 sessions
- **Timeline:** Full delivery within 1 week of shoot
- **Budget:** Client relationship is budget-conscious ($300 original site, $400-600 for this round)
- **Hosting:** Vercel (free tier likely) — self-hosted video must be size-conscious
- **Gallery:** Must work in production on Vercel's read-only filesystem (Cloudinary solves this)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cloudinary for gallery | Already half-built in codebase, solves persistence + CDN + transforms | — Pending |
| Self-hosted video | Client wants no third-party branding on the video player | — Pending |
| Hero clip decided post-shoot | Need to see footage before choosing the best hero clip | — Pending |
| $400-600 total project | Fair for rural MO market, maintains client relationship | — Pending |

---
*Last updated: 2026-02-16 after milestone v1.1 started*

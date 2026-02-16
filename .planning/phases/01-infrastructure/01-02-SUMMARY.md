---
phase: 01-infrastructure
plan: 02
subsystem: gallery-persistence
tags: [redis, upstash, vercel, persistence, gallery-api]
dependency-graph:
  requires: []
  provides:
    - persistent-gallery-metadata
    - redis-client-library
  affects:
    - gallery-api
    - admin-gallery-management
tech-stack:
  added:
    - "@upstash/redis: ^1.36.2"
  patterns:
    - redis-rest-api
    - serverless-storage
key-files:
  created:
    - src/lib/redis.ts
  modified:
    - src/app/api/gallery/route.ts
    - package.json
decisions:
  - decision: Use Upstash Redis REST API instead of traditional Redis TCP
    rationale: Vercel Edge Runtime doesn't support TCP connections; HTTP REST API is serverless-compatible
    impact: Enables production persistence without infrastructure changes
  - decision: Keep file uploads in local public directory
    rationale: Plan 03 will migrate to Cloudinary; separating concerns reduces complexity
    impact: Image files remain in public/assets/gallery until Plan 03
  - decision: Remove all production environment checks
    rationale: Redis persists in all environments (dev and prod), no special handling needed
    impact: Simpler code, consistent behavior across environments
metrics:
  duration: 3.6min
  tasks-completed: 3
  files-created: 1
  files-modified: 2
  commits: 3
  completed-at: 2026-02-16T20:36:28Z
---

# Phase 01 Plan 02: Redis Metadata Persistence Summary

**One-liner:** Replaced file-based gallery metadata storage with Upstash Redis REST API for production-persistent storage on Vercel.

## Objective Achieved

Migrated gallery metadata storage from read-only filesystem to Upstash Redis, fixing critical production bug where gallery changes were lost on Vercel deployments.

## Tasks Completed

### Task 1: Install Upstash Redis client
**Commit:** 42fe466
**Files:** package.json, package-lock.json
**Summary:** Installed @upstash/redis package (v1.36.2) for HTTP REST API-based Redis client compatible with Vercel Edge Runtime.

### Task 2: Create Redis client and gallery data helpers
**Commit:** b3097b8
**Files:** src/lib/redis.ts (new)
**Summary:** Created Redis client library with type-safe gallery operations (getGalleryData, saveGalleryData). Returns default empty state on first read to avoid file-not-found errors.

### Task 3: Migrate gallery API from file system to Redis
**Commit:** 115670c
**Files:** src/app/api/gallery/route.ts
**Summary:** Replaced all file system metadata operations with Redis operations in GET/POST/PATCH/DELETE handlers. Removed DB_PATH constant, file read operations, and production environment warnings. File uploads still use local storage (Plan 03 handles Cloudinary migration).

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

### Redis Client Architecture
- **Library:** @upstash/redis using HTTP REST API (not TCP)
- **Configuration:** Environment variables UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- **Operations:** Simple key-value storage (`redis.get('gallery')`, `redis.set('gallery', data)`)
- **Type safety:** GalleryMetadata type alias ensures compatibility with existing GalleryState interface

### Migration Details
**Removed:**
- File system imports (readFile, writeFile for metadata)
- DB_PATH constant pointing to src/app/api/gallery/db.json
- getDB() and saveDB() functions with production checks
- Production environment warnings about read-only filesystem
- Special handling for VERCEL=1 environment variable

**Added:**
- Redis imports (getGalleryData, saveGalleryData)
- Simplified error handling (Redis operations throw on failure)

**Unchanged:**
- Sharp image processing (still optimizes uploads locally)
- File uploads to public/assets/gallery (Plan 03 migrates to Cloudinary)
- ImageAsset and GalleryState type definitions
- All API handler logic (soft delete, restore, caption update, reorder)

### Gallery API Handlers Updated
1. **GET /api/gallery:** Uses getGalleryData() to fetch metadata
2. **POST /api/gallery:** Uploads image locally, saves metadata to Redis via saveGalleryData()
3. **PATCH /api/gallery:** Updates metadata (soft delete, restore, caption, section, order) and persists to Redis
4. **DELETE /api/gallery:** Permanently removes from deletedImages array in Redis

## Verification Results

All verification checks passed:
- ✅ npm run build succeeds with no TypeScript errors
- ✅ Redis client exports verified (redis, getGalleryData, saveGalleryData, GalleryMetadata)
- ✅ Gallery route imports from @/lib/redis confirmed
- ✅ All file system operations removed (readFile, DB_PATH gone)
- ✅ Production environment warnings removed
- ✅ No Vercel-specific checks remain in code

## Success Criteria Met

- ✅ All tasks completed
- ✅ Gallery metadata storage migrated from file system to Redis
- ✅ No file system operations remain in gallery API (except image file uploads)
- ✅ TypeScript compilation passes
- ✅ Code ready for Vercel deployment with persistent storage

## Next Steps

**User Setup Required:**
1. Add Upstash Redis integration via Vercel Dashboard → Storage → Create Database
2. Select free tier, link to timber-threads project
3. Copy environment variables from Vercel Dashboard → Storage → Upstash Redis → .env.local tab:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
4. For local development: Run `vercel env pull .env.local` to sync credentials

**Plan 03:** Migrate image uploads from local filesystem to Cloudinary (fixes production image persistence).

## Self-Check: PASSED

**Files created:**
- ✅ FOUND: src/lib/redis.ts

**Files modified:**
- ✅ FOUND: src/app/api/gallery/route.ts
- ✅ FOUND: package.json

**Commits:**
- ✅ FOUND: 42fe466 (Task 1: Install @upstash/redis)
- ✅ FOUND: b3097b8 (Task 2: Create Redis client)
- ✅ FOUND: 115670c (Task 3: Migrate gallery API)

All claims verified against actual repository state.

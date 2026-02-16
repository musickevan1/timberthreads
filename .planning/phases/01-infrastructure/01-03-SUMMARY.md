---
phase: 01-infrastructure
plan: 03
subsystem: cloudinary-cdn
tags: [cloudinary, cdn, image-storage, vercel, signed-uploads]
dependency-graph:
  requires:
    - 01-02-redis-metadata
  provides:
    - cloudinary-image-storage
    - signed-upload-signatures
    - hybrid-storage-support
  affects:
    - gallery-api
    - next-image-optimization
    - admin-gallery-uploads
tech-stack:
  added:
    - "cloudinary: ^2.5.1 (already in package.json)"
  patterns:
    - cloudinary-sdk-server-side
    - signed-upload-workflow
    - hybrid-storage-migration
key-files:
  created:
    - src/lib/cloudinary.ts
    - src/app/api/cloudinary-signature/route.ts
  modified:
    - src/app/api/gallery/route.ts
    - src/app/api/gallery/types.ts
    - next.config.js
decisions:
  - decision: Use server-side Cloudinary SDK configuration
    rationale: API secret must never be exposed to client; server-only env var ensures security
    impact: All Cloudinary operations go through API routes with secure credentials
  - decision: Keep Sharp preprocessing before Cloudinary upload
    rationale: Reduces bandwidth and upload time by optimizing locally first
    impact: Images optimized to WebP/1920x1080 before uploading to Cloudinary
  - decision: Store Cloudinary public_id in ImageAsset.src field
    rationale: Enables hybrid storage during migration - new uploads use public_id, existing use local paths
    impact: Phase 2 will migrate existing images; both storage types work seamlessly
  - decision: Tighten remotePatterns from wildcard to specific domains
    rationale: Security best practice - only allow known CDN sources
    impact: Next.js Image component restricted to Cloudinary, Facebook, Google domains
  - decision: Add signature generation endpoint for future admin UI
    rationale: CldUploadWidget requires server-generated signatures for secure uploads
    impact: Admin UI can use Cloudinary widgets without exposing API secret
metrics:
  duration: 2.9min
  tasks-completed: 5
  files-created: 2
  files-modified: 3
  commits: 5
  completed-at: 2026-02-16T20:42:59Z
---

# Phase 01 Plan 03: Cloudinary CDN Integration Summary

**One-liner:** Migrated gallery uploads from local filesystem to Cloudinary CDN with signed upload support, fixing Vercel's read-only filesystem limitation.

## Objective Achieved

Set up Cloudinary SDK, migrated gallery image uploads to Cloudinary CDN, configured Next.js Image optimization for remote patterns, and implemented signed upload endpoint for future admin UI integration.

## Tasks Completed

### Task 1: Create Cloudinary SDK configuration
**Commit:** eb8d3e8
**Files:** src/lib/cloudinary.ts (new)
**Summary:** Created server-side Cloudinary SDK configuration with secure API credentials. CLOUDINARY_API_SECRET uses server-only env var (no NEXT_PUBLIC_ prefix) to prevent client exposure. Exports configured cloudinary instance for API route usage.

### Task 2: Create signature generation endpoint
**Commit:** 7bde08c
**Files:** src/app/api/cloudinary-signature/route.ts (new)
**Summary:** Implemented POST /api/cloudinary-signature endpoint that generates signed upload signatures using cloudinary.utils.api_sign_request. Enables secure admin uploads via CldUploadWidget without exposing API secret to client browser.

### Task 3: Update gallery POST handler to upload to Cloudinary
**Commit:** c8aae57
**Files:** src/app/api/gallery/route.ts
**Summary:** Migrated image uploads from local filesystem to Cloudinary CDN. Removed mkdir/writeFile filesystem operations. Sharp preprocessing still optimizes images locally before upload (reduces bandwidth). Stores uploadResult.public_id in metadata src field. Uses Cloudinary's auto quality and format transformation for CDN delivery.

### Task 4: Configure Next.js for Cloudinary remote images
**Commit:** d756b10
**Files:** next.config.js
**Summary:** Replaced wildcard hostname ('**') with specific domain whitelist for security hardening. Added res.cloudinary.com to remotePatterns for Next.js Image optimization. Updated CSP img-src directive to include https://res.cloudinary.com. Whitelisted Facebook and Google domains explicitly.

### Task 5: Update ImageAsset type documentation
**Commit:** e5ace9e
**Files:** src/app/api/gallery/types.ts
**Summary:** Updated src field comment to document hybrid storage state. New uploads store Cloudinary public_id, existing images use local paths ('/assets/gallery/...'). Phase 2 will handle migrating existing images to Cloudinary.

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

### Cloudinary SDK Architecture
- **Package:** cloudinary v2.5.1 (already in package.json from earlier setup)
- **Configuration:** Server-side only in src/lib/cloudinary.ts
- **Environment Variables:**
  - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (safe for client)
  - CLOUDINARY_API_KEY (server-only)
  - CLOUDINARY_API_SECRET (server-only, NO NEXT_PUBLIC_ prefix)
- **Security:** API secret never exposed to browser, all operations via API routes

### Upload Workflow
1. **Client:** Admin selects image file
2. **Sharp Processing:** Resize to 1920x1080, convert to WebP 80% quality (reduces bandwidth)
3. **Cloudinary Upload:** Base64-encoded optimized image uploaded to timber-threads/gallery folder
4. **Transformations Applied:**
   - Max dimensions: 1920x1080 (crop: limit)
   - Quality: auto:good (Cloudinary optimization)
   - Format: auto (serves WebP/AVIF based on browser support)
5. **Metadata Storage:** public_id stored in Redis via saveGalleryData()

### Signature Endpoint (for future CldUploadWidget)
```typescript
POST /api/cloudinary-signature
Body: { paramsToSign: {...} }
Response: { signature: "..." }
```

Used by Cloudinary widgets for direct browser uploads with server-generated signatures.

### Hybrid Storage State
- **New uploads:** src = "timber-threads/gallery/1739742759-image-name" (Cloudinary public_id)
- **Existing images:** src = "/assets/gallery/filename.webp" (local path)
- **Next.js Image:** Handles both via remotePatterns (Cloudinary) and static files (local)

### Security Improvements
**Before:**
```javascript
remotePatterns: [{ protocol: 'https', hostname: '**' }] // Wildcard - ANY domain
```

**After:**
```javascript
remotePatterns: [
  { protocol: 'https', hostname: 'res.cloudinary.com' },
  { protocol: 'https', hostname: '*.facebook.com' },
  { protocol: 'https', hostname: '*.fbsbx.com' },
  { protocol: 'https', hostname: 'www.google.com' }
] // Specific domains only
```

Also updated CSP img-src to include https://res.cloudinary.com.

## Verification Results

All verification checks passed:
- ✅ npm run build succeeds with no errors
- ✅ Cloudinary SDK configuration exists in src/lib/cloudinary.ts
- ✅ Signature endpoint exists at src/app/api/cloudinary-signature/route.ts
- ✅ Gallery POST handler uses cloudinary.uploader.upload
- ✅ next.config.js remotePatterns includes res.cloudinary.com (no wildcard)
- ✅ No NEXT_PUBLIC_ prefix on CLOUDINARY_API_SECRET anywhere in codebase
- ✅ CSP includes Cloudinary domains

## Success Criteria Met

- ✅ All tasks completed
- ✅ Cloudinary SDK configured for server-side operations
- ✅ Signature generation endpoint ready for admin uploads
- ✅ Gallery uploads go to Cloudinary CDN
- ✅ Next.js Image optimization works with both local and Cloudinary images
- ✅ All Phase 1 infrastructure requirements satisfied:
  - INFRA-01: Image optimization enabled (Plan 01) ✓
  - INFRA-02: Gallery metadata persists via Redis (Plan 02) ✓
  - INFRA-03: Images stored on Cloudinary CDN (this plan) ✓
  - INFRA-04: Signed uploads configured (this plan) ✓
  - INFRA-05: remotePatterns allows Cloudinary (this plan) ✓
- ✅ Infrastructure ready for Phase 2 (Gallery Migration)

## Phase 1 Infrastructure Complete

All three infrastructure plans are now complete:

1. **Plan 01 (Image Optimization):** Next.js Image optimization enabled, quality settings standardized, priority flags configured
2. **Plan 02 (Redis Persistence):** Gallery metadata stored in Upstash Redis for production persistence
3. **Plan 03 (Cloudinary CDN):** Image uploads migrated to Cloudinary, signed upload support, security hardening

**Infrastructure Stack:**
- Next.js Image: Automatic WebP/AVIF conversion, responsive sizing
- Upstash Redis: Serverless metadata persistence (REST API)
- Cloudinary: CDN image storage with auto-optimization
- Sharp: Local preprocessing before upload (bandwidth optimization)

## User Setup Required

Before deploying to production, configure Cloudinary:

1. **Sign up for Cloudinary:**
   - Visit https://cloudinary.com/users/register_free
   - Use email: timber+cloudinary@evanmusick.dev
   - Select free tier (25 GB storage, 25 GB bandwidth)

2. **Get credentials from Cloudinary Dashboard:**
   - Navigate to Settings → Account
   - Copy **Cloud name** → NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   - Navigate to Settings → API Keys
   - Copy **API Key** → CLOUDINARY_API_KEY
   - Copy **API Secret** → CLOUDINARY_API_SECRET (NEVER use NEXT_PUBLIC_ prefix)

3. **Create upload preset:**
   - Navigate to Settings → Upload → Add upload preset
   - Name: timber-threads-gallery
   - Signing Mode: Signed
   - Folder: timber-threads/gallery
   - Allowed formats: jpg,png,webp
   - Max file size: 10MB

4. **Add to .env.local for local development:**
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

5. **Add to Vercel environment variables:**
   - Vercel Dashboard → timber-threads project → Settings → Environment Variables
   - Add all three variables to Production, Preview, and Development environments

## Next Steps

**Phase 2:** Gallery Migration
- Migrate existing local images to Cloudinary
- Update all src paths from local to public_id
- Remove public/assets/gallery directory
- Update gallery display components to use CldImage

**Phase 7:** Creative Video Editing
- Use Cloudinary for video hosting (optional)
- DaVinci Resolve workflow documented in Phase 6/7 plans

## Self-Check: PASSED

**Files created:**
- ✅ FOUND: src/lib/cloudinary.ts
- ✅ FOUND: src/app/api/cloudinary-signature/route.ts

**Files modified:**
- ✅ FOUND: src/app/api/gallery/route.ts
- ✅ FOUND: src/app/api/gallery/types.ts
- ✅ FOUND: next.config.js

**Commits:**
- ✅ FOUND: eb8d3e8 (Task 1: Cloudinary SDK configuration)
- ✅ FOUND: 7bde08c (Task 2: Signature generation endpoint)
- ✅ FOUND: c8aae57 (Task 3: Migrate gallery POST handler)
- ✅ FOUND: d756b10 (Task 4: Configure Next.js for Cloudinary)
- ✅ FOUND: e5ace9e (Task 5: Update ImageAsset type documentation)

All claims verified against actual repository state.

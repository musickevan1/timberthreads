# Codebase Concerns

**Analysis Date:** 2026-02-14

## Tech Debt

**Data Persistence in Production:**
- Issue: Gallery database is stored in local file system (`src/app/api/gallery/db.json`). Vercel deployment has read-only file system - changes are lost on redeployment or scaling.
- Files: `src/app/api/gallery/route.ts` (lines 23-32, 334-349)
- Impact: Admin cannot save gallery changes in production. Image ordering, captions, and deletions are temporary and reset on deploy.
- Fix approach: Replace file-based storage with persistent database (PostgreSQL, MongoDB, or Vercel KV). Update gallery API routes to use database queries instead of file I/O.

**Cloudinary Integration Disabled:**
- Issue: Cloudinary import and functionality are commented out in gallery API, replaced with local file storage workaround.
- Files: `src/app/api/gallery/route.ts` (lines 6-7, 406-408)
- Impact: Image optimization and CDN delivery benefits lost. Large images served from local storage. Production image deletion is non-functional (commented out).
- Fix approach: Complete Cloudinary SDK integration or replace with alternative image storage service. Uncomment and test deletion workflow.

**Console Logging in Production:**
- Issue: 45 debug console.log/console.error statements throughout codebase. Logs credentials, request data, and internal state to browser console in production.
- Files: Multiple files including `src/app/api/gallery/route.ts`, `src/app/admin/gallery/page.tsx`, `src/components/LightboxGallery.tsx`
- Impact: Sensitive information exposed (paths, env var names, internal state). Harder to distinguish critical errors from debug output.
- Fix approach: Remove all development logging or wrap with `if (process.env.NODE_ENV === 'development')`. Use production-safe logging service for errors only.

**Weak Type Safety with `any`:**
- Issue: Three instances of `error: any` type casting and `e: any` parameters instead of proper types.
- Files: `src/app/admin/gallery/page.tsx` (lines 135, 323), `src/app/api/contact/route.ts` (line 59)
- Impact: Loss of TypeScript safety. Errors are not properly typed. Harder to handle different error cases.
- Fix approach: Replace `any` with proper error types. Use `React.ChangeEvent<HTMLInputElement>` instead of `e: any`. Use `unknown` for catch blocks with proper type guards.

## Security Considerations

**Weak Authentication Mechanism:**
- Risk: Admin authentication relies on plain password comparison (`process.env.ADMIN_PASSWORD`). Password stored in session storage (client-side, vulnerable to XSS). No rate limiting on auth attempts.
- Files: `src/app/api/auth/route.ts`, `src/app/admin/page.tsx` (line 39), `src/app/admin/layout.tsx` (line 48)
- Current mitigation: ADMIN_PASSWORD not exposed with NEXT_PUBLIC_ prefix. SessionStorage clears on browser close.
- Recommendations: Implement proper session tokens (JWT or secure cookies with httpOnly flag). Add rate limiting to /api/auth endpoint. Use bcrypt or argon2 for password hashing if expanding to multiple users.

**HTML Injection in Email:**
- Risk: Contact form message is directly interpolated into HTML email without sanitization (`message.replace(/\n/g, '<br>')`). Could allow email header injection or phishing attacks.
- Files: `src/app/api/contact/route.ts` (lines 45-51)
- Current mitigation: Only newline replacement, no full HTML escaping.
- Recommendations: Use library like `html-entities` or `xss` to escape HTML. Validate email format with proper regex or library. Add DKIM/SPF validation.

**Missing Input Validation:**
- Risk: No validation on caption field length limits. Image alt text generated from filename without sanitization. No sanitization of gallery metadata.
- Files: `src/app/api/gallery/route.ts` (line 114), `src/app/admin/gallery/components/GalleryItem.tsx` (line 170)
- Current mitigation: 50MB file size limit enforced. File type validation on client (not on server for POST).
- Recommendations: Add server-side file type validation in POST handler. Enforce caption length limits (255 chars). Sanitize all user inputs with `zod` or similar validation library.

**XSS via Image Paths:**
- Risk: Image src paths stored directly from user uploads without validation. Could theoretically store malicious paths if database is compromised.
- Files: `src/app/api/gallery/route.ts` (line 113), `src/app/admin/gallery/components/GalleryItem.tsx` (line 139)
- Current mitigation: Filenames are sanitized (`toLowerCase().replace(/\s+/g, '-')`). Only served from `/assets/gallery/`.
- Recommendations: Add whitelist validation for paths. Use Content Security Policy (CSP) stricter than current to prevent path-based attacks.

**Hardcoded Fallback Email:**
- Risk: Fallback email address hardcoded in API: `evanmusick.dev@gmail.com`
- Files: `src/app/api/contact/route.ts` (line 36)
- Current mitigation: Environment variable used if set.
- Recommendations: Remove hardcoded email entirely. Require RECIPIENT_EMAIL in env. Validate email format server-side.

## Performance Bottlenecks

**Inefficient Image Metadata Calls:**
- Problem: Sharp metadata is called twice per image upload (lines 121-122 in gallery route) - once to get dimensions, but already processed.
- Files: `src/app/api/gallery/route.ts` (lines 121-123)
- Cause: Metadata queries happen after image optimization, wasting I/O.
- Improvement path: Move sharp metadata call to before optimization or cache result. Pre-compute dimensions during optimization.

**No Image Caching Headers:**
- Problem: Images served without cache-control headers. Browser downloads full image every time, even if unchanged.
- Files: `src/app/api/gallery/route.ts`, `next.config.js`
- Cause: Local file storage approach doesn't set cache headers.
- Improvement path: Add cache-control headers to image responses. Implement ETag or Last-Modified. Use CDN (Cloudinary, Vercel Image Optimization).

**Large Component Bundle Size:**
- Problem: Gallery admin page (`src/app/admin/gallery/page.tsx` - 357 lines) and GalleryItem component (`src/app/admin/gallery/components/GalleryItem.tsx` - 274 lines) are large single components.
- Files: Gallery admin components
- Cause: Mixed concerns (upload, display, edit, delete) in single page. No code splitting.
- Improvement path: Split into smaller feature-based components. Use React.lazy() for route-based code splitting.

**Session Data Fetching on Every Page Load:**
- Problem: Gallery admin re-fetches entire gallery state on mount. No pagination or lazy loading for large galleries.
- Files: `src/app/admin/gallery/page.tsx` (line 56)
- Cause: Simplistic fetch pattern without caching or pagination.
- Improvement path: Implement pagination in API. Add client-side caching (React Query, SWR). Use incremental loading.

## Fragile Areas

**Gallery State Management:**
- Files: `src/app/admin/gallery/page.tsx`, `src/app/admin/gallery/components/GalleryGrid.tsx`
- Why fragile: State split between parent component and GalleryGrid (line 28). Local images state in GalleryGrid can diverge from server state. Reordering uses client-side state without confirmation before save.
- Safe modification: Add form-level state validation. Confirm unsaved changes before navigation. Use React Context or state management library for consistency.
- Test coverage: No tests for drag-and-drop reordering logic or save failures.

**Authentication Flow:**
- Files: `src/app/admin/page.tsx`, `src/app/admin/layout.tsx`
- Why fragile: Authentication check only on component mount (line 47-52). Can be bypassed with manual sessionStorage manipulation. No token expiration. No logout confirmation.
- Safe modification: Move auth check to middleware (Next.js middleware pattern). Use httpOnly cookies. Implement token refresh.
- Test coverage: No tests for auth redirect flow or session timeout.

**API Error Handling:**
- Files: `src/app/api/gallery/route.ts`, `src/app/api/contact/route.ts`
- Why fragile: Generic catch blocks without specific error logging. Client doesn't distinguish between different failure modes (network, validation, server). Missing response validation.
- Safe modification: Use typed error responses. Log errors with context. Implement retry logic on client.
- Test coverage: No tests for API error scenarios.

**Email Dependency:**
- Files: `src/app/api/contact/route.ts`
- Why fragile: No retry logic if Gmail SMTP fails. No queue system. Missing emails silently fail with generic error message.
- Safe modification: Implement exponential backoff retry. Add email queue (Bull, AWS SQS). Log failures with correlation IDs.
- Test coverage: No tests for email sending failure scenarios.

## Test Coverage Gaps

**Zero Test Coverage:**
- What's not tested: All gallery upload, reorder, delete, restore operations. Auth login flow. Contact form submission. Image optimization pipeline.
- Files: All files in `src/app/`, `src/components/`
- Risk: Refactoring risks regression. Edge cases in image handling (corrupt files, large uploads) untested. Auth bypass vulnerabilities could go unnoticed.
- Priority: **High** - Start with critical paths: gallery API operations and authentication.

**Missing Integration Tests:**
- What's not tested: End-to-end gallery management workflow (upload → reorder → delete → restore). Contact form + email sending integration.
- Files: Gallery API routes and contact route
- Risk: Deployment breaks unnoticed if components don't work together.
- Priority: **High**

**Missing Unit Tests:**
- What's not tested: Image filename sanitization. Caption text processing. Error handling in components.
- Files: `src/app/api/gallery/route.ts`, `src/components/Contact.tsx`, GalleryItem handlers
- Risk: Subtle bugs in validation logic, XSS vulnerabilities in text processing.
- Priority: **Medium**

## Missing Critical Features

**No Database Persistence Strategy:**
- Problem: Production deployment breaks all data persistence. Gallery changes lost on redeploy.
- Blocks: Making gallery admin functional in production. Scaling to multiple deployments.

**No Image Optimization for Web:**
- Problem: Gallery loads full-resolution images over network. WebP conversion happens but images not optimized for different screen sizes.
- Blocks: Mobile performance. Large gallery loads.

**No Rate Limiting:**
- Problem: Contact form and gallery upload endpoints can be abused without rate limiting.
- Blocks: DDoS protection. Email flooding protection.

**No Backup/Recovery System:**
- Problem: Deleting images from filesystem is permanent. No backup of gallery metadata.
- Blocks: Disaster recovery. Accidental deletion recovery.

## Dependencies at Risk

**Cloudinary Package Unused:**
- Risk: `cloudinary` (^2.5.1) and `next-cloudinary` (^6.16.0) imported but integration commented out. Creates bundle bloat and maintenance burden.
- Impact: Package version updates may be missed. Abandoned integration causes confusion.
- Migration plan: Remove packages entirely if not using, or complete the integration properly. Document reason for using local storage instead.

**Outdated Email Library:**
- Risk: `nodemailer` (^6.10.0) is stable but not the latest. Gmail app passwords may have compatibility issues in future.
- Impact: Email sending could break with Gmail API changes.
- Migration plan: Monitor Gmail security updates. Consider OAuth2 flow for better security than app passwords.

## Scaling Limits

**File System Storage Limit:**
- Current capacity: Vercel ephemeral filesystem ~500MB
- Limit: Gallery data lost on deployment/scaling. Cannot persist beyond single instance.
- Scaling path: Migrate to persistent database (PostgreSQL on Railway, MongoDB Atlas, Vercel KV). Implement database migrations.

**No Pagination:**
- Current capacity: Gallery loads all images in memory. Admin panel performance degrades with 100+ images.
- Limit: Gallery admin becomes unusable with large image collections.
- Scaling path: Implement server-side pagination in gallery API. Add cursor-based pagination for large datasets. Implement virtual scrolling on client.

**Email Sending Rate:**
- Current capacity: Single SMTP connection, no queue. Can handle ~5-10 emails/minute.
- Limit: If contact form gains traffic, emails may fail or SMTP connection throttles.
- Scaling path: Implement email queue (Bull, AWS SQS, SendGrid API). Use transactional email service instead of Gmail.

---

*Concerns audit: 2026-02-14*

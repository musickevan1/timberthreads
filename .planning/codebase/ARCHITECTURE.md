# Architecture

**Analysis Date:** 2026-02-14

## Pattern Overview

**Overall:** Next.js 14 full-stack application with React client components, API routes, and admin dashboard pattern.

**Key Characteristics:**
- Client-side rendered components using 'use client' directive
- Server-side API routes handling business logic
- File-based database (JSON) for development, read-only in production
- Session-based authentication for admin panel
- Component-driven UI with Tailwind CSS styling

## Layers

**Presentation Layer:**
- Purpose: Render UI components and handle user interactions
- Location: `src/components/` and `src/app/`
- Contains: React components (`.tsx`), page layouts, admin interfaces
- Depends on: API routes, type definitions, external libraries (Next.js Image, react-scroll)
- Used by: Browser clients, end users

**API Layer:**
- Purpose: Handle HTTP requests, manage data operations, authenticate users
- Location: `src/app/api/`
- Contains: Route handlers (`route.ts` files), type definitions, business logic
- Depends on: File system operations (fs/promises), Sharp for image processing, Nodemailer for email
- Used by: Frontend components via fetch(), admin dashboard

**Data Layer:**
- Purpose: Persist and retrieve application state
- Location: `src/app/api/gallery/db.json` (development), public file storage
- Contains: JSON database with gallery images, deleted images tracking
- Depends on: File system access
- Used by: API routes

**Admin Dashboard Layer:**
- Purpose: Provide management interface for gallery content
- Location: `src/app/admin/`
- Contains: Login page, gallery management page, sub-components
- Depends on: Authentication API, gallery API, session storage
- Used by: Admin users

## Data Flow

**Gallery Image Display Flow:**

1. User visits homepage
2. `src/app/page.tsx` renders client component
3. `Gallery` component (in `src/components/Gallery.tsx`) mounts
4. Component fetches from `GET /api/gallery`
5. API reads from `src/app/api/gallery/db.json`
6. Images sorted by `order` property and grouped by `section` (Facility/Quilting)
7. Images rendered with Next.js Image component
8. Clicking image opens `LightboxGallery` component for full view

**Admin Image Upload Flow:**

1. Admin accesses `/admin/gallery` after login
2. Admin enters password at `/admin`
3. `src/app/api/auth` verifies password matches `ADMIN_PASSWORD` env var
4. Session flag set in `sessionStorage`
5. `src/app/admin/gallery/page.tsx` loads and checks authentication
6. Admin selects image in `UploadSection` component
7. Image sent via multipart FormData to `POST /api/gallery`
8. Sharp resizes/optimizes image to WebP
9. Optimized image saved to `public/assets/gallery/`
10. Metadata stored in `db.json`
11. Gallery reloads with new image

**Admin Image Reordering Flow:**

1. Admin drags image in `GalleryGrid` component
2. Drag updates local component state
3. On drop, calls `PATCH /api/gallery?action=updateOrder`
4. API receives ordered array of image sources
5. API updates `order` property for each image in matching section
6. Changes saved to `db.json`
7. Client refetches gallery data to confirm

**Contact Form Flow:**

1. User fills form in `Contact` component
2. Form submits to `POST /api/contact`
3. API validates required fields (name, email, message)
4. Nodemailer creates SMTP connection to Gmail
5. Email sent to configured recipient via environment variables
6. Response returned to client

**State Management:**

Gallery admin uses React hooks:
- `useState` for UI state (activeTab, isUploading, uploadProgress, etc.)
- `useEffect` for data fetching on mount
- Session storage for authentication persistence (`sessionStorage.getItem('isAuthenticated')`)
- Dialog/confirmation state managed in parent component `src/app/admin/gallery/page.tsx`

Homepage uses similar patterns:
- `useState` for component-level UI (selectedImageIndex, currentSection in Gallery component)
- `useEffect` for fetching gallery data on mount

## Key Abstractions

**ImageAsset Type:**
- Purpose: Type definition for gallery images with metadata
- Examples: `src/app/api/gallery/types.ts`
- Pattern: Exported TypeScript interface used across frontend and API layers
- Properties: `src`, `alt`, `caption`, `section`, `order`, `metadata`, `isDeleted`, `deletedAt`

**GalleryState Type:**
- Purpose: Represents entire gallery database state
- Examples: `src/app/api/gallery/types.ts`
- Pattern: Container for active images array and deleted images array
- Used by: Gallery API route, gallery page

**Tab Navigation Pattern:**
- Purpose: Manage admin gallery view sections
- Examples: `src/app/admin/gallery/components/types.ts`, `src/app/admin/gallery/page.tsx`
- Pattern: Union type `Tab = 'Facility' | 'Quilting' | 'deleted'` mapped to image sections with helper function `getImageSection()`

**API Request Pattern:**
- Purpose: Consistent CRUD operations through HTTP methods and query parameters
- Examples: `src/app/api/gallery/route.ts`
- Pattern: Uses Next.js route methods (GET, POST, PATCH, DELETE) with NextRequest/NextResponse types
- Query parameter actions: `softDelete`, `restore`, `updateCaption`, `updateSection`, `updateOrder`

## Entry Points

**Public Website:**
- Location: `src/app/page.tsx` (root route `/`)
- Triggers: Browser navigation to domain
- Responsibilities: Render homepage with all sections (hero, about, workshops, accommodations, calendar, gallery, contact, map, connect)

**Admin Dashboard:**
- Location: `src/app/admin/page.tsx` (route `/admin`)
- Triggers: User navigates to `/admin`
- Responsibilities: Render login form, verify password against `ADMIN_PASSWORD` env var

**Admin Gallery Management:**
- Location: `src/app/admin/gallery/page.tsx` (route `/admin/gallery`)
- Triggers: User after successful authentication at `/admin`
- Responsibilities: Render gallery management interface with upload, reorder, edit, delete functionality

**API Entry Points:**
- `src/app/api/gallery/route.ts`: GET (fetch), POST (upload), PATCH (update), DELETE (permanent delete)
- `src/app/api/auth/route.ts`: POST (password verification)
- `src/app/api/contact/route.ts`: POST (send contact email)

## Error Handling

**Strategy:** Try-catch blocks with JSON error responses, client-side error state management

**Patterns:**

API Routes:
- Wrap async operations in try-catch
- Return `NextResponse.json()` with error message and HTTP status code
- Status codes: 400 (bad request), 401 (auth failed), 404 (not found), 500 (server error)
- Example: `src/app/api/gallery/route.ts` catches file upload errors and returns descriptive messages

Components:
- Track error state with `useState` (e.g., `uploadError`, `error`)
- Display errors in conditional UI blocks with red styling
- Log errors to console for debugging
- Example: `src/app/admin/gallery/page.tsx` shows upload errors in alert box

Gallery Route Edge Cases:
- Production (Vercel) environment: Cannot write to file system, logs warning and returns success anyway (data lost on redeploy)
- Missing file: Catches error and returns empty gallery state
- Image not found: Returns 404 when trying to modify non-existent image

## Cross-Cutting Concerns

**Logging:**
- Approach: Console.log/console.error in API routes and components
- API routes log: environment detection, database operations, file system operations
- Components log errors to browser console for debugging

**Validation:**

File Upload Validation (API):
- File size limit: 50MB
- File type (client): JPG, PNG, GIF, WebP only
- File existence before processing

Form Validation (API):
- Contact form requires: name, email, message non-empty
- Auth API: password must match `ADMIN_PASSWORD` env var

Database State Validation:
- Gallery API validates section exists when moving images
- Validates image sources exist in database before operations
- Prevents duplicate entries when restoring

**Authentication:**

Approach: Session-based with environment variable
- Login: Client submits password to `POST /api/auth`, API validates against `ADMIN_PASSWORD`
- On success: Client sets `sessionStorage.setItem('isAuthenticated', 'true')`
- On each admin page load: Check `sessionStorage.getItem('isAuthenticated')`
- If missing: Redirect to login page via `useRouter().push('/admin')`
- Logout: Clear session storage and redirect

Note: This is client-side session checking. For production, consider server-side sessions with cookies.

**Image Processing:**

Sharp library handles:
- Image resizing: Max 1920x1080, fit 'inside', no enlargement
- Format conversion: All formats converted to WebP
- Quality: 80% quality for file size optimization
- Metadata extraction: Dimensions stored after optimization

**Environment Configuration:**

Required environment variables:
- `ADMIN_PASSWORD`: Password for admin panel access
- `EMAIL_USER`: Gmail address for sending contact form emails
- `EMAIL_PASS`: Gmail app-specific password (for SMTP auth)
- `RECIPIENT_EMAIL`: Email address to receive contact form submissions

Environment detection:
- `process.env.VERCEL === '1'` used to detect production environment
- In production: File system operations log warning and don't persist (read-only filesystem)
- In development: File system operations work normally

---

*Architecture analysis: 2026-02-14*

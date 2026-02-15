# External Integrations

**Analysis Date:** 2026-02-14

## APIs & External Services

**Email Delivery:**
- Gmail SMTP Server - Contact form email submissions
  - SDK/Client: `nodemailer` 6.10.0
  - Implementation: `/src/app/api/contact/route.ts` POST handler
  - Auth: Environment variables `EMAIL_USER` and `EMAIL_PASS`
  - Configuration: SMTP host `smtp.gmail.com`, port 465 (SSL)
  - Recipients: `RECIPIENT_EMAIL` env var (fallback: `evanmusick.dev@gmail.com`)

**Calendar Integration:**
- Google Calendar - Public availability calendar embed
  - Implementation: `src/components/Calendar.tsx` iframe embed
  - Calendar ID: `timberandthreads24@gmail.com` (base64 encoded in URL: `dGltYmVyYW5kdGhyZWFkczI0QGdtYWlsLmNvbQ`)
  - Timezone: America/Chicago
  - Access: Public calendar (no auth required, embedded via Google Calendar public sharing)
  - URL: Hardcoded in component, updates require code changes

**Image Hosting (Planned):**
- Cloudinary - Image upload and delivery (infrastructure in place but not currently active)
  - SDK: `cloudinary` 2.5.1
  - Wrapper: `next-cloudinary` 6.16.0
  - Status: Commented out in `/src/app/api/gallery/route.ts` (lines 6-7)
  - Note: Gallery currently uses local filesystem storage instead

**Maps Integration:**
- Google Maps - Location display in contact section
  - Implementation: `src/components/Contact.tsx` link to Google Maps embed
  - Address: 306 NW 300 Rd, Clinton MO
  - Access: Public link (no API key required)

**Social Media Integration:**
- Facebook - Content Security Policy allows Facebook widgets/iframes
- CSP Configuration in `next.config.js` includes: Facebook domains (`*.facebook.com`, `*.facebook.net`, `*.fbsbx.com`)

**Google Services (via CSP):**
- Google Analytics tracking (permitted via CSP)
- Google Search Console (permitted via CSP)

## Data Storage

**Databases:**
- Not applicable - No database service used

**File Storage:**
- Local Filesystem (Development & Production)
  - Path: `/public/assets/gallery/`
  - Format: WebP (converted via Sharp)
  - Maximum file size: 50MB per upload
  - Image optimization: Resized to max 1920x1080, WebP 80% quality
  - Metadata storage: JSON file at `/src/app/api/gallery/db.json`
  - Implementation: `/src/app/api/gallery/route.ts` (POST for uploads, PATCH for updates)

**Production Consideration:**
- Vercel has read-only filesystem between deployments
- Gallery changes persist in-memory during session but do not survive redeploys
- Warning logged in gallery route: "In production environment, file system is read-only"

**Caching:**
- None detected

## Authentication & Identity

**Admin Access:**
- Custom Password-Based Authentication
  - Endpoint: `/src/app/api/auth/route.ts` POST handler
  - Method: Password verification via `ADMIN_PASSWORD` environment variable
  - Session storage: `sessionStorage.isAuthenticated` flag in browser
  - Protected pages: `/admin` and `/admin/gallery`
  - Login page: `src/app/admin/page.tsx` (password input form)

**Public Access:**
- No user authentication required
- Website fully public

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console logging only
  - Email sending: `console.log()` in contact API route
  - Gallery operations: Detailed logging in gallery route (uploads, deletions, DB operations)
  - Environment detection: Logs whether running on Vercel or locally
  - Admin auth: Error logging in auth route

## CI/CD & Deployment

**Hosting:**
- Vercel (primary deployment platform)
- Environment detection via `process.env.VERCEL === '1'`

**CI Pipeline:**
- Not detected

**Build Command:**
```bash
next build
```

**Start Command:**
```bash
next start
```

**Development Command:**
```bash
next dev
```

## Environment Configuration

**Required env vars:**
- `EMAIL_USER` - Gmail address for sending contact form emails
- `EMAIL_PASS` - Gmail app password (not regular password) for SMTP authentication
- `RECIPIENT_EMAIL` - Where to send contact form submissions (optional, has fallback)
- `ADMIN_PASSWORD` - Password for admin panel access at `/admin`

**Optional env vars:**
- None detected

**Example Configuration:**
See `.env.example` (contains EMAIL_USER, EMAIL_PASS, RECIPIENT_EMAIL)

**Secrets location:**
- `.env` file (development local)
- Vercel Environment Variables dashboard (production)
- Note: Never commit `.env` to git (listed in `.gitignore`)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Email notifications via Gmail SMTP (one-way from app to email service)
- Google Calendar events (no callback, just public embed)

## API Endpoints

**Internal API Routes:**

| Endpoint | Method | Purpose | Auth | File |
|----------|--------|---------|------|------|
| `/api/contact` | POST | Contact form submissions | None | `src/app/api/contact/route.ts` |
| `/api/gallery` | GET | Fetch gallery images | Session | `src/app/api/gallery/route.ts` |
| `/api/gallery` | POST | Upload new images | Session | `src/app/api/gallery/route.ts` |
| `/api/gallery` | PATCH | Update gallery (delete, restore, reorder) | Session | `src/app/api/gallery/route.ts` |
| `/api/gallery` | DELETE | Permanently delete images | Session | `src/app/api/gallery/route.ts` |
| `/api/auth` | POST | Admin authentication | None | `src/app/api/auth/route.ts` |

**Gallery PATCH Actions:**
- `?action=softDelete` - Soft delete image
- `?action=restore` - Restore deleted image
- `?action=updateCaption` - Update image caption
- `?action=updateSection` - Move image to different section
- `?action=updateOrder` - Reorder images via drag-and-drop

---

*Integration audit: 2026-02-14*

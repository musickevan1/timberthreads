# Technology Stack

**Analysis Date:** 2026-02-14

## Languages

**Primary:**
- TypeScript 5.3.3 - Type-safe development across the entire codebase

**Secondary:**
- JavaScript (JSX/TSX) - React component definitions
- CSS - Styling via Tailwind CSS

## Runtime

**Environment:**
- Node.js (version not pinned, inferred from Next.js 14 compatibility)

**Package Manager:**
- npm 10+ (inferred from package-lock.json v3 format)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 14.2.24 - Full-stack React framework with App Router
- React 18.2.0 - UI library
- React DOM 18.2.0 - DOM rendering

**Testing:**
- Not detected

**Build/Dev:**
- TypeScript Compiler 5.3.3 - Type compilation and checking
- ESLint 8.56.0 - Code linting with Next.js core-web-vitals and TypeScript configs via `eslint.config.mjs`

## Key Dependencies

**Critical:**
- nodemailer 6.10.0 - Email sending via SMTP (Gmail), used in `/src/app/api/contact/route.ts`
- cloudinary 2.5.1 - Image hosting SDK (commented out in gallery route, marked for integration)
- next-cloudinary 6.16.0 - Next.js wrapper for Cloudinary (installed but not currently used)
- sharp 0.33.5 - Image optimization and WebP conversion in gallery uploads

**UI & Interaction:**
- react-beautiful-dnd 13.1.1 - Drag-and-drop functionality for gallery item ordering
- react-dropzone 14.3.8 - File upload drag-and-drop zones
- react-scroll 1.9.2 - Smooth section scrolling (contact form navigation)
- react-device-detect 2.2.3 - Device/browser detection
- use-long-press 3.2.0 - Long-press gesture detection

**Styling:**
- Tailwind CSS 3.3.0 - Utility-first CSS framework configured in `tailwind.config.ts`
- AutoPrefixer 10.4.14 - Vendor prefixing via PostCSS
- PostCSS 8.4.14 - CSS processing pipeline

## Configuration

**Environment:**
- Configuration via `.env` file (see INTEGRATIONS.md for variables)
- Next.js config: `next.config.js` - Sets image optimization, Content Security Policy headers
- ESLint config: `eslint.config.mjs` - Extends Next.js core-web-vitals and TypeScript presets
- PostCSS config: `postcss.config.js` - Tailwind and autoprefixer plugins
- TypeScript config: `tsconfig.json` - ES2017 target, strict mode, path alias `@/*` for `./src/*`

**Build:**
- Next.js handles all build configuration
- Image optimization disabled (`unoptimized: true`) for flexibility
- Remote image patterns allow HTTPS from any hostname

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- npm 10+
- TypeScript knowledge
- Modern browser with ES2017+ support

**Production:**
- Vercel (primary deployment target, detected by `process.env.VERCEL === '1'` checks)
- Node.js runtime environment
- Environment variables: EMAIL_USER, EMAIL_PASS, RECIPIENT_EMAIL, ADMIN_PASSWORD
- Persistent file system not available in production (read-only filesystem on Vercel)

## Deployment Targets

**Primary:**
- Vercel (Next.js optimal hosting)

**Secondary:**
- Self-hosted Node.js compatible servers

---

*Stack analysis: 2026-02-14*

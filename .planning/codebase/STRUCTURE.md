# Codebase Structure

**Analysis Date:** 2026-02-14

## Directory Layout

```
timber-threads-retreat/
├── src/                       # Main application source code
│   ├── app/                   # Next.js app directory
│   │   ├── page.tsx          # Homepage (/ route)
│   │   ├── layout.tsx        # Root layout wrapper
│   │   ├── globals.css       # Global styles
│   │   ├── admin/            # Admin dashboard routes
│   │   │   ├── page.tsx      # Admin login page (/admin)
│   │   │   ├── layout.tsx    # Admin layout with header/nav
│   │   │   └── gallery/      # Gallery management section
│   │   │       ├── page.tsx  # Gallery admin page (/admin/gallery)
│   │   │       └── components/ # Gallery admin sub-components
│   │   │           ├── types.ts
│   │   │           ├── GalleryHeader.tsx
│   │   │           ├── GalleryTabs.tsx
│   │   │           ├── UploadSection.tsx
│   │   │           ├── GalleryGrid.tsx
│   │   │           ├── GalleryItem.tsx
│   │   │           ├── LoadingState.tsx
│   │   │           └── EmptyState.tsx
│   │   └── api/               # API routes
│   │       ├── gallery/       # Gallery management API
│   │       │   ├── route.ts  # GET/POST/PATCH/DELETE handlers
│   │       │   ├── types.ts  # ImageAsset, GalleryState types
│   │       │   └── db.json   # JSON database (development only)
│   │       ├── auth/          # Authentication API
│   │       │   └── route.ts  # POST password verification
│   │       └── contact/       # Contact form API
│   │           └── route.ts  # POST email sending
│   └── components/            # Shared React components
│       ├── NavBar.tsx        # Navigation bar with scroll links
│       ├── Hero.tsx          # Hero section
│       ├── About.tsx         # About section
│       ├── Workshops.tsx     # Retreats/workshops section
│       ├── Accommodations.tsx # Accommodations section
│       ├── Calendar.tsx      # Calendar/dates section
│       ├── Gallery.tsx       # Homepage gallery section
│       ├── Contact.tsx       # Contact form section
│       ├── Map.tsx           # Location/map embed section
│       ├── Connect.tsx       # Newsletter/social section
│       ├── LightboxGallery.tsx # Image lightbox viewer
│       ├── ZoomableImage.tsx  # Image zoom/pan functionality
│       └── ConfirmDialog.tsx  # Reusable confirmation modal
├── public/                    # Static files served directly
│   └── assets/               # Asset files
│       ├── gallery/          # Uploaded gallery images (generated at runtime)
│       └── [other assets]    # Logo, static images
├── styles/                    # Additional styles (legacy or utilities)
├── .planning/                 # GSD planning documents
│   └── codebase/             # This analysis directory
├── package.json              # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── eslint.config.mjs        # ESLint configuration
└── .env.example             # Environment variables template
```

## Directory Purposes

**src/:**
- Purpose: All application source code
- Contains: Components, pages, API routes, types, styles
- Key files: Entry points, type definitions

**src/app/:**
- Purpose: Next.js 14 app directory structure (file-based routing)
- Contains: Page components, layouts, API routes following directory structure
- Key files: `page.tsx` files serve as route handlers, `layout.tsx` defines wrappers

**src/app/admin/:**
- Purpose: Protected admin interface for content management
- Contains: Login page, dashboard layout, management pages
- Key files: `page.tsx` (login), `layout.tsx` (header/nav), `gallery/page.tsx` (main admin interface)

**src/app/admin/gallery/:**
- Purpose: Gallery management interface and sub-components
- Contains: Main gallery page and reusable UI components
- Key files: `page.tsx` (orchestrates state, fetches data), `components/` (GalleryGrid, GalleryTabs, UploadSection, etc.)

**src/app/admin/gallery/components/:**
- Purpose: Modular UI components for gallery management
- Contains: Presentational components with specific responsibilities
- Key files:
  - `GalleryGrid.tsx` - Renders grid of images with drag-and-drop
  - `UploadSection.tsx` - File upload interface with progress
  - `GalleryTabs.tsx` - Tab navigation (Facility, Quilting, Deleted)
  - `GalleryItem.tsx` - Individual image card with edit/delete buttons
  - `GalleryHeader.tsx` - Page header and title

**src/app/api/:**
- Purpose: Server-side API endpoints for data operations
- Contains: Route handlers using Next.js 14 API route syntax
- Key files: `route.ts` files for each API endpoint

**src/app/api/gallery/:**
- Purpose: Gallery data CRUD operations
- Contains: File upload, image reordering, soft delete, restore, permanent delete
- Key files:
  - `route.ts` - Handlers for GET/POST/PATCH/DELETE
  - `types.ts` - `ImageAsset` and `GalleryState` TypeScript interfaces
  - `db.json` - JSON file database (development only, git-ignored in production)

**src/app/api/auth/:**
- Purpose: Authentication for admin access
- Contains: Password verification endpoint
- Key files: `route.ts` - POST handler for password check

**src/app/api/contact/:**
- Purpose: Contact form email delivery
- Contains: Email sending logic using Nodemailer
- Key files: `route.ts` - POST handler for form submission

**src/components/:**
- Purpose: Reusable React components for public website
- Contains: Page sections, utilities, modal components
- Key files:
  - Layout components: `NavBar.tsx`, `Footer.tsx`
  - Section components: `Hero.tsx`, `About.tsx`, `Workshops.tsx`, `Accommodations.tsx`, `Calendar.tsx`, `Gallery.tsx`, `Contact.tsx`, `Map.tsx`, `Connect.tsx`
  - Utility components: `LightboxGallery.tsx`, `ZoomableImage.tsx`, `ConfirmDialog.tsx`

**public/:**
- Purpose: Static files served directly by web server
- Contains: Images, logos, favicon, robots.txt
- Key subdirectories: `assets/gallery/` for user-uploaded images (created at runtime)

**styles/:**
- Purpose: CSS files and styling utilities
- Contains: Possibly legacy CSS or Tailwind extensions
- Note: Primary styling is inline Tailwind classes in JSX

**.planning/codebase/:**
- Purpose: GSD codebase analysis and planning documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Generated by: GSD orchestrator tools

## Key File Locations

**Entry Points:**

- `src/app/layout.tsx`: Root HTML document layout with metadata
- `src/app/page.tsx`: Homepage entry point marked with 'use client'
- `src/app/admin/page.tsx`: Admin login page entry point
- `src/app/admin/layout.tsx`: Admin section layout with authentication check
- `src/app/admin/gallery/page.tsx`: Gallery management main page

**Configuration:**

- `tsconfig.json`: TypeScript settings including path alias `@/*` → `./src/*`
- `next.config.js`: Next.js config with CSP headers, Image optimization, remote patterns
- `tailwind.config.ts`: Tailwind CSS color palette, spacing, plugins
- `postcss.config.js`: PostCSS with Tailwind and autoprefixer
- `eslint.config.mjs`: ESLint rules configuration
- `package.json`: Dependencies and build scripts
- `.env.example`: Template for required environment variables

**Type Definitions:**

- `src/app/api/gallery/types.ts`: `ImageAsset` interface (image data), `GalleryState` interface (database)
- `src/app/admin/gallery/components/types.ts`: `Tab` type, `DialogConfig` interface

**Core Logic:**

- `src/app/api/gallery/route.ts`: Image CRUD operations, file processing with Sharp, database persistence
- `src/app/api/auth/route.ts`: Password authentication logic
- `src/app/api/contact/route.ts`: Email sending with Nodemailer
- `src/app/admin/gallery/page.tsx`: State management for gallery admin, handles upload/delete/reorder operations
- `src/components/Gallery.tsx`: Fetches and displays gallery images on homepage

**Testing:**

- No test files currently committed (testing patterns in TESTING.md will document when added)

## Naming Conventions

**Files:**

- React components: PascalCase (e.g., `NavBar.tsx`, `Gallery.tsx`)
- API route files: `route.ts` (automatically routed by Next.js)
- Type files: `types.ts` (contains interfaces and types)
- Database files: `db.json` (JSON format)
- Styles: Global `globals.css`, inline Tailwind classes

**Directories:**

- Feature directories: PascalCase for components (`GalleryTabs`, `NavBar`)
- Functional directories: lowercase-with-hyphens (standard: `api`, `admin`, `components`)
- Nested routes: Match Next.js convention with folders as route segments (`app/admin/gallery/`)

**Functions & Variables:**

- React components: PascalCase (function names match file names)
- Hooks and helper functions: camelCase (e.g., `fetchGalleryData`, `getImageSection`, `handleImageUpload`)
- Constants: camelCase for local, UPPER_SNAKE_CASE for environment variables (e.g., `ADMIN_PASSWORD`, `EMAIL_USER`)
- State variables: camelCase (e.g., `isUploading`, `activeTab`, `uploadError`)

**Types & Interfaces:**

- Interfaces: PascalCase with 'I' prefix optional (e.g., `ImageAsset`, `GalleryState`, `DialogConfig`)
- Union types: camelCase or descriptive (e.g., `Tab = 'Facility' | 'Quilting' | 'deleted'`)
- Type literals: Exact string matches for sections (`'Facility'`, `'Quilting'`)

## Where to Add New Code

**New Feature (e.g., new section on homepage):**

1. Create component in `src/components/YourFeature.tsx`
2. Add to homepage imports in `src/app/page.tsx`
3. Add section in JSX render
4. Use 'use client' directive if component needs hooks/interactivity
5. Style with Tailwind classes matching existing color scheme (stone, teal)

**New Admin Feature (e.g., new gallery management tool):**

1. Create sub-component in `src/app/admin/gallery/components/FeatureName.tsx`
2. Add state management in parent `src/app/admin/gallery/page.tsx` or child component
3. Create API route in `src/app/api/feature/route.ts` if needed
4. Import and render in gallery admin page or new admin page

**New API Endpoint:**

1. Create directory `src/app/api/featureName/`
2. Create `route.ts` with handler functions (GET, POST, PATCH, DELETE as needed)
3. Create `types.ts` with TypeScript interfaces if handling complex data
4. Call from client components using `fetch('/api/featureName', options)`

**Utilities/Helpers:**

1. Create in appropriate module scope or `src/lib/` (if adding new directory)
2. Use path alias `@/lib/functionName` when importing
3. Document with JSDoc comments for shared utilities

**Global Styles:**

1. Add to `src/app/globals.css` for site-wide styles
2. Use Tailwind @apply directive for custom class definitions
3. Avoid inline styles; use Tailwind classes in JSX

## Special Directories

**public/assets/gallery/:**
- Purpose: Stores uploaded gallery images at runtime
- Generated: Yes (created automatically when images uploaded)
- Committed: No (git-ignored, only generated in runtime)
- Structure: Flat directory with WebP images named like `filename-1234567890.webp`

**src/app/api/gallery/db.json:**
- Purpose: JSON file database tracking gallery images and deleted images (development only)
- Generated: Yes (created automatically on first gallery operation)
- Committed: Yes (included in git for reference, can be version controlled for development)
- Format: `{ "images": [...], "deletedImages": [...] }`
- Production: Not used (Vercel filesystem is read-only)

**.next/:**
- Purpose: Build artifacts and cache from Next.js
- Generated: Yes (created during `npm run build`)
- Committed: No (git-ignored)
- Auto-cleanup: Yes (regenerated on each build)

**node_modules/:**
- Purpose: Installed npm packages
- Generated: Yes (created by `npm install`)
- Committed: No (git-ignored, uses package-lock.json)
- Auto-cleanup: Manual (`npm install` or `rm -rf node_modules && npm install`)

**.planning/codebase/:**
- Purpose: GSD analysis documents and planning
- Generated: Partially (created and updated by GSD tools)
- Committed: Yes (useful for team reference)
- Modification: Can be manually edited or regenerated

---

*Structure analysis: 2026-02-14*

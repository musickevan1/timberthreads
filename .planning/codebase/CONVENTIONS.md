# Coding Conventions

**Analysis Date:** 2026-02-14

## Naming Patterns

**Files:**
- Component files use PascalCase: `NavBar.tsx`, `Contact.tsx`, `Gallery.tsx`
- API route files follow Next.js convention: `route.ts` (not specific naming)
- Type definition files use descriptive names: `types.ts`
- Single file per component, no separate types files

**Functions:**
- Component functions use PascalCase: `NavBar()`, `Contact()`, `Gallery()`
- Utility/handler functions use camelCase: `handleChange()`, `handleSubmit()`, `fetchGalleryData()`
- Event handlers follow `handle[Event]` pattern: `handleImageUpload()`, `handleSectionChange()`
- State setters use standard React convention: `setFormData()`, `setIsLoading()`, `setGalleryImages()`

**Variables:**
- State variables use camelCase: `formData`, `galleryImages`, `isLoading`, `selectedImageIndex`
- Constants use camelCase (not UPPER_CASE): `navItems`, `validTypes`, `DB_PATH`, `MAX_FILE_SIZE`
- Type guard variables use descriptive names: `imageToDelete`, `imageToRestore`
- Object property keys use consistent camelCase in config objects

**Types:**
- Interface names use PascalCase: `ConfirmDialogProps`, `ImageAsset`, `GalleryState`, `DialogConfig`
- Type aliases use PascalCase: `Tab` (type union)
- Generic prop interfaces suffix with `Props`: `GalleryGridProps`
- Index/ID numeric values use camelCase: `selectedImageIndex`, `maxOrder`

## Code Style

**Formatting:**
- ESLint configured with `next/core-web-vitals` and `next/typescript`
- Uses ESM modules with ES2017 target
- Tailwind CSS for styling (defined in `tailwind.config.ts`)

**Linting:**
- Flat config ESLint using `@eslint/eslintrc` FlatCompat
- Configuration in `eslint.config.mjs`
- Enforces Next.js best practices and TypeScript rules
- No custom prettier config found; uses ESLint defaults

**Spacing and Indentation:**
- 2-space indentation observed throughout codebase
- Consistent spacing in JSX: `className="..."` with inline Tailwind strings
- Multi-line JSX components properly indented

## Import Organization

**Order:**
1. React and Next.js imports: `import React, { useState }`, `import { useRouter }`, `import Image from 'next/image'`
2. Third-party library imports: `import { Link } from 'react-scroll'`, `import nodemailer`
3. Type imports: `import type { Metadata }`, `import { ImageAsset }` (types and interfaces)
4. Absolute path imports using alias: `import Component from '@/components/NavBar'`, `import { ImageAsset } from '@/app/api/gallery/types'`
5. Local relative imports: `import ConfirmDialog from './components/ConfirmDialog'` (used rarely, mostly prefer `@/` alias)
6. CSS imports: `import './globals.css'`

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- Used consistently for all absolute imports: `@/components/`, `@/app/api/`
- Prefer alias imports over relative paths

**Barrel Files:**
- Not used. Each component imported individually.

## Error Handling

**Patterns:**
- Async operations wrapped in try-catch-finally blocks
- Client components (`'use client'`) use state for error management: `[error, setError]`
- API routes return structured `NextResponse.json()` with status codes
- Error type checking: `error instanceof Error ? error.message : 'Unknown error'`
- Validation errors returned with 400 status code
- Server errors returned with 500 status code
- Client-side form validation before submission (gallery component checks `file.size`, `file.type`)

**Examples from codebase:**

From `Contact.tsx`:
```typescript
try {
  const response = await fetch('/api/contact', { ... });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  // Success handling
} catch (error) {
  setStatus({
    submitting: false,
    submitted: true,
    success: false,
    error: error instanceof Error ? error.message : 'Failed to send message'
  });
}
```

From `Gallery.tsx`:
```typescript
try {
  setIsLoading(true);
  const response = await fetch('/api/gallery');

  if (!response.ok) {
    throw new Error('Failed to fetch gallery data');
  }

  const data = await response.json();
  setGalleryImages(sortedImages);
} catch (err) {
  console.error('Error fetching gallery data:', err);
  setError('Failed to load gallery images. Please try again later.');
} finally {
  setIsLoading(false);
}
```

From `/api/contact/route.ts`:
```typescript
export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }
    // ... email sending logic ...
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
```

## Logging

**Framework:** `console` object (no dedicated logging library)

**Patterns:**
- Use `console.log()` for informational messages
- Use `console.error()` for error conditions
- Logging used primarily in API routes for debugging
- Log format typically: `console.log('Action:', description)` or `console.error('Error type:', error)`

**Examples:**
```typescript
console.log('Email credentials:', { user: '...', pass: '...', recipient: '...' });
console.log('Environment:', isProduction ? 'Production (Vercel)' : 'Development');
console.error('Error saving to DB:', error);
console.error('Error uploading file:', error);
```

**When to log:**
- Database operations (get/save): `console.log('Successfully saved to DB')`
- Environment configuration: `console.log('Environment:', ...)`
- Image operations: `console.log('Image soft deleted:', src)`
- Error conditions: `console.error('Error ...:', error)`

## Comments

**When to Comment:**
- Complex logic requiring explanation (example: sorting algorithm in Gallery component)
- Workarounds or temporary solutions (example: commented-out Cloudinary code)
- Important notes about production behavior (example: "In production, file system is read-only")

**JSDoc/TSDoc:**
- Not used extensively in codebase
- Function documentation is minimal
- Type annotations preferred over inline comments for clarity

**Examples from codebase:**
```typescript
// Function to sort images by order
const sortByOrder = (a: ImageAsset, b: ImageAsset): number => {
  return a.order - b.order;
};

// Temporarily comment out cloudinary import to fix build issues
// import cloudinary, { uploadImage, deleteImage } from '../../../lib/cloudinary';

// Mobile menu
{isMobile && (
  <div className={...}>
```

## Function Design

**Size:**
- Component functions typically 80-200 lines
- Event handlers 20-80 lines
- Utility functions extracted when logic exceeds 50 lines

**Parameters:**
- React components receive props as destructured interface type
- Event handlers receive typed event objects: `React.ChangeEvent<HTMLInputElement>`
- API handlers receive `NextRequest` typed parameter
- Async functions marked with `async` keyword

**Return Values:**
- React components return JSX
- Event handlers return `void`
- Async operations return `Promise<T>`
- API routes return `NextResponse`
- Utility functions return early with specific values rather than deeply nested conditionals

**Example function structure:**
```typescript
const handleImageUpload = async (fileInput: React.ChangeEvent<HTMLInputElement> | File) => {
  // Extract file
  let file: File;
  if (fileInput instanceof File) {
    file = fileInput;
  } else {
    const files = fileInput.target.files;
    if (!files || files.length === 0) return;
    file = files[0];
  }

  // Validate
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    setUploadError(`File size exceeds 10MB limit`);
    return;
  }

  // Process
  try {
    // ... main logic
  } catch (error) {
    // ... error handling
  }
};
```

## Module Design

**Exports:**
- Use `export default` for component files
- Named exports for utility functions (none currently in codebase)
- Type exports use `export interface` and `export type`

**Barrel Files:**
- Not used. Components imported individually from their file paths.
- `@/components/` alias points to individual component files

**Component Organization:**
- Each component in its own file
- Props interface defined within or above component
- Component function immediately exported as default
- Hooks imported at top level

**Example:**
```typescript
const Contact = () => {
  const [formData, setFormData] = useState({ ... });
  const [status, setStatus] = useState({ ... });

  const handleChange = (e: React.ChangeEvent<...>) => { ... };
  const handleSubmit = async (e: React.FormEvent) => { ... };

  return (
    <section>...</section>
  );
};

export default Contact;
```

---

*Convention analysis: 2026-02-14*

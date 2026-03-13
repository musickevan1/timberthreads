# Timber & Threads Retreat

A full-stack marketing and booking site for a quilting retreat center in rural Missouri.

**Live:** [timberandthreadsretreat.com](https://www.timberandthreadsretreat.com/)

---

## Overview

Timber & Threads Retreat is a hospitality business offering quilting retreats, crafting weekends, and family gatherings at a lakeside property in West Central Missouri. The client needed a web presence that could show real-time availability, showcase the property through photography, and let potential guests reach out directly -- all manageable by the owner without developer involvement. This project delivered a single-page marketing site with integrated booking visibility, a self-service gallery, and a contact form that routes inquiries straight to the client's inbox.

## Key Features

- **Real-time availability calendar** -- embedded Google Calendar gives guests an always-current view of open dates without any manual syncing
- **Cloud-hosted image gallery** -- images served through Cloudinary with automatic format optimization and responsive sizing; organized into categorized sections with sortable ordering
- **Lightbox viewer with touch support** -- full-screen image browsing with pinch-to-zoom, swipe navigation, and keyboard controls
- **Contact form with email delivery** -- server-side form handling via Nodemailer routes inquiries directly to the business owner
- **Interactive location section** -- embedded Google Maps alongside step-by-step driving directions for a rural property where GPS can be unreliable
- **Content management system** -- the owner can upload, reorder, recategorize, caption, and soft-delete gallery images without touching code
- **Responsive single-page layout** -- smooth-scrolling sections for About, Accommodations, Workshops, Calendar, Gallery, Contact, and Location, all optimized for mobile booking

## Technical Highlights

**Image pipeline.** Uploads are processed server-side with Sharp (resized to web dimensions, converted to WebP at 80% quality) before being pushed to Cloudinary. The gallery API uses signed upload requests so credentials never reach the client. Cloudinary's `CldImage` component handles automatic format negotiation and responsive `srcset` generation on the front end.

**Serverless data layer.** Gallery metadata (ordering, captions, sections, soft-delete state) is persisted in Upstash Redis via REST API, keeping the architecture fully serverless with no traditional database to manage. This pairs well with Vercel's edge deployment model.

**Image interaction.** The lightbox implements a custom `ZoomableImage` component with pinch-to-zoom (tracking touch distance deltas), bounded drag-to-pan when zoomed, and double-click/double-tap toggle -- all built from scratch without a library dependency.

**Soft-delete workflow.** Gallery deletions are non-destructive by default. Images move to a recoverable state before permanent removal, which also cleans up the corresponding Cloudinary asset. This gives the client a safety net when managing content.

## Built With

Next.js 14, React 18, TypeScript, Tailwind CSS, Cloudinary, Upstash Redis, Sharp, Nodemailer, Vercel

# Timber & Threads Retreat Website

A Next.js website for Timber & Threads Retreat featuring availability calendar and gallery management.

## Features

- Responsive design
- Google Calendar integration for availability
- Admin panel for gallery management
- Image upload and management
- Secure admin access

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
Copy `.env.example` to `.env` and set your admin password:
```
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
```

3. Google Calendar Setup:
- Create a Google Calendar for the retreat
- Set sharing settings to "Make available to public"
- Get the embed code
- Replace the calendar URL in `src/components/Calendar.tsx`

4. Run the development server:
```bash
npm run dev
```

## Admin Access

- Access the admin panel at `/admin`
- Use the password set in `.env`
- Manage gallery images at `/admin/gallery`

## Deployment

1. Set environment variables in Vercel:
   - `NEXT_PUBLIC_ADMIN_PASSWORD`

2. Deploy to Vercel:
```bash
vercel
```

## File Structure

- `/src/app/admin/*` - Admin panel pages
- `/src/app/api/*` - API routes
- `/src/components/*` - React components
- `/public/assets/*` - Uploaded images

## Development

- Built with Next.js 14
- Uses Tailwind CSS for styling
- TypeScript for type safety

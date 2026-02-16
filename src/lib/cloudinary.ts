import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary SDK with API credentials
// IMPORTANT: This file runs SERVER-SIDE ONLY - API secret never exposed to client
// Only configure if credentials are available (allows build to succeed even without credentials)
if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, // NO NEXT_PUBLIC_ prefix - server-only
  });
}

// Export configured instance for use in API routes
export { cloudinary };

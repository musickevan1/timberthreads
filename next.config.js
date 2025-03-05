/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dziunzep2/image/upload/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_ADMIN_PASSWORD: 'timberandthreads2024'
  }
};

module.exports = nextConfig;

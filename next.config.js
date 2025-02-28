/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_ADMIN_PASSWORD: 'timberandthreads2024'
  }
};

module.exports = nextConfig;

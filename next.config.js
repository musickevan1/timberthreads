/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.facebook.com',
      },
      {
        protocol: 'https',
        hostname: '*.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
    ],
  },
  env: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; connect-src 'self' https://*.facebook.com https://www.google.com https://widget.cloudinary.com https://upload-widget.cloudinary.com https://api.cloudinary.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.facebook.net https://*.facebook.com https://www.google.com https://upload-widget.cloudinary.com; frame-src https://*.facebook.com https://calendar.google.com https://www.google.com/maps/embed https://upload-widget.cloudinary.com; style-src 'self' 'unsafe-inline' https://*.facebook.com https://upload-widget.cloudinary.com; font-src 'self' data: https://*.facebook.com; img-src 'self' https://res.cloudinary.com https://*.facebook.com https://*.fbsbx.com https://www.google.com data:;"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;

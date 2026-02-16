/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
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
            value: "default-src 'self'; connect-src 'self' https://*.facebook.com https://www.google.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.facebook.net https://*.facebook.com https://www.google.com; frame-src https://*.facebook.com https://calendar.google.com https://www.google.com/maps/embed; style-src 'self' 'unsafe-inline' https://*.facebook.com; font-src 'self' data: https://*.facebook.com; img-src 'self' https://*.facebook.com https://*.fbsbx.com https://www.google.com data:;"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;

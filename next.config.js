/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
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
            value: "default-src 'self'; connect-src 'self' https://*.facebook.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.facebook.net https://*.facebook.com; frame-src https://*.facebook.com https://calendar.google.com; style-src 'self' 'unsafe-inline' https://*.facebook.com; font-src 'self' data: https://*.facebook.com; img-src 'self' https://*.facebook.com https://*.fbsbx.com data:;"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;

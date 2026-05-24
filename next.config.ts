import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; connect-src 'self' https://maps.googleapis.com; img-src 'self' blob: data: https://maps.gstatic.com https://maps.googleapis.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
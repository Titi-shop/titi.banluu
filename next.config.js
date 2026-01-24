/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src * data: blob: 'self';",
              // 👇 QUAN TRỌNG CHO PI SDK
              "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
              "connect-src * data: blob:;",
              "img-src * data: blob:;",
              "style-src * 'unsafe-inline';",
              "frame-src *;",
            ].join(" "),
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

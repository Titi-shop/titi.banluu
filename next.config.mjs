/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Bỏ qua lỗi ESLint khi build (không chặn deploy)
  eslint: { ignoreDuringBuilds: true },

  // ✅ Bỏ qua lỗi TypeScript khi build (tương tự)
  typescript: { ignoreBuildErrors: true },

  // ✅ Không tối ưu hóa ảnh (tránh cấu hình domain phức tạp)
  images: { unoptimized: true },

  // ✅ Thêm headers để cho phép Pi SDK hoạt động trong Pi Browser
  async headers() {
    return [
      {
        source: "/(.*)", // áp dụng cho mọi route
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              // Cho phép nạp script SDK của Pi
              "script-src 'self' https://sdk.minepi.com 'unsafe-inline' 'unsafe-eval';",
              // Cho phép giao tiếp tới API Pi Network
              "connect-src 'self' https://api.minepi.com https://sdk.minepi.com https://minepi.com;",
              // Cho phép hình ảnh từ local, data URI, blob (để hiển thị avatar, icon, v.v.)
              "img-src 'self' data: blob: https:;",
              // Cho phép CSS inline (vì Tailwind dùng inline style)
              "style-src 'self' 'unsafe-inline';",
              // Cho phép iframe nếu cần Pi Browser hoặc thanh toán
              "frame-src 'self' https://sdk.minepi.com https://minepi.com;",
            ].join(" "),
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // ✅ Cho phép Pi Browser mở iframe nếu cần
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // ✅ Bật experimental flags (đảm bảo tương thích Next 15+)
  experimental: {
    serverActions: false,
  },
};

export default nextConfig;

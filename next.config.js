/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Bỏ qua lỗi lint khi build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bỏ qua lỗi TypeScript khi build
    ignoreBuildErrors: true,
  },
  images: {
    // Cho phép dùng <img> mà không bị cảnh báo
    unoptimized: true,
  },
};

module.exports = nextConfig;

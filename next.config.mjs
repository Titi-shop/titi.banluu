/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⛳ Không fail build nếu còn lỗi ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ⛳ Không fail build nếu còn lỗi TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  // Cho phép dùng <img> local & không tối ưu hoá ảnh (đỡ cấu hình miền)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

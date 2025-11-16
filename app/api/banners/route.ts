import { NextResponse } from "next/server";

/**
 * 🧩 API: /api/banners
 * Trả danh sách banner quảng cáo hiển thị trên trang chủ và trang quảng cáo
 */
export async function GET() {
  const banners = [
    {
      id: 1,
      image: "/banners/1122d422-28af-4055-ab39-05573b3d2094 (1).jfif",
      link: "/category/pet",
      title: "Ưu đãi đặc biệt cho thú cưng 🐶",
    },
    {
      id: 2,
      image: "/banners/b42db293-7ba1-41a2-9bd1-7373ca643943.jfif",
      link: "/category/electronics",
      title: "🔥 Siêu giảm giá điện tử - Mua ngay!",
    },
    {
      id: 3,
      image: "/banners/b42db293-7ba1-41a2-9bd1-7373ca643943.jfif",
      link: "/category/fashion",
      title: "💃 Thời trang 2025 - Sale sốc toàn sàn",
    },
  ];

  return NextResponse.json(banners);
}

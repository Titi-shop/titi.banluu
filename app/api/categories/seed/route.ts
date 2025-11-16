import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = [
    { id: 1, name: "Điện thoại & Laptop", icon: "/banners/maytinh.jpg" },
    { id: 2, name: "Thời trang Nam", icon: "/banners/thoitrangnam.jpg" },
    { id: 3, name: "Thời trang Nữ", icon: "/banners/thoitrangnu.jpg" },
    { id: 4, name: "Giày dép", icon: "/banners/Screenshot_2025-11-14-19-32-23-378_com.vuahanghieu.jpg" },
    { id: 5, name: "Làm đẹp", icon: "/banners/lamdep.jpg" },
    { id: 20, name: "Nội thất", icon: "/banners/noithat.jpg" },
    { id: 7, name: "Mẹ & Bé", icon: "/banners/mevabe.jpg" },
    { id: 8, name: "Thiết bị điện tử", icon: "/banners/dienthoai.jpg" },
    { id: 9, name: "Đồ gia dụng", icon: "/banners/dogiadung.jpg" },
    { id: 10, name: "Sức khỏe", icon: "/banners/suckhoe.jpg" },
    { id: 11, name: "Thể thao & Du lịch", icon: "/banners/thethao.jpg" },
    { id: 12, name: "Ô tô & Xe máy", icon: "/banners/oto.jpg" },
    { id: 13, name: "Thú cưng", icon: "/banners/thucung.jpg" },
    { id: 14, name: "Điện máy", icon: "/banners/dienmay.jpg" },
    { id: 15, name: "Sách", icon: "/banners/sach.jpg" },
    { id: 16, name: "Đồng hồ", icon: "/banners/dongho.jpg" },
    { id: 19, name: "Đồ chơi", icon: "/banners/dochoi.jpg" },
    { id: 18, name: "Máy ảnh & Flycam", icon: "/banners/flycam.jpg" },
  ];

  await kv.set("categories", categories);

  return NextResponse.json({
    ok: true,
    message: "Đã tạo đầy đủ danh mục",
    count: categories.length,
    categories
  });
}

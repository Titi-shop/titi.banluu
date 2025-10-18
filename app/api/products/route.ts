import { NextResponse } from "next/server";

// Bộ nhớ tạm (RAM)
let products: any[] = [];

// ==============================
// 🔹 GET — Lấy danh sách sản phẩm
// ==============================
export async function GET() {
  return NextResponse.json(products);
}

// ==============================
// 🔹 POST — Nhận JSON từ client
// ==============================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, images } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: "Thiếu tên hoặc giá sản phẩm" },
        { status: 400 }
      );
    }

    // ✅ Đảm bảo mảng ảnh chỉ chứa URL string
    const imageUrls = Array.isArray(images)
      ? images.map((img: any) => (typeof img === "string" ? img : img.url))
      : [];

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: imageUrls,
      createdAt: new Date().toISOString(),
    };

    // Lưu vào bộ nhớ tạm (RAM)
    products.unshift(newProduct);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("❌ Lỗi POST:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi khi thêm sản phẩm" },
      { status: 500 }
    );
  }
}

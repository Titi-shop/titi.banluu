import { NextResponse } from "next/server";

// Bộ nhớ tạm lưu sản phẩm (RAM)
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

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: images || [],
      createdAt: new Date().toISOString(),
    };

    // ✅ Thêm sản phẩm mới vào danh sách tạm
    products.unshift(newProduct);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("❌ Lỗi POST:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi khi thêm sản phẩm" },
      { status: 500 }
    );
  }
}

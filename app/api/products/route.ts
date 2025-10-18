import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Bộ nhớ tạm (RAM) lưu sản phẩm
let products: any[] = [];

// ==============================
// 🔹 GET — Lấy danh sách sản phẩm
// ==============================
export async function GET() {
  return NextResponse.json(products);
}

// ==============================
// 🔹 POST — Thêm sản phẩm mới
// ==============================
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const images = formData.getAll("images") as File[];

    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin sản phẩm" },
        { status: 400 }
      );
    }

    // ✅ Upload ảnh lên Vercel Blob
    const imageUrls: string[] = [];
    for (const img of images) {
      const buffer = Buffer.from(await img.arrayBuffer());
      const blob = await put(`uploads/${Date.now()}-${img.name}`, buffer, {
        access: "public",
        contentType: img.type,
      });
      imageUrls.push(blob.url);
    }

    // ✅ Lưu sản phẩm vào bộ nhớ tạm
    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: imageUrls,
      createdAt: new Date().toISOString(),
    };

    products.unshift(newProduct);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("❌ Lỗi POST:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi thêm sản phẩm" },
      { status: 500 }
    );
  }
}

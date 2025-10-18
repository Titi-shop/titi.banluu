import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

// ==============================
// 🔹 Đọc danh sách sản phẩm từ Blob
// ==============================
async function readProducts() {
  try {
    const blobs = await list();
    const file = blobs.blobs.find((b) => b.pathname === "products.json");
    if (!file) return [];

    // ⚠️ Tránh lỗi cache cũ — luôn đọc bản mới nhất
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("❌ Lỗi đọc sản phẩm:", err);
    return [];
  }
}

// ==============================
// 🔹 Ghi danh sách sản phẩm vào Blob
// ==============================
async function writeProducts(products: any[]) {
  try {
    await put("products.json", JSON.stringify(products, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("❌ Lỗi ghi sản phẩm:", err);
  }
}

// ==============================
// 🔹 GET — Lấy danh sách sản phẩm
// ==============================
export async function GET() {
  const products = await readProducts();
  return NextResponse.json(products);
}

// ==============================
// 🔹 POST — Thêm sản phẩm mới
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

    // 🧩 Đọc danh sách hiện tại
    const products = await readProducts();

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: images || [],
      createdAt: new Date().toISOString(),
    };

    // ✅ Thêm vào đầu danh sách (không ghi đè)
    products.unshift(newProduct);

    // 🧠 Ghi lại danh sách mới
    await writeProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ Lỗi POST:", err);
    return NextResponse.json(
      { success: false, message: "Không thể thêm sản phẩm" },
      { status: 500 }
    );
  }
}

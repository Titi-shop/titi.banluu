// app/api/products/route.ts
import { NextResponse } from "next/server";
import { del, put, list, get } from "@vercel/blob";  // <--- Thêm dòng này

// 🧩 Hàm ghi sản phẩm vào Blob
async function writeProducts(products: any[]) {
  try {
    // 🧩 Bước 1: Ghi tạm file mới
    const tempFileName = "products-temp.json";
    await put(tempFileName, JSON.stringify(products, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });

    // 🧩 Bước 2: Xóa file cũ nếu tồn tại
    try {
      await del("products.json");
    } catch (err) {
      console.warn("⚠️ Không tìm thấy products.json cũ, bỏ qua xoá.");
    }

    // 🧩 Bước 3: Ghi lại file chính thức
    await put("products.json", JSON.stringify(products, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });

    console.log("✅ Ghi products.json thành công:", products.length);
  } catch (err) {
    console.error("❌ Lỗi ghi products.json:", err);
  }
}

// ==================================
// 🗂 Bộ nhớ tạm (RAM)
// ==================================
let products: any[] = [];

// ✅ Đọc dữ liệu từ Blob khi khởi động
(async () => {
  try {
    const existing = await get("products.json");
    if (existing?.blob) {
      const text = await existing.blob.text();
      products = JSON.parse(text);
      console.log("📦 Đã load", products.length, "sản phẩm từ Blob");
    }
  } catch (err) {
    console.warn("⚠️ Chưa có products.json trong Blob");
  }
})();

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
    const body = await req.json();
    const { name, price, description, images } = body;

    if (!name || !price)
      return NextResponse.json({ success: false, message: "Thiếu tên hoặc giá" }, { status: 400 });

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: images || [],
      createdAt: new Date().toISOString(),
    };

    products.unshift(newProduct);

    // 🧩 Ghi lại Blob JSON
    await writeProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("❌ POST Error:", error);
    return NextResponse.json({ success: false, message: "Lỗi khi thêm" }, { status: 500 });
  }
}

// ==============================
// 🔹 PUT — Cập nhật sản phẩm
// ==============================
export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const id = Number(formData.get("id"));
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const images = formData.getAll("images") as string[];

    const index = products.findIndex((p) => p.id === id);
    if (index === -1)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" }, { status: 404 });

    const updated = {
      ...products[index],
      name,
      price,
      description,
      images,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;
    await writeProducts(products);

    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error("❌ PUT Error:", err);
    return NextResponse.json({ success: false, message: "Cập nhật thất bại" }, { status: 500 });
  }
}

// ==============================
// 🔹 DELETE — Xóa sản phẩm
// ==============================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id)
      return NextResponse.json({ success: false, message: "Thiếu ID sản phẩm" }, { status: 400 });

    const before = products.length;
    products = products.filter((p) => p.id !== id);

    if (before === products.length)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" }, { status: 404 });

    await writeProducts(products);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE Error:", err);
    return NextResponse.json({ success: false, message: "Xóa thất bại" }, { status: 500 });
  }
}

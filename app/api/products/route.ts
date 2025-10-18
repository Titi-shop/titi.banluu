// app/api/products/route.ts
import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";

// ==================================
// 🧩 Hàm ghi sản phẩm vào Blob
// ==================================
async function writeProducts(products: any[]) {
  try {
    const data = JSON.stringify(products, null, 2);

    // Kiểm tra xem file products.json có tồn tại không
    const { blobs } = await list();
    const oldFile = blobs.find((b) => b.pathname === "products.json");

    if (oldFile) {
      console.log("🗑 Xóa file cũ...");
      await del("products.json");
      // Đợi 2 giây để đảm bảo xóa hoàn tất trên tất cả edge server
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Ghi file mới (ép ghi mới hoàn toàn)
    await put("products.json", data, {
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

// ✅ Load dữ liệu từ Blob khi server start
(async () => {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "products.json");

    if (file) {
      const res = await fetch(file.url, { cache: "no-store" });
      products = await res.json();
      console.log("📦 Đã load", products.length, "sản phẩm từ Blob");
    } else {
      console.warn("⚠️ Chưa có file products.json trong Blob");
    }
  } catch (err) {
    console.error("❌ Lỗi đọc products.json:", err);
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

    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: "Thiếu tên hoặc giá" },
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

    products.unshift(newProduct);
    await writeProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("❌ POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi khi thêm sản phẩm" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

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
    return NextResponse.json(
      { success: false, message: "Cập nhật thất bại" },
      { status: 500 }
    );
  }
}

// ==============================
// 🔹 DELETE — Xóa sản phẩm
// ==============================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID sản phẩm" },
        { status: 400 }
      );
    }

    const before = products.length;
    products = products.filter((p) => p.id !== id);

    if (before === products.length)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    await writeProducts(products);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE Error:", err);
    return NextResponse.json(
      { success: false, message: "Xóa thất bại" },
      { status: 500 }
    );
  }
}

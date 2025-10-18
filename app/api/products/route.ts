import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

// ==============================
// 🔹 Hàm đọc danh sách sản phẩm từ Blob
// ==============================
async function readProducts() {
  try {
    const blobs = await list();
    const file = blobs.blobs.find((b) => b.pathname === "products.json");
    if (!file) return [];

    const res = await fetch(file.url, { cache: "no-store" });
    const text = await res.text();
    if (!text.trim()) return [];

    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Lỗi đọc sản phẩm:", err);
    return [];
  }
}

// ==============================
// 🔹 Hàm ghi danh sách sản phẩm vào Blob
// ==============================
async function writeProducts(products: any[]) {
  try {
    await put("products.json", JSON.stringify(products, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });
    console.log("✅ Ghi products.json thành công:", products.length);
  } catch (err) {
    console.error("❌ Lỗi ghi products.json:", err);
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

    const products = await readProducts();

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: images || [],
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = [newProduct, ...products];
    await writeProducts(updatedProducts);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ Lỗi POST:", err);
    return NextResponse.json(
      { success: false, message: "Không thể thêm sản phẩm" },
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
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID sản phẩm" },
        { status: 400 }
      );
    }

    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const images = formData.getAll("images") as string[];

    const products = await readProducts();
    const index = products.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );
    }

    const updatedProduct = {
      ...products[index],
      name,
      price,
      description,
      images,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updatedProduct;
    await writeProducts(products);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err) {
    console.error("❌ Lỗi PUT:", err);
    return NextResponse.json(
      { success: false, message: "Cập nhật sản phẩm thất bại" },
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

    if (!id)
      return NextResponse.json(
        { success: false, message: "Thiếu ID sản phẩm" },
        { status: 400 }
      );

    const products = await readProducts();
    const filtered = products.filter((p: any) => p.id !== id);

    if (filtered.length === products.length) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm để xóa" },
        { status: 404 }
      );
    }

    await writeProducts(filtered);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi DELETE:", err);
    return NextResponse.json(
      { success: false, message: "Xóa sản phẩm thất bại" },
      { status: 500 }
    );
  }
}

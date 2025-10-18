import { NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";

// Tên file lưu danh sách sản phẩm trong Blob
const PRODUCTS_BLOB = "products.json";

// ==============================
// 🔹 Hàm hỗ trợ: Đọc danh sách sản phẩm từ Blob
// ==============================
async function readProducts() {
  try {
    const blobs = await list();
    const file = blobs.blobs.find((b) => b.pathname === PRODUCTS_BLOB);
    if (!file) return [];
    const res = await fetch(file.url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Lỗi đọc Blob:", err);
    return [];
  }
}

// ==============================
// 🔹 Ghi lại danh sách vào Blob
// ==============================
async function writeProducts(products: any[]) {
  try {
    await put(PRODUCTS_BLOB, JSON.stringify(products, null, 2), {
      access: "public",
      addRandomSuffix: false, // ghi đè file cũ
    });
  } catch (err) {
    console.error("❌ Lỗi ghi Blob:", err);
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

    products.unshift(newProduct);
    await writeProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("❌ Lỗi POST:", error);
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
    if (!id)
      return NextResponse.json(
        { success: false, message: "Thiếu ID sản phẩm" },
        { status: 400 }
      );

    const products = await readProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const imagesData = formData.getAll("images");

    // ✅ Xử lý ảnh: URL cũ hoặc File mới
    let uploadedUrls: string[] = [];
    for (const item of imagesData) {
      if (typeof item === "string") {
        uploadedUrls.push(item);
      } else if (item instanceof File) {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": item.type,
            "x-filename": item.name,
          },
          body: item,
        });
        const data = await res.json();
        if (data?.url) uploadedUrls.push(data.url);
      }
    }

    if (uploadedUrls.length === 0) uploadedUrls = products[index].images;

    const updatedProduct = {
      ...products[index],
      name,
      price,
      description,
      images: uploadedUrls,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updatedProduct;
    await writeProducts(products);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("❌ Lỗi PUT:", error);
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
    if (!id)
      return NextResponse.json(
        { success: false, message: "Thiếu ID sản phẩm" },
        { status: 400 }
      );

    let products = await readProducts();
    const before = products.length;
    products = products.filter((p) => p.id !== id);
    if (products.length === before)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    await writeProducts(products);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Lỗi DELETE:", error);
    return NextResponse.json(
      { success: false, message: "Xóa sản phẩm thất bại" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";

// ==============================
// 📦 ĐƯỜNG DẪN LƯU FILE JSON
// ==============================
const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "products.json");

// ==============================
// 🔧 HÀM HỖ TRỢ
// ==============================

// ✅ Đọc danh sách sản phẩm
function readProducts() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]", "utf-8");
    const data = fs.readFileSync(dataFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Lỗi đọc file:", error);
    return [];
  }
}

// ✅ Ghi dữ liệu sản phẩm vào file JSON
function saveProducts(products: any[]) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(products, null, 2), "utf-8");
  } catch (error) {
    console.error("❌ Lỗi ghi file:", error);
  }
}

// ==============================
// 🔹 GET — Lấy danh sách sản phẩm
// ==============================
export async function GET() {
  const products = readProducts();
  return NextResponse.json(products);
}

// ==============================
// 🔹 POST — Thêm sản phẩm mới (Upload ảnh lên Blob)
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

    // ✅ Upload từng ảnh lên Blob Storage
    const uploadedUrls: string[] = [];
    for (const img of images) {
      if (!img || !img.name) continue;
      const buffer = Buffer.from(await img.arrayBuffer());
      const blob = await put(`uploads/${Date.now()}-${img.name}`, buffer, {
        access: "public",
        contentType: img.type,
      });
      uploadedUrls.push(blob.url);
    }

    // ✅ Tạo sản phẩm mới
    const products = readProducts();
    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: uploadedUrls,
      createdAt: new Date().toISOString(),
    };

    products.push(newProduct);
    saveProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ Lỗi POST:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi thêm sản phẩm" },
      { status: 500 }
    );
  }
}

// ==============================
// 🔹 PUT — Cập nhật sản phẩm
// ==============================
export async function PUT(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let updatedData: any = {};

    if (contentType.includes("application/json")) {
      updatedData = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      updatedData.id = Number(formData.get("id"));
      updatedData.name = formData.get("name");
      updatedData.price = formData.get("price");
      updatedData.description = formData.get("description");

      const images = formData.getAll("images") as File[];
      if (images.length) {
        updatedData.images = [];
        for (const img of images) {
          if (!img || !img.name) continue;
          const buffer = Buffer.from(await img.arrayBuffer());
          const blob = await put(`uploads/${Date.now()}-${img.name}`, buffer, {
            access: "public",
            contentType: img.type,
          });
          updatedData.images.push(blob.url);
        }
      }
    }

    if (!updatedData.id)
      return NextResponse.json(
        { success: false, message: "Thiếu ID sản phẩm" },
        { status: 400 }
      );

    const products = readProducts();
    const index = products.findIndex((p: any) => p.id === updatedData.id);
    if (index === -1)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    // Giữ hình cũ nếu không có ảnh mới
    products[index] = {
      ...products[index],
      ...updatedData,
      images: updatedData.images || products[index].images,
    };

    saveProducts(products);
    return NextResponse.json({ success: true, product: products[index] });
  } catch (err) {
    console.error("❌ Lỗi PUT:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi cập nhật sản phẩm" },
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

    const products = readProducts();
    const newProducts = products.filter((p: any) => p.id !== id);
    saveProducts(newProducts);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi DELETE:", err);
    return NextResponse.json(
      { success: false, error: "Không thể xóa sản phẩm" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ==============================
// 📦 ĐƯỜNG DẪN LƯU TRỮ DỮ LIỆU
// ==============================
const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "products.json");
const uploadDir = path.join(process.cwd(), "public", "uploads");

// ==============================
// 🔧 HÀM HỖ TRỢ
// ==============================

// ✅ Đọc danh sách sản phẩm (và tự tạo file nếu chưa có)
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

// ✅ Ghi dữ liệu vào file JSON
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
// 🔹 POST — Thêm sản phẩm mới
// ==============================
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const images = formData.getAll("images") as File[];

    if (!name || !price)
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin sản phẩm" },
        { status: 400 }
      );

    // ✅ Tạo thư mục upload nếu chưa có
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const imagePaths: string[] = [];
    for (const img of images) {
      if (!img || !img.name) continue;
      const arrayBuffer = await img.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const safeName = `${Date.now()}-${img.name.replace(/\s+/g, "_")}`;
      const imgPath = path.join(uploadDir, safeName);
      fs.writeFileSync(imgPath, buffer);
      imagePaths.push(`/uploads/${safeName}`);
    }

    const products = readProducts();
    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: imagePaths,
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

    // 🧩 Nếu client gửi JSON
    if (contentType.includes("application/json")) {
      updatedData = await req.json();
    }
    // 🖼 Nếu client gửi formData
    else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      updatedData.id = Number(formData.get("id"));
      updatedData.name = formData.get("name");
      updatedData.price = formData.get("price");
      updatedData.description = formData.get("description");

      const images = formData.getAll("images") as File[];
      if (images.length) {
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        updatedData.images = [];

        for (const img of images) {
          if (!img || !img.name) continue;
          const arrayBuffer = await img.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const safeName = `${Date.now()}-${img.name.replace(/\s+/g, "_")}`;
          const imgPath = path.join(uploadDir, safeName);
          fs.writeFileSync(imgPath, buffer);
          updatedData.images.push(`/uploads/${safeName}`);
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

    // 🧠 Giữ nguyên hình ảnh cũ nếu không upload ảnh mới
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

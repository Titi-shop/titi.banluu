import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "products.json");

// ✅ Đảm bảo thư mục /data tồn tại
async function ensureDataFile() {
  const dir = path.dirname(dataFile);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf-8");
  }
}

// ✅ Đọc danh sách sản phẩm
async function readProducts() {
  await ensureDataFile();
  const data = await fs.readFile(dataFile, "utf-8");
  return JSON.parse(data || "[]");
}

// ✅ Ghi danh sách sản phẩm
async function writeProducts(products: any[]) {
  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(products, null, 2), "utf-8");
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

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID sản phẩm" },
        { status: 400 }
      );
    }

    const products = await readProducts();
    const index = products.findIndex((p: any) => p.id === id);
    if (index === -1)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const imageValues = formData.getAll("images").map((i) => i.toString());

    // ✅ Cập nhật
    products[index] = {
      ...products[index],
      name,
      price,
      description,
      images: imageValues,
      updatedAt: new Date().toISOString(),
    };

    await writeProducts(products);

    return NextResponse.json({ success: true, product: products[index] });
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

    const products = await readProducts();
    const filtered = products.filter((p: any) => p.id !== id);
    await writeProducts(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Lỗi DELETE:", error);
    return NextResponse.json(
      { success: false, message: "Xóa sản phẩm thất bại" },
      { status: 500 }
    );
  }
}

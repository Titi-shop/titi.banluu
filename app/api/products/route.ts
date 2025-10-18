import { NextResponse } from "next/server";

// Bộ nhớ tạm (RAM)
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

    products.unshift(newProduct);

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

    const existingIndex = products.findIndex((p) => p.id === id);
    if (existingIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );
    }

    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const newImages: File[] = formData.getAll("images") as File[];

    // 🧩 Nếu có ảnh mới thì upload lên Blob
    let uploadedUrls: string[] = products[existingIndex].images;
    if (newImages.length > 0) {
      uploadedUrls = [];
      for (const file of newImages) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/upload`, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
            "x-filename": file.name,
          },
          body: file,
        });
        const data = await res.json();
        if (data?.url) uploadedUrls.push(data.url);
      }
    }

    // ✅ Cập nhật thông tin
    const updatedProduct = {
      ...products[existingIndex],
      name,
      price,
      description,
      images: uploadedUrls,
      updatedAt: new Date().toISOString(),
    };

    products[existingIndex] = updatedProduct;

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

    const before = products.length;
    products = products.filter((p) => p.id !== id);

    if (products.length === before)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Lỗi DELETE:", error);
    return NextResponse.json(
      { success: false, message: "Xóa sản phẩm thất bại" },
      { status: 500 }
    );
  }
}

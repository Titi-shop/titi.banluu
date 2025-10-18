// ==============================
// 🔹 POST — Thêm sản phẩm mới
// ==============================
export async function POST(req: Request) {
  try {
    // 🧩 Đọc danh sách sản phẩm thật từ Blob mỗi lần POST
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "products.json");

    let products: any[] = [];
    if (file) {
      const res = await fetch(file.url, { cache: "no-store" });
      products = await res.json();
    }

    // 🧩 Đọc dữ liệu từ form
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

    // 🧩 Ghi lại vào Blob thật
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

import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";
import { headers } from "next/headers";

/**
 * ====================================
 * 🧩 TiTi Shop - API Quản lý sản phẩm
 * ------------------------------------
 * 🔥 Phiên bản có SALE tự động theo ngày
 * ====================================
 */

// 🔹 Nhận biết môi trường Pi
const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

/** Đọc danh sách sản phẩm từ Blob */
async function readProducts() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "products.json");
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("❌ Lỗi đọc products.json:", err);
    return [];
  }
}

/** Ghi danh sách sản phẩm vào Blob */
async function writeProducts(products: any[]) {
  try {
    const data = JSON.stringify(products, null, 2);
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === "products.json");
    if (old) await del("products.json");

    await put("products.json", data, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log("✅ Đã lưu products.json:", products.length);
  } catch (err) {
    console.error("❌ Lỗi ghi file:", err);
  }
}

/** Kiểm tra role người dùng có phải seller không */
async function isSeller(username: string): Promise<boolean> {
  try {
    if (isTestnet) {
      console.log("🧪 Testnet mode: tự động cho phép seller");
      return true;
    }

    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/users/role?username=${username}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("⚠️ Không xác minh được quyền người bán:", res.status);
      return false;
    }

    const data = await res.json();
    return data.role === "seller";
  } catch (err) {
    console.error("❌ Lỗi xác minh role seller:", err);
    return false;
  }
}

/** 🔹 GET - Lấy toàn bộ sản phẩm (có tính giá sale tự động) */
export async function GET() {
  const products = await readProducts();
  const now = new Date();

  const enriched = products.map((p: any) => {
    const start = p.saleStart ? new Date(p.saleStart) : null;
    const end = p.saleEnd ? new Date(p.saleEnd) : null;

    const isSale =
      start && end && now >= start && now <= end && p.salePrice;

    return {
      ...p,
      isSale,
      finalPrice: isSale ? p.salePrice : p.price,
    };
  });

  return NextResponse.json(enriched);
}

/** 🔹 POST - Tạo sản phẩm mới (có sale) */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      price,
      description,
      images,
      seller,
      salePrice,
      saleStart,
      saleEnd,
    } = body;

    if (!name || !price || !seller) {
      return NextResponse.json(
        { success: false, message: "Thiếu tên, giá hoặc người bán" },
        { status: 400 }
      );
    }

    const sellerLower = seller.trim().toLowerCase();
    const canPost = await isSeller(sellerLower);

    if (!canPost) {
      return NextResponse.json(
        { success: false, message: "Tài khoản không có quyền đăng sản phẩm" },
        { status: 403 }
      );
    }

    const products = await readProducts();

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description: description || "",
      images: images || [],
      seller: sellerLower,
      env: isTestnet ? "testnet" : "mainnet",
      createdAt: new Date().toISOString(),

      // ⭐ BỔ SUNG SALE
      salePrice: salePrice || null,
      saleStart: saleStart || null,
      saleEnd: saleEnd || null,
    };

    products.unshift(newProduct);
    await writeProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ POST error:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi khi thêm sản phẩm" },
      { status: 500 }
    );
  }
}

/** 🔹 PUT - Cập nhật sản phẩm (có cập nhật sale) */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      price,
      description,
      images,
      seller,
      salePrice,
      saleStart,
      saleEnd,
    } = body;

    if (!id || !seller || !name || !price) {
      return NextResponse.json(
        { success: false, message: "Thiếu dữ liệu sản phẩm" },
        { status: 400 }
      );
    }

    const sellerLower = seller.trim().toLowerCase();
    const canEdit = await isSeller(sellerLower);

    if (!canEdit) {
      return NextResponse.json(
        { success: false, message: "Không có quyền sửa sản phẩm" },
        { status: 403 }
      );
    }

    const products = await readProducts();
    const index = products.findIndex((p: any) => p.id === id);

    if (index === -1)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    if (products[index].seller.toLowerCase() !== sellerLower)
      return NextResponse.json(
        { success: false, message: "Không được sửa sản phẩm người khác" },
        { status: 403 }
      );

    products[index] = {
      ...products[index],
      name,
      price,
      description,
      images,
      updatedAt: new Date().toISOString(),

      // ⭐ CẬP NHẬT SALE
      salePrice: salePrice ?? products[index].salePrice,
      saleStart: saleStart ?? products[index].saleStart,
      saleEnd: saleEnd ?? products[index].saleEnd,
    };

    await writeProducts(products);
    return NextResponse.json({ success: true, product: products[index] });
  } catch (err) {
    console.error("❌ PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Không thể cập nhật sản phẩm" },
      { status: 500 }
    );
  }
}

/** 🔹 DELETE - Xóa sản phẩm */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const body = await req.json();
    const seller = (body?.seller || "").toLowerCase();

    if (!id || !seller)
      return NextResponse.json(
        { success: false, message: "Thiếu ID hoặc seller" },
        { status: 400 }
      );

    const canDelete = await isSeller(seller);
    if (!canDelete)
      return NextResponse.json(
        { success: false, message: "Không có quyền xóa sản phẩm" },
        { status: 403 }
      );

    const products = await readProducts();
    const product = products.find((p: any) => p.id === id);
    if (!product)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    if (product.seller.toLowerCase() !== seller)
      return NextResponse.json(
        { success: false, message: "Không được xóa sản phẩm của người khác" },
        { status: 403 }
      );

    const updated = products.filter((p) => p.id !== id);
    await writeProducts(updated);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi khi xóa sản phẩm" },
      { status: 500 }
    );
  }
}

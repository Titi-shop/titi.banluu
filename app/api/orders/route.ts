import { NextResponse } from "next/server";
import { list, del, put } from "@vercel/blob";

const FILE_NAME = "orders.json";

// 🧩 Đọc tất cả đơn hàng
async function readOrders(): Promise<any[]> {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === FILE_NAME);
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("❌ Lỗi đọc orders:", err);
    return [];
  }
}

// 🧩 Ghi lại toàn bộ danh sách đơn
async function writeOrders(orders: any[]) {
  try {
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === FILE_NAME);
    if (old) {
      await del(FILE_NAME);
      await new Promise((r) => setTimeout(r, 1500)); // đợi xóa hoàn tất
    }

    await put(FILE_NAME, JSON.stringify(orders, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    console.log("✅ Đã ghi orders.json:", orders.length);
  } catch (err) {
    console.error("❌ Lỗi ghi orders:", err);
  }
}

// ----------------------------
// 🔹 GET: Lấy danh sách đơn
// ----------------------------
export async function GET() {
  const orders = await readOrders();
  return NextResponse.json(orders);
}

// ----------------------------
// 🔹 POST: Tạo đơn mới
// ----------------------------
export async function POST(req: Request) {
  try {
    const order = await req.json();
    const orders = await readOrders();

    const newOrder = {
      ...order,
      id: order.id ?? Date.now(),
      status: order.status ?? "Chờ xác nhận",
      createdAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    await writeOrders(orders);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("❌ POST /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ----------------------------
// 🔹 PUT: Cập nhật trạng thái
// ----------------------------
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    const orders = await readOrders();

    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    orders[index] = {
      ...orders[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    await writeOrders(orders);
    return NextResponse.json({ success: true, order: orders[index] });
  } catch (err) {
    console.error("❌ PUT /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

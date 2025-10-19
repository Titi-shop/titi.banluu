import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

const FILE_NAME = "orders.json";

// 🧩 Đọc danh sách đơn hàng từ Vercel Blob
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

// 🧩 Ghi danh sách đơn hàng lên Vercel Blob
async function writeOrders(orders: any[]) {
  try {
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

    orders.push(newOrder);
    await writeOrders(orders);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("❌ POST /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// ----------------------------
// 🔹 PUT: Cập nhật trạng thái đơn hàng
// ----------------------------
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    const orders = await readOrders();

    const index = orders.findIndex((o) => Number(o.id) === Number(id));
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

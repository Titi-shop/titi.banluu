import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

const BLOB_NAME = "orders.json";

// đọc đơn: lấy file từ Blob, nếu chưa có => []
async function readOrdersFromBlob(): Promise<any[]> {
  const { blobs } = await list({ prefix: BLOB_NAME });
  const file = blobs.find(b => b.pathname === BLOB_NAME);
  if (!file) return [];
  const res = await fetch(file.url, { cache: "no-store" });
  if (!res.ok) return [];
  return await res.json();
}

// ghi đơn: overwrite toàn bộ file JSON
async function saveOrdersToBlob(orders: any[]) {
  await put(BLOB_NAME, JSON.stringify(orders, null, 2), {
    access: "public",
    contentType: "application/json",
  });
}

// --- GET: Lấy tất cả đơn ---
export async function GET() {
  try {
    const orders = await readOrdersFromBlob();
    return NextResponse.json(orders);
  } catch (e) {
    console.error("GET orders error:", e);
    return NextResponse.json([], { status: 200 });
  }
}

// --- POST: Tạo đơn mới ---
export async function POST(req: Request) {
  try {
    const order = await req.json();
    const orders = await readOrdersFromBlob();

    orders.push({
      ...order,
      id: order.id ?? Date.now(),
      status: order.status ?? "Chờ xác nhận", // đảm bảo đúng chuỗi
    });

    await saveOrdersToBlob(orders);
    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// --- PUT: cập nhật trạng thái ---
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    let orders = await readOrdersFromBlob();
    let updated = false;

    orders = orders.map((o: any) => {
      if (o.id === id) {
        updated = true;
        return { ...o, status };
      }
      return o;
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    await saveOrdersToBlob(orders);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

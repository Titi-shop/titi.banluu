import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Thiếu thông tin cập nhật." }, { status: 400 });
    }

    // Lấy danh sách đơn hàng từ KV
    let orders: any[] = [];
    const stored = await kv.get("orders");

    if (stored) {
      try {
        orders = Array.isArray(stored) ? stored : JSON.parse(stored as string);
      } catch (e) {
        console.warn("⚠️ Không thể parse dữ liệu KV:", e);
      }
    }

    // Cập nhật đơn hàng theo id
    const updatedOrders = orders.map((o) =>
      String(o.id) === String(id) ? { ...o, status } : o
    );

    // Ghi lại dữ liệu vào KV
    await kv.set("orders", JSON.stringify(updatedOrders));

    console.log(`✅ Đơn ${id} cập nhật trạng thái: ${status}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi API PATCH:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "orders.json");

// Đọc danh sách đơn hàng
function readOrders() {
  try {
    if (!fs.existsSync(dataFile)) return [];
    const raw = fs.readFileSync(dataFile, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Lưu danh sách đơn hàng
function saveOrders(orders: any[]) {
  fs.writeFileSync(dataFile, JSON.stringify(orders, null, 2), "utf-8");
}

// GET: lấy toàn bộ đơn hàng
export async function GET() {
  const orders = readOrders();
  return NextResponse.json(orders);
}

// POST: tạo đơn hàng mới
export async function POST(req: Request) {
  try {
    const order = await req.json();
    const orders = readOrders();

    orders.push({
      ...order,
      id: order.id ?? Date.now(),
      status: order.status ?? "Chờ xác nhận",
    });

    saveOrders(orders);
    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Lỗi tạo đơn:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// PUT: cập nhật trạng thái đơn hàng
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    let orders = readOrders();
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

    saveOrders(orders);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lỗi cập nhật đơn:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

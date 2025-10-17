import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "orders.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("✅ [Pi COMPLETE] Giao dịch hoàn tất:", body);

    // Cập nhật trạng thái đơn hàng sang "Đã thanh toán"
    const orders = fs.existsSync(dataFile)
      ? JSON.parse(fs.readFileSync(dataFile, "utf-8"))
      : [];

    const updated = orders.map((o: any) =>
      o.id === body.metadata?.orderId
        ? { ...o, status: "Chờ xác nhận (Pi đã thanh toán)" }
        : o
    );

    fs.writeFileSync(dataFile, JSON.stringify(updated, null, 2));

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("❌ Lỗi complete:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

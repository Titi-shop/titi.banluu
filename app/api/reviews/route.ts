import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * ✅ API: /api/reviews
 * - Lưu và lấy danh sách đánh giá
 * - Khắc phục lỗi "[object Object]" & 500 Internal Server Error
 */

// 🟢 Lấy danh sách review
export async function GET() {
  try {
    const stored = await kv.get("reviews");

    // Nếu KV lưu object thay vì JSON string -> xử lý an toàn
    let reviews: any[] = [];
    if (stored) {
      if (typeof stored === "string") {
        reviews = JSON.parse(stored);
      } else if (Array.isArray(stored)) {
        reviews = stored;
      } else {
        // Trường hợp lỡ lưu object
        reviews = Object.values(stored);
      }
    }

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error("❌ Lỗi đọc reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi đọc dữ liệu" },
      { status: 500 }
    );
  }
}

// 🟢 Gửi đánh giá mới
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, rating, comment, username } = body;

    if (!orderId || !rating || !username) {
      return NextResponse.json(
        { success: false, error: "Thiếu orderId, rating hoặc username" },
        { status: 400 }
      );
    }

    // ✅ Đảm bảo đọc danh sách hiện có an toàn
    let reviews: any[] = [];
    const stored = await kv.get("reviews");

    if (stored) {
      if (typeof stored === "string") {
        reviews = JSON.parse(stored);
      } else if (Array.isArray(stored)) {
        reviews = stored;
      }
    }

    const newReview = {
      id: Date.now(),
      orderId,
      rating,
      comment: comment || "",
      username,
      createdAt: new Date().toISOString(),
    };

    // ✅ Lưu review mới
    reviews.unshift(newReview);
    await kv.set("reviews", JSON.stringify(reviews));

    // ✅ Cập nhật trạng thái reviewed trong orders
    try {
      const ordersRaw = await kv.get("orders");
      let orders: any[] = [];

      if (ordersRaw) {
        if (typeof ordersRaw === "string") orders = JSON.parse(ordersRaw);
        else if (Array.isArray(ordersRaw)) orders = ordersRaw;
      }

      const index = orders.findIndex((o) => String(o.id) === String(orderId));
      if (index !== -1) {
        orders[index].reviewed = true;
        orders[index].updatedAt = new Date().toISOString();
        await kv.set("orders", JSON.stringify(orders));
      }
    } catch (err) {
      console.warn("⚠️ Không thể cập nhật reviewed trong orders:", err);
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: any) {
    console.error("❌ Lỗi lưu review:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể lưu đánh giá" },
      { status: 500 }
    );
  }
}

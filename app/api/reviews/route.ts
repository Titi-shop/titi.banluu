import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const reviewFile = path.join(process.cwd(), "data", "reviews.json");

function readReviews() {
  if (!fs.existsSync(reviewFile)) return [];
  return JSON.parse(fs.readFileSync(reviewFile, "utf-8"));
}

function saveReviews(data: any[]) {
  fs.writeFileSync(reviewFile, JSON.stringify(data, null, 2), "utf-8");
}

// --- GET: Lấy tất cả đánh giá ---
export async function GET() {
  return NextResponse.json(readReviews());
}

// --- POST: Thêm đánh giá mới ---
export async function POST(req: Request) {
  try {
    const { orderId, rating, comment } = await req.json();
    const reviews = readReviews();
    reviews.push({
      id: Date.now(),
      orderId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });
    saveReviews(reviews);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lỗi POST review:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

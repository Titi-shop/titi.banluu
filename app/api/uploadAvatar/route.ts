import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { Redis } from "@upstash/redis";
import clientPromise from "@/lib/mongodb";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const username = formData.get("username") as string;

    if (!file || !username) {
      return NextResponse.json({ error: "Thiếu dữ liệu file hoặc username" }, { status: 400 });
    }

    // upload lên vercel blob
    const blob = await put(`avatars/${username}-${Date.now()}.jpg`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // lưu đường dẫn vào redis
    await redis.set(`avatar:${username}`, blob.url);

    // lưu vào mongodb
    const client = await clientPromise;
    const db = client.db("titi_users");
    await db.collection("avatars").updateOne(
      { username },
      { $set: { url: blob.url, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("❌ Upload avatar error:", error);
    return NextResponse.json({ error: "Lỗi upload ảnh" }, { status: 500 });
  }
}

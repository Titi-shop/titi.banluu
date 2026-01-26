// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const runtime = "nodejs"; // 🔥 BẮT BUỘC

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔥 server-only
);

export async function POST(req: Request) {
  try {
    // ✅ AUTH – seller / user
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "INVALID_FILE" },
        { status: 400 }
      );
    }

    // ✅ SAFE FILE EXT
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

    // ✅ PATH: products/<pi_uid>/<uuid>.<ext>
    const filePath = `products/${user.pi_uid}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      return NextResponse.json(
        { error: "UPLOAD_FAILED" },
        { status: 500 }
      );
    }

    // ✅ PUBLIC URL
    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: data.publicUrl, // 🔥 LINK ẢNH CHUẨN
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return NextResponse.json(
      { error: "UPLOAD_FAILED" },
      { status: 500 }
    );
  }
}

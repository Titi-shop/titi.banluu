import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =====================================================
   GET – LIST ADDRESSES
===================================================== */
export async function GET() {
  const user = await getUserFromBearer();
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("user_id", user.pi_uid)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, items: data ?? [] });
}

/* =====================================================
   POST – CREATE ADDRESS
===================================================== */
export async function POST(req: Request) {
  const user = await getUserFromBearer();
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null)
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });

  const {
    full_name,
    phone,
    country,
    province,
    district,
    ward,
    address_line,
    postal_code,
    label,
  } = body as {
    full_name?: unknown;
    phone?: unknown;
    country?: unknown;
    province?: unknown;
    district?: unknown;
    ward?: unknown;
    address_line?: unknown;
    postal_code?: unknown;
    label?: unknown;
  };

  if (
    typeof full_name !== "string" ||
    typeof phone !== "string" ||
    typeof country !== "string" ||
    typeof province !== "string" ||
    typeof address_line !== "string"
  ) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  /* Clear old default */
  await supabaseAdmin
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.pi_uid);

  const { data, error } = await supabaseAdmin
    .from("addresses")
    .insert({
      user_id: user.pi_uid,
      full_name: full_name.trim(),
      phone: phone.trim(),
      country: country.trim(),
      province: province.trim(),
      district:
        typeof district === "string" ? district.trim() : null,
      ward:
        typeof ward === "string" ? ward.trim() : null,
      address_line: address_line.trim(),
      postal_code:
        typeof postal_code === "string"
          ? postal_code.trim()
          : null,
      label:
        label === "office" || label === "other"
          ? label
          : "home",
      is_default: true,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, address: data });
}

/* =====================================================
   PUT – SET DEFAULT
===================================================== */
export async function PUT(req: Request) {
  const user = await getUserFromBearer();
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body)
  ) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }

  const { id } = body as { id?: unknown };

  if (typeof id !== "string")
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

  await supabaseAdmin
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.pi_uid);

  const { error } = await supabaseAdmin
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.pi_uid);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

/* =====================================================
   DELETE
===================================================== */
export async function DELETE(req: Request) {
  const user = await getUserFromBearer();
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id)
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.pi_uid);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

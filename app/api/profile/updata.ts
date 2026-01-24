import { validateEmail } from "@/utils/validateEmail";

if (body.email) {
  const check = validateEmail(body.email);
  if (!check.valid) {
    return NextResponse.json(
      { success: false, error: check.message },
      { status: 400 }
    );
  }
}

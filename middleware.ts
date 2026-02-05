import { NextRequest, NextResponse } from "next/server";

const PI_ONLY = process.env.PI_BROWSER_ONLY === "true";

// Heuristic UA check
function isPiBrowser(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  return /PiBrowser/i.test(ua);
}

export function middleware(req: NextRequest) {
  if (!PI_ONLY) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow Next internals & static
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap")
  ) {
    return NextResponse.next();
  }

  // Chỉ kiểm tra navigation từ browser
  const secFetchDest = req.headers.get("sec-fetch-dest") || "";
  const isDocument = secFetchDest === "document";

  // ❗️CHỈ chặn nếu KHÔNG phải Pi Browser
  if (isDocument && !isPiBrowser(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("reason", "pi_browser_required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/).*)"],
};

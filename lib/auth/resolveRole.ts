import { query } from "@/lib/db";
import type { Role } from "./role";
import type { SessionUser } from "./session";

/* =========================================================
   Resolve RBAC role
   - DB FIRST (source of truth)
   - ENV FALLBACK (Bootstrap only)
========================================================= */
export async function resolveRole(
  user: SessionUser | null
): Promise<Role> {
  if (!user?.pi_uid) return "guest";

  /* =====================================================
     1️⃣ DB FIRST
  ===================================================== */
  try {
    const { rows } = await query(
      `
      SELECT role
      FROM public.users
      WHERE pi_uid = $1
      LIMIT 1
      `,
      [user.pi_uid]
    );

    const role = rows?.[0]?.role;
    if (role === "seller" || role === "admin" || role === "customer") {
      return role;
    }

    if (rows?.length) {
      return "customer";
    }
  } catch {
    // ignore DB errors in bootstrap
  }

  /* =====================================================
     2️⃣ FALLBACK (BOOTSTRAP MODE)
  ===================================================== */
  const normalize = (v?: string | null) =>
    (v ?? "")
      .normalize("NFKC")
      .trim()
      .toLowerCase();

  const username = normalize(user.username);
  const wallet = normalize(user.wallet_address);

  const allowUsers =
    process.env.NEXT_PUBLIC_SELLER_PI_USERNAMES
      ?.split(",")
      .map(u => normalize(u)) ?? [];

  const allowWallets =
    process.env.NEXT_PUBLIC_SELLER_PI_WALLETS
      ?.split(",")
      .map(w => normalize(w)) ?? [];

  const isSellerByUsername =
    !!username && allowUsers.includes(username);

  const isSellerByWallet =
    !!wallet && allowWallets.includes(wallet);

  return isSellerByUsername || isSellerByWallet
    ? "seller"
    : "customer";
}

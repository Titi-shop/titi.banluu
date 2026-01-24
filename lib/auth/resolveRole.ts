import { query } from "@/lib/db";
import type { Role } from "./role";
import type { SessionUser } from "./session";

/**
 * Resolve RBAC role.
 * DB source of truth: public.users.role by pi_uid.
 * Fallback: env allowlists (keeps old behavior).
 */
export async function resolveRole(user: SessionUser | null): Promise<Role> {
  if (!user?.pi_uid) return "guest";

  // 1) DB FIRST
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

    const role = rows?.[0]?.role as string | undefined;
    if (role === "seller" || role === "customer" || role === "admin") return role as Role;
    if (rows?.length) return "customer";
  } catch {
    // ignore
  }

  // 2) FALLBACK (bootstrap)
  const allowUsers = process.env.NEXT_PUBLIC_SELLER_PI_USERNAMES?.split(",") ?? [];
  const allowWallets = process.env.NEXT_PUBLIC_SELLER_PI_WALLETS?.split(",") ?? [];

  const username = (user.username ?? "").trim().toLowerCase();
  const wallet = (user.wallet_address ?? "").trim().toUpperCase();

  const isSellerByUsername =
    !!username && allowUsers.map((u) => u.trim().toLowerCase()).includes(username);

  const isSellerByWallet =
    !!wallet && allowWallets.map((w) => w.trim().toUpperCase()).includes(wallet);

  return isSellerByUsername || isSellerByWallet ? "seller" : "customer";
}

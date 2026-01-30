export async function resolveRole(
  user: AuthUser | null
): Promise<Role> {
  if (!user?.pi_uid) return "guest";

  const normalize = (v?: string | null) =>
    (v ?? "").normalize("NFKC").trim().toLowerCase();

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

  const isSellerByEnv =
    (!!username && allowUsers.includes(username)) ||
    (!!wallet && allowWallets.includes(wallet));

  /* =====================================
     🔥 BOOTSTRAP OVERRIDE (ENV FIRST)
  ===================================== */
  if (isSellerByEnv) {
    return "seller";
  }

  /* =====================================
     DB FALLBACK
  ===================================== */
  try {
    const { rows } = await query(
      `
      select role
      from public.users
      where pi_uid = $1
      limit 1
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
    // ignore
  }

  return "customer";
}

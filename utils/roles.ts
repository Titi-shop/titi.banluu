export type Role = "seller" | "customer";

export function isSellerByEnv(
  user: { username?: string; wallet_address?: string } | null | undefined
): boolean {
  if (!user) return false;

  const allowUser = process.env.NEXT_PUBLIC_SELLER_PI_USERNAME;
  const allowWallet = process.env.NEXT_PUBLIC_SELLER_PI_WALLET;

  const okByUser = allowUser && user.username?.toLowerCase() === allowUser.toLowerCase();
  const okByWallet =
    allowWallet && user.wallet_address && user.wallet_address.toUpperCase() === allowWallet.toUpperCase();

  return Boolean(okByUser || okByWallet);
}

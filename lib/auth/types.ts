// lib/auth/types.ts
export type UserRole = "ADMIN" | "SELLER" | "CUSTOMER";

export interface AuthUser {
  piId: string;
  username: string;
  role: UserRole;
}

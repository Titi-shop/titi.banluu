// types/pi.ts
export interface PiUser {
  uid: string;
  username: string;
  roles?: Array<"buyer" | "seller" | "admin">;
}

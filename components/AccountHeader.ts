// components/AccountHeader.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { UserCircle } from "lucide-react";

export default function AccountHeader() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="bg-orange-500 text-white p-6 text-center shadow">
      <div className="w-24 h-24 bg-white rounded-full mx-auto text-orange-600 text-4xl overflow-hidden shadow flex items-center justify-center">
        <UserCircle size={40} />
      </div>

      <p className="mt-3 text-lg font-semibold">
        @{user.username}
      </p>

      <p className="text-xs opacity-90">
        {user.role === "seller"
          ? "Người bán"
          : user.role === "admin"
          ? "Quản trị"
          : "Khách hàng"}
      </p>
    </section>
  );
}

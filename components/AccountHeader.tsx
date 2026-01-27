"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import Image from "next/image";
import { UserCircle } from "lucide-react";

export default function AccountHeader() {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    apiFetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        const url =
          typeof data === "object" &&
          data !== null &&
          "profile" in data &&
          typeof (data as any).profile?.avatar === "string"
            ? (data as any).profile.avatar
            : null;

        setAvatar(url);
      })
      .catch(() => setAvatar(null));
  }, [user]);

  if (!user) return null;

  return (
    <section className="bg-orange-500 text-white p-6 text-center shadow">
      <div className="w-24 h-24 bg-white rounded-full mx-auto overflow-hidden shadow flex items-center justify-center">
        {avatar ? (
          <Image
            src={avatar}
            alt="Avatar"
            width={96}
            height={96}
            className="object-cover"
          />
        ) : (
          <UserCircle size={48} className="text-orange-500" />
        )}
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

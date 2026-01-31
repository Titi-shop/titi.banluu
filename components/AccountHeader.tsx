"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES (NO any)
========================= */
interface Profile {
  avatar: string | null;
}

/* =========================
   COMPONENT
========================= */
export default function AccountHeader() {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const res = await apiAuthFetch("/api/profile", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data: unknown = await res.json();

        if (
          typeof data === "object" &&
          data !== null &&
          "profile" in data
        ) {
          const profile = (data as { profile: Profile }).profile;
          setAvatar(
            typeof profile.avatar === "string"
              ? profile.avatar
              : null
          );
        }
      } catch (err) {
        console.error("Load profile failed:", err);
        setAvatar(null);
      }
    };

    loadProfile();
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

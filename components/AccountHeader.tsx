"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import Image from "next/image";
import { UserCircle } from "lucide-react";
import { useTranslationClient as useTranslation } 
  from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */

type ProfileApiResponse = {
  profile?: {
    avatar?: string;
  };
};

function isProfileApiResponse(
  value: unknown
): value is ProfileApiResponse {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;

  if (!("profile" in v)) return true;

  if (typeof v.profile === "object" && v.profile !== null) {
    const p = v.profile as Record<string, unknown>;
    return !("avatar" in p) || typeof p.avatar === "string";
  }

  return false;
}

/* =========================
   COMPONENT
========================= */

export default function AccountHeader() {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const t = useTranslation();

  useEffect(() => {
    if (!user) return;

    apiFetch("/api/profile")
      .then((res) => res.json())
      .then((data: unknown) => {
        if (!isProfileApiResponse(data)) {
          setAvatar(null);
          return;
        }
        setAvatar(data.profile?.avatar ?? null);
      })
      .catch(() => setAvatar(null));
  }, [user]);

  if (!user) return null;

  const roleLabel =
    user.role === "admin"
      ? t("admin")
      : user.role === "seller"
      ? t("seller")
      : t("buyer");

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
        {roleLabel}
      </p>
    </section>
  );
}

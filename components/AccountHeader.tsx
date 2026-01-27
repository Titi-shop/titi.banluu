"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import Image from "next/image";
import { UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";

/* =========================
   TYPES
========================= */

type ProfileApiResponse = {
  profile?: {
    avatar?: string;
  };
};

/* =========================
   RUNTIME GUARD
========================= */

function isProfileApiResponse(
  value: unknown
): value is ProfileApiResponse {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;

  if (!("profile" in v)) return true;

  if (
    typeof v.profile === "object" &&
    v.profile !== null
  ) {
    const p = v.profile as Record<string, unknown>;
    return (
      !("avatar" in p) ||
      typeof p.avatar === "string"
    );
  }

  return false;
}

/* =========================
   COMPONENT
========================= */

export default function AccountHeader() {
  const { user } = useAuth();
  const t = useTranslations();
  const [avatar, setAvatar] = useState<string | null>(null);

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
        {t(`role.${user.role}`)}
      </p>
    </section>
  );
}

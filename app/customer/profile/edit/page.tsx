"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { provincesByCountry } from "@/data/provinces";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES (NO any)
========================= */
interface ProfileInfo {
  display_name: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  country: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [info, setInfo] = useState<ProfileInfo>({
    display_name: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    country: "VN",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     LOAD PROFILE (PI BEARER)
  ========================= */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/account");
      return;
    }

    const loadProfile = async () => {
      try {
        const token = await getPiAccessToken();

        const res = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) throw new Error("UNAUTHORIZED");

        const raw: unknown = await res.json();
        const profile =
          typeof raw === "object" && raw !== null && "profile" in raw
            ? (raw as { profile: ProfileInfo }).profile
            : (raw as ProfileInfo);

        setInfo({
          display_name: profile.display_name ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          province: profile.province ?? "",
          country: profile.country ?? "VN",
        });
      } catch (err) {
        console.error("LOAD PROFILE ERROR", err);
        setError(t.profile_error_loading);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, user, router, t]);

  /* =========================
     SAVE PROFILE (PI BEARER)
  ========================= */
  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(info),
        cache: "no-store",
      });

      const data: unknown = await res.json();

      if (
        !res.ok ||
        typeof data !== "object" ||
        data === null ||
        !("success" in data)
      ) {
        throw new Error("SAVE_FAILED");
      }

      router.push("/customer/profile");
    } catch (err) {
      console.error("SAVE PROFILE ERROR", err);
      alert(t.save_failed || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const provinceList = provincesByCountry[info.country] || [];

  /* =========================
     UI STATES
  ========================= */
  if (loading || authLoading) {
    return <p className="text-center">{t.loading_profile}</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-32">
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600"
      >
        ←
      </button>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg mt-12 p-6 space-y-3">
        <input
          className="w-full border px-3 py-2 rounded"
          value={info.display_name}
          onChange={(e) =>
            setInfo({ ...info, display_name: e.target.value })
          }
          placeholder={t.app_name}
        />

        <input
          className="w-full border px-3 py-2 rounded"
          value={info.email}
          onChange={(e) => setInfo({ ...info, email: e.target.value })}
          placeholder={t.email}
        />

        <input
          className="w-full border px-3 py-2 rounded"
          value={info.phone}
          onChange={(e) => setInfo({ ...info, phone: e.target.value })}
          placeholder={t.phone}
          inputMode="tel"
        />

        <textarea
          className="w-full border px-3 py-2 rounded"
          value={info.address}
          onChange={(e) => setInfo({ ...info, address: e.target.value })}
          placeholder={t.address}
        />

        <select
          className="w-full border px-3 py-2 rounded"
          value={info.country}
          onChange={(e) =>
            setInfo({ ...info, country: e.target.value, province: "" })
          }
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>

        <select
          className="w-full border px-3 py-2 rounded"
          value={info.province}
          onChange={(e) =>
            setInfo({ ...info, province: e.target.value })
          }
        >
          <option value="">{t.select_option}</option>
          {provinceList.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full bg-green-500 text-white py-2 rounded"
        >
          {saving ? t.saving : t.save_changes}
        </button>
      </div>
    </main>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { countries } from "@/data/countries";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, Edit3, Save, X } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { getPiAccessToken, clearPiToken } from "@/lib/piAuth";

/* ================= TYPES ================= */

interface ProfileData {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;

  country: string;
  province: string | null;
  district: string | null;
  ward: string | null;
  address_line: string | null;
  postal_code: string | null;

  avatar_url: string | null;

  shop_name: string | null;
  shop_slug: string | null;
  shop_description: string | null;
  shop_banner: string | null;
}

const defaultProfile: ProfileData = {
  full_name: null,
  email: null,
  phone: null,
  bio: null,

  country: "VN",
  province: null,
  district: null,
  ward: null,
  address_line: null,
  postal_code: null,

  avatar_url: null,

  shop_name: null,
  shop_slug: null,
  shop_description: null,
  shop_banner: null,
};

type EditableKey =
  | "full_name"
  | "email"
  | "phone"
  | "bio"
  | "shop_banner"
  | "shop_name"
  | "shop_description"
  | "country"
  | "province"
  | "district"
  | "ward"
  | "address_line"
  | "postal_code";

const editableFields: EditableKey[] = [
  "full_name",
  "email",
  "phone",
  "bio",

  "shop_banner",
  "shop_name",
  "shop_description",

  "country",
  "province",
  "district",
  "ward",
  "address_line",
  "postal_code",
];

/* ================= COMPONENT ================= */

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [form, setForm] = useState<ProfileData>(defaultProfile);

  const [editMode, setEditMode] = useState(false);

  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ================= LOAD PROFILE ================= */

  useEffect(() => {
    if (authLoading || !user) return;

    const loadProfile = async () => {
      try {
        const token = await getPiAccessToken();

        let res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          clearPiToken();
          const newToken = await getPiAccessToken();

          res = await fetch("/api/profile", {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        }

        if (!res.ok) throw new Error();

        const raw = await res.json();

        const p = raw?.profile ?? {};

        const safe: ProfileData = {
          full_name: p.full_name ?? null,
          email: p.email ?? null,
          phone: p.phone ?? null,
          bio: p.bio ?? null,

          country: p.country ?? "VN",
          province: p.province ?? null,
          district: p.district ?? null,
          ward: p.ward ?? null,
          address_line: p.address_line ?? null,
          postal_code: p.postal_code ?? null,

          avatar_url: p.avatar_url ?? null,

          shop_name: p.shop_name ?? null,
          shop_slug: p.shop_slug ?? null,
          shop_description: p.shop_description ?? null,
          shop_banner: p.shop_banner ?? null,
        };

        setProfile(safe);
        setForm(safe);
      } catch {
        setError(t.profile_error_loading);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, user, t]);

  /* ================= AVATAR ================= */

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setPreview(url);
    setUploading(true);

    try {
      const token = await getPiAccessToken();

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setProfile((p) => ({ ...p, avatar_url: data.avatar }));
      setForm((p) => ({ ...p, avatar_url: data.avatar }));

      setSuccess(t.profile_avatar_updated);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError(t.upload_failed);
    } finally {
      URL.revokeObjectURL(url);
      setPreview(null);
      setUploading(false);
    }
  };

  /* ================= BANNER ================= */

  const handleBannerUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = await getPiAccessToken();

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploadShopBanner", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setProfile((p) => ({ ...p, shop_banner: data.banner }));
      setForm((p) => ({ ...p, shop_banner: data.banner }));
    } catch {
      setError("Upload failed");
    }
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    setSaving(true);

    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      setProfile(form);
      setEditMode(false);

      setSuccess(t.saved_successfully);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError(t.save_failed);
    } finally {
      setSaving(false);
    }
  };

  /* ================= RENDER ================= */

  if (loading || authLoading) {
    return <p className="p-4 text-center">{t.loading_profile}</p>;
  }

  const dialProfile =
    countries.find((c) => c.code === profile.country)?.dialCode ?? "";

  const dialForm =
    countries.find((c) => c.code === form.country)?.dialCode ?? "";

  return (
    <main className="min-h-screen bg-gray-100 pb-28">
      <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow p-6">

        {/* AVATAR */}
        <div className="relative w-28 h-28 mx-auto mb-4">

          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-orange-200 flex items-center justify-center text-4xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <Upload size={16} className="text-white" />
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </label>

        </div>

        <h2 className="text-center font-semibold mb-4">
          @{user?.username}
        </h2>

        {uploading && <p className="text-center text-sm">{t.uploading}</p>}
        {success && <p className="text-center text-green-600 text-sm">✓ {success}</p>}
        {error && <p className="text-center text-red-500 text-sm">{error}</p>}

        {/* INFO */}

        <div className="space-y-3 mt-4">

          {editableFields.map((key) => {

            if (key === "shop_banner") {
              return (
                <div key={key} className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">{t.profile_shop_banner}</span>

                  {editMode ? (
                    <label className="cursor-pointer text-orange-500 flex items-center gap-2">
                      <Upload size={14} />
                      {t.upload}

                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                      />
                    </label>
                  ) : (
                    <span className="text-xs text-gray-500 break-all">
                      {profile.shop_banner ?? t.profile_not_set}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div key={key} className="flex justify-between border-b pb-2">

                <span className="text-gray-500">
                  {t[`profile_${key}`]}
                </span>

                {editMode ? (

                  key === "country" ? (

                    <select
                      className="text-right"
                      value={form.country}
                      onChange={(e) =>
                        setForm({ ...form, country: e.target.value })
                      }
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>

                  ) : key === "phone" ? (

                    <div className="flex gap-2">
                      <span className="text-gray-400 text-sm">{dialForm}</span>

                      <input
                        className="text-right w-24"
                        value={form.phone ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>

                  ) : (

                    <input
                      className="text-right"
                      value={(form[key] as string) ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />

                  )

                ) : key === "phone" ? (

                  <span>
                    {profile.phone
                      ? `${dialProfile} ${profile.phone}`
                      : t.profile_not_set}
                  </span>

                ) : key === "country" ? (

                  <span>
                    {countries.find(
                      (c) => c.code === profile.country
                    )?.name ?? t.profile_not_set}
                  </span>

                ) : (

                  <span>
                    {(profile[key] as string) ?? t.profile_not_set}
                  </span>

                )}

              </div>
            );

          })}

        </div>

        {/* ACTION */}

        <div className="flex justify-center mt-6 gap-3">

          {editMode ? (

            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-orange flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? t.saving : t.save}
              </button>

              <button
                onClick={() => {
                  setForm(profile);
                  setEditMode(false);
                }}
                className="bg-gray-300 px-4 py-2 rounded flex items-center gap-2"
              >
                <X size={16} /> {t.cancel}
              </button>
            </>

          ) : (

            <button
              onClick={() => setEditMode(true)}
              className="btn-orange flex items-center gap-2"
            >
              <Edit3 size={16} /> {t.edit}
            </button>

          )}

        </div>

      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES
========================= */
interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  country: string;
  countryCode: string;
  is_default: boolean;
}

const emptyForm: Omit<Address, "id" | "is_default"> = {
  name: "",
  phone: "",
  address: "",
  country: "",
  countryCode: "",
};

/* =========================
   PAGE
========================= */
export default function CustomerAddressPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* =========================
     LOAD ADDRESSES
  ========================= */
  const loadAddresses = async () => {
    try {
      const token = await getPiAccessToken();
      const res = await fetch("/api/address", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setAddresses(data.items || []);
    } catch (err) {
      console.error("LOAD ADDRESS ERROR", err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  /* =========================
     CHANGE COUNTRY
  ========================= */
  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find((c) => c.code === e.target.value);
    if (!selected) return;

    setForm({
      ...form,
      country: selected.code,
      countryCode: selected.dial,
    });
  };

  /* =========================
     SAVE ADDRESS
  ========================= */
  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ " + t.fill_all_fields);
      return;
    }

    setSaving(true);
    try {
      const token = await getPiAccessToken();
      const res = await fetch("/api/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          country: form.country,
        }),
      });

      if (!res.ok) throw new Error("SAVE_FAILED");

      setShowForm(false);
      setForm(emptyForm);
      setMessage("✅ " + t.address_saved);
      await loadAddresses();
    } catch (err) {
      console.error("SAVE ADDRESS ERROR", err);
      setMessage("❌ Lưu địa chỉ thất bại");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     SET DEFAULT
  ========================= */
  const setDefault = async (id: string) => {
    try {
      const token = await getPiAccessToken();
      await fetch("/api/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      await loadAddresses();
    } catch (err) {
      console.error("SET DEFAULT ERROR", err);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-28">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 bg-white z-20 border-b">
        <div className="max-w-md mx-auto flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="text-orange-600 text-lg font-bold"
          >
            ←
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-800">
            {t.shipping_address}
          </h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-md mx-auto px-4 pt-20">
        {/* ADDRESS LIST */}
        <div className="space-y-4">
          {addresses.length === 0 && (
            <p className="text-center text-gray-400 mt-10">
              {t.no_address || "Chưa có địa chỉ"}
            </p>
          )}

          {addresses.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-xl p-4 shadow-sm border ${
                a.is_default ? "border-orange-500" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {a.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {a.countryCode} {a.phone}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {a.address}
                  </p>
                </div>

                {a.is_default && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    Mặc định
                  </span>
                )}
              </div>

              {!a.is_default && (
                <button
                  onClick={() => setDefault(a.id)}
                  className="mt-3 text-sm text-orange-600 font-medium"
                >
                  Đặt làm mặc định
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={() => setShowForm(true)}
          className="mt-6 w-full py-3 rounded-xl bg-white border-2 border-dashed border-orange-400 text-orange-600 font-semibold"
        >
          ➕ {t.add_address || "Thêm địa chỉ mới"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-500">
            {message}
          </p>
        )}
      </div>

      {/* OVERLAY */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setShowForm(false)}
        />
      )}

      {/* BOTTOM SHEET */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl
          transition-transform duration-300
          ${showForm ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ height: "70vh" }}
      >
        {/* DRAG HANDLE */}
        <div
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4"
          onClick={() => setShowForm(false)}
        />

        {/* FORM */}
        <div className="px-4 overflow-y-auto h-full pb-28">
          <div className="relative mb-4">
  <button
    onClick={() => setShowForm(false)}
    className="absolute left-0 top-0 text-orange-600 font-semibold"
  >
    ← {t.back}
  </button>

  <h2 className="text-lg font-semibold text-center">
    {t.add_address || "Thêm địa chỉ"}
  </h2>
</div>

          <label className="block text-sm font-medium mb-1">
            {t.country}
          </label>
          <select
            className="w-full border rounded-lg p-2 mb-3"
            value={form.country}
            onChange={handleCountryChange}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dial})
              </option>
            ))}
          </select>

          <input
            className="w-full border rounded-lg p-2 mb-3"
            placeholder={t.full_name}
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            className="w-full border rounded-lg p-2 mb-3"
            placeholder={t.phone_number}
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <textarea
            className="w-full border rounded-lg p-2 mb-4"
            rows={3}
            placeholder={t.address}
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </div>

        {/* SAVE BUTTON */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-orange-600 text-white font-semibold"
          >
            {saving ? t.saving : t.save_address}
          </button>
        </div>
      </div>
    </main>
  );
}

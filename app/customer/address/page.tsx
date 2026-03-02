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
  full_name: string;
  phone: string;
  country: string;
  province: string;
  address_line: string;
  is_default: boolean;
}

const emptyForm = {
  full_name: "",
  phone: "",
  country: "",
  province: "",
  address_line: "",
};

export default function CustomerAddressPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

   const getCountryDisplay = (code: string) => {
  const found = countries.find((c) => c.code === code);
  return found ? `${found.flag} ${found.name}` : code;
};

  /* =========================
     LOAD
  ========================= */
  const loadAddresses = async () => {
    const token = await getPiAccessToken();
if (!token) return;
    const res = await fetch("/api/address", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAddresses(data.items || []);
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  /* =========================
     HANDLERS
  ========================= */
  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find((c) => c.code === e.target.value);
    if (!selected) return;
    setForm({
      ...form,
      country: selected.code,
    });
  };

  const handleSave = async () => {
     if (
  !form.full_name ||
  !form.phone ||
  !form.country ||
  !form.province ||
  !form.address_line
){
      setMessage("⚠️ " + t.fill_all_fields);
      return;
    }

    setSaving(true);
    try {
      const token = await getPiAccessToken();
if (!token) return;
      await fetch("/api/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      setShowForm(false);
      setForm(emptyForm);
      await loadAddresses();
      setMessage("✅ " + t.address_saved);
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    const token = await getPiAccessToken();
if (!token) return;
    await fetch("/api/address", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    loadAddresses();
  };

  const deleteAddress = async (id: string) => {
    if (!confirm(t.confirm_delete || "Xoá địa chỉ này?")) return;

    const token = await getPiAccessToken();
if (!token) return;
    await fetch(`/api/address?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadAddresses();
  };

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-28">
      {/* HEADER */}
      <div className="fixed top-0 inset-x-0 bg-white border-b z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-orange-600 font-bold"
          >
            ←
          </button>
          <h1 className="flex-1 text-center font-semibold">
            {t.shipping_address}
          </h1>
        </div>
      </div>

      {/* LIST */}
      <div className="max-w-md mx-auto px-4 pt-20 space-y-4">
        {addresses.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl bg-white p-4 shadow border ${
              a.is_default ? "border-orange-500" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold"><p>{a.full_name}</p>
                <p className="text-sm text-gray-600">
                   {a.phone}
                </p>
                <p className="text-sm text-gray-500 mt-1">{a.address_line}</p>
                 <p className="text-sm text-gray-500">
  {getCountryDisplay(a.country)}
</p>
              </div>

              {a.is_default && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {t.default || "Mặc định"}
                </span>
              )}
            </div>

            <div className="flex gap-4 mt-3 text-sm">
              {!a.is_default && (
                <button
                  onClick={() => setDefault(a.id)}
                  className="text-orange-600 font-medium"
                >
                  ⭐ {t.set_default || "Đặt mặc định"}
                </button>
              )}

              <button
                onClick={() => deleteAddress(a.id)}
                className="text-red-500 font-medium"
              >
                {t.delete || "Xoá"}
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-orange-400 rounded-xl text-orange-600 font-semibold bg-white"
        >
           {t.add_address || "Thêm địa chỉ"}
        </button>

        {message && (
          <p className="text-center text-sm text-gray-500">{message}</p>
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
  placeholder="Province / City"
  value={form.province}
  onChange={(e) =>
    setForm({ ...form, province: e.target.value })
  }
/>

          <input
            className="w-full border rounded-lg p-2 mb-3"
            placeholder={t.full_name}
            value={form.full_name}
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
            value={form.address_line}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </div>

        {/* SAVE BUTTON */}
        <div className="absolute bottom-12 left-0 right-0 bg-white border-t p-4">
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
      

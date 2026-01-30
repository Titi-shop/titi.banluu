"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

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

export default function CustomerAddressPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* ================================
     LOAD ADDRESSES
  ================================= */
  useEffect(() => {
    const saved = localStorage.getItem("addresses");
    if (saved) {
      setAddresses(JSON.parse(saved));
    }
  }, []);

  /* ================================
     CHANGE COUNTRY
  ================================= */
  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = countries.find((c) => c.code === code);
    if (!selected) return;

    setForm({
      ...form,
      country: selected.code,
      countryCode: selected.dial,
    });
  };

  /* ================================
     SAVE ADDRESS
  ================================= */
  const handleSave = () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ " + t.fill_all_fields);
      return;
    }

    setSaving(true);

    const newAddress: Address = {
      id: crypto.randomUUID(),
      ...form,
      is_default: addresses.length === 0, // cái đầu tiên auto default
    };

    const updated = [...addresses, newAddress];
    setAddresses(updated);
    localStorage.setItem("addresses", JSON.stringify(updated));

    setForm(emptyForm);
    setShowForm(false);
    setMessage("✅ " + t.address_saved);
    setSaving(false);
  };

  /* ================================
     SET DEFAULT
  ================================= */
  const setDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      is_default: a.id === id,
    }));
    setAddresses(updated);
    localStorage.setItem("addresses", JSON.stringify(updated));
  };

  /* ================================
     UI
  ================================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto p-4 mt-12">
        <h1 className="text-2xl font-bold text-center text-orange-600 mb-4">
          📍 {t.shipping_address}
        </h1>

        {/* ADDRESS LIST */}
        <div className="space-y-3 mb-4">
          {addresses.length === 0 && (
            <p className="text-center text-gray-500">
              {t.no_address || "Chưa có địa chỉ"}
            </p>
          )}

          {addresses.map((a) => (
            <div
              key={a.id}
              className="bg-white p-4 rounded-lg shadow border"
            >
              <p className="font-semibold">
                👤 {a.name}{" "}
                {a.is_default && (
                  <span className="text-xs text-green-600">
                    (Mặc định)
                  </span>
                )}
              </p>
              <p>📞 {a.countryCode} {a.phone}</p>
              <p>🏠 {a.address}</p>

              {!a.is_default && (
                <button
                  onClick={() => setDefault(a.id)}
                  className="mt-2 text-sm text-orange-600 font-semibold"
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
          className="w-full py-3 border-2 border-dashed border-orange-500 rounded text-orange-600 font-semibold"
        >
          ➕ {t.add_address || "Thêm địa chỉ"}
        </button>

        {/* ADD FORM */}
        {showForm && (
          <div className="mt-4 bg-white p-4 rounded-xl shadow">
            {/* Country */}
            <label className="block mb-1 font-medium">🌍 {t.country}</label>
            <select
              className="border p-2 w-full rounded mb-3"
              value={form.country}
              onChange={handleCountryChange}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dial})
                </option>
              ))}
            </select>

            <label className="block mb-1 font-medium">👤 {t.full_name}</label>
            <input
              className="border p-2 w-full rounded mb-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <label className="block mb-1 font-medium">📞 {t.phone_number}</label>
            <input
              className="border p-2 w-full rounded mb-3"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <label className="block mb-1 font-medium">🏠 {t.address}</label>
            <textarea
              className="border p-2 w-full rounded mb-3"
              rows={3}
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-orange-600 text-white rounded font-semibold"
            >
              💾 {t.save_address}
            </button>
          </div>
        )}

        {message && (
          <p className="mt-3 text-center text-sm text-gray-600">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

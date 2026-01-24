"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface AddressForm {
  name: string;
  phone: string;
  address: string;
  country: string;
  countryCode: string;
}

export default function CustomerAddressPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [form, setForm] = useState<AddressForm>({
    name: "",
    phone: "",
    address: "",
    country: "",
    countryCode: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* ================================
     LOAD ADDRESS FROM LOCALSTORAGE
  ================================= */
  useEffect(() => {
    const saved = localStorage.getItem("shipping_info");

    if (saved) {
      const data = JSON.parse(saved);
      const countryData =
        countries.find((c) => c.code === data.country) || countries[0];

      setForm({
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        country: data.country || countryData.code,
        countryCode: countryData.dial,
      });
    } else {
      const first = countries[0];
      setForm({
        name: "",
        phone: "",
        address: "",
        country: first.code,
        countryCode: first.dial,
      });
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
     SAVE ADDRESS (NO AUTH)
  ================================= */
  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ " + t.fill_all_fields);
      return;
    }

    setSaving(true);

    localStorage.setItem("shipping_info", JSON.stringify(form));

    setMessage("✅ " + t.address_saved);

    setTimeout(() => {
      router.push("/checkout");
    }, 500);

    setSaving(false);
  };

  /* ================================
     UI
  ================================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-20 relative">
      <button
        onClick={() => router.back()}
        className="absolute top-3 left-3 text-orange-600 text-lg font-bold"
      >
        ←
      </button>

      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow mt-14">
        <h1 className="text-2xl font-bold text-center text-orange-600 mb-4">
          📍 {t.shipping_address}
        </h1>

        {/* Country */}
        <label className="block mb-2 font-medium">🌍 {t.country}</label>
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

        {/* Name */}
        <label className="block mb-2 font-medium">👤 {t.full_name}</label>
        <input
          className="border p-2 w-full rounded mb-3"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Phone */}
        <label className="block mb-2 font-medium">📞 {t.phone_number}</label>
        <div className="flex mb-3">
          <span className="px-3 py-2 bg-gray-100 border rounded-l">
            {form.countryCode}
          </span>
          <input
            type="tel"
            className="border p-2 w-full rounded-r"
            value={form.phone}
            placeholder={t.enter_phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {/* Address */}
        <label className="block mb-2 font-medium">🏠 {t.address}</label>
        <textarea
          className="border p-2 w-full rounded mb-4"
          rows={3}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded text-white font-semibold ${
            saving ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {saving ? t.saving : "💾 " + t.save_address}
        </button>

        {message && (
          <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </main>
  );
}

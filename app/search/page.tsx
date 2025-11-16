"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext"; // ✅ đường dẫn chuẩn

export default function SearchPage() {
  const { translate, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Khi đổi ngôn ngữ → làm mới kết quả hiển thị text
    if (results.length > 0) setResults([...results]);
  }, [language]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("❌", translate("search_error") || "Lỗi tìm kiếm:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">
        🔍 {translate("search_title") || "Tìm kiếm sản phẩm"}
      </h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={translate("search_placeholder") || "Nhập tên sản phẩm..."}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-blue-400"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg"
        >
          {loading ? translate("searching") || "Đang tìm..." : translate("search_button") || "Tìm"}
        </button>
      </div>

      {loading && <p>⏳ {translate("searching") || "Đang tìm kiếm..."}</p>}

      {results.length === 0 && !loading && (
        <p className="text-gray-500 text-center mt-4">
          {translate("no_results") || "Không tìm thấy sản phẩm nào."}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {results.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.id}`}
            className="border rounded-lg shadow hover:shadow-md p-3 transition"
          >
            <img
              src={item.images?.[0] || "/placeholder.png"}
              alt={item.name}
              className="rounded-md w-full h-36 object-cover"
            />
            <h3 className="font-semibold mt-2 text-gray-800 text-sm">{item.name}</h3>
            <p className="text-orange-500 font-medium text-sm">{item.price} Pi</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

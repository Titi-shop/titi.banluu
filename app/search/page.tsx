"use client";

import { useState } from "react";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">🔍 Tìm kiếm sản phẩm</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập tên sản phẩm..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-blue-400"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg"
        >
          Tìm
        </button>
      </div>

      {loading && <p>⏳ Đang tìm kiếm...</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

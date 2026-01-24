"use client";
import { useEffect, useState } from "react";

export default function PiPriceWidget() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/pi-price");
        const data = await res.json();
        if (data.price_usd) setPrice(data.price_usd);
      } catch (e) {
        console.error("Không thể lấy giá Pi:", e);
      }
    };

    fetchPrice(); // Lấy lần đầu
    const interval = setInterval(fetchPrice, 5 * 60 * 1000); // cập nhật mỗi 5 phút
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-3 right-3 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-md">
      💰 1 PI = {price ? `${price.toFixed(2)} USD` : "Đang tải..."}
    </div>
  );
}

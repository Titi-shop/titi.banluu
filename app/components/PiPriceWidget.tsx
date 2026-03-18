"use client";

import { useEffect, useState } from "react";

interface PiPriceData {
  price_usd: number;
  change_24h: number | null; // % tăng/giảm từ giá mở cửa
}

export default function PiPriceWidget() {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/pi-price", { cache: "no-store" });
        const data: PiPriceData = await res.json();

        if (data.price_usd !== undefined) {
          setPrevPrice(price); // lưu giá trước để so sánh
          setPrice(Number(data.price_usd));
        }

        if (data.change_24h !== undefined) {
          setChange(Number(data.change_24h));
        }
      } catch (e) {
        console.error("Không thể lấy giá Pi:", e);
      }
    };

    fetchPrice(); // fetch ngay khi mount
    const interval = setInterval(fetchPrice, 10 * 1000); // mỗi 10 giây

    return () => clearInterval(interval);
  }, [price]);

  // Xác định màu giá Pi dựa trên so sánh với giá trước đó
  let priceColor = "text-orange-500"; // mặc định cam
  if (prevPrice !== null && price !== null) {
    if (price > prevPrice) priceColor = "text-green-600";
    else if (price < prevPrice) priceColor = "text-red-600";
  }

  // Mũi tên tăng giảm dựa trên % thay đổi trong ngày
  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;

  return (
    <div className="w-full flex justify-center py-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">1 PI =</span>

        <span className={`text-lg font-bold ${priceColor}`}>
          {price !== null ? price.toFixed(6) : "..."}
        </span>

        <span className="text-gray-500">USD</span>

        {change !== null && (
          <span
            className={`text-xs font-semibold flex items-center gap-1
            ${isUp ? "text-green-600" : ""}
            ${isDown ? "text-red-600" : ""}
          `}
          >
            {isUp && "▲"}
            {isDown && "▼"}
            {change.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function PiPriceWidget() {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/pi-price", { cache: "no-store" });
        const data = await res.json();

        if (data.price_usd) {
          setPrice(Number(data.price_usd));
        }

        if (data.change_24h !== undefined) {
          setChange(Number(data.change_24h));
        }
      } catch (e) {
        console.error("Không thể lấy giá Pi:", e);
      }
    };

    fetchPrice();

    const interval = setInterval(fetchPrice, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;

  return (
    <div className="w-full flex justify-center py-1">
      <div className="flex items-center gap-2 text-sm">

        <span className="text-gray-500">
          1 PI =
        </span>

        <span className="text-lg font-bold text-orange-500">
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

"use client";
import { useEffect, useState } from "react";

export default function PiStatus() {
  const [status, setStatus] = useState("⏳ Đang tải Pi SDK...");

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).Pi) {
        setStatus("✅ Pi SDK đã load!");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <div className="text-center mt-4 font-medium text-gray-700">{status}</div>;
}

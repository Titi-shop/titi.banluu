"use client";

import { useEffect, useRef } from "react";

interface PiSDK {
  init(options: { version: string; sandbox: boolean }): void;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

export default function PiProvider() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tryInit = () => {
      if (!window.Pi) return;
      if (initializedRef.current) return;

      try {
        window.Pi.init({
          version: "2.0",
          sandbox: process.env.NEXT_PUBLIC_PI_ENV === "testnet",
        });
        initializedRef.current = true;
        console.log("✅ Pi SDK initialized");
      } catch (err) {
        console.error("❌ Pi init error:", err);
      }
    };

    tryInit();                    // thử ngay
    const timer = setInterval(tryInit, 300); // chờ Pi Browser inject

    return () => clearInterval(timer);
  }, []);

  return null;
}

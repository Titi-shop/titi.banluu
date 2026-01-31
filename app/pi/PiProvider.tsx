"use client";

import { useEffect, useRef } from "react";

interface PiSDK {
  init(options: { version: string; sandbox?: boolean }): void;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

export default function PiProvider() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.Pi) return;

    try {
      window.Pi.init({
        version: "2.0",
        sandbox: process.env.NEXT_PUBLIC_PI_ENV === "sandbox",
      });
      initializedRef.current = true;
      console.log("✅ Pi SDK initialized");
    } catch (err) {
      console.error("❌ Pi SDK init error:", err);
    }
  }, []);

  return null;
}

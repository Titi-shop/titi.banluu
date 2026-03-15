"use client";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date?: string;
}

export default function NotificationsPage() {
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = await getPiAccessToken();
        if (!token) throw new Error("NO_TOKEN");

        const res = await fetch("/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("INVALID_RESPONSE");
        }

        setNotifications(data);
      } catch (err) {
        console.error("❌ Load notifications error:", err);
        setError(t.fetch_error ?? "Load notifications error");
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  return (
    <main className="p-4 max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-purple-600 mb-4">
       🔔 {t.notifications ?? "Notifications"}
      </h1>

      {loading ? (
        <p> {t.loading ?? "Loading..."}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">
          {t.no_notifications ?? "No notifications"}
        </p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="border rounded-lg p-3 shadow-sm hover:bg-gray-50 transition"
            >
              <p className="font-semibold">{n.title}</p>
              <p className="text-gray-600 text-sm">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
  {n.date
    ? new Date(n.date).toLocaleString()
    : (t.unknown_time ?? "Unknown time")}
</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

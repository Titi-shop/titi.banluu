"use client";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const { t } = useTranslation(); // 🔹 Dùng hệ thống dịch thực

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`HTTP Error! Status: ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid JSON structure");
        }

        setNotifications(data);
      } catch (err) {
        console.error("❌ Lỗi tải thông báo:", err);
        setError(t.fetch_error || "Lỗi tải thông báo.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [t]);

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-600 mb-4">
        🔔 {t.notifications || "Thông báo của bạn"}
      </h1>

      {loading ? (
        <p>⏳ {t.loading || "Đang tải..."}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">{t.no_notifications || "Không có thông báo mới."}</p>
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
                {new Date(n.date).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

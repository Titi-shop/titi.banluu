"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { translate } = useLanguage();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("❌ Lỗi tải thông báo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-600 mb-4">
        🔔 {translate("notifications") || "Thông báo của bạn"}
      </h1>

      {loading ? (
        <p>⏳ {translate("loading") || "Đang tải..."}</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">
          {translate("no_notifications") || "Không có thông báo mới."}
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
                {new Date(n.date).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface Profile {
  address: string;
  phone: string;
}

export default function AccountPage() {
  const { user, login, logout } = useAuth();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Khi user đăng nhập, fetch thông tin profile nếu đã lưu
  useEffect(() => {
    if (!user) return;

    // Gọi API lấy profile
    fetch(`/api/profile?user=${user.username}`)
      .then((res) => res.json())
      .then((data: Profile | null) => {
        if (data) {
          setAddress(data.address);
          setPhone(data.phone);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi lấy profile:", err);
      })
      .finally(() => {
        setProfileLoaded(true);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập trước!");
      return;
    }
    const body = {
      username: user.username,
      address,
      phone,
    };
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        alert("Lưu thông tin thành công!");
      } else {
        alert("Lỗi khi lưu thông tin!");
      }
    } catch (err) {
      console.error("Lỗi khi gửi profile:", err);
      alert("Lỗi khi lưu thông tin!");
    }
  };

  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4"></h1>

      {user ? (
        <>
          <p className="text-lg mb-2">
            👤, <b>{user.username}</b>
          </p>
          <p className="text-gray-600 mb-4">
            Ví Pi: {user.wallet_address || "Chưa liên kết"}
          </p>

          <div className="w-full max-w-md border p-4 rounded bg-gray-50 mb-4">
            <h2 className="text-lg font-semibold mb-3">Thông tin giao hàng</h2>

            <label className="block mb-1">Địa chỉ</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
              placeholder="Số nhà, tên đường, quận, thành phố"
            />

            <label className="block mb-1">Số điện thoại</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
              placeholder="0123456789"
            />

            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
            >
              Lưu thông tin
            </button>
          </div>

          {/* Nếu profile đã load và có dữ liệu, hiển thị thông tin */}
          {profileLoaded && (address || phone) && (
            <div className="w-full max-w-md p-4 border rounded bg-white">
              <h3 className="font-semibold mb-2">Thông tin hiện tại:</h3>
              <p>Địa chỉ: {address}</p>
              <p>Số điện thoại: {phone}</p>
            </div>
          )}

          <button
            onClick={logout}
            className="bg-red-500 text-white px-6 py-2 rounded mt-6 hover:bg-red-600"
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <button
          onClick={login}
          className="bg-yellow-500 text-white px-6 py-3 rounded hover:bg-yellow-600"
        >
          🔐 Đăng nhập
        </button>
      )}
    </main>
  );
}

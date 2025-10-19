"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedUser = localStorage.getItem("pi_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const user = parsed?.user?.username || "guest";
        setUsername(user);

        // ✅ Nếu là tài khoản admin (nguyenminhduc1991111)
        if (user === "nguyenminhduc1991111") {
          setIsSeller(true);
        }
      } catch (err) {
        console.error("Lỗi đọc user:", err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
    localStorage.removeItem("titi_role");
    localStorage.removeItem("titi_username");
    router.push("/pilogin");
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-purple-600 text-white shadow-md">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-lg hover:text-yellow-300">
          TiTi Shop
        </Link>

        {/* ✅ Nút "Đăng hàng" chỉ hiện khi là nguyenminhduc1991111 */}
        {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-3 py-1 rounded-lg"
          >
            🔘 Đăng hàng
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/customer"
          className={`hover:text-yellow-300 ${
            pathname.startsWith("/customer") ? "underline" : ""
          }`}
        >
          Khách hàng
        </Link>

        <Link
          href="/account"
          className={`hover:text-yellow-300 ${
            pathname.startsWith("/account") ? "underline" : ""
          }`}
        >
          Tài khoản
        </Link>

        {username ? (
          <>
            <span className="text-sm text-gray-200">
              👋 Xin chào, <b>{username}</b>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <Link
            href="/pilogin"
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
}

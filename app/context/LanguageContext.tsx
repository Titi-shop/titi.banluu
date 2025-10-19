"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "vi" | "en" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ✅ Sửa phần này — không ép kiểu Record phức tạp để tránh lỗi build
const translations = {
  vi: {
    home: "Trang chủ",
    category: "Danh mục",
    search: "Tìm kiếm",
    notifications: "Thông báo",
    account: "Tài khoản",
    select_language: "Chọn ngôn ngữ",
    seller_dashboard: "Khu vực Quản lý Người Bán - TiTi Shop",
    post_product: "Đăng sản phẩm",
    manage_stock: "Quản lý kho hàng",
    process_orders: "Xử lý đơn hàng",
    update_status: "Cập nhật trạng thái",
    delivery: "Giao hàng",
    my_orders: "Đơn mua của bạn",
    current_language: "Ngôn ngữ hiện tại",
  },
  en: {
    home: "Home",
    category: "Category",
    search: "Search",
    notifications: "Notifications",
    account: "Account",
    select_language: "Select Language",
    seller_dashboard: "Seller Management - TiTi Shop",
    post_product: "Post Product",
    manage_stock: "Stock Management",
    process_orders: "Process Orders",
    update_status: "Update Status",
    delivery: "Delivery",
    my_orders: "Your Orders",
    current_language: "Current language",
  },
  zh: {
    home: "主页",
    category: "分类",
    search: "搜索",
    notifications: "通知",
    account: "账户",
    select_language: "选择语言",
    seller_dashboard: "卖家管理区域 - TiTi 商店",
    post_product: "发布商品",
    manage_stock: "库存管理",
    process_orders: "处理订单",
    update_status: "更新状态",
    delivery: "发货",
    my_orders: "您的订单",
    current_language: "当前语言",
  },
} as const; // 👈 Dùng “as const” để lock giá trị và không lỗi khi build

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language | null;
    if (saved) setLanguage(saved);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const translate = (key: string): string => {
    return translations[language][key as keyof typeof translations["vi"]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

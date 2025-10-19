"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ thêm import router để điều hướng

type Language = "vi" | "en" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
  goToShop: () => void;
  goToCustomer: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ✅ Toàn bộ bản dịch mở rộng, tương thích trang Shop / Customer / Seller
const translations = {
  vi: {
    // ---- NAVIGATION ----
    home: "Trang chủ",
    category: "Danh mục",
    search: "Tìm kiếm",
    notifications: "Thông báo",
    account: "Tài khoản",
    select_language: "Chọn ngôn ngữ",
    current_language: "Ngôn ngữ hiện tại",

    // ---- SELLER ----
    seller_dashboard: "Khu vực Quản lý Người Bán - TiTi Shop",
    post_product: "Đăng sản phẩm",
    manage_stock: "Quản lý kho hàng",
    process_orders: "Xử lý đơn hàng",
    update_status: "Cập nhật trạng thái",
    delivery: "Giao hàng",

    // ---- CUSTOMER ----
    my_orders: "Đơn mua của bạn",
    waiting_confirm: "Chờ xác nhận",
    waiting_pickup: "Chờ lấy hàng",
    delivering: "Đang giao",
    review: "Đánh giá",
    wallet_label: "Ví của bạn",
    logout: "Đăng xuất",
    customer_title: "Thành viên TiTi Shop",

    // ---- SHOP ----
    shop_title: "Danh mục sản phẩm",
    product_price: "Giá",
    product_list: "Danh sách sản phẩm",
  },

  en: {
    // ---- NAVIGATION ----
    home: "Home",
    category: "Category",
    search: "Search",
    notifications: "Notifications",
    account: "Account",
    select_language: "Select Language",
    current_language: "Current language",

    // ---- SELLER ----
    seller_dashboard: "Seller Management - TiTi Shop",
    post_product: "Post Product",
    manage_stock: "Stock Management",
    process_orders: "Process Orders",
    update_status: "Update Status",
    delivery: "Delivery",

    // ---- CUSTOMER ----
    my_orders: "Your Orders",
    waiting_confirm: "Waiting for confirmation",
    waiting_pickup: "Waiting for pickup",
    delivering: "Delivering",
    review: "Review",
    wallet_label: "Your wallet",
    logout: "Logout",
    customer_title: "TiTi Shop Member",

    // ---- SHOP ----
    shop_title: "Product Categories",
    product_price: "Price",
    product_list: "Product List",
  },

  zh: {
    // ---- NAVIGATION ----
    home: "主页",
    category: "分类",
    search: "搜索",
    notifications: "通知",
    account: "账户",
    select_language: "选择语言",
    current_language: "当前语言",

    // ---- SELLER ----
    seller_dashboard: "卖家管理区域 - TiTi 商店",
    post_product: "发布商品",
    manage_stock: "库存管理",
    process_orders: "处理订单",
    update_status: "更新状态",
    delivery: "发货",

    // ---- CUSTOMER ----
    my_orders: "您的订单",
    waiting_confirm: "等待确认",
    waiting_pickup: "等待取货",
    delivering: "配送中",
    review: "评价",
    wallet_label: "您的钱包",
    logout: "退出登录",
    customer_title: "TiTi 商店会员",

    // ---- SHOP ----
    shop_title: "商品分类",
    product_price: "价格",
    product_list: "产品列表",
  },
} as const;

// ✅ Context Provider
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");
  const router = useRouter(); // ✅ dùng router điều hướng

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language | null;
    if (saved) setLanguage(saved);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  // ✅ Hai hàm điều hướng nhanh
  const goToShop = () => router.push("/shop");
  const goToCustomer = () => router.push("/customer");

  const translate = (key: string): string => {
    return translations[language][key as keyof typeof translations["vi"]] || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: changeLanguage, translate, goToShop, goToCustomer }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ✅ Custom hook
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

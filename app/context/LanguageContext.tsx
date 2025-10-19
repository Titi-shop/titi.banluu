"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

type Language = "vi" | "en" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
  goToShop: () => void;
  goToCustomer: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ✅ Bộ dịch đa ngôn ngữ mở rộng cho toàn hệ thống TiTi Shop
const translations: Record<Language, Record<string, string>> = {
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
    order_code: "Mã đơn",
    buyer: "Người mua",
    total: "Tổng tiền",
    created_at: "Ngày tạo",
    confirm_done: "Xác nhận hoàn tất đơn này?",
    order_completed: "✅ Đơn hàng đã được đánh dấu hoàn tất!",
    update_error: "Có lỗi xảy ra khi cập nhật đơn hàng.",
    mark_done: "Hoàn tất đơn",


    // ---- CUSTOMER ----
    my_orders: "Đơn mua của bạn",
    waiting_confirm: "Chờ xác nhận",
    waiting_pickup: "Chờ lấy hàng",
    delivering: "Đang giao",
    review: "Đánh giá",
    wallet_label: "Ví của bạn",
    logout: "Đăng xuất",
    customer_title: "Thành viên TiTi Shop",
    loading_orders: "Đang tải đơn hàng...",
    no_orders: "Không có đơn hàng nào.",
    status: "Trạng thái",

    // ---- SHOP ----
    shop_title: "Danh mục sản phẩm",
    product_price: "Giá",
    product_list: "Danh sách sản phẩm",

    // ---- COMMON ----
    loading: "Đang tải sản phẩm...",
    no_products: "Chưa có sản phẩm nào.",
    no_image: "Không có ảnh",

    // ---- SHIPPING ----
    shipping_orders_title: "Đơn hàng đang giao",
    no_shipping_orders: "Bạn chưa có đơn hàng nào đang giao.",
    confirm_received: "Xác nhận rằng bạn đã nhận được hàng?",
    confirm_received_button: "Tôi đã nhận hàng",
    thanks_confirm: "✅ Cảm ơn bạn! Đơn hàng đã được xác nhận hoàn tất.",
    error_confirm: "Có lỗi xảy ra khi xác nhận đơn hàng.",
    completed_status: "Hoàn tất",
    seller_label: "Người bán",
    created_at: "Ngày tạo",
    products_label: "Sản phẩm",
    unknown: "Không xác định",

    // ---- SEARCH ----
    search_title: "Tìm kiếm sản phẩm",
    search_placeholder: "Nhập tên sản phẩm...",
    search_button: "Tìm",
    searching: "Đang tìm kiếm...",
    no_results: "Không tìm thấy sản phẩm nào.",
    search_error: "Lỗi khi tìm kiếm sản phẩm.",

    // ---- REVIEW ----
    review_title: "Đánh giá đơn hàng",
    no_review_orders: "Không có đơn hàng nào cần đánh giá.",
    review_button: "✍️ Đánh giá đơn này",
    review_thanks: "✅ Đã gửi đánh giá!",
    review_error: "Không thể gửi đánh giá.",
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
    order_code: "Order Code",
    buyer: "Buyer",
    total: "Total",
    created_at: "Created At",
    confirm_done: "Confirm to mark this order as completed?",
    order_completed: "✅ Order has been marked as completed!",
    update_error: "An error occurred while updating the order.",
    mark_done: "Mark as Completed",


    // ---- CUSTOMER ----
    my_orders: "Your Orders",
    waiting_confirm: "Waiting for confirmation",
    waiting_pickup: "Waiting for pickup",
    delivering: "Delivering",
    review: "Review",
    wallet_label: "Your wallet",
    logout: "Logout",
    customer_title: "TiTi Shop Member",
    loading_orders: "Loading orders...",
    no_orders: "No orders found.",
    status: "Status",

    // ---- SHOP ----
    shop_title: "Product Categories",
    product_price: "Price",
    product_list: "Product List",

    // ---- COMMON ----
    loading: "Loading products...",
    no_products: "No products available.",
    no_image: "No image",

    // ---- SHIPPING ----
    shipping_orders_title: "Orders in Delivery",
    no_shipping_orders: "You have no orders currently being delivered.",
    confirm_received: "Confirm that you have received the order?",
    confirm_received_button: "I have received the order",
    thanks_confirm: "✅ Thank you! Your order has been marked as completed.",
    error_confirm: "An error occurred while confirming the order.",
    completed_status: "Completed",
    seller_label: "Seller",
    created_at: "Created at",
    products_label: "Products",
    unknown: "Unknown",

    // ---- SEARCH ----
    search_title: "Search Products",
    search_placeholder: "Enter product name...",
    search_button: "Search",
    searching: "Searching...",
    no_results: "No products found.",
    search_error: "Error while searching products.",

    // ---- REVIEW ----
    review_title: "Order Reviews",
    no_review_orders: "No orders pending review.",
    review_button: "✍️ Review this order",
    review_thanks: "✅ Review submitted!",
    review_error: "Failed to submit review.",
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
    order_code: "订单编号",
    buyer: "买家",
    total: "总金额",
    created_at: "创建时间",
    confirm_done: "确认完成此订单？",
    order_completed: "✅ 订单已标记为完成！",
    update_error: "更新订单时发生错误。",
    mark_done: "完成订单",


    // ---- CUSTOMER ----
    my_orders: "您的订单",
    waiting_confirm: "等待确认",
    waiting_pickup: "等待取货",
    delivering: "配送中",
    review: "评价",
    wallet_label: "您的钱包",
    logout: "退出登录",
    customer_title: "TiTi 商店会员",
    loading_orders: "正在加载订单...",
    no_orders: "暂无订单。",
    status: "状态",

    // ---- SHOP ----
    shop_title: "商品分类",
    product_price: "价格",
    product_list: "产品列表",

    // ---- COMMON ----
    loading: "正在加载商品...",
    no_products: "暂无商品。",
    no_image: "没有图片",

    // ---- SHIPPING ----
    shipping_orders_title: "配送中的订单",
    no_shipping_orders: "您暂无正在配送的订单。",
    confirm_received: "确认您已收到货物？",
    confirm_received_button: "我已收货",
    thanks_confirm: "✅ 感谢您！订单已确认完成。",
    error_confirm: "确认订单时发生错误。",
    completed_status: "已完成",
    seller_label: "卖家",
    created_at: "创建时间",
    products_label: "商品",
    unknown: "未知",

    // ---- SEARCH ----
    search_title: "搜索商品",
    search_placeholder: "输入商品名称...",
    search_button: "搜索",
    searching: "正在搜索...",
    no_results: "未找到任何商品。",
    search_error: "搜索商品时出错。",

    // ---- REVIEW ----
    review_title: "订单评价",
    no_review_orders: "没有待评价的订单。",
    review_button: "✍️ 评价此订单",
    review_thanks: "✅ 已提交评价！",
    review_error: "提交评价失败。",
  },
};

// ✅ Provider chính
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lang") as Language | null;
      if (saved) setLanguage(saved);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lang);
    }
    router.refresh?.();
  };

  const goToShop = () => router.push("/shop");
  const goToCustomer = () => router.push("/customer");

  const translate = (key: string): string => {
    const dict = translations[language];
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: changeLanguage, translate, goToShop, goToCustomer }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ✅ Hook tiện dụng
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

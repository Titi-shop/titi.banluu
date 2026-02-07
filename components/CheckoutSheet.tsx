"use client";

import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutSheet({ open, onClose }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* SHEET */}
      <div
        className="
          absolute bottom-0 left-0 right-0
          bg-white rounded-t-2xl
          h-[80vh]
          flex flex-col
        "
      >
        {/* HANDLE */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-3" />

        {/* HEADER */}
        <div className="px-4 pb-2 border-b">
          <h3 className="font-semibold text-base">
            Thanh toán
          </h3>
          <p className="text-xs text-gray-500">
            Hiển thị địa chỉ – sản phẩm – số lượng – nút Pay
          </p>
        </div>

        {/* CONTENT (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* ĐỊA CHỈ (placeholder) */}
          <div className="border rounded-lg p-3">
            <p className="font-medium">Heo meo</p>
            <p className="text-sm text-gray-600">0981716731</p>
            <p className="text-sm text-gray-500">
              Đức Hòa, Long An
            </p>
          </div>

          {/* SẢN PHẨM (placeholder) */}
          <div className="flex gap-3 items-center border-b pb-3">
            <img
              src="/placeholder.png"
              className="w-16 h-16 rounded object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Kính 3D
              </p>
              <p className="text-xs text-gray-500">
                Số lượng: 1
              </p>
            </div>
            <p className="font-semibold text-orange-600">
              23 π
            </p>
          </div>

          {/* NÚT PAY */}
          <button className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold">
            Pay Now
          </button>

          <p className="text-center text-xs text-gray-500">
            🔒 An tâm mua sắm tại TiTi
          </p>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 border rounded-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

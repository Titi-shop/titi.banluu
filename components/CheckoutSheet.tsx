"use client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutSheet({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40">
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4">
        <div className="w-12 h-1 bg-gray-300 rounded mx-auto mb-3" />

        <h3 className="font-semibold mb-2">Thanh toán</h3>

        <p className="text-sm text-gray-500">
          Hiển thị địa chỉ – sản phẩm – số lượng – nút Pay
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 border rounded"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

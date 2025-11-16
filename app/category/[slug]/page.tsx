// app/category/[slug]/page.tsx

import Image from "next/image";

// 🧩 Kiểu dữ liệu sản phẩm
interface Product {
  id: number;
  name: string;
  price: number;
  thumbnail: string;
}

// 🧩 Props từ dynamic route
interface Props {
  params: {
    slug: string;
  };
}

// 🧩 Hàm tạo Metadata SEO
export async function generateMetadata({ params }: Props) {
  const categoryName = params.slug.replace(/-/g, " ");

  return {
    title: `${categoryName} | TiTi Mall`,
    description: `Khám phá các sản phẩm thuộc danh mục ${categoryName} tại TiTi Mall.`,
  };
}

// 🧩 Hàm lấy danh sách sản phẩm từ API
async function getProducts(slug: string) {
  try {
    const res = await fetch(
      `https://api.titimall.vn/products?category=${slug}`,
      {
        next: { revalidate: 60 }, // 🕒 Cache 1 phút
      }
    );

    if (!res.ok) return [];

    return (await res.json()) as Product[];
  } catch (err) {
    console.error("❌ Lỗi fetch API:", err);
    return [];
  }
}

// 🧩 Trang chính
export default async function CategoryPage({ params }: Props) {
  const { slug } = params;
  const categoryName = slug.replace(/-/g, " ");

  const products = await getProducts(slug);

  return (
    <div className="px-6 py-8">
      <button
        onClick={() => history.back()}
        className="text-orange-600 font-semibold mb-4"
      >
        ← Quay lại
      </button>

      <h1 className="text-2xl font-semibold capitalize mb-6">
        {categoryName}
      </h1>

      {/* Nếu rỗng */}
      {products.length === 0 ? (
        <p className="text-gray-500">Hiện chưa có sản phẩm trong danh mục này.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="border rounded-2xl shadow-sm hover:shadow-md transition p-3 bg-white"
            >
              <Image
                src={item.thumbnail || "/placeholder.png"}
                alt={item.name}
                width={300}
                height={300}
                className="w-full h-auto rounded-lg object-cover"
              />

              <h2 className="mt-2 text-sm font-medium line-clamp-2">{item.name}</h2>

              <p className="text-red-600 font-semibold mt-1">
                {item.price.toLocaleString("vi-VN")} ₫
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

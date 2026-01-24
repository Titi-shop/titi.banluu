"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

// Định nghĩa kiểu Banner, bỏ any
interface Banner {
  id: number | string;
  image: string;
  title?: string;
  link?: string;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/banners");
        if (!res.ok) throw new Error("Không thể tải dữ liệu banner");

        const data = await res.json();
        setBanners(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error("❌ Lỗi tải banner:", err);
        const message =
          err instanceof Error ? err.message : "Lỗi không xác định";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // ❌ KHÔNG render gì khi đang loading / lỗi / không có banner
  // → Không tạo khoảng trống
  if (loading || error || banners.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-xl shadow-md bg-white">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop
        className="h-48 md:h-60 relative"
      >
        {banners.map((b) => {
          const imageSrc = b.image.startsWith("/") ? b.image : `/${b.image}`;

          return (
            <SwiperSlide key={b.id}>
              <a
                href={b.link || "#"}
                className="relative block h-full"
              >
                <img
                  src={imageSrc}
                  alt={b.title || `Banner ${b.id}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {b.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 text-sm md:text-base font-medium">
                    {b.title}
                  </div>
                )}
              </a>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

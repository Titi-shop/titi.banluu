"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function BannerCarousel() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/banners")
  .then((res) => res.ok ? res.json() : Promise.resolve([]))
  .then((data) => setBanners(Array.isArray(data) ? data : []))
  .catch((err) => {
    console.error("❌ Lỗi tải banner:", err);
    setBanners([]);
  })
  .finally(() => setLoading(false));

  }, []);

  if (loading)
    return <p className="text-center py-10 text-gray-400">⏳ Đang tải banner...</p>;
  if (error)
    return <p className="text-center py-10 text-red-500">⚠️ Lỗi tải banner: {error}</p>;
  if (banners.length === 0)
    return <p className="text-center py-10 text-gray-400">🚫 Không có banner để hiển thị.</p>;

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
              <a href={b.link} className="relative block h-full">
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

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCountUp } from "../../../hooks/useCountUp";
import { listPublicTournaments } from "../../../api/publicTournamentApi";
import { listPublicBranches } from "../../../api/publicBranchApi";

/** Một ô số liệu ở dải dưới hero — đếm tăng khi cuộn tới. */
const HeroStat = ({ label, value, index }) => {
  const { ref, value: current } = useCountUp(value);

  return (
    <div
      ref={ref}
      className="hm-rise flex flex-col gap-1"
      style={{ "--i": index + 4 }}
    >
      <span className="text-[26px] font-black leading-none text-white md:text-[34px]">
        {current.toLocaleString("vi-VN")}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
        {label}
      </span>
    </div>
  );
};

/**
 * Bốn chỉ số thật lấy từ API public.
 *
 * Mỗi chỉ số chỉ cần `totalElements` nên gọi với size=1 — BE trả đúng một bản
 * ghi, phần đếm nằm ở metadata phân trang. `allSettled` để một endpoint lỗi
 * không xoá cả dải; ô nào hỏng thì bị bỏ qua.
 *
 * Không có endpoint public nào tổng hợp số tay cơ / số trận trên toàn hệ thống
 * (participants và matches đều theo từng giải, analytics thì owner/manager-only),
 * nên dải này dùng bốn chỉ số đếm được thật thay vì hai chỉ số bịa.
 */
function useHeroStats() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    let alive = true;

    const countOf = (promise) => promise.then((paged) => paged.totalElements);

    Promise.allSettled([
      countOf(listPublicTournaments({ page: 0, size: 1 })),
      countOf(listPublicTournaments({ page: 0, size: 1, status: "IN_PROGRESS" })),
      countOf(listPublicTournaments({ page: 0, size: 1, status: "COMPLETED" })),
      countOf(listPublicBranches({ page: 0, size: 1 })),
    ]).then((results) => {
      if (!alive) return;
      const labels = ["Giải đấu", "Đang diễn ra", "Đã hoàn thành", "Chi nhánh"];
      const real = results
        .map((result, index) =>
          result.status === "fulfilled" && Number.isFinite(result.value)
            ? { label: labels[index], value: result.value }
            : null
        )
        .filter(Boolean);
      setStats(real);
    });

    return () => {
      alive = false;
    };
  }, []);

  return stats;
}

const Banner = () => {
  const imageRef = useRef(null);
  const stats = useHeroStats();

  // Parallax: listener scroll duy nhất của trang, throttle bằng rAF nên tối đa
  // một lần ghi transform mỗi khung hình.
  useEffect(() => {
    const el = imageRef.current;
    if (!el) return undefined;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;

    let frame = null;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const offset = Math.min(window.scrollY * 0.25, 120);
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-[#0b0d12] min-h-[440px] md:min-h-[560px]">
      {/* Lớp ảnh: parallax bọc ngoài, Ken Burns bên trong — hai transform
          độc lập nên không giẫm lên nhau. */}
      <div ref={imageRef} className="absolute inset-0 will-change-transform">
        <img
          src="/images/tournaments/pool-2.jpg"
          alt=""
          className="hm-kenburns h-full w-full object-cover"
        />
      </div>

      {/* Overlay cố định, không đổi theo theme — ảnh nền vốn đã sáng ở cả hai
          chế độ nên chữ cần nền tối riêng để đạt tương phản. */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/60 to-black/20" />

      <div className="relative mx-auto flex min-h-[440px] max-w-[1600px] flex-col justify-center gap-8 px-6 py-16 md:min-h-[560px] md:px-16">
        <div className="flex max-w-3xl flex-col gap-5">
          <span
            className="hm-rise text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--wnt25-color-red)]"
            style={{ "--i": 0 }}
          >
            BTMS • Mùa giải 2026
          </span>

          {/* leading và tracking phải chừa chỗ cho dấu — xem chú thích ở
              global.css, khối h1–h6. Bản cũ `leading-[0.95] tracking-tight`
              làm "BILLIARDS" dính liền và cắt ngọn dấu trên "ĐỈNH", "VIỆT". */}
          <h1
            className="hm-rise text-[40px] font-black uppercase leading-[1.1] text-white md:text-[68px]"
            style={{ "--i": 1 }}
          >
            Sân chơi Billiards
            <br />
            đỉnh cao Việt Nam
          </h1>

          <p
            className="hm-rise max-w-xl text-base leading-relaxed text-white/75 md:text-lg"
            style={{ "--i": 2 }}
          >
            Theo dõi lịch thi đấu, bảng xếp hạng và từng đường cơ của các tay cơ
            hàng đầu — trực tiếp trên hệ thống BTMS.
          </p>

          <div className="hm-rise flex flex-wrap gap-4" style={{ "--i": 3 }}>
            <Link
              to="/event"
              className="hm-cta rounded-md bg-[var(--wnt25-color-red)] px-7 py-3 text-sm font-bold uppercase tracking-wide text-white hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Xem giải đấu
            </Link>
            <Link
              to="/branches"
              className="hm-cta rounded-md border border-white/40 px-7 py-3 text-sm font-bold uppercase tracking-wide text-white hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Hệ thống chi nhánh
            </Link>
          </div>
        </div>

        {/* Chỉ dựng dải khi đã có số thật — tránh nháy dải rỗng lúc đang tải */}
        {stats.length > 0 && (
          <div className="grid max-w-2xl grid-cols-2 gap-6 border-t border-white/15 pt-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <HeroStat key={stat.label} index={index} {...stat} />
            ))}
          </div>
        )}
      </div>

      {/* Bọc hai lớp: lớp ngoài giữ việc căn giữa, lớp trong chạy animation —
          nếu gộp làm một thì keyframes sẽ ghi đè -translate-x-1/2. */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="hm-bob text-2xl text-white/50">↓</div>
      </div>
    </section>
  );
};

export default Banner;

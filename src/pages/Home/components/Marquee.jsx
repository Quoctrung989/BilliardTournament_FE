import { useEffect, useState } from "react";
import { listPublicTournaments } from "../../../api/publicTournamentApi";
import { listPublishedPosts } from "../../../api/newsApi";

/**
 * Cache ở cấp module: trang có nhiều dải cùng nguồn (giải đấu dùng cho cả dải
 * trên Lịch thi đấu lẫn dải trên Top tay cơ), không cache thì mỗi dải bắn một
 * request trùng nhau. Dữ liệu ở đây thuần trang trí nên cache theo vòng đời
 * tab là chấp nhận được.
 */
const cache = {};

const loaders = {
  tournaments: () =>
    listPublicTournaments({ page: 0, size: 8 }).then((paged) =>
      (paged.content || []).map((t) => t.name).filter(Boolean)
    ),
  news: () =>
    listPublishedPosts({ page: 0, size: 8 }).then((paged) =>
      (paged.content || []).map((p) => p.title).filter(Boolean)
    ),
};

const fetchItems = (source) => {
  if (!cache[source]) {
    cache[source] = loaders[source]().catch(() => []);
  }
  return cache[source];
};

/**
 * Dải chữ chạy ngang ngăn giữa các section.
 * Danh sách lặp đúng hai lần để khi track dịch -50% thì nối liền mạch.
 *
 * @param {"tournaments"|"news"} source Nguồn dữ liệu.
 * @param {"left"|"right"} [direction] Hướng chạy — đổi chiều giữa các dải để
 *   trang không bị đơn điệu khi có nhiều dải.
 * @param {string} [label] Nhãn cố định ở đầu dải (không cuộn).
 */
const Marquee = ({ source = "tournaments", direction = "left", label }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchItems(source).then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  // Quá ít mục thì track ngắn hơn màn hình và vòng lặp lộ chỗ nối — ẩn hẳn.
  if (items.length < 3) return null;

  const loop = [...items, ...items];

  return (
    <div
      className="hm-marquee flex w-full items-stretch overflow-hidden border-y border-white/10 bg-[var(--wnt25-color-dark)]"
      aria-hidden="true"
    >
      {label && (
        <span className="z-[3] flex shrink-0 items-center bg-[var(--wnt25-color-red)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white">
          {label}
        </span>
      )}

      <div className="overflow-hidden py-3">
        <div
          className={`hm-marquee-track ${
            direction === "right" ? "hm-marquee-track--rev" : ""
          }`}
        >
          {loop.map((text, index) => (
            <span
              key={`${text}-${index}`}
              className="flex shrink-0 items-center gap-8 px-8 text-[13px] font-black uppercase tracking-[0.2em] text-white/70"
            >
              {text}
              <span className="text-[var(--wnt25-color-red)]">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marquee;

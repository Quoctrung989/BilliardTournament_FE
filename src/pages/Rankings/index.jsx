import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getLeaderboard } from "../../api/leaderboardApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams } from "../../utils/pagination";
import { DEFAULT_PLAYER_AVATAR, DEFAULT_COUNTRY } from "../../constants/rankingEnums";
import "./rankingsTheme.css";

const PAGE_SIZE = 20;

const PERIODS = [
  { value: "ALL", label: "Mọi thời điểm" },
  { value: "YEAR", label: "Theo năm" },
  { value: "QUARTER", label: "Theo quý" },
  { value: "MONTH", label: "Theo tháng" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
const QUARTERS = Array.from({ length: 4 }, (_, i) => ({ value: i + 1, label: `Quý ${i + 1}` }));

/* Năm bắt đầu có dữ liệu giải đấu — khớp LeaderboardPeriod.earliestSelectableYear() phía BE */
const FIRST_YEAR = 2024;

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_QUARTER = Math.floor(now.getMonth() / 3) + 1;

const YEARS = Array.from(
  { length: Math.max(1, CURRENT_YEAR - FIRST_YEAR + 1) },
  (_, i) => CURRENT_YEAR - i
);

/* Tách tên: phần đầu nhẹ, phần cuối in đậm — kiểu "ALOYSIUS YAPP" */
const splitName = (fullName) => {
  const parts = (fullName || "").trim().split(/\s+/);
  if (parts.length <= 1) return { lead: "", tail: fullName || "—" };
  return { lead: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1] };
};

/* ── Logo bi xếp hình thoi 1-2-3-2-1 trong huy hiệu đỏ ── */
const BallRack = () => (
  <div className="flex flex-col items-center gap-[3px]">
    {[1, 2, 3, 2, 1].map((count, row) => (
      <div key={row} className="flex gap-[3px]">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="rnk-rack-dot" />
        ))}
      </div>
    ))}
  </div>
);

/* Nét vẽ tay đỏ trang trí hai bên hero */
const Squiggle = ({ className, flip }) => (
  <svg
    viewBox="0 0 320 200"
    fill="none"
    className={className}
    style={flip ? { transform: "scaleX(-1)" } : undefined}
    aria-hidden="true"
  >
    <path
      d="M12 26c22-16 34 6 18 20-14 12-30-4-14-18 20-18 44 10 66 2"
      stroke="var(--rnk-red)"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M20 92c60-46 152-52 214-14 46 28 52 78 6 96-40 16-86-8-96-44"
      stroke="var(--rnk-red)"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path d="M132 148l16 22 24-12" stroke="var(--rnk-red)" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

/* Ngôi sao bốn cánh cho hiệu ứng hover của nút lọc (path gốc từ Uiverse) */
const StarIcon = () => (
  <svg viewBox="0 0 784.11 815.53" aria-hidden="true">
    <path d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
  </svg>
);

/**
 * Nút lọc kỳ thống kê.
 *
 * Sáu ngôi sao nằm sẵn trong nút, chỉ hiện ra và bung theo sáu quỹ đạo khác
 * nhau khi trỏ vào — toàn bộ chuyển động nằm ở `.rnk-period` trong
 * rankingsTheme.css, đây chỉ dựng khung.
 */
const PeriodButton = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rnk-period px-4 sm:px-6 py-2.5 text-[12px] sm:text-[13px] font-bold uppercase tracking-wide ${
      active ? "rnk-period--active" : ""
    }`}
  >
    {label}
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <span key={i} className={`rnk-star rnk-star-${i}`}>
        <StarIcon />
      </span>
    ))}
  </button>
);

/* Màu huy chương lấy theo vị trí trên bục (0-1-2), KHÔNG theo entry.rank — hai
   cơ thủ bằng điểm sẽ cùng mang rank 1, lúc đó tra theo rank sẽ ra hai thẻ vàng
   và không còn thẻ bạc. */
const MEDALS = [
  {
    color: "var(--rnk-gold)",
    ink: "var(--rnk-gold-ink)",
    glow: "rgba(224, 164, 21, 0.45)",
    title: "Vô địch",
  },
  {
    color: "var(--rnk-silver)",
    ink: "var(--rnk-silver-ink)",
    glow: "rgba(151, 163, 180, 0.45)",
    title: "Á quân",
  },
  {
    color: "var(--rnk-bronze)",
    ink: "var(--rnk-bronze-ink)",
    glow: "rgba(192, 122, 62, 0.45)",
    title: "Hạng ba",
  },
];

const PodiumCard = ({ entry, place, onOpen }) => {
  const medal = MEDALS[place];
  const { lead, tail } = splitName(entry.playerName);
  const champion = place === 0;

  return (
    <div
      className={`rnk-podium-card flex flex-col items-center px-4 pb-6 pt-7 text-center ${
        champion ? "order-first sm:order-none sm:-mt-8" : ""
      }`}
      style={{
        "--rnk-medal": medal.color,
        "--rnk-medal-ink": medal.ink,
        "--rnk-medal-glow": medal.glow,
      }}
      onClick={() => onOpen(entry.userId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(entry.userId)}
    >
      <div
        className={`rnk-podium-photo ${
          champion
            ? "h-[104px] w-[104px] sm:h-[132px] sm:w-[132px]"
            : "h-[84px] w-[84px] sm:h-[104px] sm:w-[104px]"
        }`}
      >
        <img
          src={entry.avatarUrl || DEFAULT_PLAYER_AVATAR}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
          }}
        />
      </div>

      {/* Badge đè lên mép dưới ảnh — vẽ sau nên luôn nằm trên */}
      <span className="rnk-podium-badge -mt-4">#{entry.rank}</span>

      <p
        className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: "var(--rnk-medal-ink)" }}
      >
        {medal.title}
      </p>

      <h3
        className={`rnk-name mt-1 ${
          champion ? "text-[19px] sm:text-[24px]" : "text-[16px] sm:text-[20px]"
        }`}
      >
        {lead && <span className="font-medium">{lead} </span>}
        <span className="font-black">{tail}</span>
      </h3>

      <p
        className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--rnk-meta)" }}
      >
        <span className="text-[13px] leading-none">{DEFAULT_COUNTRY.flag}</span>
        {DEFAULT_COUNTRY.name}
      </p>

      <div
        className={`rnk-numeric mt-3 ${
          champion ? "text-[30px] sm:text-[36px]" : "text-[24px] sm:text-[28px]"
        }`}
        style={{ color: "var(--rnk-value)" }}
      >
        {Number(entry.totalPoints || 0).toLocaleString("vi-VN")}
        <span className="ml-1 text-[11px] font-bold not-italic uppercase tracking-wider">
          đ<span className="lowercase">iểm</span>
        </span>
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-6"
        style={{ color: "var(--rnk-meta)" }}
      >
        {[
          { value: entry.tournamentsPlayed, label: "Giải" },
          { value: entry.championCount, label: "Vô địch" },
          { value: entry.top3Count, label: "Top 3" },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="text-[16px] font-bold leading-none" style={{ color: "var(--rnk-name)" }}>
              {stat.value}
            </div>
            <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Bục vinh danh top 3.
 *
 * Trên màn rộng xếp á quân – quán quân – hạng ba để quán quân đứng giữa và nhô
 * cao hơn hai bên. Màn hẹp lưới về một cột, lúc đó quán quân được `order-first`
 * kéo lên đầu (xem PodiumCard) — đứng giữa chỉ có nghĩa khi còn ba cột.
 */
const Podium = ({ entries, onOpen }) => (
  <div className="mb-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-3 sm:gap-6">
    {[
      { entry: entries[1], place: 1 },
      { entry: entries[0], place: 0 },
      { entry: entries[2], place: 2 },
    ].map(({ entry, place }) =>
      entry ? (
        <PodiumCard key={entry.userId} entry={entry} place={place} onOpen={onOpen} />
      ) : null
    )}
  </div>
);

const PlayerRow = ({ entry, onOpen }) => {
  const { lead, tail } = splitName(entry.playerName);
  return (
    <div
      className="rnk-row flex items-center gap-4 sm:gap-6 px-5 sm:px-10 py-4 sm:py-5 cursor-pointer transition-colors"
      onClick={() => onOpen(entry.userId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(entry.userId)}
    >
      {/* Hạng */}
      <div
        className="rnk-numeric shrink-0 w-[52px] sm:w-[76px] text-[26px] sm:text-[38px]"
        style={{ color: "var(--rnk-rank)" }}
      >
        <span className="text-[15px] sm:text-[20px] align-top">#</span>
        {entry.rank}
      </div>

      {/* Ảnh cơ thủ */}
      <div
        className="shrink-0 h-[56px] w-[56px] sm:h-[80px] sm:w-[80px] rounded-lg overflow-hidden"
        style={{ background: "var(--rnk-photo-bg)" }}
      >
        <img
          src={entry.avatarUrl || DEFAULT_PLAYER_AVATAR}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_PLAYER_AVATAR;
          }}
        />
      </div>

      {/* Tên + quốc gia */}
      <div className="min-w-0 flex-1">
        <h3 className="rnk-name text-[17px] sm:text-[26px] truncate">
          {lead && <span className="font-medium">{lead} </span>}
          <span className="font-black">{tail}</span>
        </h3>
        <p
          className="mt-1 sm:mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--rnk-meta)" }}
        >
          <span className="text-[13px] sm:text-[15px] leading-none">{DEFAULT_COUNTRY.flag}</span>
          {DEFAULT_COUNTRY.name}
        </p>
      </div>

      {/* Thành tích phụ — ẩn trên màn hẹp để giữ bố cục thoáng như bản gốc */}
      <div
        className="hidden lg:flex shrink-0 items-center gap-8 text-center"
        style={{ color: "var(--rnk-meta)" }}
      >
        {[
          { value: entry.tournamentsPlayed, label: "Giải" },
          { value: entry.championCount, label: "Vô địch" },
          { value: entry.top3Count, label: "Top 3" },
        ].map((stat) => (
          <div key={stat.label} className="w-[58px]">
            <div
              className="text-[19px] font-bold leading-none"
              style={{ color: "var(--rnk-name)" }}
            >
              {stat.value}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Điểm tích lũy */}
      <div
        className="rnk-numeric shrink-0 text-right text-[20px] sm:text-[30px]"
        style={{ color: "var(--rnk-value)" }}
      >
        {Number(entry.totalPoints || 0).toLocaleString("vi-VN")}
        <span className="ml-1 text-[11px] sm:text-[13px] font-bold not-italic uppercase tracking-wider">
          đ<span className="lowercase">iểm</span>
        </span>
      </div>
    </div>
  );
};

const RankingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const period = searchParams.get("period") || "ALL";
  const year = Number(searchParams.get("year")) || CURRENT_YEAR;
  const quarter = Number(searchParams.get("quarter")) || CURRENT_QUARTER;
  const month = Number(searchParams.get("month")) || CURRENT_MONTH;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /* Ghi bộ lọc vào URL để F5 / chia sẻ link giữ nguyên kỳ đang xem */
  const patchParams = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") next.delete(key);
            else next.set(key, String(value));
          });
          return next;
        },
        { replace: true }
      );
      setPage(0);
    },
    [setSearchParams]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page,
        size: PAGE_SIZE,
        period,
        ...(period === "ALL" ? {} : { year }),
        ...(period === "QUARTER" ? { quarter } : {}),
        ...(period === "MONTH" ? { month } : {}),
      });
      const result = await getLeaderboard(params, PAGE_SIZE);
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setItems([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, period, year, quarter, month]);

  useEffect(() => {
    load();
  }, [load]);

  const periodLabel = useMemo(() => {
    switch (period) {
      case "YEAR":
        return `Năm ${year}`;
      case "QUARTER":
        return `Quý ${quarter}/${year}`;
      case "MONTH":
        return `Tháng ${month}/${year}`;
      default:
        return "Mọi thời điểm";
    }
  }, [period, year, quarter, month]);

  const openProfile = (userId) => navigate(`/event/players/user/${userId}`);

  /* Bục chỉ dựng ở trang đầu — sang trang 2 thì ba cái tên đứng đầu bảng là
     hạng 21, 22, 23, vinh danh chúng là sai. Lúc đó bảng chạy đủ từ dòng một. */
  const podiumEntries = page === 0 ? items.slice(0, 3) : [];
  const rows = page === 0 ? items.slice(3) : items;

  const selectClass =
    "rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm font-medium text-[#1d2430] " +
    "focus:outline-none focus:border-black/40 dark:border-white/15 dark:bg-white/10 dark:text-white";

  return (
    <div className="rnk-surface w-full" style={{ background: "var(--rnk-hero-bg)" }}>
      {/* ══ Hero ══ */}
      <div className="rnk-hero relative w-full overflow-hidden pt-12 pb-[120px] sm:pb-[140px]">
        <Squiggle className="pointer-events-none absolute left-0 top-6 h-[190px] w-[300px] opacity-90" />
        <Squiggle
          className="pointer-events-none absolute right-0 top-6 h-[190px] w-[300px] opacity-90"
          flip
        />

        <div className="relative flex flex-col items-center">
          <div className="rnk-badge flex h-[150px] w-[150px] sm:h-[190px] sm:w-[190px] flex-col items-center justify-center rounded-full text-white">
            <BallRack />
            <p className="mt-3 text-[22px] sm:text-[27px] font-extrabold leading-none tracking-tight">
              nineball<span className="text-white/70">.</span>
            </p>
            <p className="mt-1 text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.3em] text-white/85">
              Bảng xếp hạng
            </p>
          </div>

          <h1
            className="mt-6 px-4 text-center text-[26px] sm:text-[38px] font-black uppercase italic leading-none tracking-tight"
            style={{ color: "var(--rnk-name)" }}
          >
            Bảng xếp hạng cơ thủ
          </h1>
          <p
            className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--rnk-meta)" }}
          >
            Điểm tích lũy · {periodLabel}
          </p>
        </div>
      </div>

      {/* ══ Thẻ xếp hạng nổi lên trên hero ══ */}
      <div className="relative z-10 mx-auto -mt-[100px] sm:-mt-[118px] w-full max-w-[1290px] px-3 sm:px-6 pb-16">
        {/* Bộ lọc kỳ thống kê. Nút rời chứ không còn dính mép thẻ — đàn sao lúc
            hover cần chỗ bung ra khỏi khung nút. */}
        <div className="mb-5 flex flex-wrap items-center gap-2 px-2 sm:gap-3 sm:px-4">
          {PERIODS.map((p) => (
            <PeriodButton
              key={p.value}
              label={p.label}
              active={period === p.value}
              onClick={() => patchParams({ period: p.value === "ALL" ? null : p.value })}
            />
          ))}

          {period !== "ALL" && (
            <div className="ml-auto flex flex-wrap gap-2 pr-2">
              {period === "MONTH" && (
                <select
                  className={selectClass}
                  value={month}
                  onChange={(e) => patchParams({ month: e.target.value })}
                  aria-label="Chọn tháng"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              )}
              {period === "QUARTER" && (
                <select
                  className={selectClass}
                  value={quarter}
                  onChange={(e) => patchParams({ quarter: e.target.value })}
                  aria-label="Chọn quý"
                >
                  {QUARTERS.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              )}
              <select
                className={selectClass}
                value={year}
                onChange={(e) => patchParams({ year: e.target.value })}
                aria-label="Chọn năm"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!loading && podiumEntries.length > 0 && (
          <Podium entries={podiumEntries} onOpen={openProfile} />
        )}

        <div className="rnk-card overflow-hidden rounded-2xl">
          {loading ? (
            <div className="py-28 text-center text-sm" style={{ color: "var(--rnk-meta)" }}>
              Đang tải bảng xếp hạng...
            </div>
          ) : items.length === 0 ? (
            <div className="py-28 text-center">
              <p className="text-lg font-bold" style={{ color: "var(--rnk-name)" }}>
                Chưa có cơ thủ nào tích lũy điểm trong kỳ này.
              </p>
              {period !== "ALL" && (
                <button
                  onClick={() =>
                    patchParams({ period: null, year: null, quarter: null, month: null })
                  }
                  className="mt-4 text-sm font-bold hover:underline"
                  style={{ color: "var(--rnk-red)" }}
                >
                  Xem mọi thời điểm
                </button>
              )}
            </div>
          ) : (
            <>
              {rows.map((entry) => (
                <PlayerRow key={entry.userId} entry={entry} onOpen={openProfile} />
              ))}
              {rows.length === 0 && (
                <p className="py-12 text-center text-sm" style={{ color: "var(--rnk-meta)" }}>
                  Kỳ này mới có {items.length} cơ thủ tích lũy điểm — tất cả đều đã lên bục.
                </p>
              )}
              {totalElements > 0 && (
                <AdminPagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={PAGE_SIZE}
                  disabled={loading}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingsPage;

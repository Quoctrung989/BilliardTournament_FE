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
        {/* Tab kỳ thống kê — dính vào mép trên thẻ */}
        <div className="flex flex-wrap items-end gap-1 pl-2 sm:pl-4">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => patchParams({ period: p.value === "ALL" ? null : p.value })}
              className={`rnk-tab rounded-t-xl px-4 sm:px-6 py-2.5 text-[12px] sm:text-[13px] font-bold uppercase tracking-wide transition-all ${
                period === p.value ? "rnk-tab--active" : "hover:brightness-105"
              }`}
            >
              {p.label}
            </button>
          ))}

          {period !== "ALL" && (
            <div className="mb-2 ml-auto flex flex-wrap gap-2 pr-2">
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
              {items.map((entry) => (
                <PlayerRow key={entry.userId} entry={entry} onOpen={openProfile} />
              ))}
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

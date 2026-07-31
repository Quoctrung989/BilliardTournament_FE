import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import { listPublicTournaments } from "../../api/publicTournamentApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useReveal } from "../../hooks/useReveal";
import { TOURNAMENT_STATUS_LABELS } from "../../constants/tournamentConfig";
import "./eventTheme.css";

const BANNER_POOL = [
  "/images/tournaments/vn-player-1.jpg",
  "/images/tournaments/action-1.jpg",
  "/images/tournaments/action-2.jpg",
  "/images/tournaments/pool-6.jpg",
  "/images/tournaments/pool-4.jpg",
  "/images/tournaments/pool-2.jpg",
];

/* Ảnh mặc định cố định theo id → mỗi giải một ảnh khác nhau */
const bannerFor = (id) =>
  BANNER_POOL[Math.abs(Number(id) || 0) % BANNER_POOL.length];

const TIME_FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "OPEN_FOR_REGISTRATION", label: "Mở đăng ký" },
  { value: "REGISTRATION_CLOSED", label: "Đóng đăng ký" },
  { value: "IN_PROGRESS", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

/**
 * Màu chấm cho từng trạng thái. Nhãn chữ KHÔNG khai báo ở đây — lấy từ
 * `TOURNAMENT_STATUS_LABELS` để chỉ có một nguồn nhãn tiếng Việt trong toàn dự
 * án. Bảng tự viết trước đây thiếu DRAFT / DRAW_PREVIEW / FINAL_BRACKET_READY
 * nên card rơi vào nhánh dự phòng và in ra thẳng tên enum.
 */
const STATUS_DOT = {
  DRAFT:                 "#94a3b8",
  OPEN_FOR_REGISTRATION: "#22c55e",
  REGISTRATION_CLOSED:   "#f59e0b",
  DRAW_PREVIEW:          "#eab308",
  DRAW_DONE:             "#a855f7",
  FINAL_BRACKET_READY:   "#22d3ee",
  IN_PROGRESS:           "#ef4444",
  COMPLETED:             "#38bdf8",
  CANCELLED:             "#64748b",
};

const fmtDateShort = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const isFull = (t) =>
  t.approvedCount != null && t.maxParticipants > 0 && t.approvedCount >= t.maxParticipants;

const getBadge = (t) => {
  // Còn mở đăng ký nhưng đã kín chỗ — thông tin hữu ích hơn chính trạng thái.
  if (t.status === "OPEN_FOR_REGISTRATION" && isFull(t))
    return { label: "Hết slot", dot: "#dc2626", live: false };

  return {
    label: TOURNAMENT_STATUS_LABELS[t.status] || "Chưa xác định",
    dot: STATUS_DOT[t.status] || "#94a3b8",
    live: t.status === "IN_PROGRESS",
  };
};

/** Pill kính mờ đặt đè lên ảnh — chấm màu mang thông tin, chữ giữ tương phản. */
const StatusPill = ({ badge }) => (
  <span
    className={`evt-status${badge.live ? " evt-status--live" : ""}`}
    style={{ "--evt-dot": badge.dot }}
  >
    <span className="evt-status__dot" aria-hidden />
    {badge.label}
  </span>
);

/* ── WNT-style card ── */
const TournamentCard = ({ tournament, index }) => {
  const navigate = useNavigate();
  const badge = getBadge(tournament);
  const startStr = fmtDateShort(tournament.startAt);
  const endStr   = fmtDateShort(tournament.endAt);
  const dateStr  = startStr && endStr ? `${startStr} – ${endStr}` : startStr || "—";
  const isCompleted = tournament.status === "COMPLETED" || tournament.status === "DRAW_DONE";

  return (
    // Stagger ở lớp ngoài, hover ở lớp trong — gộp chung thì transition-delay
    // của stagger rò sang hover, card càng ở sau càng chậm nhấc lên.
    <div className="ui-stagger flex" style={{ "--i": Math.min(index, 11) }}>
    <div
      className="ui-card flex flex-col w-full cursor-pointer group rounded-2xl border border-transparent"
      onClick={() => navigate(`/event/${tournament.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/event/${tournament.id}`)}
    >
      {/* Image card */}
      <div className="relative overflow-hidden rounded-t-2xl" style={{ aspectRatio: "4/5" }}>
        <img
          src={tournament.thumbnailUrl || bannerFor(tournament.id)}
          alt={tournament.name}
          className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          onError={(e) => { e.currentTarget.src = bannerFor(tournament.id); }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.65) 100%)"
        }} />

        {/* Tournament name – top */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <h3 style={{
            color: "#fff", fontWeight: 900, fontStyle: "italic",
            textTransform: "uppercase", fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            lineHeight: 1.25, textShadow: "0 2px 12px rgba(0,0,0,0.7)",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {tournament.name}
          </h3>
        </div>

        {/* Game type + format – centered */}
        <div className="absolute bottom-10 left-0 right-0 text-center px-4">
          {tournament.gameType && (
            <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "0.85rem", fontWeight: 700 }}>
              {tournament.gameType}
            </p>
          )}
          {tournament.formatName && (
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem" }}>
              {tournament.formatName}
            </p>
          )}
        </div>

        {/* Status badge – bottom-right only */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex justify-end">
          <StatusPill badge={badge} />
        </div>
      </div>

      {/* Below card: date + action button — grey background */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-b-2xl"
        style={{ background: "var(--evt-card-footer)" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--evt-text-2)", fontWeight: 500 }}>
          {dateStr}
        </span>

        <button
          type="button"
          className="evt-cta"
          onClick={(e) => { e.stopPropagation(); navigate(`/event/${tournament.id}`); }}
        >
          🎱 {isCompleted ? "Kết quả" : "Xem"}
        </button>
      </div>
    </div>
    </div>
  );
};

/* ── Page ── */
const EventPage = () => {
  const gridRef = useReveal({ threshold: 0.05 });
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page, size: pageSize,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchApplied ? { search: searchApplied } : {}),
      });
      const result = await listPublicTournaments(params);
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPage(result.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchApplied]);

  useEffect(() => { load(); }, [load]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchApplied(searchInput.trim());
    setPage(0);
  };

  const handleStatusChange = (v) => {
    setStatusFilter(v);
    setPage(0);
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a1220]">

      {/* ── Hero banner ── */}
      <div className="w-full h-[280px] bg-[#0c1527] relative overflow-hidden">
        <img
          src="/images/tournaments/pool-6.jpg"
          alt=""
          className="h-full w-full object-cover object-top opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1527]/90 to-transparent" />
        <div className="absolute inset-0 flex items-end pb-10 px-10">
          <div>
            <p className="text-[#ef342a] text-xs font-bold uppercase tracking-widest mb-1">
              World Nineball Tour
            </p>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tight">
              Giải Đấu Bi-a
            </h1>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-[#f7f7f7] dark:bg-[#0d1b2e] border-b border-gray-200 dark:border-white/10 sticky top-[64px] z-30">
        <div className="max-w-[1600px] mx-auto px-8 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.value || "all"}
                  onClick={() => handleStatusChange(f.value)}
                  className={`ui-press px-4 py-1.5 rounded-full text-sm font-semibold ${
                    statusFilter === f.value
                      ? "bg-[#0c1527] text-white dark:bg-white dark:text-[#0d1b2e]"
                      : "text-[#333] border border-gray-300 hover:border-[#0c1527] dark:text-white/70 dark:border-white/20 dark:hover:border-white/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative lg:ml-auto w-full lg:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm giải đấu..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full border border-gray-300 bg-white text-sm rounded-full pl-8 pr-4 py-1.5 placeholder:text-gray-400 focus:outline-none focus:border-[#0c1527] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/50"
              />
            </form>
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="max-w-[1600px] mx-auto px-16 py-12">

        {/* Count label */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-slate-700 dark:text-white/85">
            {TIME_FILTERS.find((f) => f.value === statusFilter)?.label || "Tất cả giải đấu"}
          </h2>
          {!loading && (
            <span className="text-sm text-slate-400 dark:text-white/50 font-medium">
              {totalElements} giải tìm thấy
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-400 dark:text-white/50">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-500 dark:text-white/70 text-lg font-semibold">Không có giải đấu nào phù hợp.</p>
            <button
              onClick={() => { handleStatusChange(""); setSearchInput(""); setSearchApplied(""); }}
              className="mt-4 text-[#ef342a] text-sm font-semibold hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((t, i) => (
              <TournamentCard key={t.id} tournament={t} index={i} />
            ))}
          </div>
        )}

        {totalElements > 0 && (
          <div className="mt-8">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              disabled={loading}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPage;

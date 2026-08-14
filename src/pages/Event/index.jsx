import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import { listPublicTournaments } from "../../api/publicTournamentApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams } from "../../utils/pagination";
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
 * Cỡ trang riêng cho lưới giải đấu — bội số của 4 để trang nào cũng kết thúc
 * bằng một hàng đầy.
 *
 * Bộ dùng chung `PAGE_SIZE_OPTIONS` là [9, 18, 24], hợp với lưới 3 cột của các
 * màn admin. Lưới ở đây bốn cột (`lg:grid-cols-4`), 9 chia 4 dư 1 nên trang nào
 * cũng thừa một card lẻ loi ở hàng cuối.
 */
const EVENT_PAGE_SIZES = [8, 16, 24];

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

/**
 * Khoảng ngày viết gọn cho dải đáy card.
 *
 * Ghép thẳng hai ngày đầy đủ ra "25 thg 7, 2026 – 31 thg 7, 2026" — dài gần
 * bằng cả bề ngang card khi lưới chuyển sang bốn cột. Giải nào cũng gói gọn
 * trong một năm, nên ghi năm hai lần là thừa: bỏ ở vế đầu khi trùng năm.
 */
const fmtDateRange = (startIso, endIso) => {
  const start = startIso ? new Date(startIso) : null;
  const end = endIso ? new Date(endIso) : null;

  if (!start) return fmtDateShort(endIso) || "—";
  if (!end) return fmtDateShort(startIso);

  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });

  return `${startStr} – ${fmtDateShort(endIso)}`;
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

/**
 * Hành động của nút ở dải đáy card, đổi theo trạng thái giải.
 *
 * `null` nghĩa là giải đang ở trạng thái chẳng có gì để làm thêm (đóng đăng ký,
 * đã huỷ) — lúc đó nút rơi về "Xem", đừng bịa ra hành động cho có.
 *
 * Hai đường dẫn cuối dùng `?tab=` vì `EventDetailPage` đọc tham số đó lúc dựng
 * state (xem `useState(searchParams.get("tab") || "info")`), nên vào thẳng đúng
 * tab chứ không phải bấm thêm một nhịp.
 */
const secondaryAction = (t) => {
  if (t.status === "OPEN_FOR_REGISTRATION" && !isFull(t))
    return { label: "Đăng ký ngay", to: `/player/tournaments/${t.id}/register` };

  if (t.status === "IN_PROGRESS")
    return { label: "Tỷ số trực tiếp", to: `/event/${t.id}?tab=matches` };

  if (t.status === "COMPLETED" || t.status === "DRAW_DONE")
    return { label: "Kết quả", to: `/event/${t.id}?tab=ranking` };

  return null;
};

/* ── WNT-style card ── */
const TournamentCard = ({ tournament, index }) => {
  const navigate = useNavigate();
  const badge = getBadge(tournament);
  const dateStr = fmtDateRange(tournament.startAt, tournament.endAt);
  const second = secondaryAction(tournament);

  return (
    // Stagger ở lớp ngoài, hover ở lớp trong — gộp chung thì transition-delay
    // của stagger rò sang hover, card càng ở sau càng chậm nhấc lên.
    <div className="ui-stagger flex" style={{ "--i": Math.min(index, 11) }}>
    {/* Lớp ngoài chỉ để mang gradient và quầng sáng — xem .evt-card-frame */}
    <div className="evt-card-frame">
    <div
      className="evt-card-body flex flex-col w-full cursor-pointer group"
      onClick={() => navigate(`/event/${tournament.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/event/${tournament.id}`)}
    >
      {/* Khối ảnh. 3/4: dọc hơn 4/5 cũ nhưng không kéo lưới dài như 9/16 đã thử. */}
      <div className="evt-media" style={{ aspectRatio: "3/4" }}>
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

        {/* Khối đáy: thể loại + thể thức bên trái, trạng thái bên phải.
            Trước đây hai cụm này tách rời (chữ căn giữa ở bottom-10, badge ở
            bottom-0) nên rơi đúng vào giữa ảnh, đè lên mặt cơ thủ. Gộp thành
            một hàng sát đáy, nơi gradient đã tối sẵn. */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {tournament.gameType && (
              <p className="truncate" style={{ color: "rgba(255,255,255,0.95)", fontSize: "0.85rem", fontWeight: 700 }}>
                {tournament.gameType}
              </p>
            )}
            {tournament.formatName && (
              <p className="truncate" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem" }}>
                {tournament.formatName}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <StatusPill badge={badge} />
          </div>
        </div>

        {/* Lớp phủ khi trỏ vào: làm mờ thông tin bên dưới, chỉ để nổi nút điều
            hướng ở giữa. Nút nằm trên khối ảnh tỉ lệ cố định 3/4 nên nhãn dài
            như "Tỷ số trực tiếp" không còn kéo cao card như hồi ở dải đáy. */}
        <div className="evt-overlay">
          <button
            type="button"
            className="evt-cta evt-cta--overlay"
            onClick={(e) => {
              e.stopPropagation();
              navigate(second ? second.to : `/event/${tournament.id}`);
            }}
          >
            {second ? second.label : "Xem chi tiết"}
          </button>
        </div>
      </div>

      {/* Chỉ còn ngày — nút đã chuyển lên giữa ảnh. Nhờ vậy dòng này luôn một
          dòng, mọi card cao bằng nhau. */}
      <div className="evt-card-date">{dateStr}</div>
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
  const [pageSize, setPageSize] = useState(EVENT_PAGE_SIZES[0]);
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
    <div className="w-full bg-white dark:bg-[#0b0d12]">

      {/* ── Hero banner ── */}
      <div className="w-full h-[280px] bg-[#0e1116] relative overflow-hidden">
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
            <h1 className="text-4xl font-black text-white uppercase">
              Giải Đấu Bi-a
            </h1>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-[#f7f7f7] dark:bg-[#161a22] border-b border-gray-200 dark:border-white/10 sticky top-[64px] z-30">
        <div className="max-w-[1600px] mx-auto px-8 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.value || "all"}
                  onClick={() => handleStatusChange(f.value)}
                  className={`ui-underline ui-underline--chip px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                    statusFilter === f.value
                      ? "ui-underline--active text-[#0e1116] dark:text-white"
                      : "text-[#333]/70 hover:text-[#0e1116] dark:text-white/60 dark:hover:text-white"
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
          /* Bốn cột từ lg trở lên: card nhỏ lại nhưng một màn chứa được gấp
             rưỡi số giải, đỡ phải cuộn. Khe hở hạ từ 32 xuống 24 để bù lại bề
             ngang mà cột thứ tư lấy mất. */
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              pageSizeOptions={EVENT_PAGE_SIZES}
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

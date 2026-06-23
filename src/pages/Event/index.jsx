import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import { listPublicTournaments } from "../../api/publicTournamentApi";
import AdminPagination from "../../components/admin/ui/AdminPagination";
import { getApiErrorMessage } from "../../utils/apiError";
import { buildListParams, DEFAULT_PAGE_SIZE } from "../../utils/pagination";

/* ─── Status config ───────────────────────────────────────────────── */
const STATUS_CONFIG = {
  OPEN_FOR_REGISTRATION: { label: "Mở đăng ký", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  REGISTRATION_CLOSED: { label: "Đóng đăng ký", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  DRAW_DONE: { label: "Đã bốc thăm", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  IN_PROGRESS: { label: "Đang diễn ra", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  COMPLETED: { label: "Hoàn thành", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  CANCELLED: { label: "Đã hủy", bg: "bg-red-100", text: "text-red-600", dot: "bg-red-400" },
};

/* ─── Time filter tabs ────────────────────────────────────────────── */
const TIME_FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "OPEN_FOR_REGISTRATION", label: "Mở đăng ký" },
  { value: "REGISTRATION_CLOSED", label: "Đóng đăng ký" },
  { value: "IN_PROGRESS", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

const FALLBACK_IMAGE =
  "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const fmtCurrency = (v) => {
  if (v == null || Number(v) === 0) return "Miễn phí";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
};

const isTournamentFull = (t) => {
  if (t.approvedCount == null || t.maxParticipants == null) return false;
  return t.approvedCount >= t.maxParticipants;
};

const getPublicTournamentBadge = (tournament) => {
  if (tournament.status === "OPEN_FOR_REGISTRATION" && isTournamentFull(tournament)) {
    return { label: "Đã đủ người", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
  }
  if (tournament.status === "OPEN_FOR_REGISTRATION" && !tournament.isRegister) {
    return { label: "Chưa mở ĐK online", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  }
  return STATUS_CONFIG[tournament.status];
};

/* ─── Card ────────────────────────────────────────────────────────── */
const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate();
  const s = getPublicTournamentBadge(tournament);
  const full = isTournamentFull(tournament);
  const canRegisterOnline = tournament.status === "OPEN_FOR_REGISTRATION" && tournament.isRegister && !full;

  return (
    <div
      onClick={() => navigate(`/event/${tournament.id}`)}
      className="group flex flex-col overflow-hidden rounded-l-[24px] border border-gray-300 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/event/${tournament.id}`)}
    >
      {/* Ảnh */}
      <div className="overflow-hidden h-[200px] bg-slate-100">
        <img
          src={tournament.thumbnailUrl || FALLBACK_IMAGE}
          alt={tournament.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
      </div>

      {/* Nội dung */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold px-2 py-1 border border-[#ef342a] text-[#ef342a] rounded-lg">
            {fmtDate(tournament.startAt)}
            {tournament.endAt && ` – ${fmtDate(tournament.endAt)}`}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {tournament.gameType}
          </span>
        </div>

        <h3 className="text-base font-black uppercase leading-[1.2] tracking-tight text-[#1d2430] line-clamp-2">
          {tournament.name}
        </h3>

        <p className="text-xs text-gray-500 font-semibold">
          {tournament.formatName || tournament.format}
          {tournament.participantType && (
            <> · {tournament.participantType === "SINGLE" ? "Đơn" : tournament.participantType === "DOUBLE" ? "Đôi" : "Đội"}</>
          )}
        </p>

        <p className="text-sm font-semibold text-[#1d2430]">
          Giải thưởng: {tournament.prizePool ? fmtCurrency(tournament.prizePool) : "—"}
        </p>

        {/* Slot bar */}
        {tournament.approvedCount != null && tournament.maxParticipants > 0 && (
          <div className="mt-1">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>{tournament.approvedCount}/{tournament.maxParticipants} người</span>
              {!full && tournament.status === "OPEN_FOR_REGISTRATION" && (
                <span className={tournament.maxParticipants - tournament.approvedCount <= 3 ? "text-amber-600 font-semibold" : "text-emerald-600"}>
                  Còn {tournament.maxParticipants - tournament.approvedCount} slot
                </span>
              )}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${full ? "bg-red-400" : tournament.maxParticipants - tournament.approvedCount <= 3 ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${Math.min(100, (tournament.approvedCount / tournament.maxParticipants) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto gap-2">
          {s && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          )}

          {canRegisterOnline && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/event/${tournament.id}`); }}
              className="text-xs font-bold px-4 py-1.5 bg-[#ef342a] hover:bg-[#d42a22] text-white rounded-md transition-colors shrink-0"
            >
              Đăng ký
            </button>
          )}
          {tournament.status === "IN_PROGRESS" && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/event/${tournament.id}`); }}
              className="text-xs font-bold px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shrink-0"
            >
              Theo dõi
            </button>
          )}
          {tournament.status === "COMPLETED" && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/event/${tournament.id}?tab=ranking`); }}
              className="text-xs font-bold px-4 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-md transition-colors shrink-0"
            >
              Kết quả ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Page ────────────────────────────────────────────────────────── */
const EventPage = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams({
        page,
        size: pageSize,
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
    <div className="w-full bg-white">
      {/* Banner */}
      <div className="w-full h-[280px] bg-[#333333] relative overflow-hidden">
        <img
          src="https://matchroompool.com/wp-content/uploads/us-open-2026_desktop-players.png"
          alt=""
          className="h-full w-full object-cover object-top opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#333333]/80 to-transparent flex items-end pb-10 px-10 max-w-[1600px] mx-auto left-0 right-0">
          <div>
            <p className="text-[#ef342a] text-xs font-bold uppercase tracking-widest mb-1">
              Hệ thống giải đấu
            </p>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">
              Giải Đấu Bi-a
            </h1>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-[#f7f7f7]/95 backdrop-blur-sm border-b border-gray-200 sticky top-[100px] z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex gap-2 flex-wrap">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.value || "all"}
                  onClick={() => handleStatusChange(f.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${statusFilter === f.value
                      ? "bg-[#333333] text-white"
                      : "text-[#333333] border border-gray-300 hover:border-[#333333]"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative lg:ml-auto w-full lg:w-1/4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm giải đấu..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full border border-gray-300 bg-white text-[#333333] text-sm rounded-lg pl-8 pr-4 py-1.5 placeholder:text-gray-400 focus:outline-none focus:border-[#ef342a]"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        className="max-w-[1600px] mx-auto px-6 py-10 relative overflow-hidden rounded-2xl"
        style={{ backgroundImage: "url('/fire-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/60 z-0" />

        <div className="mb-8 relative flex items-center z-10">
          <h2 className="text-lg font-semibold text-white drop-shadow-lg">
            {TIME_FILTERS.find((f) => f.value === statusFilter)?.label || "Tất cả giải đấu"}
          </h2>
          {!loading && (
            <span
              className="absolute left-1/2 -translate-x-1/2 inline-flex items-center text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wide shadow-lg overflow-hidden border border-white/20"
              style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
            >
              <span className="relative z-10" style={{ textShadow: "0 0 8px rgba(255,180,0,0.9)" }}>
                {totalElements} giải tìm thấy
              </span>
            </span>
          )}
        </div>

        {loading ? (
          <div className="relative z-10 text-center py-24 text-white/60">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="relative z-10 text-center py-24 bg-white/10 backdrop-blur-sm rounded-[24px] border border-white/20">
            <p className="text-white/80 text-lg font-semibold">Không có giải đấu nào phù hợp.</p>
            <button
              onClick={() => { handleStatusChange(""); setSearchInput(""); setSearchApplied(""); }}
              className="mt-4 text-orange-300 text-sm font-semibold hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="relative z-10 mt-6">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              disabled={loading}
              onPageChange={setPage}
              onPageSizeChange={() => { }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPage;

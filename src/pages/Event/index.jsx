import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { TOURNAMENT_STATUS_LABELS } from "../../constants/tournamentConfig";

/* ─── Status config ───────────────────────────────────────────────── */
const STATUS_CONFIG = {
  OPEN_FOR_REGISTRATION: { label: "Mở đăng ký",   bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  REGISTRATION_CLOSED:   { label: "Đóng đăng ký",  bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  DRAW_DONE:             { label: "Đã bốc thăm",   bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  IN_PROGRESS:           { label: "Đang diễn ra",  bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
  COMPLETED:             { label: "Hoàn thành",    bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400"   },
  CANCELLED:             { label: "Đã hủy",        bg: "bg-red-100",    text: "text-red-600",    dot: "bg-red-400"    },
};

/* ─── Time filter tabs ────────────────────────────────────────────── */
const TIME_FILTERS = [
  { value: "all",      label: "Tất cả" },
  { value: "upcoming", label: "Sắp diễn ra" },
  { value: "ongoing",  label: "Đang diễn ra" },
  { value: "past",     label: "Đã kết thúc" },
];

const UPCOMING_STATUSES = ["OPEN_FOR_REGISTRATION", "REGISTRATION_CLOSED", "DRAW_DONE"];
const ONGOING_STATUSES  = ["IN_PROGRESS"];
const PAST_STATUSES     = ["COMPLETED", "CANCELLED"];

/* ─── Mock data ───────────────────────────────────────────────────── */
const MOCK_TOURNAMENTS = [
  {
    id: 1,
    name: "Vietnam 9-Ball Open 2026",
    gameType: "9-Ball",
    formatName: "Loại trực tiếp",
    status: "IN_PROGRESS",
    startAt: "2026-06-01",
    endAt: "2026-06-08",
    location: "Hà Nội",
    venue: "Trung tâm Bi-a Thăng Long",
    typeBadge: "Giải Mở",
    image: "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp",
  },
  {
    id: 2,
    name: "Giải Vô Địch Carom 3 Băng Toàn Quốc",
    gameType: "Carom 3 Băng",
    formatName: "Vòng bảng + Playoff",
    status: "IN_PROGRESS",
    startAt: "2026-05-28",
    endAt: "2026-06-07",
    location: "TP. Hồ Chí Minh",
    venue: "CLB Bi-a Quốc Tế",
    typeBadge: "Giải Chính",
    image: "https://matchroompool.com/wp-content/uploads/us-open-2026_desktop-players.png",
  },
  {
    id: 3,
    name: "Đà Nẵng 8-Ball Championship 2026",
    gameType: "8-Ball",
    formatName: "Loại trực tiếp kép",
    status: "COMPLETED",
    startAt: "2026-05-10",
    endAt: "2026-05-14",
    location: "Đà Nẵng",
    venue: "Arena Sports Center",
    typeBadge: "Xếp hạng",
    image: "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp",
  },
  {
    id: 4,
    name: "Giải Bi-a Trẻ Toàn Quốc 2026",
    gameType: "10-Ball",
    formatName: "Vòng bảng",
    status: "OPEN_FOR_REGISTRATION",
    startAt: "2026-07-10",
    endAt: "2026-07-14",
    location: "Cần Thơ",
    venue: "Nhà Thi Đấu Cần Thơ",
    typeBadge: "Mời",
    image: "https://matchroompool.com/wp-content/uploads/us-open-2026_desktop-players.png",
  },
  {
    id: 5,
    name: "Giải Vô Địch Billiards Miền Bắc",
    gameType: "Carom 1 Băng",
    formatName: "Vòng tròn + Loại",
    status: "REGISTRATION_CLOSED",
    startAt: "2026-06-20",
    endAt: "2026-06-25",
    location: "Hải Phòng",
    venue: "CLB Bi-a Hải Phòng",
    typeBadge: "Giải Chính",
    image: "https://matchroompool.com/wp-content/uploads/UK-OPEN-2026_1920x1080-1.webp",
  },
  {
    id: 6,
    name: "Ho Chi Minh City 8-Ball Open",
    gameType: "8-Ball",
    formatName: "Loại trực tiếp kép",
    status: "COMPLETED",
    startAt: "2026-04-10",
    endAt: "2026-04-14",
    location: "TP. Hồ Chí Minh",
    venue: "Vietnam Billiards Club",
    typeBadge: "Mở",
    image: "https://matchroompool.com/wp-content/uploads/us-open-2026_desktop-players.png",
  },
];

/* ─── Helpers ─────────────────────────────────────────────────────── */
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/* ─── Card ────────────────────────────────────────────────────────── */
const STREAM_INTERVAL_MS = 110;

const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate();
  const s = STATUS_CONFIG[tournament.status];

  const handleAction = () => navigate(`/event/${tournament.id}`);

  return (
    <div className="group tournament-card-stream flex flex-col overflow-hidden rounded-l-[24px] border border-gray-300 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer">
      {/* Ảnh */}
      <div className="overflow-hidden h-[200px]">
        <img
          src={tournament.image}
          alt={tournament.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>

      {/* Nội dung */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Hàng đầu: ngày + loại badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold px-2 py-1 border border-[#ef342a] text-[#ef342a] rounded-lg">
            {fmtDate(tournament.startAt)} – {fmtDate(tournament.endAt)}
          </span>
          <span className="text-xs font-bold text-[#333333] uppercase tracking-wide">
            {tournament.typeBadge}
          </span>
        </div>

        {/* Tên giải */}
        <h3 className="text-base font-black uppercase leading-[1.2] tracking-tight text-[#1d2430] line-clamp-2">
          {tournament.name}
        </h3>

        {/* Thể thức + loại bi */}
        <p className="text-xs text-gray-500 font-semibold">
          {tournament.gameType} · {tournament.formatName}
        </p>

        {/* Địa điểm */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin size={13} className="text-gray-400 shrink-0" />
          <span className="line-clamp-1">{tournament.venue}, {tournament.location}</span>
        </div>

        {/* Footer: trạng thái + nút */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto gap-2">
          {s && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          )}

          {tournament.status === "OPEN_FOR_REGISTRATION" && (
            <button
              onClick={handleAction}
              className="text-xs font-bold px-4 py-1.5 bg-[#ef342a] hover:bg-[#d42a22] text-white rounded-md transition-colors shrink-0"
            >
              Đăng ký
            </button>
          )}
          {tournament.status === "IN_PROGRESS" && (
            <button
              onClick={handleAction}
              className="text-xs font-bold px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shrink-0"
            >
              Theo dõi
            </button>
          )}
          {tournament.status === "COMPLETED" && (
            <button
              onClick={handleAction}
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
  const [timeFilter,   setTimeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [search,       setSearch]       = useState("");

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    ...Object.entries(TOURNAMENT_STATUS_LABELS)
      .filter(([v]) => v !== "DRAFT")
      .map(([value, label]) => ({ value, label })),
  ];

  const filtered = useMemo(() => {
    return MOCK_TOURNAMENTS.filter((t) => {
      if (timeFilter === "upcoming" && !UPCOMING_STATUSES.includes(t.status)) return false;
      if (timeFilter === "ongoing"  && !ONGOING_STATUSES.includes(t.status))  return false;
      if (timeFilter === "past"     && !PAST_STATUSES.includes(t.status))     return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [timeFilter, statusFilter, search]);

  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisibleCount(filtered.length);
      return undefined;
    }

    setVisibleCount(0);
    if (filtered.length === 0) return undefined;

    const timers = filtered.map((_, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), (index + 1) * STREAM_INTERVAL_MS)
    );

    return () => timers.forEach(clearTimeout);
  }, [filtered]);

  const visibleTournaments = filtered.slice(0, visibleCount);

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
      <div className="bg-[#f7f7f7]/95 backdrop-blur-sm border-b border-gray-200 sticky top-[var(--layout-header-h)] z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Filter theo thời gian */}
            <div className="flex gap-2 flex-wrap">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTimeFilter(f.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    timeFilter === f.value
                      ? "bg-[#333333] text-white"
                      : "text-[#333333] border border-gray-300 hover:border-[#333333]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 lg:ml-auto flex-wrap items-center">
              {/* Filter theo trạng thái */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 bg-white text-[#333333] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#ef342a] cursor-pointer"
              >
                {statusOptions.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {/* Tìm kiếm */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm giải đấu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border border-gray-300 bg-white text-[#333333] text-sm rounded-lg pl-8 pr-4 py-1.5 placeholder:text-gray-400 focus:outline-none focus:border-[#ef342a] w-44"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        {/* Section header */}
        <div className="bg-[#f7f7f7] p-4 rounded-md flex justify-between items-center mb-8 border border-gray-200">
          <h2 className="text-lg font-bold text-[#1d2430]">
            {timeFilter === "all"      && "Tất cả giải đấu"}
            {timeFilter === "upcoming" && "Giải đấu sắp diễn ra"}
            {timeFilter === "ongoing"  && "Giải đang diễn ra"}
            {timeFilter === "past"     && "Giải đã kết thúc"}
          </h2>
          <span className="text-sm text-gray-500 font-semibold italic">
            {filtered.length} giải
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-l-[24px] border border-gray-300 shadow-sm">
            <p className="text-gray-400 text-lg font-semibold">Không có giải đấu nào phù hợp.</p>
            <button
              onClick={() => { setTimeFilter("all"); setStatusFilter(""); setSearch(""); }}
              className="mt-4 text-[#ef342a] text-sm font-semibold hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPage;

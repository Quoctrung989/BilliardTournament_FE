import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MatchesTab from "./MatchesTab";
import RankingTab from "./RankingTab";
import {
  Calendar, MapPin, Building2, DollarSign,
  ArrowLeft, User, Info, List, Radio, BarChart2,
  Tv2, Search, Globe, Trophy,
} from "lucide-react";

/* ─── Mock data ─────────────────────────────────────────────────────── */
const TOURNAMENTS = [
  {
    /* Đang diễn ra — bracket 8 người, khớp hoàn toàn với MatchesTab */
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
    prizeFund: 31300,
    prizes: [
      { label: "Vô địch",   amount: 15000 },
      { label: "Á quân",    amount: 7000  },
      { label: "Hạng 3–4",  amount: 3500  },
      { label: "Hạng 5–8",  amount: 1450  },
    ],
    /* 8 người — đúng với bracket Vòng 1 (4 trận) → Bán kết (2) → Chung kết (1) */
    players: [
      { id: 1, name: "Nguyễn Văn Anh",    country: "Việt Nam",    flag: "🇻🇳" },
      { id: 2, name: "Ko Pin Yi",          country: "Đài Loan",    flag: "🇹🇼" },
      { id: 3, name: "Carlo Biado",        country: "Philippines", flag: "🇵🇭" },
      { id: 4, name: "Trần Đức Minh",      country: "Việt Nam",    flag: "🇻🇳" },
      { id: 5, name: "James Aranas",       country: "Philippines", flag: "🇵🇭" },
      { id: 6, name: "Lê Quang Hùng",      country: "Việt Nam",    flag: "🇻🇳" },
      { id: 7, name: "Trần Quốc Tuấn",     country: "Việt Nam",    flag: "🇻🇳" },
      { id: 8, name: "Nguyễn Mạnh Hùng",   country: "Việt Nam",    flag: "🇻🇳" },
    ],
  },
  {
    /* Đang diễn ra — vòng bảng 6 người, toàn cơ thủ Carom Việt Nam */
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
    prizeFund: 20000,
    prizes: [
      { label: "Vô địch",  amount: 9000 },
      { label: "Á quân",   amount: 4500 },
      { label: "Hạng 3",   amount: 2500 },
      { label: "Hạng 4–6", amount: 1333 },
    ],
    players: [
      { id: 1, name: "Trần Quốc Khánh",   country: "Việt Nam", flag: "🇻🇳" },
      { id: 2, name: "Nguyễn Hoàng Long",  country: "Việt Nam", flag: "🇻🇳" },
      { id: 3, name: "Lê Thanh Tùng",      country: "Việt Nam", flag: "🇻🇳" },
      { id: 4, name: "Phạm Văn Đức",       country: "Việt Nam", flag: "🇻🇳" },
      { id: 5, name: "Vũ Mạnh Cường",      country: "Việt Nam", flag: "🇻🇳" },
      { id: 6, name: "Đinh Trọng Khương",   country: "Việt Nam", flag: "🇻🇳" },
    ],
  },
  {
    /* Đã kết thúc — 8 cơ thủ 8-Ball */
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
    prizeFund: 15000,
    prizes: [
      { label: "Vô địch",  amount: 7000 },
      { label: "Á quân",   amount: 3500 },
      { label: "Hạng 3–4", amount: 1500 },
      { label: "Hạng 5–8", amount: 500  },
    ],
    players: [
      { id: 1, name: "Nguyễn Xuân Trường", country: "Việt Nam", flag: "🇻🇳" },
      { id: 2, name: "Phạm Tuấn Kiệt",     country: "Việt Nam", flag: "🇻🇳" },
      { id: 3, name: "Trần Minh Tuấn",      country: "Việt Nam", flag: "🇻🇳" },
      { id: 4, name: "Lê Văn Hưng",         country: "Việt Nam", flag: "🇻🇳" },
      { id: 5, name: "Nguyễn Đức Anh",      country: "Việt Nam", flag: "🇻🇳" },
      { id: 6, name: "Hoàng Văn Linh",       country: "Việt Nam", flag: "🇻🇳" },
      { id: 7, name: "Ngô Đình Nhân",        country: "Việt Nam", flag: "🇻🇳" },
      { id: 8, name: "Bùi Văn An",           country: "Việt Nam", flag: "🇻🇳" },
    ],
  },
  {
    /* Mở đăng ký — chưa có cơ thủ xác nhận, chỉ 6 người đăng ký sơ bộ */
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
    prizeFund: 10000,
    prizes: [
      { label: "Vô địch",  amount: 5000 },
      { label: "Á quân",   amount: 2500 },
      { label: "Hạng 3–4", amount: 1250 },
    ],
    players: [
      { id: 1, name: "Võ Minh Tâm",         country: "Việt Nam", flag: "🇻🇳" },
      { id: 2, name: "Đinh Xuân Hùng",       country: "Việt Nam", flag: "🇻🇳" },
      { id: 3, name: "Nguyễn Văn Trọng",     country: "Việt Nam", flag: "🇻🇳" },
      { id: 4, name: "Trần Đình Khoa",        country: "Việt Nam", flag: "🇻🇳" },
      { id: 5, name: "Lê Minh Khoa",          country: "Việt Nam", flag: "🇻🇳" },
      { id: 6, name: "Phạm Bá Thanh",         country: "Việt Nam", flag: "🇻🇳" },
    ],
  },
  {
    /* Đóng đăng ký — chuẩn bị thi đấu, 8 người Carom 1 Băng */
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
    prizeFund: 12000,
    prizes: [
      { label: "Vô địch",  amount: 6000 },
      { label: "Á quân",   amount: 3000 },
      { label: "Hạng 3–4", amount: 1500 },
    ],
    players: [
      { id: 1, name: "Lê Đình Tự",          country: "Việt Nam", flag: "🇻🇳" },
      { id: 2, name: "Bùi Văn Trương",       country: "Việt Nam", flag: "🇻🇳" },
      { id: 3, name: "Phạm Văn Sơn",         country: "Việt Nam", flag: "🇻🇳" },
      { id: 4, name: "Nguyễn Quốc Hùng",     country: "Việt Nam", flag: "🇻🇳" },
      { id: 5, name: "Trần Văn Nam",          country: "Việt Nam", flag: "🇻🇳" },
      { id: 6, name: "Hoàng Đình Khải",       country: "Việt Nam", flag: "🇻🇳" },
      { id: 7, name: "Vũ Tiến Dũng",          country: "Việt Nam", flag: "🇻🇳" },
      { id: 8, name: "Đỗ Thanh Bình",         country: "Việt Nam", flag: "🇻🇳" },
    ],
  },
  {
    /* Đã kết thúc — giải quốc tế có cơ thủ Philippines + Đài Loan */
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
    prizeFund: 25000,
    prizes: [
      { label: "Vô địch",  amount: 12000 },
      { label: "Á quân",   amount: 6000  },
      { label: "Hạng 3–4", amount: 2500  },
      { label: "Hạng 5–8", amount: 1000  },
    ],
    players: [
      { id: 1, name: "Trần Thanh Lâm",    country: "Việt Nam",    flag: "🇻🇳" },
      { id: 2, name: "Nguyễn Hoàng Nam",  country: "Việt Nam",    flag: "🇻🇳" },
      { id: 3, name: "Phạm Thanh Chương", country: "Việt Nam",    flag: "🇻🇳" },
      { id: 4, name: "Lê Đức Thịnh",      country: "Việt Nam",    flag: "🇻🇳" },
      { id: 5, name: "Carlo Biado",        country: "Philippines", flag: "🇵🇭" },
      { id: 6, name: "Efren Reyes",        country: "Philippines", flag: "🇵🇭" },
      { id: 7, name: "Ko Pin Yi",          country: "Đài Loan",    flag: "🇹🇼" },
      { id: 8, name: "Chang Yi-Jen",       country: "Đài Loan",    flag: "🇹🇼" },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
const fmtUSD = (n) =>
  n != null ? `$${Number(n).toLocaleString("en-US")}` : "—";

/* ─── Tabs ──────────────────────────────────────────────────────────── */
const TABS = [
  { id: "info",    label: "Thông tin", Icon: Info      },
  { id: "matches", label: "Trận đấu",  Icon: List      },
  { id: "live",    label: "Trực tiếp", Icon: Radio,    live: true },
  { id: "ranking", label: "Xếp hạng",  Icon: BarChart2 },
];

/* ─── Info tab ──────────────────────────────────────────────────────── */
const InfoTab = ({ t, onWatchNow }) => {
  const [nameSearch,    setNameSearch]    = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const countries = useMemo(
    () => [...new Set(t.players.map((p) => p.country))].sort(),
    [t.players]
  );

  const filteredPlayers = useMemo(
    () =>
      t.players.filter((p) => {
        const okName    = p.name.toLowerCase().includes(nameSearch.toLowerCase());
        const okCountry = !countryFilter || p.country === countryFilter;
        return okName && okCountry;
      }),
    [t.players, nameSearch, countryFilter]
  );

  return (
    <div className="space-y-4">

      {/* ── Thông tin giải ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header strip */}
        <div className="flex items-center justify-center gap-1.5 py-2.5" style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #162840 100%)" }}>
          <Info size={12} className="text-white/50" />
          <span className="text-[10px] font-medium tracking-[0.14em] text-white/60 uppercase">
            Thông tin giải đấu
          </span>
        </div>

        <div className="px-6 pt-4 pb-5">
          {/* Tên giải */}
          <h1 className="text-center text-lg sm:text-xl font-semibold text-[#0d1b2e] mb-5 leading-snug">
            {t.name}
          </h1>

          {/* 4-col meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { Icon: Calendar,   label: "Ngày thi đấu",    value: `${fmtDate(t.startAt)} – ${fmtDate(t.endAt)}` },
              { Icon: Building2,  label: "Địa điểm",        value: t.venue        },
              { Icon: MapPin,     label: "Khu vực",         value: t.location     },
              { Icon: DollarSign, label: "Tổng giải thưởng", value: fmtUSD(t.prizeFund) },
            ].map(({ Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 bg-[#f8f9fb] rounded-2xl px-3 py-3.5 text-center"
              >
                <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Icon size={13} className="text-[#0d1b2e]/45" />
                </div>
                <span className="text-[9px] font-medium tracking-wide text-gray-400 uppercase leading-tight">{label}</span>
                <span className="text-xs font-medium text-[#0d1b2e] leading-snug">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cơ cấu giải thưởng */}
        <div
          className="mx-4 mb-4 rounded-2xl px-5 py-4"
          style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #162840 100%)" }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Trophy size={12} className="text-yellow-400" />
            <span className="text-[9px] font-medium tracking-[0.14em] text-white/45 uppercase">
              Cơ cấu giải thưởng
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3">
            {t.prizes.map((p, i) => (
              <div key={p.label} className={i === 0 ? "col-span-2 sm:col-span-1" : ""}>
                <p className="text-[9px] font-medium tracking-wide text-white/40 uppercase mb-0.5">
                  {p.label}
                </p>
                <p className={`font-semibold ${i === 0 ? "text-xl text-yellow-400" : "text-base text-[#ef342a]"}`}>
                  {fmtUSD(p.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Banner trực tiếp ── */}
      <div
        className="relative rounded-3xl overflow-hidden cursor-pointer group"
        style={{ background: "linear-gradient(135deg, #0d1b2e 55%, #1e3a5f)" }}
        onClick={onWatchNow}
      >
        <img
          src={t.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity duration-300"
        />
        <div className="relative flex items-center gap-3.5 px-6 py-4">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
            <Tv2 size={17} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-medium tracking-widest text-white/40 uppercase">Trực tiếp tại</p>
            <p className="text-white font-semibold text-sm leading-tight">Billiards Live TV</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onWatchNow(); }}
            className="bg-[#ef342a] hover:bg-[#d42a22] active:scale-95 text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-all shrink-0 shadow-lg shadow-[#ef342a]/30"
          >
            Xem ngay
          </button>
        </div>
      </div>

      {/* ── Danh sách cơ thủ ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header strip */}
        <div className="flex items-center justify-center gap-1.5 py-2.5" style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #162840 100%)" }}>
          <User size={12} className="text-white/50" />
          <span className="text-[10px] font-medium tracking-[0.14em] text-white/60 uppercase">
            Danh sách cơ thủ
          </span>
        </div>

        <div className="px-5 pt-3.5 pb-5">
          {/* Bộ lọc */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm tên cơ thủ..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-full bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-8 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:border-[#0d1b2e]/15 focus:bg-white transition-all"
              />
            </div>
            <div className="relative sm:w-40">
              <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full appearance-none bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-8 pr-4 py-2 focus:outline-none focus:border-[#0d1b2e]/15 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Tất cả quốc gia</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center shrink-0 px-1">
              <span className="text-[11px] text-gray-400 font-light">
                {filteredPlayers.length}/{t.players.length} cơ thủ
              </span>
            </div>
          </div>

          {/* Lưới cơ thủ */}
          {filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#f8f9fb] hover:bg-[#eef0f5] transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                    <User size={15} className="text-[#0d1b2e]/25" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0d1b2e] leading-tight truncate group-hover:text-[#ef342a] transition-colors">
                      {p.name.split(" ").slice(0, -1).join(" ")}{" "}
                      <span className="font-semibold">{p.name.split(" ").at(-1)}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 font-light mt-0.5 flex items-center gap-1">
                      <span className="text-xs leading-none">{p.flag}</span>
                      {p.country}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 rounded-2xl bg-[#f8f9fb]">
              <p className="text-gray-400 text-sm font-light">Không tìm thấy cơ thủ phù hợp.</p>
              <button
                onClick={() => { setNameSearch(""); setCountryFilter(""); }}
                className="mt-2 text-[#ef342a] text-xs hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Placeholder tabs ──────────────────────────────────────────────── */
const ComingSoon = ({ label }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-28 gap-2">
    <p className="text-gray-200 text-4xl font-semibold">{label}</p>
    <p className="text-gray-400 text-sm font-light">Sắp ra mắt</p>
  </div>
);

/* ─── Page ──────────────────────────────────────────────────────────── */
const EventDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");

  const tournament = TOURNAMENTS.find((t) => t.id === Number(id));

  if (!tournament) {
    return (
      <div className="font-poppins flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-gray-400 text-base font-light">Không tìm thấy giải đấu.</p>
        <button
          onClick={() => navigate("/event")}
          className="text-[#ef342a] text-sm font-medium hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Quay lại danh sách
        </button>
      </div>
    );
  }

  const isLive = tournament.status === "IN_PROGRESS";

  return (
    <div className="font-poppins w-full min-h-screen pb-16" style={{ background: "#f0f2f6" }}>

      {/* ── Hero ── */}
      <div className="relative w-full h-[290px] overflow-hidden">
        <img
          src={tournament.image}
          alt={tournament.name}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2e]/95 via-[#0d1b2e]/50 to-transparent" />

        {/* Nút quay lại */}
        <button
          onClick={() => navigate("/event")}
          className="absolute top-5 left-5 flex items-center gap-1.5 text-white/75 hover:text-white text-sm font-light bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3.5 py-1.5 rounded-full transition-all"
        >
          <ArrowLeft size={13} />
          Giải đấu
        </button>

        {/* Live badge */}
        {isLive && (
          <button
            onClick={() => setActiveTab("live")}
            className="absolute top-5 right-5 flex items-center gap-1.5 bg-[#ef342a] hover:bg-[#d42a22] text-white text-[10px] font-medium px-3 py-1.5 rounded-full shadow-lg shadow-[#ef342a]/40 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Trực tiếp
          </button>
        )}

        {/* Tiêu đề */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 max-w-[90%] mx-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-medium text-[#ef342a]/90 bg-[#ef342a]/15 border border-[#ef342a]/25 px-2.5 py-0.5 rounded-full">
              {tournament.typeBadge}
            </span>
            <span className="text-[10px] font-light text-white/45">
              {tournament.gameType}
            </span>
          </div>
          <h2 className="text-white text-lg sm:text-xl font-semibold leading-tight drop-shadow-lg">
            {tournament.name}
          </h2>
        </div>
      </div>

      {/* ── Nội dung tab ── */}
      <div className="max-w-[90%] mx-auto px-4 sm:px-5 py-4">
        {activeTab === "info"    && <InfoTab t={tournament} onWatchNow={() => setActiveTab("live")} />}
        {activeTab === "matches" && <MatchesTab tournament={tournament} />}
        {activeTab === "live"    && <ComingSoon label="Trực tiếp" />}
        {activeTab === "ranking" && <RankingTab tournament={tournament} />}
      </div>

      {/* ── Thanh điều hướng dưới — trắng, active xanh đen, bo tròn ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-1px_12px_rgba(0,0,0,0.07)]">
        <div className="flex w-full gap-1.5 px-2 pt-1.5 pb-2.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-1
                  py-2 rounded-2xl transition-all duration-200
                  ${isActive
                    ? "bg-[#0d1b2e] text-white"
                    : "text-gray-400 hover:bg-[#0d1b2e] hover:text-white"
                  }
                `}
              >
                <span className="relative">
                  <tab.Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                  {tab.live && isLive && (
                    <span className={`absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-[#ef342a] border ${isActive ? "border-[#0d1b2e]" : "border-white"}`} />
                  )}
                </span>
                <span className={`text-[10px] leading-none ${isActive ? "font-medium" : "font-light"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default EventDetailPage;

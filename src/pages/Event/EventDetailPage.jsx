import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MatchesTab from "./MatchesTab";
import RankingTab from "./RankingTab";
import {
  Calendar, MapPin, Building2, DollarSign,
  ArrowLeft, User, Info, List, Radio, BarChart2,
  Tv2, Search, Trophy, X,
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
      { id: 1, name: "Nguyễn Văn Anh",   nickname: "Anh Cò",        age: 28, address: "Hà Nội" },
      { id: 2, name: "Trần Đức Minh",    nickname: "Minh Lửa",       age: 31, address: "Hải Phòng" },
      { id: 3, name: "Lê Quang Hùng",    nickname: "Hùng Phong",     age: 26, address: "TP. Hồ Chí Minh" },
      { id: 4, name: "Trần Quốc Tuấn",   nickname: "Tuấn Bão",       age: 24, address: "Đà Nẵng" },
      { id: 5, name: "Nguyễn Mạnh Hùng", nickname: "Hùng Gấu",       age: 29, address: "Hà Nội" },
      { id: 6, name: "Phạm Đình Long",   nickname: "Long Rồng",      age: 27, address: "Bắc Ninh" },
      { id: 7, name: "Vũ Tiến Thành",    nickname: "Thành Thần",     age: 33, address: "Hưng Yên" },
      { id: 8, name: "Đỗ Quang Vinh",    nickname: "Vinh Sấm",       age: 30, address: "Nam Định" },
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
      { id: 1, name: "Trần Quốc Khánh",  nickname: "Khánh Đen",     age: 32, address: "TP. Hồ Chí Minh" },
      { id: 2, name: "Nguyễn Hoàng Long", nickname: "Long Rồng",     age: 27, address: "Bình Dương" },
      { id: 3, name: "Lê Thanh Tùng",    nickname: "Tùng Tiger",    age: 25, address: "Đồng Nai" },
      { id: 4, name: "Phạm Văn Đức",     nickname: "Đức Cẩm",       age: 30, address: "TP. Hồ Chí Minh" },
      { id: 5, name: "Vũ Mạnh Cường",    nickname: "Cường Sư Tử",   age: 28, address: "Vũng Tàu" },
      { id: 6, name: "Đinh Trọng Khương", nickname: "Khương Thần",   age: 33, address: "Cần Thơ" },
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
      { id: 1, name: "Nguyễn Xuân Trường", nickname: "Trường Xanh",  age: 29, address: "Đà Nẵng" },
      { id: 2, name: "Phạm Tuấn Kiệt",     nickname: "Kiệt Thần",    age: 26, address: "Quảng Nam" },
      { id: 3, name: "Trần Minh Tuấn",      nickname: "Tuấn Chớp",   age: 31, address: "Đà Nẵng" },
      { id: 4, name: "Lê Văn Hưng",         nickname: "Hưng Trâu",   age: 34, address: "Quảng Ngãi" },
      { id: 5, name: "Nguyễn Đức Anh",      nickname: "Anh Ó",       age: 23, address: "Huế" },
      { id: 6, name: "Hoàng Văn Linh",      nickname: "Linh Cáo",    age: 27, address: "Đà Nẵng" },
      { id: 7, name: "Ngô Đình Nhân",       nickname: "Nhân Nhện",   age: 25, address: "Bình Định" },
      { id: 8, name: "Bùi Văn An",          nickname: "An Tốc Độ",   age: 30, address: "Gia Lai" },
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
      { id: 1, name: "Võ Minh Tâm",      nickname: "Tâm Bướm",    age: 20, address: "Cần Thơ" },
      { id: 2, name: "Đinh Xuân Hùng",   nickname: "Hùng Trẻ",    age: 19, address: "An Giang" },
      { id: 3, name: "Nguyễn Văn Trọng", nickname: "Trọng Gió",   age: 21, address: "Kiên Giang" },
      { id: 4, name: "Trần Đình Khoa",   nickname: "Khoa Lửa",    age: 22, address: "Cần Thơ" },
      { id: 5, name: "Lê Minh Khoa",     nickname: "Khoa Nước",   age: 20, address: "Hậu Giang" },
      { id: 6, name: "Phạm Bá Thanh",    nickname: "Thanh Nhỏ",   age: 23, address: "Sóc Trăng" },
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
      { id: 1, name: "Lê Đình Tự",       nickname: "Tự Carom",    age: 35, address: "Hải Phòng" },
      { id: 2, name: "Bùi Văn Trương",   nickname: "Trương Già",  age: 40, address: "Hải Phòng" },
      { id: 3, name: "Phạm Văn Sơn",     nickname: "Sơn Núi",     age: 32, address: "Quảng Ninh" },
      { id: 4, name: "Nguyễn Quốc Hùng", nickname: "Hùng Bắc",   age: 29, address: "Hà Nội" },
      { id: 5, name: "Trần Văn Nam",      nickname: "Nam Mưa",     age: 31, address: "Thái Bình" },
      { id: 6, name: "Hoàng Đình Khải",  nickname: "Khải Phong",  age: 27, address: "Nam Định" },
      { id: 7, name: "Vũ Tiến Dũng",     nickname: "Dũng Thép",   age: 33, address: "Hải Phòng" },
      { id: 8, name: "Đỗ Thanh Bình",    nickname: "Bình Tĩnh",   age: 28, address: "Hưng Yên" },
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
      { id: 1, name: "Trần Thanh Lâm",    nickname: "Lâm Điện",    age: 30, address: "TP. Hồ Chí Minh" },
      { id: 2, name: "Nguyễn Hoàng Nam",  nickname: "Nam Phố",     age: 28, address: "TP. Hồ Chí Minh" },
      { id: 3, name: "Phạm Thanh Chương", nickname: "Chương Bay",  age: 32, address: "Bình Dương" },
      { id: 4, name: "Lê Đức Thịnh",      nickname: "Thịnh Vương", age: 35, address: "Long An" },
      { id: 5, name: "Hoàng Văn Tú",      nickname: "Tú Hổ",       age: 27, address: "Tiền Giang" },
      { id: 6, name: "Ngô Minh Phát",     nickname: "Phát Lốc",    age: 29, address: "TP. Hồ Chí Minh" },
      { id: 7, name: "Bùi Quốc Khánh",   nickname: "Khánh Bay",   age: 31, address: "Đồng Nai" },
      { id: 8, name: "Võ Thanh Tùng",     nickname: "Tùng Đen",    age: 26, address: "Bà Rịa - Vũng Tàu" },
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

/* ─── Player Profile Modal ───────────────────────────────────────────── */
const PlayerProfile = ({ player, onClose }) => {
  if (!player) return null;

  const nameParts = player.name.trim().split(" ");
  const lastName  = nameParts.at(-1);
  const firstName = nameParts.slice(0, -1).join(" ");
  const initials  = [nameParts.at(-2)?.[0], nameParts.at(-1)?.[0]]
    .filter(Boolean).join("").toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(160deg, #1e3a5f 0%, #0d1b2e 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <div className="flex justify-end px-5 pt-4">
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center pt-2 pb-5">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center border-[3px] border-white/15 shadow-xl"
              style={{ background: "linear-gradient(135deg, #2a4a70 0%, #162840 100%)" }}
            >
              <span className="text-4xl font-black text-white/60 select-none tracking-tight">
                {initials}
              </span>
            </div>
            <div className="absolute -inset-1.5 rounded-full border border-white/8" />
          </div>
        </div>

        {/* Tên */}
        <div className="text-center px-6 pb-5">
          <p className="text-white/45 text-sm font-light italic leading-none">{firstName}</p>
          <p className="text-white text-3xl font-black italic leading-tight tracking-tight mt-0.5">
            {lastName}
          </p>
          <p className="text-[#ef342a] text-sm font-semibold italic mt-1.5">"{player.nickname}"</p>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/8 mb-4" />

        {/* Info rows */}
        <div className="px-5 pb-6 space-y-2">
          {[
            { label: "Tuổi",    value: `${player.age} tuổi` },
            { label: "Địa chỉ", value: player.address        },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-2xl px-4 py-2.5"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase">{label}</span>
              <span className="text-sm font-light text-white/75">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Info tab ──────────────────────────────────────────────────────── */
const InfoTab = ({ t, onWatchNow }) => {
  const [nameSearch,     setNameSearch]     = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const filteredPlayers = useMemo(
    () => t.players.filter((p) => {
      const q = nameSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.nickname.toLowerCase().includes(q);
    }),
    [t.players, nameSearch]
  );

  return (
    <div className="space-y-0 rounded-3xl overflow-hidden shadow-md border border-gray-100">

      {/* ── 1. META STRIP ── */}
      <div className="bg-white grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { Icon: Calendar,   label: "Ngày thi đấu",     value: `${fmtDate(t.startAt)} – ${fmtDate(t.endAt)}` },
          { Icon: Building2,  label: "Địa điểm",         value: t.venue        },
          { Icon: MapPin,     label: "Khu vực",          value: t.location     },
          { Icon: DollarSign, label: "Tổng giải thưởng", value: fmtUSD(t.prizeFund) },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-5">
            <Icon size={16} className="text-[#0d1b2e]/30 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium leading-none mb-1">{label}</p>
              <p className="text-sm font-semibold text-[#0d1b2e] truncate leading-snug">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. PRIZE BREAKDOWN ── */}
      <div className="px-5 py-6" style={{ background: "linear-gradient(180deg, #0f2035 0%, #0d1b2e 100%)" }}>
        <div className="flex items-center gap-1.5 mb-4">
          <Trophy size={13} className="text-yellow-400" />
          <span className="text-[10px] font-bold tracking-[0.18em] text-white/40 uppercase">Cơ cấu giải thưởng</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {t.prizes.map((p, i) => (
            <div
              key={p.label}
              className="rounded-xl px-4 py-4"
              style={{ background: i === 0 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)" }}
            >
              <p className="text-[9px] text-white/35 uppercase tracking-wide font-medium mb-1.5">{p.label}</p>
              <p className={`font-black leading-none ${i === 0 ? "text-2xl text-yellow-400" : "text-lg text-white/80"}`}>
                {fmtUSD(p.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. LIVE BANNER ── */}
      <div
        className="relative overflow-hidden cursor-pointer group"
        style={{ background: "#0a1525" }}
        onClick={onWatchNow}
      >
        <img src={t.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
        <div className="relative flex items-center gap-4 px-6 py-5 border-t border-white/5">
          <Tv2 size={16} className="text-white/50 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase">Trực tiếp tại</p>
            <p className="text-white font-black italic text-sm uppercase tracking-wide leading-tight">
              Billiards <span className="text-[#ef342a]">Live</span> TV
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onWatchNow(); }}
            className="bg-[#ef342a] hover:bg-[#d42a22] active:scale-95 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg transition-all shrink-0 tracking-wider uppercase"
          >
            Xem ngay
          </button>
        </div>
      </div>

      {/* ── 5. DANH SÁCH CƠ THỦ ── */}
      <div className="bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)" }}>
          <div className="flex items-center gap-2">
            <User size={13} className="text-white/70" />
            <span className="text-[10px] font-bold tracking-[0.18em] text-white uppercase">Danh sách cơ thủ</span>
          </div>
          <span className="text-[10px] text-white/60 font-light">{filteredPlayers.length}/{t.players.length}</span>
        </div>

        <div className="px-4 pt-3 pb-5">
          <div className="relative mb-3">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm tên hoặc biệt danh..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="w-full bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-xl pl-8 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:border-[#0d1b2e]/15 focus:bg-white transition-all"
            />
          </div>

          {filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredPlayers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlayer(p)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#f8f9fb] hover:bg-[#eef0f5] transition-colors cursor-pointer group border border-transparent hover:border-[#0d1b2e]/10"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white/70"
                    style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0d1b2e 100%)" }}
                  >
                    {p.name.split(" ").at(-1)[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0d1b2e] leading-tight truncate group-hover:text-[#ef342a] transition-colors">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-[#ef342a]/70 font-light mt-0.5 truncate italic">
                      "{p.nickname}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 rounded-xl bg-[#f8f9fb]">
              <p className="text-gray-400 text-sm font-light">Không tìm thấy cơ thủ phù hợp.</p>
              <button onClick={() => setNameSearch("")} className="mt-2 text-[#ef342a] text-xs hover:underline">
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <PlayerProfile player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
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
  const { id }          = useParams();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "info");

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
  // Chỉ khoá tab trận đấu khi còn mở đăng ký — chưa chốt cơ thủ, chưa xếp cặp
  const matchesLocked = tournament.status === "OPEN_FOR_REGISTRATION";

  return (
    <div className="font-poppins w-full min-h-screen pb-28" style={{ background: "#f0f2f6" }}>

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
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-3 py-4 rounded-3xl overflow-hidden">
        {activeTab === "info"    && <InfoTab t={tournament} onWatchNow={() => setActiveTab("live")} />}
        {activeTab === "matches" && <MatchesTab tournament={tournament} />}
        {activeTab === "live"    && <ComingSoon label="Trực tiếp" />}
        {activeTab === "ranking" && <RankingTab tournament={tournament} />}
      </div>

      {/* ── Thanh điều hướng dưới — floating pill ── */}
      <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-6">
        <div
          className="flex gap-1 p-1.5 rounded-2xl shadow-xl w-full max-w-lg"
          style={{ background: "rgba(13,27,46,0.95)", backdropFilter: "blur(12px)" }}
        >
          {TABS.map((tab) => {
            const isActive   = activeTab === tab.id;
            const isDisabled = tab.id === "matches" && matchesLocked;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                title={isDisabled ? "Lịch thi đấu chưa được xếp" : undefined}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-1
                  py-2.5 rounded-xl transition-all duration-200
                  ${isDisabled
                    ? "text-white/15 cursor-not-allowed"
                    : isActive
                      ? "bg-white text-[#0d1b2e]"
                      : "text-white/50 hover:text-white/80"
                  }
                `}
              >
                <span className="relative">
                  <tab.Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                  {tab.live && isLive && (
                    <span className={`absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-[#ef342a] border ${isActive ? "border-white" : "border-[#0d1b2e]"}`} />
                  )}
                </span>
                <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-light"}`}>
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

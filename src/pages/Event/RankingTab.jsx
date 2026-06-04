import { useState, useMemo } from "react";
import { Search, Trophy, ChevronDown, Medal, Star } from "lucide-react";

/* ─── Ranking data per tournament ───────────────────────────────────── */
const RANKING_BY_TOURNAMENT = {
  /* Tournament 1 — Vietnam 9-Ball Open 2026 (IN_PROGRESS)
     Vòng 1 xong, Bán kết đang diễn ra → xếp hạng tạm thời */
  1: [
    { rank:1,     label:"#1",   name:"Nguyễn Văn Anh",    flag:"🇻🇳", country:"Việt Nam",    prize:15000, note:"Vào chung kết"  },
    { rank:2,     label:"#2",   name:"TBD",                flag:"",    country:"—",           prize:7000,  note:"Chờ bán kết 2" },
    { rank:"3-4", label:"#3-4", name:"Carlo Biado",        flag:"🇵🇭", country:"Philippines", prize:3500,  note:"Thua bán kết"  },
    { rank:"3-4", label:"#3-4", name:"James Aranas",       flag:"🇵🇭", country:"Philippines", prize:3500,  note:"Đang thi đấu"  },
    { rank:"5-8", label:"#5-8", name:"Ko Pin Yi",          flag:"🇹🇼", country:"Đài Loan",    prize:1450,  note:"Thua vòng 1"   },
    { rank:"5-8", label:"#5-8", name:"Trần Đức Minh",      flag:"🇻🇳", country:"Việt Nam",    prize:1450,  note:"Thua vòng 1"   },
    { rank:"5-8", label:"#5-8", name:"Lê Quang Hùng",      flag:"🇻🇳", country:"Việt Nam",    prize:1450,  note:"Thua vòng 1"   },
    { rank:"5-8", label:"#5-8", name:"Trần Quốc Tuấn",     flag:"🇻🇳", country:"Việt Nam",    prize:1450,  note:"Thua vòng 1"   },
  ],
  /* Tournament 2 — Carom 3 Băng (IN_PROGRESS) — vòng bảng chưa xong */
  2: [
    { rank:1,     label:"#1",   name:"Trần Quốc Khánh",   flag:"🇻🇳", country:"Việt Nam",    prize:9000,  note:"Dẫn đầu bảng"  },
    { rank:2,     label:"#2",   name:"Nguyễn Hoàng Long",  flag:"🇻🇳", country:"Việt Nam",    prize:4500,  note:"Hạng 2 bảng"   },
    { rank:3,     label:"#3",   name:"Lê Thanh Tùng",      flag:"🇻🇳", country:"Việt Nam",    prize:2500,  note:""              },
    { rank:4,     label:"#4",   name:"Phạm Văn Đức",       flag:"🇻🇳", country:"Việt Nam",    prize:1333,  note:""              },
    { rank:5,     label:"#5",   name:"Vũ Mạnh Cường",      flag:"🇻🇳", country:"Việt Nam",    prize:1333,  note:""              },
    { rank:6,     label:"#6",   name:"Đinh Trọng Khương",   flag:"🇻🇳", country:"Việt Nam",    prize:1333,  note:""              },
  ],
  /* Tournament 3 — Đà Nẵng 8-Ball (COMPLETED) — kết quả chính thức */
  3: [
    { rank:1,     label:"#1",   name:"Nguyễn Xuân Trường", flag:"🇻🇳", country:"Việt Nam",    prize:7000,  note:"Vô địch"  },
    { rank:2,     label:"#2",   name:"Phạm Tuấn Kiệt",     flag:"🇻🇳", country:"Việt Nam",    prize:3500,  note:"Á quân"   },
    { rank:"3-4", label:"#3-4", name:"Trần Minh Tuấn",      flag:"🇻🇳", country:"Việt Nam",    prize:1500,  note:""         },
    { rank:"3-4", label:"#3-4", name:"Lê Văn Hưng",         flag:"🇻🇳", country:"Việt Nam",    prize:1500,  note:""         },
    { rank:"5-8", label:"#5-8", name:"Nguyễn Đức Anh",      flag:"🇻🇳", country:"Việt Nam",    prize:500,   note:""         },
    { rank:"5-8", label:"#5-8", name:"Hoàng Văn Linh",       flag:"🇻🇳", country:"Việt Nam",    prize:500,   note:""         },
    { rank:"5-8", label:"#5-8", name:"Ngô Đình Nhân",        flag:"🇻🇳", country:"Việt Nam",    prize:500,   note:""         },
    { rank:"5-8", label:"#5-8", name:"Bùi Văn An",           flag:"🇻🇳", country:"Việt Nam",    prize:500,   note:""         },
  ],
  /* Tournament 4 — Bi-a Trẻ (OPEN_FOR_REGISTRATION) — chưa có xếp hạng */
  4: [],
  /* Tournament 5 — Billiards Miền Bắc (REGISTRATION_CLOSED) — chưa thi */
  5: [],
  /* Tournament 6 — HCM 8-Ball Open (COMPLETED) */
  6: [
    { rank:1,     label:"#1",   name:"Carlo Biado",         flag:"🇵🇭", country:"Philippines", prize:12000, note:"Vô địch"  },
    { rank:2,     label:"#2",   name:"Ko Pin Yi",           flag:"🇹🇼", country:"Đài Loan",    prize:6000,  note:"Á quân"   },
    { rank:"3-4", label:"#3-4", name:"Trần Thanh Lâm",      flag:"🇻🇳", country:"Việt Nam",    prize:2500,  note:""         },
    { rank:"3-4", label:"#3-4", name:"Nguyễn Hoàng Nam",    flag:"🇻🇳", country:"Việt Nam",    prize:2500,  note:""         },
    { rank:"5-8", label:"#5-8", name:"Phạm Thanh Chương",   flag:"🇻🇳", country:"Việt Nam",    prize:1000,  note:""         },
    { rank:"5-8", label:"#5-8", name:"Lê Đức Thịnh",        flag:"🇻🇳", country:"Việt Nam",    prize:1000,  note:""         },
    { rank:"5-8", label:"#5-8", name:"Efren Reyes",          flag:"🇵🇭", country:"Philippines", prize:1000,  note:""         },
    { rank:"5-8", label:"#5-8", name:"Chang Yi-Jen",         flag:"🇹🇼", country:"Đài Loan",    prize:1000,  note:""         },
  ],
};

const fmtUSD = (n) => `$${Number(n).toLocaleString("en-US")}`;

/* ─── Rank badge ────────────────────────────────────────────────────── */
const RankBadge = ({ label, size = "sm" }) => {
  const isFirst = label === "#1";
  const base = size === "lg"
    ? "text-sm font-bold px-3 py-1 rounded-xl min-w-[48px] text-center"
    : "text-xs font-semibold px-2 py-0.5 rounded-lg min-w-[40px] text-center";
  return (
    <span className={`${base} ${
      isFirst
        ? "bg-yellow-400/20 text-yellow-600 border border-yellow-400/40"
        : "bg-[#0d1b2e]/8 text-[#0d1b2e]/60 border border-[#0d1b2e]/10"
    }`}>
      {label}
    </span>
  );
};

/* ─── Champion card (#1) ────────────────────────────────────────────── */
const ChampionCard = ({ player, tournamentStatus }) => {
  const isTBD = player.name === "TBD";

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0d1b2e 0%, #132236 60%, #0d2040 100%)",
        border: "1.5px solid rgba(234,179,8,0.45)",
        boxShadow: "0 4px 32px rgba(234,179,8,0.12)",
      }}
    >
      {/* Gold shimmer top strip */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.6), transparent)" }} />

      <div className="flex items-center gap-5 px-7 py-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {isTBD
              ? <span className="text-white/20 text-2xl font-bold">?</span>
              : <Trophy size={28} className="text-yellow-400/60" />
            }
          </div>
          {/* #1 badge on avatar */}
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
            <Star size={13} className="text-yellow-900 fill-yellow-900" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <RankBadge label="#1" size="sm" />
            {tournamentStatus === "IN_PROGRESS" && (
              <span className="text-[9px] font-medium text-yellow-400/70 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                Tạm thời
              </span>
            )}
          </div>

          {isTBD ? (
            <p className="text-white/35 text-lg font-light italic">Chờ kết quả...</p>
          ) : (
            <>
              <p className="text-white font-semibold text-xl leading-tight">
                {player.name.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="font-extrabold italic">{player.name.split(" ").at(-1)}</span>
              </p>
              <p className="text-white/45 text-xs font-light mt-1 flex items-center gap-1.5">
                <span className="text-base leading-none">{player.flag}</span>
                {player.country.toUpperCase()}
              </p>
            </>
          )}

          {player.note && (
            <span className="inline-block mt-2 text-[9px] font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              {player.note}
            </span>
          )}
        </div>

        {/* Prize */}
        <div className="shrink-0 text-right">
          <p className="text-yellow-400 text-2xl font-extrabold tabular-nums">{fmtUSD(player.prize)}</p>
          <p className="text-white/30 text-[10px] font-light mt-0.5">giải thưởng</p>
        </div>
      </div>

      {/* Gold shimmer bottom strip */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.6), transparent)" }} />
    </div>
  );
};

/* ─── Rank row ──────────────────────────────────────────────────────── */
const RankRow = ({ player, isLast }) => {
  const isTBD = player.name === "TBD";
  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[#f8f9fb] transition-colors ${!isLast ? "border-b border-gray-100" : ""}`}>
      {/* Rank badge */}
      <div className="w-12 shrink-0 flex justify-center">
        <RankBadge label={player.label} />
      </div>

      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center"
        style={{ background: "#f0f2f6" }}
      >
        {isTBD
          ? <span className="text-gray-300 text-sm font-bold">?</span>
          : <Medal size={15} className={player.rank === 2 ? "text-gray-400" : "text-gray-300"} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isTBD ? (
          <p className="text-gray-400 text-sm font-light italic">Chờ kết quả...</p>
        ) : (
          <>
            <p className="text-[#0d1b2e] text-sm leading-tight">
              {player.name.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="font-semibold">{player.name.split(" ").at(-1)}</span>
            </p>
            <p className="text-gray-400 text-[10px] font-light mt-0.5 flex items-center gap-1">
              <span className="text-xs leading-none">{player.flag}</span>
              {player.country}
            </p>
          </>
        )}
        {player.note && (
          <span className="inline-block mt-1 text-[9px] font-light text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {player.note}
          </span>
        )}
      </div>

      {/* Prize */}
      <div className="shrink-0 text-right">
        <p className="text-[#ef342a] text-base font-bold tabular-nums">{fmtUSD(player.prize)}</p>
      </div>
    </div>
  );
};

/* ─── Main RankingTab ───────────────────────────────────────────────── */
const RankingTab = ({ tournament }) => {
  const [nameSearch,  setNameSearch]  = useState("");
  const [rankFilter,  setRankFilter]  = useState("");

  const allRankings = RANKING_BY_TOURNAMENT[tournament?.id] || [];
  const isInProgress = tournament?.status === "IN_PROGRESS";
  const noData = allRankings.length === 0;

  /* Rank group options derived from data */
  const rankGroups = useMemo(() => {
    const seen = new Set();
    return allRankings
      .map((r) => r.label)
      .filter((l) => { if (seen.has(l)) return false; seen.add(l); return true; });
  }, [allRankings]);

  const filtered = useMemo(() => {
    return allRankings.filter((r) => {
      const okName = !nameSearch || r.name.toLowerCase().includes(nameSearch.toLowerCase());
      const okRank = !rankFilter  || r.label === rankFilter;
      return okName && okRank;
    });
  }, [allRankings, nameSearch, rankFilter]);

  const champion = filtered[0];
  const rest     = filtered.slice(1);

  /* No data states */
  if (noData) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
        <Trophy size={36} className="text-gray-200" />
        <p className="text-gray-400 text-sm font-medium">Chưa có xếp hạng</p>
        <p className="text-gray-300 text-xs font-light">
          {tournament?.status === "OPEN_FOR_REGISTRATION"
            ? "Giải đấu chưa bắt đầu"
            : "Chờ kết thúc đăng ký"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Status + filter bar ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* Status badge */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full shrink-0 ${
            isInProgress
              ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
              : "bg-green-50 text-green-600 border border-green-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isInProgress ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
            {isInProgress ? "Xếp hạng tạm thời" : "Kết quả chính thức"}
          </div>

          {/* Search by name */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm tên cơ thủ..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="w-full bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-8 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:border-[#0d1b2e]/15 focus:bg-white transition-all"
            />
          </div>

          {/* Filter by rank group */}
          <div className="relative min-w-[150px]">
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="w-full appearance-none bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-4 pr-8 py-2 focus:outline-none focus:border-[#0d1b2e]/15 transition-all cursor-pointer"
            >
              <option value="">Tất cả thứ hạng</option>
              {rankGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Count */}
          <span className="text-[11px] text-gray-400 font-light shrink-0">
            {filtered.length}/{allRankings.length} cơ thủ
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm text-center py-14">
          <p className="text-gray-400 text-sm font-light">Không tìm thấy cơ thủ.</p>
          <button
            onClick={() => { setNameSearch(""); setRankFilter(""); }}
            className="mt-2 text-[#ef342a] text-xs hover:underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <>
          {/* ── Champion card ── */}
          {champion && <ChampionCard player={champion} tournamentStatus={tournament?.status} />}

          {/* ── Rest of rankings ── */}
          {rest.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {rest.map((player, idx) => (
                <RankRow
                  key={`${player.name}-${idx}`}
                  player={player}
                  isLast={idx === rest.length - 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RankingTab;

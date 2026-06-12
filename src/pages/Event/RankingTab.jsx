import { useState, useMemo } from "react";
import { Search, Trophy, ChevronDown, Star } from "lucide-react";

/* ─── Ranking data per tournament ───────────────────────────────────── */
const RANKING_BY_TOURNAMENT = {
  1: [
    { rank:1,     label:"#1",   name:"Nguyễn Văn Anh",    nickname:"Anh Cơ",         prize:15000, note:"Vào chung kết"  },
    { rank:2,     label:"#2",   name:"TBD",                nickname:"",               prize:7000,  note:"Chờ bán kết 2" },
    { rank:"3-4", label:"#3-4", name:"Carlo Biado",        nickname:"The Magician",   prize:3500,  note:"Thua bán kết"  },
    { rank:"3-4", label:"#3-4", name:"James Aranas",       nickname:"Jimbo",          prize:3500,  note:"Đang thi đấu"  },
    { rank:"5-8", label:"#5-8", name:"Ko Pin Yi",          nickname:"Silent Killer",  prize:1450,  note:"Thua vòng 1"   },
    { rank:"5-8", label:"#5-8", name:"Trần Đức Minh",      nickname:"Minh Cơ",        prize:1450,  note:"Thua vòng 1"   },
    { rank:"5-8", label:"#5-8", name:"Lê Quang Hùng",      nickname:"Hùng Lê",        prize:1450,  note:"Thua vòng 1"   },
    { rank:"5-8", label:"#5-8", name:"Trần Quốc Tuấn",     nickname:"Tuấn Bull",      prize:1450,  note:"Thua vòng 1"   },
  ],
  2: [
    { rank:1,     label:"#1",   name:"Trần Quốc Khánh",   nickname:"Khánh Pro",      prize:9000,  note:"Dẫn đầu bảng"  },
    { rank:2,     label:"#2",   name:"Nguyễn Hoàng Long",  nickname:"Long Shark",     prize:4500,  note:"Hạng 2 bảng"   },
    { rank:3,     label:"#3",   name:"Lê Thanh Tùng",      nickname:"Tùng Lê",        prize:2500,  note:""              },
    { rank:4,     label:"#4",   name:"Phạm Văn Đức",       nickname:"Đức Phạm",       prize:1333,  note:""              },
    { rank:5,     label:"#5",   name:"Vũ Mạnh Cường",      nickname:"Cường Tiger",    prize:1333,  note:""              },
    { rank:6,     label:"#6",   name:"Đinh Trọng Khương",   nickname:"Khương Pro",     prize:1333,  note:""              },
  ],
  3: [
    { rank:1,     label:"#1",   name:"Nguyễn Xuân Trường", nickname:"Trường Billiard",prize:7000,  note:"Vô địch"  },
    { rank:2,     label:"#2",   name:"Phạm Tuấn Kiệt",     nickname:"Kiệt Phạm",      prize:3500,  note:"Á quân"   },
    { rank:"3-4", label:"#3-4", name:"Trần Minh Tuấn",      nickname:"Tuấn Classic",   prize:1500,  note:""         },
    { rank:"3-4", label:"#3-4", name:"Lê Văn Hưng",         nickname:"Hưng Pro",       prize:1500,  note:""         },
    { rank:"5-8", label:"#5-8", name:"Nguyễn Đức Anh",      nickname:"Anh Đức",        prize:500,   note:""         },
    { rank:"5-8", label:"#5-8", name:"Hoàng Văn Linh",       nickname:"Linh Hoàng",     prize:500,   note:""         },
    { rank:"5-8", label:"#5-8", name:"Ngô Đình Nhân",        nickname:"Nhân Ngô",       prize:500,   note:""         },
    { rank:"5-8", label:"#5-8", name:"Bùi Văn An",           nickname:"An Bùi",         prize:500,   note:""         },
  ],
  /* Tournament 4 — HCM City 8-Ball Open (COMPLETED, group_stage) */
  4: [
    { rank:1,     label:"#1",   name:"Nguyễn Văn Anh",    nickname:"Anh Cò",       prize:12000, note:"Vô địch"   },
    { rank:2,     label:"#2",   name:"Nguyễn Mạnh Hùng",  nickname:"Hùng Gấu",     prize:6000,  note:"Á quân"    },
    { rank:"3-4", label:"#3-4", name:"James Aranas",       nickname:"Django",        prize:2500,  note:"Thua SF"   },
    { rank:"3-4", label:"#3-4", name:"Ko Pin Yi",          nickname:"Silent Killer", prize:2500,  note:"Thua SF"   },
    { rank:"5-8", label:"#5-8", name:"Carlo Biado",        nickname:"The Magician",  prize:800,   note:""          },
    { rank:"5-8", label:"#5-8", name:"Trần Đức Minh",      nickname:"Minh Lửa",      prize:800,   note:""          },
    { rank:"5-8", label:"#5-8", name:"Lê Quang Hùng",      nickname:"Hùng Phong",    prize:800,   note:""          },
    { rank:"5-8", label:"#5-8", name:"Trần Quốc Tuấn",     nickname:"Tuấn Bão",      prize:800,   note:""          },
  ],
  /* Tournament 5 — OPEN_FOR_REGISTRATION */
  5: [],
  /* Tournament 6 — REGISTRATION_CLOSED (chưa thi đấu) */
  6: [],
  /* Tournament 7 — Giải Bi-a Trẻ Toàn Quốc (IN_PROGRESS, group_stage) */
  7: [
    { rank:1,     label:"#1",   name:"Võ Minh Tâm",       nickname:"Tâm Bướm",    prize:5000,  note:"Dẫn đầu bảng" },
    { rank:2,     label:"#2",   name:"Trần Đình Khoa",    nickname:"Khoa Lửa",    prize:2500,  note:"Hạng 2 bảng"  },
    { rank:"3-4", label:"#3-4", name:"Nguyễn Văn Trọng",  nickname:"Trọng Gió",   prize:1200,  note:""             },
    { rank:"3-4", label:"#3-4", name:"Huỳnh Công Danh",   nickname:"Danh Sóng",   prize:1200,  note:""             },
    { rank:"5-8", label:"#5-8", name:"Đinh Xuân Hùng",    nickname:"Hùng Trẻ",    prize:400,   note:""             },
    { rank:"5-8", label:"#5-8", name:"Lê Minh Khoa",      nickname:"Khoa Nước",   prize:400,   note:""             },
    { rank:"5-8", label:"#5-8", name:"Phạm Bá Thanh",     nickname:"Thanh Nhỏ",   prize:400,   note:""             },
    { rank:"5-8", label:"#5-8", name:"Ngô Thanh Phong",   nickname:"Phong Gió",   prize:400,   note:""             },
  ],
  /* Tournament 8 — Vô Địch Billiards Miền Bắc (COMPLETED, double_elimination) */
  8: [
    { rank:1,     label:"#1",   name:"Lê Đình Tự",        nickname:"Tự Carom",    prize:8000,  note:"Vô địch"   },
    { rank:2,     label:"#2",   name:"Vũ Tiến Dũng",      nickname:"Dũng Thép",   prize:4000,  note:"Á quân"    },
    { rank:"3-4", label:"#3-4", name:"Bùi Văn Trương",    nickname:"Trương Già",  prize:1800,  note:""          },
    { rank:"3-4", label:"#3-4", name:"Nguyễn Quốc Hùng",  nickname:"Hùng Bắc",   prize:1800,  note:""          },
    { rank:"5-8", label:"#5-8", name:"Phạm Văn Sơn",      nickname:"Sơn Núi",     prize:600,   note:""          },
    { rank:"5-8", label:"#5-8", name:"Trần Văn Nam",       nickname:"Nam Mưa",     prize:600,   note:""          },
    { rank:"5-8", label:"#5-8", name:"Hoàng Đình Khải",   nickname:"Khải Phong",  prize:600,   note:""          },
    { rank:"5-8", label:"#5-8", name:"Đỗ Thanh Bình",     nickname:"Bình Tĩnh",   prize:600,   note:""          },
  ],
  /* Tournament 9 — UPCOMING */
  9: [],
  /* Tournament 10 — OPEN_FOR_REGISTRATION */
  10: [],
};

const fmtUSD = (n) => `$${Number(n).toLocaleString("en-US")}`;

/* ─── Initials avatar ───────────────────────────────────────────────── */
const PlayerAvatar = ({ name, size = "md" }) => {
  const initial = name === "TBD" ? "?" : (name?.split(" ").at(-1)?.[0]?.toUpperCase() || "?");
  const sz = size === "lg"
    ? "w-16 h-16 rounded-2xl text-2xl"
    : "w-10 h-10 rounded-xl text-sm";
  return (
    <div
      className={`${sz} shrink-0 flex items-center justify-center font-black text-white/80`}
      style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0d1b2e 100%)" }}
    >
      {initial}
    </div>
  );
};

/* ─── Rank badge ────────────────────────────────────────────────────── */
const RankBadge = ({ label, size = "sm" }) => {
  const isFirst  = label === "#1";
  const isSecond = label === "#2";
  const isThird  = label === "#3" || label === "#3-4";
  const base = size === "lg"
    ? "text-sm font-bold px-3 py-1 rounded-xl min-w-[56px] text-center whitespace-nowrap"
    : "text-[11px] font-bold px-2.5 py-0.5 rounded-lg min-w-[52px] text-center whitespace-nowrap";
  const color = isFirst
    ? "bg-yellow-400/20 text-yellow-600 border border-yellow-400/40"
    : isSecond
      ? "bg-gray-200/60 text-gray-500 border border-gray-300/60"
      : isThird
        ? "bg-amber-100 text-amber-700 border border-amber-300/50"
        : "bg-[#0d1b2e]/8 text-[#0d1b2e]/50 border border-[#0d1b2e]/10";
  return <span className={`${base} ${color}`}>{label}</span>;
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
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.6), transparent)" }} />

      <div className="flex items-center gap-5 px-7 py-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          {isTBD ? (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                 style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-white/20 text-2xl font-bold">?</span>
            </div>
          ) : (
            <PlayerAvatar name={player.name} size="lg" />
          )}
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
            <Star size={13} className="text-yellow-900 fill-yellow-900" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
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
                <span className="font-extrabold italic text-yellow-300">{player.name.split(" ").at(-1)}</span>
              </p>
              {player.nickname && (
                <p className="text-white/40 text-xs font-light mt-1 italic">"{player.nickname}"</p>
              )}
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
      <div className="shrink-0 flex justify-center" style={{ minWidth: 56 }}>
        <RankBadge label={player.label} />
      </div>

      {/* Avatar */}
      {isTBD
        ? <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-gray-100">
            <span className="text-gray-300 text-sm font-bold">?</span>
          </div>
        : <PlayerAvatar name={player.name} size="md" />
      }

      {/* Name + nickname */}
      <div className="flex-1 min-w-0">
        {isTBD ? (
          <p className="text-gray-400 text-sm font-light italic">Chờ kết quả...</p>
        ) : (
          <>
            <p className="text-[#0d1b2e] text-sm leading-tight">
              {player.name.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="font-bold text-[#ef342a]">{player.name.split(" ").at(-1)}</span>
            </p>
            {player.nickname && (
              <p className="text-gray-400 text-[10px] font-light mt-0.5 italic">"{player.nickname}"</p>
            )}
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
  const [nameSearch, setNameSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("");

  const allRankings  = RANKING_BY_TOURNAMENT[tournament?.id] || [];
  const isInProgress = tournament?.status === "IN_PROGRESS";
  const noData       = allRankings.length === 0;

  const rankGroups = useMemo(() => {
    const seen = new Set();
    return allRankings.map((r) => r.label).filter((l) => { if (seen.has(l)) return false; seen.add(l); return true; });
  }, [allRankings]);

  const filtered = useMemo(() => allRankings.filter((r) => {
    const okName = !nameSearch || r.name.toLowerCase().includes(nameSearch.toLowerCase());
    const okRank = !rankFilter  || r.label === rankFilter;
    return okName && okRank;
  }), [allRankings, nameSearch, rankFilter]);

  const champion = filtered[0];
  const rest     = filtered.slice(1);

  if (noData) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
        <Trophy size={36} className="text-gray-200" />
        <p className="text-gray-400 text-sm font-medium">Chưa có xếp hạng</p>
        <p className="text-gray-300 text-xs font-light">
          {tournament?.status === "OPEN_FOR_REGISTRATION" ? "Giải đấu chưa bắt đầu" : "Chờ kết thúc đăng ký"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full shrink-0 ${
            isInProgress ? "bg-yellow-50 text-yellow-600 border border-yellow-200" : "bg-green-50 text-green-600 border border-green-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isInProgress ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
            {isInProgress ? "Xếp hạng tạm thời" : "Kết quả chính thức"}
          </div>

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

          <div className="relative min-w-[150px]">
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="w-full appearance-none bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-4 pr-8 py-2 focus:outline-none focus:border-[#0d1b2e]/15 transition-all cursor-pointer"
            >
              <option value="">Tất cả thứ hạng</option>
              {rankGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <span className="text-[11px] text-gray-400 font-light shrink-0">
            {filtered.length}/{allRankings.length} cơ thủ
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm text-center py-14">
          <p className="text-gray-400 text-sm font-light">Không tìm thấy cơ thủ.</p>
          <button onClick={() => { setNameSearch(""); setRankFilter(""); }} className="mt-2 text-[#ef342a] text-xs hover:underline">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <>
          {champion && <ChampionCard player={champion} tournamentStatus={tournament?.status} />}
          {rest.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {rest.map((player, idx) => (
                <RankRow key={`${player.name}-${idx}`} player={player} isLast={idx === rest.length - 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RankingTab;

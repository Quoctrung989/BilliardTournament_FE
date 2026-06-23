import { useState, useMemo } from "react";
import { Search, List, GitBranch, Clock, ChevronDown } from "lucide-react";

/* ─── Mock data ──────────────────────────────────────────────────────── */
/* Rounds của Tournament 1 (Vietnam 9-Ball Open 2026 — IN_PROGRESS)
   Bracket 8 người: 4 trận Vòng 1 → 2 Bán kết → 1 Chung kết
   Tất cả 8 cơ thủ khớp với danh sách players của tournament id=1 */
const ROUNDS = [
  { id: "r1", label: "Vòng 1",    raceTO: 7  },
  { id: "sf", label: "Bán kết",   raceTO: 9  },
  { id: "f",  label: "Chung kết", raceTO: 11 },
];

const MATCHES = [
  /* ── Vòng 1 (2026-06-01) — 4 trận, tất cả đã kết thúc ── */
  { id:"m1", roundId:"r1", seq:1, table:"B1", time:"2026-06-01T09:00",
    p1:{ name:"Nguyễn Văn Anh",    flag:"🇻🇳", score:7 },
    p2:{ name:"Ko Pin Yi",          flag:"🇹🇼", score:3 },
    status:"done", winSide:1 },
  { id:"m2", roundId:"r1", seq:2, table:"B2", time:"2026-06-01T09:00",
    p1:{ name:"Carlo Biado",        flag:"🇵🇭", score:7 },
    p2:{ name:"Trần Đức Minh",      flag:"🇻🇳", score:5 },
    status:"done", winSide:1 },
  { id:"m3", roundId:"r1", seq:3, table:"B3", time:"2026-06-01T11:00",
    p1:{ name:"James Aranas",       flag:"🇵🇭", score:7 },
    p2:{ name:"Lê Quang Hùng",      flag:"🇻🇳", score:2 },
    status:"done", winSide:1 },
  { id:"m4", roundId:"r1", seq:4, table:"B4", time:"2026-06-01T11:00",
    p1:{ name:"Trần Quốc Tuấn",     flag:"🇻🇳", score:4 },
    p2:{ name:"Nguyễn Mạnh Hùng",   flag:"🇻🇳", score:7 },
    status:"done", winSide:2 },

  /* ── Bán kết (2026-06-03) — m5 đã xong, m6 đang diễn ra ── */
  { id:"m5", roundId:"sf", seq:1, table:"B1", time:"2026-06-03T14:00",
    /* Nguyễn Văn Anh (thắng m1) vs Carlo Biado (thắng m2) */
    p1:{ name:"Nguyễn Văn Anh",    flag:"🇻🇳", score:9 },
    p2:{ name:"Carlo Biado",        flag:"🇵🇭", score:7 },
    status:"done", winSide:1 },
  { id:"m6", roundId:"sf", seq:2, table:"B2", time:"2026-06-03T14:00",
    /* James Aranas (thắng m3) vs Nguyễn Mạnh Hùng (thắng m4) */
    p1:{ name:"James Aranas",       flag:"🇵🇭", score:5 },
    p2:{ name:"Nguyễn Mạnh Hùng",   flag:"🇻🇳", score:7 },
    status:"live", winSide:null },

  /* ── Chung kết (2026-06-05) — chưa diễn ra ── */
  { id:"m7", roundId:"f", seq:1, table:"B1", time:"2026-06-05T16:00",
    /* Nguyễn Văn Anh (thắng sf1) vs TBD (chờ kết quả sf2) */
    p1:{ name:"Nguyễn Văn Anh",    flag:"🇻🇳", score:null },
    p2:{ name:"TBD",                flag:"",    score:null },
    status:"upcoming", winSide:null },
];

/* ─── Helpers ──────────────────────────────────────────────────────── */
const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day:"2-digit", month:"2-digit",
    hour:"2-digit", minute:"2-digit",
    hour12: false,
  }).replace(",","");
};

const STATUS_META = {
  done:     { label:"Đã kết thúc",  bg:"bg-gray-100",   text:"text-gray-500",  dot:"bg-gray-400"  },
  live:     { label:"Đang diễn ra", bg:"bg-red-50",     text:"text-red-500",   dot:"bg-red-500"   },
  upcoming: { label:"Sắp diễn ra",  bg:"bg-blue-50",    text:"text-blue-500",  dot:"bg-blue-400"  },
};

/* ─── Match card (list view) ───────────────────────────────────────── */
const MatchRow = ({ m }) => {
  const meta   = STATUS_META[m.status] || STATUS_META.upcoming;
  const isLive = m.status === "live";

  const PlayerSide = ({ player, win, align }) => (
    <div className={`flex items-center gap-2 flex-1 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <span className="text-base leading-none">{player.flag}</span>
      <span className={`text-sm leading-tight truncate max-w-[100px] sm:max-w-[140px] ${win ? "font-semibold text-[#0d1b2e]" : "font-light text-gray-500"}`}>
        {player.name}
      </span>
      {player.score != null && (
        <span className={`text-lg font-bold tabular-nums ${win ? "text-[#0d1b2e]" : "text-gray-400"}`}>
          {player.score}
        </span>
      )}
    </div>
  );

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${isLive ? "bg-red-50/40" : ""}`}>
      {/* Table badge */}
      <span className="shrink-0 text-[10px] font-semibold text-white bg-[#0d1b2e] rounded-lg px-2 py-1 w-9 text-center">
        {m.table}
      </span>

      {/* Players */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <PlayerSide player={m.p1} win={m.winSide === 1} align="left"  />
        <span className="shrink-0 text-[10px] font-medium text-gray-400 px-1">VS</span>
        <PlayerSide player={m.p2} win={m.winSide === 2} align="right" />
      </div>

      {/* Right: status + time */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${isLive ? "animate-pulse" : ""}`} />
          {meta.label}
        </span>
        <span className="text-[10px] text-gray-400 font-light flex items-center gap-0.5">
          <Clock size={9} />
          {fmtTime(m.time)}
        </span>
      </div>
    </div>
  );
};

/* ─── List view ────────────────────────────────────────────────────── */
const ListView = ({ matches, rounds }) => (
  <div className="space-y-4">
    {rounds.map((round) => {
      const rMatches = matches.filter((m) => m.roundId === round.id);
      if (rMatches.length === 0) return null;
      return (
        <div key={round.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Round header */}
          <div
            className="flex items-center justify-between px-5 py-2.5"
            style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #162840 100%)" }}
          >
            <span className="text-xs font-semibold text-white tracking-wide">{round.label}</span>
            <span className="text-[10px] font-light text-white/50">Race to {round.raceTO}</span>
          </div>
          {/* Match rows */}
          <div>
            {rMatches.map((m) => <MatchRow key={m.id} m={m} />)}
          </div>
        </div>
      );
    })}
  </div>
);

/* ─── Bracket card ─────────────────────────────────────────────────── */
const BracketCard = ({ match, compact }) => {
  const isLive     = match?.status === "live";
  const isUpcoming = match?.status === "upcoming";
  const W = compact ? 180 : 210;

  if (!match) {
    return (
      <div
        className="rounded-xl border border-dashed border-white/10 flex items-center justify-center"
        style={{ width: W, height: 70, background: "rgba(255,255,255,0.04)" }}
      >
        <span className="text-white/20 text-xs">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl overflow-hidden border ${isLive ? "border-red-500/40" : "border-white/10"}`}
      style={{ width: W, height: 70, background: isLive ? "rgba(239,52,42,0.08)" : "rgba(255,255,255,0.06)" }}
    >
      {/* header bar */}
      <div className="flex items-center justify-between px-2.5 pt-1.5 pb-0.5">
        <span className="text-[9px] text-white/30 font-medium">{match.table}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-[9px] text-red-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE
          </span>
        )}
        {!isLive && (
          <span className="text-[9px] text-white/25">{fmtTime(match.time)}</span>
        )}
      </div>
      {/* Players */}
      {[
        { p: match.p1, side: 1 },
        { p: match.p2, side: 2 },
      ].map(({ p, side }) => {
        const isWinner = match.winSide === side;
        return (
          <div key={side} className={`flex items-center justify-between px-2.5 py-[3px] mx-1 rounded ${isWinner ? "bg-white/10" : ""}`}>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs leading-none shrink-0">{p.flag}</span>
              <span
                className={`text-[11px] leading-tight truncate ${
                  isWinner ? "text-white font-semibold" : isUpcoming ? "text-white/60 font-light" : "text-white/45 font-light"
                }`}
                style={{ maxWidth: compact ? 100 : 125 }}
              >
                {p.name || "TBD"}
              </span>
            </div>
            <span className={`text-sm font-bold tabular-nums shrink-0 ${isWinner ? "text-white" : "text-white/35"}`}>
              {p.score ?? (isUpcoming ? "" : "—")}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Bracket view ─────────────────────────────────────────────────── */
const CARD_H     = 70;
const CARD_W     = 210;
const PAIR_GAP   = 14;  // gap between matches in same pair
const PAIR_SPACE = 28;  // extra vertical space between pairs
const ROUND_GAP  = 56;  // horizontal gap between rounds

/*
  Round 0 (r1): 4 matches → 2 pairs
  Round 1 (sf): 2 matches → 1 pair
  Round 2 (f):  1 match

  Slot height for round r = CARD_H + gap_within_round
    r=0: slot = CARD_H + PAIR_GAP = 84
    r=1: 2 × slot_r0 + PAIR_SPACE = 2×84 + 28 = 196  → center of pair
    r=2: 2 × slot_r1 = 392

  Match center_y for round r, match idx m:
    r=0: m × 84 + 35 (for m in 0-3, pairs: [0,1] and [2,3])
         pair break after idx 1 → m>=2: add PAIR_SPACE
    r=1: feed from r=0 pair → center between the two feeding matches
    r=2: center of the two r=1 matches
*/

function calcMatchY(rIdx, mIdx) {
  if (rIdx === 0) {
    const pairOffset = mIdx >= 2 ? PAIR_SPACE : 0;
    return mIdx * (CARD_H + PAIR_GAP) + pairOffset + CARD_H / 2;
  }
  if (rIdx === 1) {
    // center between the 2 feeding r0 matches
    const feed0 = calcMatchY(0, mIdx * 2);
    const feed1 = calcMatchY(0, mIdx * 2 + 1);
    return (feed0 + feed1) / 2;
  }
  // rIdx === 2
  const feed0 = calcMatchY(1, 0);
  const feed1 = calcMatchY(1, 1);
  return (feed0 + feed1) / 2;
}

function calcMatchTop(rIdx, mIdx) {
  return calcMatchY(rIdx, mIdx) - CARD_H / 2;
}

const totalH = calcMatchY(0, 2) - CARD_H / 2 + CARD_H + CARD_H / 2 + PAIR_GAP * 2 + PAIR_SPACE;
// Simpler: bottom of last r0 match + some padding
const SVG_H = Math.ceil(calcMatchTop(0, 3) + CARD_H + 20);

function xLeft(rIdx)  { return rIdx * (CARD_W + ROUND_GAP); }
function xRight(rIdx) { return xLeft(rIdx) + CARD_W; }
const SVG_W = xRight(2) + 20;

/* connector paths between rounds */
function connectorPath(fromRIdx, fromMIdx) {
  const x0   = xRight(fromRIdx);
  const y0   = calcMatchY(fromRIdx, fromMIdx);
  const toMIdx = Math.floor(fromMIdx / 2);
  const x1   = xLeft(fromRIdx + 1);
  const y1   = calcMatchY(fromRIdx + 1, toMIdx);
  const midX = x0 + ROUND_GAP / 2;
  return `M ${x0} ${y0} H ${midX} V ${y1} H ${x1}`;
}

const BracketView = ({ matches }) => {
  const roundsData = [
    { id:"r1", label:"Vòng 1",    raceTO:7  },
    { id:"sf", label:"Bán kết",   raceTO:9  },
    { id:"f",  label:"Chung kết", raceTO:11 },
  ];

  const byRound = (id) => matches.filter((m) => m.roundId === id).sort((a,b)=>a.seq-b.seq);
  const r0 = byRound("r1");  // 4 matches
  const r1 = byRound("sf");  // 2 matches
  const r2 = byRound("f");   // 1 match
  const allByRound = [r0, r1, r2];

  return (
    <div
      className="rounded-3xl overflow-auto border border-gray-100 shadow-sm"
      style={{ background: "linear-gradient(160deg, #0d1b2e 0%, #0f2237 100%)" }}
    >
      {/* Round column headers */}
      <div className="flex border-b border-white/8" style={{ width: SVG_W + 40, paddingLeft: 20, paddingRight: 20 }}>
        {roundsData.map((r, rIdx) => (
          <div
            key={r.id}
            className="flex-shrink-0 text-center py-2.5"
            style={{ width: CARD_W, marginLeft: rIdx > 0 ? ROUND_GAP : 0 }}
          >
            <p className="text-white text-xs font-semibold">{r.label}</p>
            <p className="text-white/35 text-[10px] font-light">Race to {r.raceTO}</p>
          </div>
        ))}
      </div>

      {/* Bracket body */}
      <div className="relative" style={{ width: SVG_W + 40, height: SVG_H, margin: "16px 20px" }}>
        {/* SVG connectors */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={SVG_W}
          height={SVG_H}
          style={{ overflow: "visible" }}
        >
          {/* R0 → R1 connectors (4 lines) */}
          {[0,1,2,3].map((i) => (
            <path key={`c0-${i}`} d={connectorPath(0, i)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
          ))}
          {/* R1 → R2 connectors (2 lines) */}
          {[0,1].map((i) => (
            <path key={`c1-${i}`} d={connectorPath(1, i)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
          ))}
        </svg>

        {/* Match cards — absolutely positioned */}
        {allByRound.map((roundMatches, rIdx) =>
          roundMatches.map((match, mIdx) => (
            <div
              key={match.id}
              className="absolute"
              style={{
                left:  xLeft(rIdx),
                top:   calcMatchTop(rIdx, mIdx),
              }}
            >
              <BracketCard match={match} compact={false} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ─── Main MatchesTab export ───────────────────────────────────────── */
const MatchesTab = ({ tournament }) => {
  const [view,          setView]          = useState("list");
  const [nameSearch,    setNameSearch]    = useState("");
  const [roundFilter,   setRoundFilter]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [sortOrder,     setSortOrder]     = useState("asc");

  const filteredMatches = useMemo(() => {
    return MATCHES
      .filter((m) => {
        const search = nameSearch.toLowerCase();
        const inName = !search ||
          m.p1.name.toLowerCase().includes(search) ||
          m.p2.name.toLowerCase().includes(search);
        const inRound  = !roundFilter  || m.roundId  === roundFilter;
        const inStatus = !statusFilter || m.status   === statusFilter;
        return inName && inRound && inStatus;
      })
      .sort((a, b) => {
        const diff = new Date(a.time) - new Date(b.time);
        return sortOrder === "asc" ? diff : -diff;
      });
  }, [nameSearch, roundFilter, statusFilter, sortOrder]);

  return (
    <div className="space-y-4">

      {/* ── View toggle ── */}
      <div className="flex gap-2">
        {[
          { id:"list",    label:"Danh sách", Icon: List      },
          { id:"bracket", label:"Sơ đồ",     Icon: GitBranch },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
              view === id
                ? "bg-[#0d1b2e] text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filters (only in list view) ── */}
      {view === "list" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex flex-wrap gap-2.5">
            {/* Search by player */}
            <div className="relative flex-1 min-w-[160px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm tên cơ thủ..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-full bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-8 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:border-[#0d1b2e]/15 focus:bg-white transition-all"
              />
            </div>

            {/* Filter by round */}
            <div className="relative min-w-[140px]">
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
                className="w-full appearance-none bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-4 pr-8 py-2 focus:outline-none focus:border-[#0d1b2e]/15 transition-all cursor-pointer"
              >
                <option value="">Tất cả vòng</option>
                {ROUNDS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Filter by status */}
            <div className="relative min-w-[150px]">
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-4 pr-8 py-2 focus:outline-none focus:border-[#0d1b2e]/15 transition-all cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="done">Đã kết thúc</option>
                <option value="live">Đang diễn ra</option>
                <option value="upcoming">Sắp diễn ra</option>
              </select>
            </div>

            {/* Sort by time */}
            <button
              onClick={() => setSortOrder((s) => s === "asc" ? "desc" : "asc")}
              className="flex items-center gap-1.5 bg-[#f8f9fb] hover:bg-[#eef0f5] text-[#0d1b2e] text-sm font-light rounded-2xl px-4 py-2 transition-colors"
            >
              <Clock size={12} className="text-gray-400" />
              {sortOrder === "asc" ? "Cũ nhất trước" : "Mới nhất trước"}
            </button>

            {/* Result count */}
            <div className="flex items-center px-1">
              <span className="text-[11px] text-gray-400 font-light">
                {filteredMatches.length} trận
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {view === "list" ? (
        filteredMatches.length > 0 ? (
          <ListView matches={filteredMatches} rounds={ROUNDS} />
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm text-center py-16">
            <p className="text-gray-400 text-sm font-light">Không tìm thấy trận đấu phù hợp.</p>
            <button
              onClick={() => { setNameSearch(""); setRoundFilter(""); setStatusFilter(""); }}
              className="mt-2 text-[#ef342a] text-xs hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )
      ) : (
        <BracketView matches={MATCHES} />
      )}
    </div>
  );
};

export default MatchesTab;

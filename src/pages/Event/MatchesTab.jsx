import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, List, GitBranch, ChevronDown, Trophy, BarChart2, ZoomIn, ZoomOut, Move, Maximize2, User } from "lucide-react";
import { getPublicStages } from "../../api/matchApi";
import { useTournamentSocket } from "../../hooks/useTournamentSocket";
import "./eventTheme.css";

/* ═══════════════════════════════════════════════════════════════════
   FORMAT DETECTION
═══════════════════════════════════════════════════════════════════ */
const FORMAT_MAP = {
  "Loại trực tiếp":      "single_elimination",
  "Loại trực tiếp kép":  "double_elimination",
  "Vòng tròn loại dần + Playoff": "group_stage",
};
const detectFormatFromTournament = (t) =>
  t?.bracketType || FORMAT_MAP[t?.formatName] || "single_elimination";

const detectFormatFromStages = (stages) => {
  if (!stages?.length) return null;
  const types = stages.map(s => s.stageType);
  if (types.includes("WINNERS") || types.includes("LOSERS") || types.includes("GRAND_FINAL"))
    return "double_elimination";
  if (types.includes("PROGRESSIVE_ROUND") || types.includes("PROGRESSIVE_PLAYOFF")) return "group_stage";
  if (types.includes("GROUP")) return "group_stage";
  if (types.includes("KNOCKOUT")) return "single_elimination";
  return "single_elimination";
};

const VIEWS = {
  single_elimination: [
    { id:"list",    label:"Danh sách", Icon:List      },
    { id:"bracket", label:"Sơ đồ",    Icon:GitBranch },
  ],
  double_elimination: [
    { id:"list",    label:"Danh sách", Icon:List      },
    { id:"bracket", label:"Sơ đồ",    Icon:GitBranch },
  ],
  round_robin: [
    { id:"list",    label:"Lịch đấu",  Icon:List      },
    { id:"standing",label:"Bảng điểm", Icon:BarChart2 },
  ],
  group_stage: [
    { id:"list",    label:"Lịch đấu",  Icon:List      },
    { id:"standing",label:"Bảng điểm", Icon:BarChart2 },
    { id:"bracket", label:"Playoff",   Icon:GitBranch },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   API → COMPONENT FORMAT ADAPTERS
═══════════════════════════════════════════════════════════════════ */
const apiStatus = (s) =>
  s === "IN_PROGRESS" ? "live"
  : s === "COMPLETED" || s === "WALKOVER" || s === "BYE" ? "done"
  : "upcoming";

export const apiMatchToComp = (m) => {
  const status = apiStatus(m.status);
  let winSide = null;
  if (m.winner) {
    winSide = m.player1?.id === m.winner.id ? 1 : 2;
  } else if (
    status === "done" &&
    m.player1Score != null &&
    m.player2Score != null &&
    m.player1Score !== m.player2Score
  ) {
    // BE không gửi winner nhưng có tỷ số → suy ra người thắng từ điểm
    winSide = m.player1Score > m.player2Score ? 1 : 2;
  }
  return {
    id: String(m.id),
    roundId: `r${m.roundNo}`,
    seq: m.positionNo,
    table: m.matchCode || `#${m.id}`,
    time: m.scheduledAt || null,
    tableNo: m.tableNo ?? null,
    p1: { id: m.player1?.id ?? null, name: m.player1?.displayName || "TBD", flag: "", score: m.player1Score ?? null },
    p2: { id: m.player2?.id ?? null, name: m.player2?.displayName || "TBD", flag: "", score: m.player2Score ?? null },
    status,
    winSide,
    stageType: m.stageType,
    roundNo: m.roundNo,
    positionNo: m.positionNo,
    raceTo: m.raceTo,
    bracket: m.stageType === "WINNERS" ? "W" : m.stageType === "LOSERS" ? "L" : m.stageType === "GRAND_FINAL" ? "GF" : null,
  };
};

/** matchId (đích, id gốc từ BE) -> { player1: {type,code}|null, player2: {...}|null } của trận nguồn —
 *  dùng winSlot/loseSlot (BE trả về đúng slot player1/player2) để hiện "Thắng RxMy" / "Thua RxMy"
 *  thay vì "TBD", đúng cả nhánh thắng (nextMatchWinId) lẫn nhánh thua rớt xuống (nextMatchLoseId). */
function buildFeedersMap(rawMatches) {
  const result = new Map();
  const ensure = (id) => {
    if (!result.has(id)) result.set(id, { player1: null, player2: null });
    return result.get(id);
  };
  (rawMatches || []).forEach(m => {
    if (m.nextMatchWinId && m.winSlot) {
      ensure(m.nextMatchWinId)[m.winSlot] = { type: "win", code: m.matchCode };
    }
    if (m.nextMatchLoseId && m.loseSlot) {
      ensure(m.nextMatchLoseId)[m.loseSlot] = { type: "lose", code: m.matchCode };
    }
  });
  return result;
}

const LEAGUE_STAGE_TYPES = ["GROUP", "PROGRESSIVE_ROUND"];
const buildRoundsFromApiStage = (stageMatches, stageType) => {
  if (!stageMatches?.length) return [];
  const roundNos = [...new Set(stageMatches.map(m => m.roundNo))].sort((a,b)=>a-b);
  const total = roundNos.length;
  const isLeague = LEAGUE_STAGE_TYPES.includes(stageType);
  return roundNos.map((rNo, idx) => {
    const fromEnd = total - 1 - idx;
    // Stage vòng tròn: chỉ "Vòng N"; chỉ knockout mới có tứ/bán/chung kết
    const label = isLeague ? `Vòng ${rNo}`
      : fromEnd === 0 ? "Chung kết"
      : fromEnd === 1 ? "Bán kết"
      : fromEnd === 2 ? "Tứ kết"
      : `Vòng ${rNo}`;
    const raceTo = stageMatches.find(m => m.roundNo === rNo)?.raceTo ?? 7;
    const prefix = stageType === "WINNERS" ? "WB " : stageType === "LOSERS" ? "LB " : "";
    return {
      id: `r${rNo}`,
      label: prefix + label,
      raceTO: raceTo,
      bracket: stageType === "WINNERS" ? "W" : stageType === "LOSERS" ? "L" : stageType === "GRAND_FINAL" ? "GF" : null,
    };
  });
};

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */
const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).replace(",","");
};

/* Tính bảng điểm vòng tròn từ danh sách trận (dữ liệu BE).

   ⚠️ Thứ tự phân định PHẢI khớp BracketGenerationServiceImpl.computeStageStandings() ở backend,
   vì backend dùng chính thứ tự đó để loại người sau mỗi giai đoạn. Lệch nhau thì khán giả thấy
   một bảng còn hệ thống loại người theo bảng khác:
     1. Số trận thắng
     2. Hiệu số ván
     3. Đối đầu trực tiếp giữa những người còn hoà
     4. Tổng số ván thắng
     5. Tên A→Z (backend dùng hạt giống → id; FE không có 2 field này nên chốt bằng tên)

   Trả về mảng đã xếp hạng: [{ id, name, played, wins, losses, framesWon, framesLost, frameDiff, rank }] */
const computeStandings = (matches) => {
  const table = {};
  const ensure = (p) => {
    if (!p?.id) return null;
    if (!table[p.id]) table[p.id] = { id:p.id, name:p.displayName||"—", avatarUrl:p.avatarUrl||null, played:0, wins:0, losses:0, framesWon:0, framesLost:0 };
    return table[p.id];
  };
  // Lượt 1: đưa TẤT CẢ cơ thủ vào bảng (kể cả chưa đá trận nào) để thấy tổng quan từ đầu
  (matches||[]).forEach((m) => { ensure(m.player1); ensure(m.player2); });
  // Lượt 2: cộng dồn kết quả từ các trận đã xong
  (matches||[]).forEach((m) => {
    const done = m.status === "COMPLETED" || m.status === "WALKOVER";
    if (!done) return;
    const a = ensure(m.player1), b = ensure(m.player2);
    if (!a || !b) return;
    const s1 = m.player1Score ?? 0, s2 = m.player2Score ?? 0;
    a.played++; b.played++;
    a.framesWon += s1; a.framesLost += s2;
    b.framesWon += s2; b.framesLost += s1;
    const winId = m.winner?.id ?? (s1 > s2 ? m.player1?.id : s2 > s1 ? m.player2?.id : null);
    if (winId === a.id) { a.wins++; b.losses++; }
    else if (winId === b.id) { b.wins++; a.losses++; }
  });
  /* Số trận thắng khi chỉ tính các trận GIỮA những người trong nhóm hoà */
  const headToHeadWins = (groupIds) => {
    const h2h = {};
    groupIds.forEach((id) => { h2h[id] = 0; });
    (matches || []).forEach((m) => {
      if (m.status !== "COMPLETED" && m.status !== "WALKOVER") return;
      const id1 = m.player1?.id, id2 = m.player2?.id;
      if (!h2h.hasOwnProperty(id1) || !h2h.hasOwnProperty(id2)) return;
      const s1 = m.player1Score ?? 0, s2 = m.player2Score ?? 0;
      const winId = m.winner?.id ?? (s1 > s2 ? id1 : s2 > s1 ? id2 : null);
      if (winId != null && h2h.hasOwnProperty(winId)) h2h[winId] += 1;
    });
    return h2h;
  };

  const rows = Object.values(table).map((r) => ({ ...r, frameDiff: r.framesWon - r.framesLost }));

  // Bậc 1-2: số trận thắng → hiệu số ván
  rows.sort((x, y) => y.wins - x.wins || y.frameDiff - x.frameDiff);

  // Bậc 3-5: trong từng nhóm còn hoà (cùng thắng + cùng hiệu số) mới xét đối đầu trực tiếp
  let i = 0;
  while (i < rows.length) {
    let j = i + 1;
    while (j < rows.length && rows[j].wins === rows[i].wins && rows[j].frameDiff === rows[i].frameDiff) j++;
    if (j - i > 1) {
      const group = rows.slice(i, j);
      const h2h = headToHeadWins(group.map((r) => r.id));
      group.sort((x, y) =>
        (h2h[y.id] || 0) - (h2h[x.id] || 0)          // 3. đối đầu trực tiếp
        || y.framesWon - x.framesWon                  // 4. số ván thắng
        || (x.name || "").localeCompare(y.name || "") // 5. chốt cuối
      );
      rows.splice(i, j - i, ...group);
    }
    i = j;
  }

  return rows.map((r, idx) => ({ ...r, rank: idx + 1 }));
};

/* ═══════════════════════════════════════════════════════════════════
   SHARED DISPLAY COMPONENTS
═══════════════════════════════════════════════════════════════════ */
const BracketCard = ({ match, compact, flashIds, feedersMap }) => {
  const navigate   = useNavigate();
  const isLive     = match?.status === "live";
  const isDone     = match?.status === "done";
  const isUpcoming = match?.status === "upcoming";
  const isFlashing = match && flashIds?.has(match.id);
  const feeders    = match && feedersMap?.get(Number(match.id));
  const W = compact ? 190 : 218;

  if (!match) return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center"
         style={{ width:W, height:C_H, background:"var(--evt-box-bg)" }}>
      <span className="text-slate-400 dark:text-white/20 text-[11px] font-light tracking-wide">Chờ xác định</span>
    </div>
  );

  return (
    <div className={`rounded-xl overflow-hidden border transition-colors ${isLive?"border-red-500/50":"border-slate-200 dark:border-white/[0.09]"} ${isFlashing?"ws-flash":""}`}
         style={{ width:W, height:C_H, background: isLive?"rgba(239,52,42,0.09)":"var(--evt-box-bg)", boxShadow: isLive?"0 0 0 1px rgba(239,52,42,0.15)":"none" }}>
      <div className="flex items-center justify-between px-3 pt-1.5 pb-1 border-b border-slate-200 dark:border-white/[0.06]">
        <span className="text-[9px] text-sky-600 dark:text-sky-300/75 font-semibold italic tracking-wide">{match.table}</span>
        {isLive
          ? <span className="flex items-center gap-1 text-[9px] text-red-400 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>LIVE</span>
          : isDone
            ? <span className="text-[9px] text-blue-600 dark:text-blue-400/60 font-medium">Kết thúc</span>
            : <span className="text-[9px] text-slate-400 dark:text-white/30">{fmtTime(match.time)}</span>}
      </div>
      {[{p:match.p1,side:1},{p:match.p2,side:2}].map(({p,side})=>{
        const isWinner = match.winSide === side;
        const isLoser  = isDone && match.winSide && !isWinner;
        const feeder = !p?.id ? feeders?.[side === 1 ? "player1" : "player2"] : null;
        return (
          <div key={side}
               className={`relative flex items-center justify-between pl-3 pr-2.5 py-[4px] mx-1 my-[1px] rounded-md ${isWinner?"bg-blue-500/[0.12]":""}`}>
            {isWinner && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-[3px] rounded-full bg-blue-500"/>}
            <span
                  onClick={p?.id ? (e) => { e.stopPropagation(); navigate(`/event/players/${p.id}`); } : undefined}
                  className={`text-[11.5px] leading-tight truncate ${p?.id?"cursor-pointer hover:underline":""} ${
                    isWinner ? "text-blue-600 dark:text-blue-400 font-bold"
                    : isLoser ? "text-slate-400 dark:text-white/35 font-light"
                    : isUpcoming ? "text-slate-500 dark:text-white/55 font-light"
                    : "text-slate-700 dark:text-white/70 font-normal"}`}
                  style={{maxWidth: compact?110:138}}>
              {p?.id ? p.name : feeder ? `${feeder.type === "win" ? "Thắng" : "Thua"} ${feeder.code}` : "TBD"}
            </span>
            <span className={`text-[15px] font-black tabular-nums shrink-0 ${
                    isWinner ? "text-blue-600 dark:text-blue-400"
                    : isLoser ? "text-slate-300 dark:text-white/25"
                    : "text-slate-400 dark:text-white/40"}`}>
              {p?.score??(isUpcoming?"":"—")}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const MatchRow = ({ m, matchNum, flashIds, showRefs = true, feedersMap }) => {
  const navigate   = useNavigate();
  const num        = matchNum ?? m.seq;
  const isLive     = m.status === "live";
  const isDone     = m.status === "done";
  const p1Win      = m.winSide === 1;
  const p2Win      = m.winSide === 2;
  const isFlashing = flashIds?.has(m.id);
  const feeders    = feedersMap?.get(Number(m.id));
  const p1Feeder   = !m.p1?.id ? feeders?.player1 : null;
  const p2Feeder   = !m.p2?.id ? feeders?.player2 : null;
  const feederLabel = (f) => `${f.type === "win" ? "Thắng" : "Thua"} ${f.code}`;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/[0.05] last:border-0 transition-colors ${isLive?"":"hover:bg-slate-50 dark:hover:bg-white/[0.03]"} ${isFlashing?"ws-flash":""}`}
         style={isLive?{background:"rgba(239,52,42,0.07)"}:{}}>
      <div className="shrink-0 w-10 text-center">
        <span className="text-[11px] italic font-bold text-sky-600 dark:text-sky-300/90">{m.table}</span>
      </div>
      <div className="flex-1 flex items-center min-w-0">
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span
            onClick={m.p1?.id ? () => navigate(`/event/players/${m.p1.id}`) : undefined}
            className={`text-[13px] leading-tight truncate text-right max-w-[100px] sm:max-w-[140px] ${m.p1?.id?"cursor-pointer hover:underline":""} ${p1Win?"font-bold text-blue-600 dark:text-blue-400":isDone?"text-slate-400 dark:text-white/45 font-light":"text-slate-600 dark:text-white/65"}`}>
            {m.p1?.id ? m.p1.name : p1Feeder ? feederLabel(p1Feeder) : m.p1?.name}
          </span>
          <span className={`text-xl font-black tabular-nums shrink-0 w-7 text-right ${p1Win?"text-blue-600 dark:text-blue-400":isDone?"text-slate-400 dark:text-white/40":m.p1?.score!=null?"text-slate-800 dark:text-white":"text-transparent"}`}>
            {m.p1?.score??""}
          </span>
        </div>
        <span className="shrink-0 text-[10px] text-slate-300 dark:text-white/20 font-medium px-3">vs</span>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className={`text-xl font-black tabular-nums shrink-0 w-7 ${p2Win?"text-blue-600 dark:text-blue-400":isDone?"text-slate-400 dark:text-white/40":m.p2?.score!=null?"text-slate-800 dark:text-white":"text-transparent"}`}>
            {m.p2?.score??""}
          </span>
          <span
            onClick={m.p2?.id ? () => navigate(`/event/players/${m.p2.id}`) : undefined}
            className={`text-[13px] leading-tight truncate max-w-[100px] sm:max-w-[140px] ${m.p2?.id?"cursor-pointer hover:underline":""} ${p2Win?"font-bold text-blue-600 dark:text-blue-400":isDone?"text-slate-400 dark:text-white/45 font-light":"text-slate-600 dark:text-white/65"}`}>
            {m.p2?.id ? m.p2.name : p2Feeder ? feederLabel(p2Feeder) : m.p2?.name}
          </span>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5 pl-3 border-l border-slate-200 dark:border-white/[0.07] min-w-[95px]">
        {isLive
          ? <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>LIVE
            </span>
          : <span className="text-[10px] text-sky-600 dark:text-sky-300/80 font-normal">{fmtTime(m.time)}</span>
        }
        {m.tableNo != null && (
          <span className="text-[9px] font-semibold text-slate-500 dark:text-white/50">Bàn {m.tableNo}</span>
        )}
        {showRefs && (
          <span className="text-[9px] text-sky-600 dark:text-sky-300/70 font-normal tracking-wide">
            #{num} / W#{num+15} / L#{num+25}
          </span>
        )}
      </div>
    </div>
  );
};

const BRACKET_BADGE = {
  W:  { label:"WB", cls:"bg-emerald-500/15 text-emerald-400" },
  L:  { label:"LB", cls:"bg-orange-500/15 text-orange-400"   },
  GF: { label:"GF", cls:"bg-yellow-500/15 text-yellow-400"   },
};

const ListView = ({ matches, rounds, flashIds, feedersMap }) => {
  const matchNumMap = useMemo(() => {
    const map = {};
    let idx = 0;
    rounds.forEach(r => {
      matches.filter(m => m.roundId === r.id).sort((a,b) => a.seq-b.seq)
             .forEach(m => { map[m.id] = ++idx; });
    });
    return map;
  }, [matches, rounds]);

  return (
    <div className="space-y-4">
      {rounds.map(round => {
        const rMatches = matches.filter(m => m.roundId===round.id).sort((a,b)=>a.seq-b.seq);
        if (!rMatches.length) return null;
        const badge = round.bracket ? BRACKET_BADGE[round.bracket] : null;
        return (
          <div key={round.id} className="rounded-3xl overflow-hidden shadow-sm"
               style={{background:"var(--evt-card-bg)",border:"1px solid var(--evt-card-border)"}}>
            <div className="flex items-center justify-between px-5 py-2.5"
                 style={{background:"linear-gradient(135deg,#9b1c1c 0%,#7f1616 100%)"}}>
              <div className="flex items-center gap-2">
                {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white">{badge.label}</span>}
                <span className="text-xs font-semibold text-white tracking-wide">{round.label}</span>
              </div>
              <span className="text-[10px] font-light text-white/70">Đánh tới {round.raceTO} ván</span>
            </div>
            <div>{rMatches.map(m=><MatchRow key={m.id} m={m} matchNum={matchNumMap[m.id]} flashIds={flashIds} feedersMap={feedersMap}/>)}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   STANDING VIEW — bảng điểm vòng tròn (tính từ dữ liệu BE)
═══════════════════════════════════════════════════════════════════ */
const Avatar = ({ url, size = 42 }) => (
  url ? (
    <img src={url} alt="" loading="lazy"
         className="rounded-full object-cover shrink-0 ring-2 ring-white dark:ring-white/10 shadow-sm"
         style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full flex items-center justify-center shrink-0 bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-white/30 ring-2 ring-white dark:ring-white/10"
          style={{ width: size, height: size }}>
      <User size={size * 0.55} />
    </span>
  )
);

const StandingTable = ({ rows }) => {
  const navigate = useNavigate();
  return (
  <div className="relative rounded-3xl shadow-sm"
       style={{background:"var(--evt-card-bg)",border:"1px solid var(--evt-card-border)"}}>
    <div className="rounded-3xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <colgroup>
          <col style={{width:56}} />
          <col />
          <col style={{width:84}} />
          <col style={{width:72}} />
          <col style={{width:72}} />
          <col style={{width:72}} />
          <col style={{width:72}} />
          <col style={{width:72}} />
          <col style={{width:88}} />
        </colgroup>
        {/* Header */}
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/[0.08] text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-white/35">
            <th className="text-center py-3.5 font-semibold">#</th>
            <th className="text-left font-semibold">Cơ thủ</th>
            <th className="text-center font-semibold" title="Điểm">Điểm</th>
            <th className="text-center font-semibold" title="Số trận đã đấu">Trận</th>
            <th className="text-center font-semibold" title="Thắng">Thắng</th>
            <th className="text-center font-semibold" title="Thua">Thua</th>
            <th className="text-center font-semibold" title="Rack thắng">RT</th>
            <th className="text-center font-semibold" title="Rack thua">RB</th>
            <th className="text-center font-semibold" title="Hiệu số rack">Hiệu số</th>
          </tr>
        </thead>
        <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400 dark:text-white/30 text-sm font-light">Chưa có cơ thủ</td></tr>
        ) : rows.map((r, idx) => {
          const eliminated = !!r.eliminated;
          const isFirst = r.rank === 1 && !eliminated;
          // Đường cắt nằm TRÊN người bị loại đầu tiên (ranh giới còn lại / bị loại)
          const cutAbove = eliminated && idx > 0 && !rows[idx - 1].eliminated;
          return (
            <tr key={r.id}
                 className={`transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] ${
                   cutAbove ? "border-t-2 border-dashed border-slate-300 dark:border-white/20"
                           : "border-t border-slate-100 dark:border-white/[0.04] first:border-t-0"} ${
                   eliminated ? "bg-slate-100/70 dark:bg-white/[0.03] opacity-60"
                             : isFirst ? "bg-amber-50/50 dark:bg-yellow-400/[0.04]" : ""}`}>
              <td className="py-3 text-center">
                <span className={`inline-flex text-sm font-bold w-9 h-9 rounded-xl items-center justify-center ${
                  isFirst ? "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-yellow-400/20 dark:text-yellow-300 dark:border-yellow-400/30"
                  : eliminated ? "bg-slate-200 text-slate-400 border border-slate-200 dark:bg-white/[0.06] dark:text-white/30 dark:border-white/10"
                  : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/[0.06] dark:text-white/50 dark:border-white/10"}`}>
                  {r.rank}
                </span>
              </td>
              <td className="py-3 pl-2 pr-4">
                <span className="flex items-center gap-3 min-w-0">
                  <Avatar url={r.avatarUrl} />
                  <span
                    onClick={r.id ? () => navigate(`/event/players/${r.id}`) : undefined}
                    className={`text-sm truncate ${r.id?"cursor-pointer hover:underline":""} ${
                      isFirst ? "text-amber-600 dark:text-[#fbbf24] font-bold"
                      : eliminated ? "text-slate-400 dark:text-white/35 font-medium"
                      : "text-slate-800 dark:text-white font-semibold"}`}>{r.name}</span>
                  {eliminated && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-white/40 uppercase tracking-wide shrink-0">
                      Bị loại
                    </span>
                  )}
                </span>
              </td>
              <td className={`text-center text-lg font-bold tabular-nums ${eliminated ? "text-slate-400 dark:text-white/30" : "text-indigo-600 dark:text-indigo-400"}`}>{r.wins}</td>
              <td className="text-center text-sm text-slate-400 dark:text-white/45 tabular-nums">{r.played}</td>
              <td className={`text-center text-sm font-semibold tabular-nums ${eliminated ? "text-slate-400 dark:text-white/30" : "text-emerald-600 dark:text-emerald-400"}`}>{r.wins}</td>
              <td className="text-center text-sm text-slate-400 dark:text-white/45 tabular-nums">{r.losses}</td>
              <td className="text-center text-sm text-slate-500 dark:text-white/55 tabular-nums">{r.framesWon}</td>
              <td className="text-center text-sm text-slate-400 dark:text-white/40 tabular-nums">{r.framesLost}</td>
              <td className={`text-center text-sm font-bold tabular-nums ${eliminated ? "text-slate-400 dark:text-white/30" : r.frameDiff>0?"text-blue-600 dark:text-blue-400":r.frameDiff<0?"text-red-600 dark:text-red-400":"text-slate-400 dark:text-white/40"}`}>
                {r.frameDiff>0?"+":""}{r.frameDiff}
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
    <div className="flex justify-end px-6 py-3 text-xs text-slate-400 dark:text-white/30 font-light">
      {rows.length} cơ thủ
    </div>
    </div>
  </div>
  );
};

const StandingView = ({ rows }) => {
  const empty = !rows || rows.length === 0;
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Title — luôn chung 1 tên, 1 bảng gộp duy nhất */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Trophy size={22} className="text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Bảng xếp hạng
        </h2>
      </div>

      {empty ? (
        <div className="rounded-3xl shadow-sm flex flex-col items-center justify-center py-16 gap-2"
             style={{background:"var(--evt-card-bg)",border:"1px solid var(--evt-card-border)"}}>
          <BarChart2 size={30} className="text-slate-300 dark:text-white/15"/>
          <p className="text-slate-500 dark:text-white/40 text-sm font-light">Chưa có bảng điểm — các trận vòng tròn chưa hoàn thành</p>
        </div>
      ) : (
        <StandingTable rows={rows}/>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   DYNAMIC BRACKET VIEW — works with any number of rounds
═══════════════════════════════════════════════════════════════════ */
const C_H=88, C_W=218, P_GAP=16, P_SP=30, R_GAP=60;

function buildBracketGeometry(rounds, matchesByRound) {
  // Find first round match count to determine bracket size
  const firstRoundId = rounds[0]?.id;
  const firstRoundCount = matchesByRound[firstRoundId]?.length || 1;

  function posY(roundIdx, matchIdx) {
    if (roundIdx === 0) {
      const half = firstRoundCount;
      const off = matchIdx >= half/2 ? P_SP : 0;
      return matchIdx * (C_H + P_GAP) + off + C_H/2;
    }
    return (posY(roundIdx-1, matchIdx*2) + posY(roundIdx-1, matchIdx*2+1)) / 2;
  }

  const posTop = (ri, mi) => posY(ri, mi) - C_H/2;
  const posXL  = (ri) => ri * (C_W + R_GAP);
  const posXR  = (ri) => posXL(ri) + C_W;

  const svgH = Math.ceil(posTop(0, firstRoundCount-1) + C_H + 20);
  const svgW = posXR(rounds.length - 1) + 20;

  const paths = [];
  rounds.slice(0,-1).forEach((_, ri) => {
    const count = matchesByRound[rounds[ri].id]?.length || 0;
    for (let mi = 0; mi < count; mi++) {
      const midX = posXR(ri) + R_GAP/2;
      const parentMi = Math.floor(mi/2);
      paths.push(`M ${posXR(ri)} ${posY(ri,mi)} H ${midX} V ${posY(ri+1,parentMi)} H ${posXL(ri+1)}`);
    }
  });

  return { posTop, posXL, svgH, svgW, paths };
}

const ZOOM_MIN = 0.4, ZOOM_MAX = 1.5, ZOOM_STEP = 0.1;
const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +z.toFixed(3)));

const BracketView = ({ matches, rounds, flashIds, feedersMap }) => {
  const matchesByRound = useMemo(() => {
    const map = {};
    rounds.forEach(r => {
      map[r.id] = matches.filter(m=>m.roundId===r.id).sort((a,b)=>a.seq-b.seq);
    });
    return map;
  }, [matches, rounds]);

  const { posTop, posXL, svgH, svgW, paths } = useMemo(
    () => buildBracketGeometry(rounds, matchesByRound),
    [rounds, matchesByRound]
  );

  const scrollRef = useRef(null);
  const innerRef  = useRef(null);
  const drag      = useRef({ active:false, moved:false });
  const [zoom, setZoom]         = useState(1);
  const [dragging, setDragging] = useState(false);
  const [natural, setNatural]   = useState({ w:0, h:0 });

  /* Đo kích thước thật (chưa scale) để canh vùng cuộn khi zoom */
  useLayoutEffect(() => {
    if (innerRef.current)
      setNatural({ w: innerRef.current.offsetWidth, h: innerRef.current.offsetHeight });
  }, [svgW, svgH, rounds.length, matches.length]);

  const zoomIn   = () => setZoom(z => clampZoom(z + ZOOM_STEP));
  const zoomOut  = () => setZoom(z => clampZoom(z - ZOOM_STEP));
  const fitWidth = () => {
    const el = scrollRef.current;
    if (!el || !natural.w) return;
    setZoom(clampZoom((el.clientWidth - 8) / natural.w));
  };

  /* ── Kéo-thả bằng chuột để di chuyển sơ đồ ── */
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const el = scrollRef.current; if (!el) return;
    drag.current = { active:true, moved:false, x:e.clientX, y:e.clientY, sl:el.scrollLeft, st:el.scrollTop };
    setDragging(true);
  };
  const onMouseMove = (e) => {
    if (!drag.current.active) return;
    const el = scrollRef.current; if (!el) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.sl - dx;
    el.scrollTop  = drag.current.st - dy;
  };
  const endDrag = () => { if (drag.current.active) { drag.current.active = false; setDragging(false); } };
  /* Chặn điều hướng khi vừa pan (tránh bấm nhầm vào tên cầu thủ) */
  const onClickCapture = (e) => {
    if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; }
  };

  const btnCls = "w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-white/[0.06] shadow-sm"
         style={{background:"var(--evt-card-bg)"}}>
      {/* Thanh công cụ: zoom + gợi ý kéo-thả */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-white/[0.06]">
        <span className="mr-auto hidden sm:flex items-center gap-1 text-[10px] text-slate-400 dark:text-white/30 font-light">
          <Move size={11}/> Kéo để di chuyển sơ đồ
        </span>
        <button type="button" onClick={fitWidth} className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <Maximize2 size={12}/> Vừa khung
        </button>
        <button type="button" onClick={zoomOut} disabled={zoom<=ZOOM_MIN} className={btnCls} title="Thu nhỏ"><ZoomOut size={14}/></button>
        <span className="w-10 text-center text-[11px] font-semibold tabular-nums text-slate-600 dark:text-white/70">{Math.round(zoom*100)}%</span>
        <button type="button" onClick={zoomIn} disabled={zoom>=ZOOM_MAX} className={btnCls} title="Phóng to"><ZoomIn size={14}/></button>
      </div>

      {/* Vùng cuộn + kéo-thả */}
      <div ref={scrollRef}
           onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}
           onClickCapture={onClickCapture}
           className="overflow-auto"
           style={{ maxHeight:"70vh", cursor: dragging?"grabbing":"grab", userSelect: dragging?"none":"auto" }}>
        <div style={{ width: natural.w?natural.w*zoom:undefined, height: natural.h?natural.h*zoom:undefined }}>
          <div ref={innerRef} style={{ width:svgW+40, transform:`scale(${zoom})`, transformOrigin:"top left" }}>
            <div className="flex border-b border-slate-200 dark:border-white/[0.08]" style={{paddingLeft:20,paddingRight:20}}>
              {rounds.map((r,i)=>(
                <div key={r.id} className="flex-shrink-0 text-center py-3" style={{width:C_W,marginLeft:i>0?R_GAP:0}}>
                  <p className="text-slate-800 dark:text-white text-[11px] font-bold uppercase tracking-[0.08em]">{r.label}</p>
                  <p className="text-sky-600 dark:text-sky-300/40 text-[9px] font-medium mt-0.5">Đánh tới {r.raceTO} ván</p>
                </div>
              ))}
            </div>
            <div style={{padding:"18px 20px"}}>
              <div className="relative" style={{width:svgW,height:svgH}}>
                <svg className="absolute inset-0 pointer-events-none" width={svgW} height={svgH} style={{overflow:"visible"}}>
                  {paths.map((d,i)=><path key={i} d={d} fill="none" stroke="var(--evt-bracket-line)" strokeWidth={1.5}/>)}
                </svg>
                {rounds.map((r,ri)=>
                  (matchesByRound[r.id]||[]).map((m,mi)=>(
                    <div key={m.id} className="absolute" style={{left:posXL(ri),top:posTop(ri,mi)}}>
                      <BracketCard match={m} compact={false} flashIds={flashIds} feedersMap={feedersMap}/>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   DOUBLE ELIMINATION VIEWS
═══════════════════════════════════════════════════════════════════ */
const DoubleEliminationBracketView = ({ stages, flashIds, feedersMap }) => {
  const wbStage  = stages.find(s=>s.stageType==="WINNERS");
  const lbStage  = stages.find(s=>s.stageType==="LOSERS");
  const gfStage  = stages.find(s=>s.stageType==="GRAND_FINAL");

  const wbMatches = useMemo(() => (wbStage?.matches||[]).map(apiMatchToComp), [wbStage]);
  const lbMatches = useMemo(() => (lbStage?.matches||[]).map(apiMatchToComp), [lbStage]);
  const gfMatch   = useMemo(() => (gfStage?.matches||[])[0] ? apiMatchToComp((gfStage.matches)[0]) : null, [gfStage]);

  const wbRounds = useMemo(() => buildRoundsFromApiStage(wbStage?.matches||[], "WINNERS"), [wbStage]);
  const lbRounds = useMemo(() => buildRoundsFromApiStage(lbStage?.matches||[], "LOSERS"), [lbStage]);

  return (
    <div className="space-y-3">
      {wbMatches.length > 0 && (
        <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm"
             style={{background:"var(--evt-card-bg)"}}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-200 dark:border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"/>
            <span className="text-slate-800 dark:text-white text-xs font-semibold tracking-wide">NHÁNH THẮNG (WINNER BRACKET)</span>
            <span className="ml-auto text-[10px] text-slate-400 dark:text-white/30">Thua → Nhánh Thua</span>
          </div>
          <BracketView matches={wbMatches} rounds={wbRounds} flashIds={flashIds} feedersMap={feedersMap}/>
        </div>
      )}
      {lbMatches.length > 0 && (
        <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm"
             style={{background:"var(--evt-card-bg)"}}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-200 dark:border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"/>
            <span className="text-slate-800 dark:text-white text-xs font-semibold tracking-wide">NHÁNH THUA (LOSER BRACKET)</span>
            <span className="ml-auto text-[10px] text-slate-400 dark:text-white/30">Thắng → Chung kết</span>
          </div>
          <BracketView matches={lbMatches} rounds={lbRounds} flashIds={flashIds} feedersMap={feedersMap}/>
        </div>
      )}
      {gfMatch && (
        <div className="rounded-3xl overflow-hidden border border-yellow-500/20 shadow-sm"
             style={{background:"var(--evt-card-bg)"}}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-200 dark:border-white/[0.08]">
            <Trophy size={12} className="text-yellow-400 shrink-0"/>
            <span className="text-slate-800 dark:text-white text-xs font-semibold tracking-wide">CHUNG KẾT LỚN (GRAND FINAL)</span>
            <span className="ml-auto text-[10px] text-yellow-400/50">Đánh tới {gfMatch.raceTo} ván</span>
          </div>
          <div className="p-5 flex justify-center">
            <BracketCard match={gfMatch} compact={false} flashIds={flashIds} feedersMap={feedersMap}/>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ onClear }) => (
  <div className="bg-white dark:bg-[#0d1b2e] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center py-16">
    <p className="text-gray-400 dark:text-white/50 text-sm font-light">Không tìm thấy trận đấu phù hợp.</p>
    {onClear && <button onClick={onClear} className="mt-2 text-[#ef342a] text-xs hover:underline">Xóa bộ lọc</button>}
  </div>
);

const NoBracket = () => (
  <div className="bg-white dark:bg-[#0d1b2e] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col items-center justify-center py-28 gap-2">
    <p className="text-gray-200 dark:text-white/15 text-4xl font-semibold">Lịch thi đấu</p>
    <p className="text-gray-400 dark:text-white/50 text-sm font-light">Bracket chưa được sinh hoặc chưa có trận nào</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const MatchesTab = ({ tournament }) => {
  const [stages,      setStages]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState("list");
  const [nameSearch,  setNameSearch]  = useState("");
  const [roundFilter, setRoundFilter] = useState("");
  const [stageFilter, setStageFilter] = useState(null); // null = "Tất cả giai đoạn"

  const load = useCallback(async () => {
    if (!tournament?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getPublicStages(tournament.id);
      setStages(Array.isArray(data) ? data : []);
    } catch { setStages([]); }
    finally { setLoading(false); }
  }, [tournament?.id]);

  useEffect(() => { load(); }, [load]);

  const [flashIds, setFlashIds] = useState(() => new Set());
  const flashTimers = useRef({});

  /* ── WebSocket: cập nhật tỷ số + người chơi kế tiếp real-time ── */
  const flashMatch = useCallback((id) => {
    const sid = String(id);
    setFlashIds(prev => { const s = new Set(prev); s.add(sid); return s; });
    clearTimeout(flashTimers.current[sid]);
    flashTimers.current[sid] = setTimeout(() => {
      setFlashIds(prev => { const s = new Set(prev); s.delete(sid); return s; });
    }, 1500);
  }, []);

  const handleMatchUpdate = useCallback((updatedMatch) => {
    setStages(prev => prev.map(stage => {
      if (!stage.matches) return stage;
      const matchIdx = stage.matches.findIndex(m => m.id === updatedMatch.id);
      if (matchIdx === -1) return stage;
      const newMatches = [...stage.matches];
      newMatches[matchIdx] = {
        ...newMatches[matchIdx],
        // player1/player2 phải merge ở đây — đây là chỗ trận kế tiếp (vòng sau)
        // nhận người thắng vừa được điền vào (trước đó là null/TBD).
        player1: updatedMatch.player1 ?? newMatches[matchIdx].player1,
        player2: updatedMatch.player2 ?? newMatches[matchIdx].player2,
        player1Score: updatedMatch.player1Score,
        player2Score: updatedMatch.player2Score,
        status: updatedMatch.status,
        winner: updatedMatch.winner,
        loser: updatedMatch.loser,
      };
      return { ...stage, matches: newMatches };
    }));

    flashMatch(updatedMatch.id);
  }, [flashMatch]);

  /* Safety net: nếu lỡ mất một message MATCH_UPDATE (rớt mạng, reconnect...),
     BE luôn kèm theo BRACKET_SYNC (toàn bộ trận của tournament) để đồng bộ lại. */
  const handleBracketSync = useCallback((matches) => {
    if (!Array.isArray(matches) || !matches.length) return;
    setStages(prev => {
      const byStage = new Map();
      matches.forEach(m => {
        const key = m.stageId ?? m.stageType;
        if (!byStage.has(key)) byStage.set(key, []);
        byStage.get(key).push(m);
      });
      return prev.map(stage => {
        const key = stage.id ?? stage.stageType;
        const stageMatches = byStage.get(key);
        return stageMatches ? { ...stage, matches: stageMatches } : stage;
      });
    });
  }, []);

  useTournamentSocket(tournament?.id, {
    onMatchUpdate: handleMatchUpdate,
    onBracketSync: handleBracketSync,
  });

  /* Detect format */
  const format = useMemo(
    () => detectFormatFromStages(stages) || detectFormatFromTournament(tournament),
    [stages, tournament]
  );
  const views = VIEWS[format] || VIEWS.single_elimination;
  const validView = views.find(v=>v.id===view) ? view : views[0].id;

  const feedersMap = useMemo(
    () => buildFeedersMap(stages.flatMap(s => s.matches ?? [])),
    [stages]
  );

  /* Flatten all matches into component format — gồm cả Playoff để "Tất cả giai đoạn" đủ trận */
  const { allMatches, rounds } = useMemo(() => {
    if (!stages.length) return { allMatches: [], rounds: [] };

    const PLAYOFF_TYPES = ["PROGRESSIVE_PLAYOFF", "PLAYOFF", "KNOCKOUT"];
    // Nhiều giai đoạn (vòng tròn + playoff) → gắn tên giai đoạn vào nhãn vòng
    const multiStage = stages.filter(s =>
      s.stageType === "PROGRESSIVE_ROUND"
      || s.stageType === "GROUP"
      || PLAYOFF_TYPES.includes(s.stageType)
    ).length > 1;

    let allM = [], allR = [];
    stages.forEach(stage => {
      const compMatches = (stage.matches||[]).map(m => ({
        ...apiMatchToComp(m),
        stageId: stage.id,
        stageType: stage.stageType,
        stageName: stage.name,
        raceTo: m.raceTo,
      }));
      const stageRounds = buildRoundsFromApiStage(stage.matches||[], stage.stageType);
      // Key roundId theo stage.id để KHÔNG gộp nhầm các giai đoạn cùng loại (progressive)
      const key = `s${stage.id ?? stage.stageType}`;
      compMatches.forEach(m => { m.roundId = `${key}_r${m.roundNo}`; });
      stageRounds.forEach(r => {
        r.id = `${key}_${r.id}`;
        if (multiStage && stage.name) {
          r.label = `${stage.name} · ${r.label}`;
        } else if (multiStage && PLAYOFF_TYPES.includes(stage.stageType)) {
          r.label = `Playoff · ${r.label}`;
        }
      });
      allM = [...allM, ...compMatches];
      allR = [...allR, ...stageRounds];
    });
    return { allMatches: allM, rounds: allR };
  }, [stages]);

  /* Matches for KNOCKOUT / PROGRESSIVE_PLAYOFF / PLAYOFF stage (single elim / playoff) */
  const PLAYOFF_STAGE_TYPES = ["KNOCKOUT", "PROGRESSIVE_PLAYOFF", "PLAYOFF"];
  const koStage   = stages.find(s => PLAYOFF_STAGE_TYPES.includes(s.stageType));
  const koMatches = useMemo(
    () => (koStage?.matches||[]).map(m => ({...apiMatchToComp(m), raceTo:m.raceTo})),
    [koStage]
  );
  const koRounds  = useMemo(
    () => buildRoundsFromApiStage(koStage?.matches||[], "KNOCKOUT"),
    [koStage]
  );

  /**
   * Bảng điểm GỘP — 1 bảng duy nhất cho toàn giải, không tách theo giai đoạn.
   * Người trụ lại giai đoạn càng muộn thì xếp hạng càng cao. Ai không còn trong giai đoạn
   * kế tiếp (GĐ sau hoặc Playoff đã điền người) → eliminated=true để FE tô xám "BỊ LOẠI".
   *
   * Duyệt League từ CUỐI về ĐẦU; tập "còn lại" = người ở stage kế tiếp (league i+1,
   * hoặc Playoff nếu GĐ League cuối đã chuyển tiếp).
   */
  const mergedStanding = useMemo(() => {
    const league = stages.filter(s => s.stageType === "PROGRESSIVE_ROUND" || s.stageType === "GROUP")
                          .slice().sort((a,b) => (a.orderNo??0) - (b.orderNo??0));
    if (!league.length) return [];

    const playoffStage = stages.find(s =>
      s.stageType === "PROGRESSIVE_PLAYOFF" || s.stageType === "PLAYOFF"
    );
    const playoffPlayerIds = new Set(
      (playoffStage?.matches || [])
        .flatMap(m => [m.player1?.id, m.player2?.id])
        .filter(Boolean)
    );
    // Playoff đã được điền người sau bước "chuyển giai đoạn" → dùng làm mốc cắt GĐ League cuối
    const playoffFilled = playoffPlayerIds.size > 0;

    const perStage = league.map(s => ({
      stage: s,
      standings: computeStandings(s.matches || []),
      playerIds: new Set(
        (s.matches || []).flatMap(m => [m.player1?.id, m.player2?.id]).filter(Boolean)
      ),
    }));

    const rows = [];
    const seen = new Set();
    for (let i = perStage.length - 1; i >= 0; i--) {
      const { standings } = perStage[i];
      // Tập người còn trụ ở bước sau giai đoạn này
      let nextPlayerIds = null;
      if (i < perStage.length - 1) {
        nextPlayerIds = perStage[i + 1].playerIds;
      } else if (playoffFilled) {
        nextPlayerIds = playoffPlayerIds;
      }

      for (const row of standings) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        const eliminated = nextPlayerIds != null && !nextPlayerIds.has(row.id);
        rows.push({ ...row, eliminated });
      }
    }
    return rows.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [stages]);

  /* Tab giai đoạn: vòng tròn/bảng (GĐ1, GĐ2...) + Playoff — player cần thấy đủ chuỗi giai đoạn */
  const navStages = useMemo(
    () => stages
      .filter(s =>
        s.stageType === "PROGRESSIVE_ROUND"
        || s.stageType === "GROUP"
        || s.stageType === "PROGRESSIVE_PLAYOFF"
        || s.stageType === "PLAYOFF"
      )
      .slice()
      .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)),
    [stages]
  );
  const playoffStageId = koStage?.id ?? null;
  const isPlayoffStageSelected = stageFilter != null && stageFilter === playoffStageId;

  useEffect(() => {
    if (stageFilter != null && !navStages.some(s => s.id === stageFilter)) setStageFilter(null);
  }, [navStages, stageFilter]);

  const selectStageTab = (stageId) => {
    if (stageId == null) {
      setStageFilter(null);
      setView("list");
      return;
    }
    const stage = navStages.find(s => s.id === stageId);
    if (stage && PLAYOFF_STAGE_TYPES.includes(stage.stageType)) {
      setStageFilter(stageId);
      setView("bracket");
      return;
    }
    setStageFilter(stageId);
    setView("list");
  };

  /* Filtered for list view */
  const filteredMatches = useMemo(() => {
    const q = nameSearch.toLowerCase();
    return allMatches.filter(m => {
      const inName  = !q || m.p1?.name.toLowerCase().includes(q) || m.p2?.name.toLowerCase().includes(q);
      const inRound = !roundFilter || m.roundId === roundFilter;
      const inStage = stageFilter == null || m.stageId === stageFilter;
      return inName && inRound && inStage;
    });
  }, [allMatches, nameSearch, roundFilter, stageFilter]);

  const filteredKo = useMemo(() => {
    const q = nameSearch.toLowerCase();
    return koMatches.filter(m => {
      const inName  = !q || m.p1?.name.toLowerCase().includes(q) || m.p2?.name.toLowerCase().includes(q);
      const inRound = !roundFilter || m.roundId === roundFilter;
      return inName && inRound;
    });
  }, [koMatches, nameSearch, roundFilter]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-400 text-sm">Đang tải lịch thi đấu...</p>
    </div>
  );

  if (!stages.length) return <NoBracket/>;

  const showFilters = validView === "list";
  const showStageTabs = navStages.length > 1;

  return (
    <div className="space-y-4">
      {/* Header: view toggle */}
      <div className="flex items-center justify-end flex-wrap gap-2">
        <div className="flex gap-1.5">
          {views.map(({id,label,Icon})=>(
            <button key={id} onClick={()=>{
              setView(id);
              // Vào tab Playoff (bracket) → highlight tab giai đoạn Playoff nếu có
              if (id === "bracket" && playoffStageId != null) setStageFilter(playoffStageId);
              if (id === "list" && isPlayoffStageSelected) setStageFilter(null);
            }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                      validView===id
                        ?"bg-[#0d1b2e] text-white shadow-sm dark:bg-white dark:text-[#0d1b2e]"
                        :"bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 dark:bg-white/5 dark:text-white/70 dark:border-white/15 dark:hover:bg-white/10"
                    }`}>
              <Icon size={14}/>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab chọn giai đoạn — GĐ1, GĐ2... và Playoff */}
      {showStageTabs && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button onClick={() => selectStageTab(null)}
                  className={`shrink-0 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                    stageFilter == null && validView === "list"
                      ? "bg-[#9b1c1c] text-white shadow-sm"
                      : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 dark:bg-white/5 dark:text-white/70 dark:border-white/15"
                  }`}>
            Tất cả giai đoạn
          </button>
          {navStages.map(s => {
            const isPlayoff = PLAYOFF_STAGE_TYPES.includes(s.stageType);
            const total = (s.matches||[]).length;
            const done = (s.matches||[]).filter(m=>["COMPLETED","WALKOVER","BYE"].includes(m.status)).length;
            const active = isPlayoff
              ? validView === "bracket"
              : (validView === "list" && stageFilter === s.id);
            return (
              <button key={s.id} onClick={() => selectStageTab(s.id)}
                      className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                        active
                          ? "bg-[#9b1c1c] text-white shadow-sm"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 dark:bg-white/5 dark:text-white/70 dark:border-white/15"
                      }`}>
                {isPlayoff ? (s.name || "Playoff") : (s.name || `Giai đoạn ${s.orderNo}`)}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  active ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"
                }`}>{done}/{total}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-[#0d1b2e] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm px-5 py-4">
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none"/>
              <input type="text" placeholder="Tìm tên cơ thủ..." value={nameSearch}
                     onChange={e=>setNameSearch(e.target.value)}
                     className="w-full bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-8 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:border-[#0d1b2e]/15 focus:bg-white transition-all dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:border-white/10 dark:focus:bg-white/10 dark:focus:border-white/25"/>
            </div>
            {format !== "group_stage" && rounds.length > 0 && (
              <div className="relative min-w-[140px]">
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none"/>
                <select value={roundFilter} onChange={e=>setRoundFilter(e.target.value)}
                        className="w-full appearance-none bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-4 pr-8 py-2 focus:outline-none focus:border-[#0d1b2e]/15 transition-all cursor-pointer dark:bg-white/5 dark:text-white dark:border-white/10 dark:[&>option]:text-slate-800">
                  <option value="">Tất cả vòng</option>
                  {rounds.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center px-1">
              <span className="text-[11px] text-gray-400 dark:text-white/50 font-light">{filteredMatches.length} trận</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}

      {/* Single Elimination */}
      {format === "single_elimination" && validView === "list" && (
        filteredKo.length > 0
          ? <ListView matches={filteredKo} rounds={koRounds} flashIds={flashIds} feedersMap={feedersMap}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}
      {format === "single_elimination" && validView === "bracket" && (
        koMatches.length > 0
          ? <BracketView matches={koMatches} rounds={koRounds} flashIds={flashIds} feedersMap={feedersMap}/>
          : <NoBracket/>
      )}

      {/* Double Elimination */}
      {format === "double_elimination" && validView === "list" && (
        filteredMatches.length > 0
          ? <ListView matches={filteredMatches} rounds={rounds} flashIds={flashIds} feedersMap={feedersMap}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}
      {format === "double_elimination" && validView === "bracket" && (
        <DoubleEliminationBracketView stages={stages} flashIds={flashIds} feedersMap={feedersMap}/>
      )}

      {/* Group stage / Round robin: Lịch đấu */}
      {(format === "group_stage" || format === "round_robin") && validView === "list" && (
        filteredMatches.length > 0
          ? <ListView matches={filteredMatches} rounds={rounds} flashIds={flashIds} feedersMap={feedersMap}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}

      {/* Group stage / Round robin: Bảng điểm — 1 bảng gộp duy nhất */}
      {(format === "group_stage" || format === "round_robin") && validView === "standing" && (
        <StandingView rows={mergedStanding}/>
      )}

      {/* Group stage: Playoff (bracket từ vòng knockout) */}
      {format === "group_stage" && validView === "bracket" && (
        koMatches.length > 0
          ? <BracketView matches={koMatches} rounds={koRounds} flashIds={flashIds} feedersMap={feedersMap}/>
          : <NoBracket/>
      )}
    </div>
  );
};

export default MatchesTab;

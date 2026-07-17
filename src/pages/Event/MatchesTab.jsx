import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, List, GitBranch, ChevronDown, Trophy, BarChart2, Wifi, ZoomIn, ZoomOut, Move, Maximize2 } from "lucide-react";
import { getPublicStages } from "../../api/matchApi";
import { useMatchWebSocket } from "../../hooks/useMatchWebSocket";
import "./eventTheme.css";

/* ═══════════════════════════════════════════════════════════════════
   FORMAT DETECTION
═══════════════════════════════════════════════════════════════════ */
const FORMAT_MAP = {
  "Loại trực tiếp":      "single_elimination",
  "Loại trực tiếp kép":  "double_elimination",
  "Vòng bảng + Playoff": "group_stage",
  "Vòng bảng":           "round_robin",
};
const detectFormatFromTournament = (t) =>
  t?.bracketType || FORMAT_MAP[t?.formatName] || "single_elimination";

const detectFormatFromStages = (stages) => {
  if (!stages?.length) return null;
  const types = stages.map(s => s.stageType);
  if (types.includes("WINNERS") || types.includes("LOSERS") || types.includes("GRAND_FINAL"))
    return "double_elimination";
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

const apiMatchToComp = (m) => {
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

const buildRoundsFromApiStage = (stageMatches, stageType) => {
  if (!stageMatches?.length) return [];
  const roundNos = [...new Set(stageMatches.map(m => m.roundNo))].sort((a,b)=>a-b);
  const total = roundNos.length;
  return roundNos.map((rNo, idx) => {
    const fromEnd = total - 1 - idx;
    const label = fromEnd === 0 ? "Chung kết"
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
   Trả về mảng đã xếp hạng: [{ id, name, played, wins, losses, framesWon, framesLost, frameDiff, rank }] */
const computeStandings = (matches) => {
  const table = {};
  const ensure = (p) => {
    if (!p?.id) return null;
    if (!table[p.id]) table[p.id] = { id:p.id, name:p.displayName||"—", played:0, wins:0, losses:0, framesWon:0, framesLost:0 };
    return table[p.id];
  };
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
  return Object.values(table)
    .map((r) => ({ ...r, frameDiff: r.framesWon - r.framesLost }))
    .sort((x, y) => y.wins - x.wins || y.frameDiff - x.frameDiff || y.framesWon - x.framesWon)
    .map((r, i) => ({ ...r, rank: i + 1 }));
};

/* ═══════════════════════════════════════════════════════════════════
   SHARED DISPLAY COMPONENTS
═══════════════════════════════════════════════════════════════════ */
const BracketCard = ({ match, compact, flashIds }) => {
  const navigate   = useNavigate();
  const isLive     = match?.status === "live";
  const isDone     = match?.status === "done";
  const isUpcoming = match?.status === "upcoming";
  const isFlashing = match && flashIds?.has(match.id);
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
              {p?.name||"TBD"}
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

const MatchRow = ({ m, matchNum, flashIds }) => {
  const navigate   = useNavigate();
  const num        = matchNum ?? m.seq;
  const isLive     = m.status === "live";
  const isDone     = m.status === "done";
  const p1Win      = m.winSide === 1;
  const p2Win      = m.winSide === 2;
  const isFlashing = flashIds?.has(m.id);

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
            {m.p1?.name}
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
            {m.p2?.name}
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
        <span className="text-[9px] text-sky-600 dark:text-sky-300/70 font-normal tracking-wide">
          #{num} / W#{num+15} / L#{num+25}
        </span>
      </div>
    </div>
  );
};

const BRACKET_BADGE = {
  W:  { label:"WB", cls:"bg-emerald-500/15 text-emerald-400" },
  L:  { label:"LB", cls:"bg-orange-500/15 text-orange-400"   },
  GF: { label:"GF", cls:"bg-yellow-500/15 text-yellow-400"   },
};

const ListView = ({ matches, rounds, flashIds }) => {
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
              <span className="text-[10px] font-light text-white/70">Race to {round.raceTO}</span>
            </div>
            <div>{rMatches.map(m=><MatchRow key={m.id} m={m} matchNum={matchNumMap[m.id]} flashIds={flashIds}/>)}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   STANDING VIEW — bảng điểm vòng tròn (tính từ dữ liệu BE)
═══════════════════════════════════════════════════════════════════ */
const StandingTable = ({ title, rows, qualifyCount }) => {
  const navigate = useNavigate();
  return (
  <div className="rounded-3xl overflow-hidden shadow-sm"
       style={{background:"var(--evt-card-bg)",border:"1px solid var(--evt-card-border)"}}>
    {title && (
      <div className="flex items-center justify-between px-5 py-2.5"
           style={{background:"linear-gradient(135deg,#9b1c1c 0%,#7f1616 100%)"}}>
        <span className="text-xs font-semibold text-white tracking-wide">{title}</span>
        <span className="text-[10px] font-light text-white/70">{rows.length} cơ thủ</span>
      </div>
    )}
    {/* Header */}
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-white/[0.08] text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/35">
      <span className="w-7 text-center shrink-0">#</span>
      <span className="flex-1 min-w-0">Cơ thủ</span>
      <span className="w-8 text-center shrink-0" title="Số trận">Trận</span>
      <span className="w-8 text-center shrink-0" title="Thắng">Thắng</span>
      <span className="w-10 text-center shrink-0" title="Hiệu số frame">Hiệu số</span>
      <span className="w-10 text-center shrink-0" title="Frame thắng">Frame</span>
    </div>
    {/* Rows */}
    {rows.length === 0 ? (
      <p className="px-4 py-8 text-center text-slate-400 dark:text-white/30 text-xs font-light">Chưa có kết quả</p>
    ) : rows.map((r) => {
      const qualified = qualifyCount != null && r.rank <= qualifyCount;
      return (
        <div key={r.id}
             className={`flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.04] last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] ${qualified?"bg-emerald-50 dark:bg-emerald-400/[0.05]":""}`}>
          <span className="w-7 shrink-0 flex justify-center">
            <span className={`text-[11px] font-bold w-6 h-6 rounded-lg flex items-center justify-center ${
              r.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-yellow-400/20 dark:text-yellow-300 dark:border-yellow-400/30"
              : qualified ? "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/25"
              : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/[0.06] dark:text-white/50 dark:border-white/10"}`}>
              {r.rank}
            </span>
          </span>
          <span className="flex-1 min-w-0 flex items-center gap-2">
            <span
              onClick={r.id ? () => navigate(`/event/players/${r.id}`) : undefined}
              className={`text-[13px] truncate ${r.id?"cursor-pointer hover:underline":""} ${r.rank===1?"text-amber-600 dark:text-[#fbbf24] font-bold":"text-slate-800 dark:text-white font-medium"}`}>{r.name}</span>
            {qualified && <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-400/80 dark:bg-emerald-400/10 px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide">Vào vòng trong</span>}
          </span>
          <span className="w-8 text-center shrink-0 text-[12px] text-slate-400 dark:text-white/45 tabular-nums">{r.played}</span>
          <span className="w-8 text-center shrink-0 text-[13px] font-bold text-slate-800 dark:text-white tabular-nums">{r.wins}</span>
          <span className={`w-10 text-center shrink-0 text-[12px] font-semibold tabular-nums ${r.frameDiff>0?"text-blue-600 dark:text-blue-400":r.frameDiff<0?"text-red-600 dark:text-red-400":"text-slate-400 dark:text-white/40"}`}>
            {r.frameDiff>0?"+":""}{r.frameDiff}
          </span>
          <span className="w-10 text-center shrink-0 text-[12px] text-slate-400 dark:text-white/45 tabular-nums">{r.framesWon}</span>
        </div>
      );
    })}
  </div>
  );
};

const StandingView = ({ groups }) => {
  if (!groups.length || groups.every(g => g.rows.length === 0)) {
    return (
      <div className="rounded-3xl shadow-sm flex flex-col items-center justify-center py-16 gap-2"
           style={{background:"var(--evt-card-bg)",border:"1px solid var(--evt-card-border)"}}>
        <BarChart2 size={30} className="text-slate-300 dark:text-white/15"/>
        <p className="text-slate-500 dark:text-white/40 text-sm font-light">Chưa có bảng điểm — các trận vòng bảng chưa hoàn thành</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <StandingTable key={g.id} title={g.name} rows={g.rows} qualifyCount={g.qualifyCount}/>
      ))}
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

const BracketView = ({ matches, rounds, flashIds }) => {
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
                  <p className="text-sky-600 dark:text-sky-300/40 text-[9px] font-medium mt-0.5">Race to {r.raceTO}</p>
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
                      <BracketCard match={m} compact={false} flashIds={flashIds}/>
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
const DoubleEliminationBracketView = ({ stages, flashIds }) => {
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
          <BracketView matches={wbMatches} rounds={wbRounds} flashIds={flashIds}/>
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
          <BracketView matches={lbMatches} rounds={lbRounds} flashIds={flashIds}/>
        </div>
      )}
      {gfMatch && (
        <div className="rounded-3xl overflow-hidden border border-yellow-500/20 shadow-sm"
             style={{background:"var(--evt-card-bg)"}}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-200 dark:border-white/[0.08]">
            <Trophy size={12} className="text-yellow-400 shrink-0"/>
            <span className="text-slate-800 dark:text-white text-xs font-semibold tracking-wide">CHUNG KẾT LỚN (GRAND FINAL)</span>
            <span className="ml-auto text-[10px] text-yellow-400/50">Race to {gfMatch.raceTo}</span>
          </div>
          <div className="p-5 flex justify-center">
            <BracketCard match={gfMatch} compact={false} flashIds={flashIds}/>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   FORMAT BADGE
═══════════════════════════════════════════════════════════════════ */
const FORMAT_INFO = {
  single_elimination: { label:"Loại trực tiếp 1 lần thua", bg:"bg-blue-50",   text:"text-blue-600",   dot:"bg-blue-400"   },
  double_elimination: { label:"Loại trực tiếp 2 lần thua", bg:"bg-purple-50", text:"text-purple-600", dot:"bg-purple-400" },
  round_robin:        { label:"Vòng tròn đơn",             bg:"bg-green-50",  text:"text-green-600",  dot:"bg-green-400"  },
  group_stage:        { label:"Vòng bảng + Playoff",       bg:"bg-amber-50",  text:"text-amber-600",  dot:"bg-amber-400"  },
};
const FormatBadge = ({ format }) => {
  const info = FORMAT_INFO[format]; if (!info) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded-full ${info.bg} ${info.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`}/>{info.label}
    </span>
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
  const [wsConnected, setWsConnected] = useState(false);

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

  /* ── WebSocket: cập nhật tỷ số real-time ── */
  const handleMatchUpdate = useCallback((updatedMatch) => {
    setWsConnected(true);
    setStages(prev => prev.map(stage => {
      if (!stage.matches) return stage;
      const matchIdx = stage.matches.findIndex(m => m.id === updatedMatch.id);
      if (matchIdx === -1) return stage;
      const newMatches = [...stage.matches];
      newMatches[matchIdx] = {
        ...newMatches[matchIdx],
        player1Score: updatedMatch.player1Score,
        player2Score: updatedMatch.player2Score,
        status: updatedMatch.status,
        winner: updatedMatch.winner,
        loser: updatedMatch.loser,
      };
      return { ...stage, matches: newMatches };
    }));

    // Flash effect: dùng string ID vì apiMatchToComp chuyển id → String
    const sid = String(updatedMatch.id);
    setFlashIds(prev => { const s = new Set(prev); s.add(sid); return s; });
    clearTimeout(flashTimers.current[sid]);
    flashTimers.current[sid] = setTimeout(() => {
      setFlashIds(prev => { const s = new Set(prev); s.delete(sid); return s; });
    }, 1500);
  }, []);

  useMatchWebSocket(tournament?.id, handleMatchUpdate);

  /* Detect format */
  const format = useMemo(
    () => detectFormatFromStages(stages) || detectFormatFromTournament(tournament),
    [stages, tournament]
  );
  const views = VIEWS[format] || VIEWS.single_elimination;
  const validView = views.find(v=>v.id===view) ? view : views[0].id;

  /* Flatten all matches into component format */
  const { allMatches, rounds } = useMemo(() => {
    if (!stages.length) return { allMatches: [], rounds: [] };

    let allM = [], allR = [];
    stages.forEach(stage => {
      const compMatches = (stage.matches||[]).map(m => ({
        ...apiMatchToComp(m),
        stageType: stage.stageType,
        stageName: stage.name,
        raceTo: m.raceTo,
      }));
      const stageRounds = buildRoundsFromApiStage(stage.matches||[], stage.stageType);
      // Re-key roundId to avoid collision across stages
      compMatches.forEach(m => { m.roundId = `${stage.stageType}_r${m.roundNo}`; });
      stageRounds.forEach(r => { r.id = `${stage.stageType}_r${r.id.replace("r","")}`; });
      allM = [...allM, ...compMatches];
      allR = [...allR, ...stageRounds];
    });
    return { allMatches: allM, rounds: allR };
  }, [stages]);

  /* Matches for KNOCKOUT stage (single elim) */
  const koStage   = stages.find(s => s.stageType === "KNOCKOUT");
  const koMatches = useMemo(
    () => (koStage?.matches||[]).map(m => ({...apiMatchToComp(m), raceTo:m.raceTo})),
    [koStage]
  );
  const koRounds  = useMemo(
    () => buildRoundsFromApiStage(koStage?.matches||[], "KNOCKOUT"),
    [koStage]
  );

  /* Bảng điểm (group_stage / round_robin) — tính từ trận vòng bảng */
  const standingGroups = useMemo(() => {
    const groupStages = stages.filter(s => s.stageType === "GROUP");
    const src = groupStages.length
      ? groupStages
      : stages.filter(s => !["KNOCKOUT","WINNERS","LOSERS","GRAND_FINAL"].includes(s.stageType));
    const multi = src.length > 1;
    return src.map((s, i) => ({
      id: `${s.stageType}_${s.id ?? i}`,
      name: s.name || (multi ? `Bảng ${String.fromCharCode(65 + i)}` : "Bảng xếp hạng"),
      rows: computeStandings(s.matches || []),
      qualifyCount: null,
    }));
  }, [stages]);

  /* Filtered for list view */
  const filteredMatches = useMemo(() => {
    const q = nameSearch.toLowerCase();
    return allMatches.filter(m => {
      const inName  = !q || m.p1?.name.toLowerCase().includes(q) || m.p2?.name.toLowerCase().includes(q);
      const inRound = !roundFilter || m.roundId === roundFilter;
      return inName && inRound;
    });
  }, [allMatches, nameSearch, roundFilter]);

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

  return (
    <div className="space-y-4">
      {/* Header: format badge + view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FormatBadge format={format}/>
          {tournament?.status === "IN_PROGRESS" && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${wsConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              <Wifi size={10}/>
              {wsConnected ? "Realtime" : "Kết nối..."}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {views.map(({id,label,Icon})=>(
            <button key={id} onClick={()=>setView(id)}
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
          ? <ListView matches={filteredKo} rounds={koRounds} flashIds={flashIds}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}
      {format === "single_elimination" && validView === "bracket" && (
        koMatches.length > 0
          ? <BracketView matches={koMatches} rounds={koRounds} flashIds={flashIds}/>
          : <NoBracket/>
      )}

      {/* Double Elimination */}
      {format === "double_elimination" && validView === "list" && (
        filteredMatches.length > 0
          ? <ListView matches={filteredMatches} rounds={rounds} flashIds={flashIds}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}
      {format === "double_elimination" && validView === "bracket" && (
        <DoubleEliminationBracketView stages={stages} flashIds={flashIds}/>
      )}

      {/* Group stage / Round robin: Lịch đấu */}
      {(format === "group_stage" || format === "round_robin") && validView === "list" && (
        filteredMatches.length > 0
          ? <ListView matches={filteredMatches} rounds={rounds} flashIds={flashIds}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}

      {/* Group stage / Round robin: Bảng điểm */}
      {(format === "group_stage" || format === "round_robin") && validView === "standing" && (
        <StandingView groups={standingGroups}/>
      )}

      {/* Group stage: Playoff (bracket từ vòng knockout) */}
      {format === "group_stage" && validView === "bracket" && (
        koMatches.length > 0
          ? <BracketView matches={koMatches} rounds={koRounds}/>
          : <NoBracket/>
      )}
    </div>
  );
};

export default MatchesTab;

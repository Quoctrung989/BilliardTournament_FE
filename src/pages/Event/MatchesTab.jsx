import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Search, List, GitBranch, ChevronDown, Trophy, BarChart2, Wifi } from "lucide-react";
import { getPublicStages } from "../../api/matchApi";
import { useMatchWebSocket } from "../../hooks/useMatchWebSocket";

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
  }
  return {
    id: String(m.id),
    roundId: `r${m.roundNo}`,
    seq: m.positionNo,
    table: m.matchCode || `#${m.id}`,
    time: m.scheduledAt || null,
    p1: { name: m.player1?.displayName || "TBD", flag: "", score: m.player1Score ?? null },
    p2: { name: m.player2?.displayName || "TBD", flag: "", score: m.player2Score ?? null },
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

/* ═══════════════════════════════════════════════════════════════════
   SHARED DISPLAY COMPONENTS
═══════════════════════════════════════════════════════════════════ */
const BracketCard = ({ match, compact, flashIds }) => {
  const isLive     = match?.status === "live";
  const isUpcoming = match?.status === "upcoming";
  const isFlashing = match && flashIds?.has(match.id);
  const W = compact ? 180 : 210;

  if (!match) return (
    <div className="rounded-xl border border-dashed border-white/10 flex items-center justify-center"
         style={{ width:W, height:70, background:"rgba(255,255,255,0.04)" }}>
      <span className="text-white/20 text-xs">TBD</span>
    </div>
  );

  return (
    <div className={`rounded-xl overflow-hidden border ${isLive?"border-red-500/40":"border-white/10"} ${isFlashing?"ws-flash":""}`}
         style={{ width:W, height:70, background: isLive?"rgba(239,52,42,0.08)":"rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-2.5 pt-1.5 pb-0.5">
        <span className="text-[9px] text-white/30 font-medium">{match.table}</span>
        {isLive
          ? <span className="flex items-center gap-1 text-[9px] text-red-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>LIVE</span>
          : <span className="text-[9px] text-white/25">{fmtTime(match.time)}</span>}
      </div>
      {[{p:match.p1,side:1},{p:match.p2,side:2}].map(({p,side})=>{
        const isWinner = match.winSide === side;
        return (
          <div key={side} className={`flex items-center justify-between px-2.5 py-[3px] mx-1 rounded ${isWinner?"bg-yellow-400/15":""}`}>
            <span className={`text-[11px] leading-tight truncate ${isWinner?"text-[#fbbf24] font-bold":isUpcoming?"text-white/60 font-light":"text-white/40 font-light"}`}
                  style={{maxWidth: compact?108:133}}>
              {p?.name||"TBD"}
            </span>
            <span className={`text-sm font-bold tabular-nums shrink-0 ${isWinner?"text-[#ef342a]":"text-white/30"}`}>
              {p?.score??(isUpcoming?"":"—")}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const MatchRow = ({ m, matchNum, flashIds }) => {
  const num        = matchNum ?? m.seq;
  const isLive     = m.status === "live";
  const isDone     = m.status === "done";
  const p1Win      = m.winSide === 1;
  const p2Win      = m.winSide === 2;
  const isFlashing = flashIds?.has(m.id);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] last:border-0 transition-colors ${isLive?"":"hover:bg-white/[0.03]"} ${isFlashing?"ws-flash":""}`}
         style={isLive?{background:"rgba(239,52,42,0.07)"}:{}}>
      <div className="shrink-0 w-10 text-center">
        <span className="text-[11px] italic font-bold text-sky-400/60">{m.table}</span>
      </div>
      <div className="flex-1 flex items-center min-w-0">
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className={`text-[13px] leading-tight truncate text-right max-w-[100px] sm:max-w-[140px] ${p1Win?"font-bold text-[#fbbf24]":isDone?"text-white font-light":"text-white/65"}`}>
            {m.p1?.name}
          </span>
          <span className={`text-xl font-black tabular-nums shrink-0 w-7 text-right ${p1Win?"text-[#ef342a]":m.p1?.score!=null?"text-white":"text-transparent"}`}>
            {m.p1?.score??""}
          </span>
        </div>
        <span className="shrink-0 text-[10px] text-white/20 font-medium px-3">vs</span>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className={`text-xl font-black tabular-nums shrink-0 w-7 ${p2Win?"text-[#ef342a]":m.p2?.score!=null?"text-white":"text-transparent"}`}>
            {m.p2?.score??""}
          </span>
          <span className={`text-[13px] leading-tight truncate max-w-[100px] sm:max-w-[140px] ${p2Win?"font-bold text-[#fbbf24]":isDone?"text-white font-light":"text-white/65"}`}>
            {m.p2?.name}
          </span>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5 pl-3 border-l border-white/[0.07] min-w-[95px]">
        {isLive
          ? <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>LIVE
            </span>
          : <span className="text-[10px] text-sky-400/70 font-light">{fmtTime(m.time)}</span>
        }
        <span className="text-[9px] text-sky-400/50 font-light tracking-wide">
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
               style={{background:"linear-gradient(160deg,#0d1b2e 0%,#0f2237 100%)",border:"1px solid rgba(255,255,255,0.06)"}}>
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
   DYNAMIC BRACKET VIEW — works with any number of rounds
═══════════════════════════════════════════════════════════════════ */
const C_H=70, C_W=210, P_GAP=14, P_SP=28, R_GAP=56;

function buildBracketGeometry(rounds, matchesByRound) {
  // Find first round match count to determine bracket size
  const firstRoundId = rounds[0]?.id;
  const firstRoundCount = matchesByRound[firstRoundId]?.length || 1;
  const bracketSize = firstRoundCount * 2; // total players

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

  return (
    <div className="rounded-3xl overflow-auto border border-gray-100 shadow-sm"
         style={{background:"linear-gradient(160deg,#0d1b2e 0%,#0f2237 100%)"}}>
      <div className="flex border-b border-white/[0.08]" style={{width:svgW+40,paddingLeft:20,paddingRight:20}}>
        {rounds.map((r,i)=>(
          <div key={r.id} className="flex-shrink-0 text-center py-2.5" style={{width:C_W,marginLeft:i>0?R_GAP:0}}>
            <p className="text-white text-xs font-semibold">{r.label}</p>
            <p className="text-white/35 text-[10px] font-light">Race to {r.raceTO}</p>
          </div>
        ))}
      </div>
      <div className="relative" style={{width:svgW+40,height:svgH,margin:"16px 20px"}}>
        <svg className="absolute inset-0 pointer-events-none" width={svgW} height={svgH} style={{overflow:"visible"}}>
          {paths.map((d,i)=><path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5}/>)}
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
        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
             style={{background:"linear-gradient(160deg,#0d1b2e 0%,#0f2237 100%)"}}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"/>
            <span className="text-white text-xs font-semibold tracking-wide">NHÁNH THẮNG (WINNER BRACKET)</span>
            <span className="ml-auto text-[10px] text-white/30">Thua → Nhánh Thua</span>
          </div>
          <BracketView matches={wbMatches} rounds={wbRounds} flashIds={flashIds}/>
        </div>
      )}
      {lbMatches.length > 0 && (
        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
             style={{background:"linear-gradient(160deg,#1c0e0e 0%,#2a1515 100%)"}}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"/>
            <span className="text-white text-xs font-semibold tracking-wide">NHÁNH THUA (LOSER BRACKET)</span>
            <span className="ml-auto text-[10px] text-white/30">Thắng → Chung kết</span>
          </div>
          <BracketView matches={lbMatches} rounds={lbRounds} flashIds={flashIds}/>
        </div>
      )}
      {gfMatch && (
        <div className="rounded-3xl overflow-hidden border border-yellow-500/20 shadow-sm"
             style={{background:"linear-gradient(160deg,#1a1408 0%,#221c0a 100%)"}}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.08]">
            <Trophy size={12} className="text-yellow-400 shrink-0"/>
            <span className="text-white text-xs font-semibold tracking-wide">CHUNG KẾT LỚN (GRAND FINAL)</span>
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
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm text-center py-16">
    <p className="text-gray-400 text-sm font-light">Không tìm thấy trận đấu phù hợp.</p>
    {onClear && <button onClick={onClear} className="mt-2 text-[#ef342a] text-xs hover:underline">Xóa bộ lọc</button>}
  </div>
);

const NoBracket = () => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-28 gap-2">
    <p className="text-gray-200 text-4xl font-semibold">Lịch thi đấu</p>
    <p className="text-gray-400 text-sm font-light">Bracket chưa được sinh hoặc chưa có trận nào</p>
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
                        ?"bg-[#0d1b2e] text-white shadow-sm"
                        :"bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                    }`}>
              <Icon size={14}/>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              <input type="text" placeholder="Tìm tên cơ thủ..." value={nameSearch}
                     onChange={e=>setNameSearch(e.target.value)}
                     className="w-full bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-8 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:border-[#0d1b2e]/15 focus:bg-white transition-all"/>
            </div>
            {format !== "group_stage" && rounds.length > 0 && (
              <div className="relative min-w-[140px]">
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <select value={roundFilter} onChange={e=>setRoundFilter(e.target.value)}
                        className="w-full appearance-none bg-[#f8f9fb] border border-transparent text-[#0d1b2e] text-sm font-light rounded-2xl pl-4 pr-8 py-2 focus:outline-none focus:border-[#0d1b2e]/15 transition-all cursor-pointer">
                  <option value="">Tất cả vòng</option>
                  {rounds.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center px-1">
              <span className="text-[11px] text-gray-400 font-light">{filteredMatches.length} trận</span>
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

      {/* Fallback list for other formats */}
      {format !== "single_elimination" && format !== "double_elimination" && validView === "list" && (
        filteredMatches.length > 0
          ? <ListView matches={filteredMatches} rounds={rounds} flashIds={flashIds}/>
          : <EmptyState onClear={()=>{setNameSearch("");setRoundFilter("");}}/>
      )}
    </div>
  );
};

export default MatchesTab;

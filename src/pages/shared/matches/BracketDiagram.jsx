import { useLayoutEffect, useRef, useState, useCallback } from "react";
import { Trophy, ArrowLeftRight, Swords, Play, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import AdminCard from "../../../components/admin/ui/AdminCard";

/* ══════════════════════════════════════════════════════════
   Shared visual atoms (giữ tách biệt với DrawPage.jsx để tránh
   đụng chạm code list-view đã chạy ổn định)
══════════════════════════════════════════════════════════ */
const AVATAR_COLORS = ["#6366f1","#8b5cf6","#0ea5e9","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4"];
const avatarColor = (id) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
const initials    = (name) => name ? name.trim().charAt(0).toUpperCase() : "?";

const STAGE_META = {
  KNOCKOUT:            { icon: <Swords size={14} />,                              label: "Loại trực tiếp" },
  WINNERS:             { icon: <Trophy size={14} />,                              label: "Nhánh thắng" },
  LOSERS:              { icon: <ArrowLeftRight size={14} />,                      label: "Nhánh thua" },
  GRAND_FINAL:         { icon: <Trophy size={14} className="text-amber-500" />,   label: "Chung kết lớn" },
  FINAL_BRACKET:       { icon: <Swords size={14} />,                              label: "Loại trực tiếp" },
  PROGRESSIVE_PLAYOFF: { icon: <Trophy size={14} />,                              label: "Playoff" },
};
/** Các loại stage có hình cây nhị phân (round/positionNo + nextMatchWinId) — vẽ được sơ đồ. */
const TREE_STAGE_TYPES = new Set(["KNOCKOUT", "WINNERS", "LOSERS", "FINAL_BRACKET", "PROGRESSIVE_PLAYOFF"]);

function roundLabel(roundNo, totalRounds) {
  const diff = totalRounds - roundNo;
  if (diff === 0) return "Chung kết";
  if (diff === 1) return "Bán kết";
  if (diff === 2) return "Tứ kết";
  return `Vòng ${roundNo}`;
}

/**
 * Nhánh thắng/thua của thể thức loại kép cắt sớm (CUT_TO_SE) không tự nhiên hết ở vòng cuối cùng
 * được sinh ra — số vòng vòng dùng để gắn nhãn ("Bán kết"/"Chung kết") phải suy từ cỡ bracket gốc
 * (winnersBracketSize, xem {@link BracketDiagram}), KHÔNG phải số vòng thật sự có trong dữ liệu.
 * Xem BracketGenerationServiceImpl#generateCutToSEDE (BE) — cùng một loại lỗi, sửa song song.
 */
const log2 = (n) => Math.round(Math.log2(n));

const STATUS_LABEL = {
  PENDING: "Chờ", IN_PROGRESS: "Đang đấu", COMPLETED: "Xong", WALKOVER: "Xử thắng", BYE: "Miễn đấu",
};
const STATUS_DOT = {
  PENDING: "bg-slate-300", IN_PROGRESS: "bg-blue-500 animate-pulse",
  COMPLETED: "bg-emerald-500", WALKOVER: "bg-amber-500", BYE: "bg-slate-200 dark:bg-white/10",
};

function MiniAvatar({ name, id }) {
  return (
    <span
      className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px] shrink-0"
      style={{ backgroundColor: avatarColor(id) }}
    >
      {initials(name)}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   MatchNode — 1 ô trận trong sơ đồ cây
══════════════════════════════════════════════════════════ */
const MatchNode = ({ match, nodeRef, onStart, onScore, onComplete, starting, flashing, feeders }) => {
  const isBye = match.status === "BYE";
  const canStart    = match.status === "PENDING" && match.player1 && match.player2;
  const inProgress  = match.status === "IN_PROGRESS";

  return (
    <div
      ref={nodeRef}
      className={[
        "group w-56 rounded-lg border bg-white dark:bg-[#161a22] shadow-sm text-xs shrink-0 transition-all",
        isBye ? "opacity-60 border-slate-100 dark:border-white/10" : "border-slate-200 dark:border-white/10",
        flashing ? "ws-flash" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 rounded-t-lg">
        <span className="font-mono text-[10px] text-slate-400 dark:text-white/40">{match.matchCode}</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-white/60">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[match.status] ?? "bg-slate-300"}`} />
          {STATUS_LABEL[match.status] ?? match.status}
        </span>
      </div>

      {[["player1", match.player1], ["player2", match.player2]].map(([slot, p]) => {
        const isW = Boolean(p && match.winner && match.winner.id === p.id);
        const feeder = !p ? feeders?.[slot] : null;
        return (
          <div key={slot} className={`flex items-center gap-1.5 px-2 py-1 ${isW ? "bg-emerald-50" : ""}`}>
            <MiniAvatar name={p?.displayName} id={p?.id} />
            <span className={`flex-1 truncate ${isW ? "font-bold text-emerald-700" : p ? "text-slate-700 dark:text-white/75" : "text-slate-300 italic"}`}>
              {p?.displayName ?? (feeder ? `${feeder.type === "win" ? "Thắng" : "Thua"} ${feeder.code}` : "TBD")}
              {isW && " ✓"}
            </span>
            {["IN_PROGRESS", "COMPLETED", "WALKOVER"].includes(match.status) && (
              <span className="font-mono text-slate-500 dark:text-white/60 shrink-0">
                {slot === "player1" ? match.player1Score : match.player2Score}
              </span>
            )}
          </div>
        );
      })}

      {(canStart || inProgress) && (
        <div className="flex items-center justify-end gap-1 px-1.5 py-1 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
          {canStart && (
            <button title="Bắt đầu" disabled={starting}
                    onClick={() => onStart(match.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50">
              {starting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            </button>
          )}
          {inProgress && (
            <>
              <button title="Cập nhật tỷ số" onClick={() => onScore(match)}
                      className="w-6 h-6 rounded flex items-center justify-center text-blue-600 hover:bg-blue-50">
                <AlertCircle size={12} />
              </button>
              <button title="Kết thúc trận" onClick={() => onComplete(match)}
                      className="w-6 h-6 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50">
                <CheckCircle size={12} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   ConnectorOverlay — SVG vẽ đường nối theo vị trí DOM đo được
   (đo thật thay vì suy luận toán học → luôn đúng kể cả nhánh
   thua có cách nối lệch pha chẵn/lẻ vòng).
══════════════════════════════════════════════════════════ */
const ConnectorOverlay = ({ containerRef, nodesRef, links, signal }) => {
  const [paths, setPaths] = useState([]);
  /* Kích thước vẽ phải bám theo TOÀN BỘ nội dung, không phải phần đang nhìn
     thấy: container có `overflow-x-auto`, nên với bracket nhiều vòng thì
     `w-full` chỉ bằng bề ngang khung nhìn và mọi đường nối nằm ngoài đó bị
     SVG cắt mất. */
  const [size, setSize] = useState({ w: 0, h: 0 });

  const recompute = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    /* Khối đang ẩn (đổi tab, chưa mở panel) đo ra toàn số 0. Vẽ lúc này chỉ
       tạo ra một đống đường chụm ở góc, nên bỏ qua và chờ lần đo sau. */
    if (containerRect.width === 0) return;

    /* Toạ độ quy về hệ của container. Cộng scrollLeft/Top vì
       `getBoundingClientRect` trả theo khung nhìn, còn SVG nằm trong vùng cuộn
       nên gốc của nó dịch theo mức đã cuộn. */
    const originX = containerRect.left - container.scrollLeft;
    const originY = containerRect.top - container.scrollTop;

    const next = [];
    links.forEach(({ from, to }) => {
      const fromEl = nodesRef.current.get(from);
      const toEl = nodesRef.current.get(to);
      if (!fromEl || !toEl) return;
      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      const x1 = fr.right - originX;
      const y1 = fr.top + fr.height / 2 - originY;
      const x2 = tr.left - originX;
      const y2 = tr.top + tr.height / 2 - originY;
      const midX = (x1 + x2) / 2;
      next.push(`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`);
    });

    setSize({ w: container.scrollWidth, h: container.scrollHeight });
    setPaths(next);
  }, [containerRef, nodesRef, links]);

  useLayoutEffect(() => {
    recompute();

    /* Đo thêm một nhịp ở khung hình kế tiếp. Lần đo trên có thể rơi vào lúc
       layout chưa xong (phông chữ còn đang tải, ảnh chưa có kích thước), và
       ResizeObserver thì chỉ báo khi kích thước ĐỔI — không có nhịp này thì
       một lần đo hụt là sơ đồ trống cho tới lần tương tác sau. */
    const raf = requestAnimationFrame(recompute);

    /* Theo dõi cả container lẫn khối nội dung bên trong: thêm/bớt vòng làm
       nội dung cao lên mà bề ngoài container có khi không đổi. */
    const ro = new ResizeObserver(recompute);
    const container = containerRef.current;
    if (container) {
      ro.observe(container);
      if (container.firstElementChild) ro.observe(container.firstElementChild);
    }
    window.addEventListener("resize", recompute);
    container?.addEventListener("scroll", recompute, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", recompute);
      container?.removeEventListener("scroll", recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recompute, signal]);

  return (
    <svg
      className="absolute left-0 top-0 pointer-events-none text-slate-300 dark:text-white/20"
      width={size.w || "100%"}
      height={size.h || "100%"}
      style={{ zIndex: 0 }}
    >
      {paths.map((d, i) => (
        /* `currentColor` để đường nối lật theo chế độ sáng/tối — màu cứng
           #cbd5e1 gần như biến mất trên nền tối #161a22. */
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="2" />
      ))}
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════
   BracketTreeSection — 1 khối cây (KNOCKOUT / WINNERS / LOSERS /
   FINAL_BRACKET / PROGRESSIVE_PLAYOFF) tự đo & tự vẽ đường nối.
══════════════════════════════════════════════════════════ */
/** matchId (đích) -> { player1: {type,code}|null, player2: {...}|null } của trận nguồn — dùng
 *  winSlot/loseSlot (BE trả về đúng slot player1/player2) thay vì đoán qua positionNo, để đúng
 *  cả nhánh thắng (nextMatchWinId) lẫn nhánh thua rớt xuống (nextMatchLoseId) ở Double Elimination. */
export function buildFeedersMap(allMatches) {
  const result = new Map();
  const ensure = (id) => {
    if (!result.has(id)) result.set(id, { player1: null, player2: null });
    return result.get(id);
  };
  allMatches.forEach(m => {
    if (m.nextMatchWinId && m.winSlot) {
      ensure(m.nextMatchWinId)[m.winSlot] = { type: "win", code: m.matchCode };
    }
    if (m.nextMatchLoseId && m.loseSlot) {
      ensure(m.nextMatchLoseId)[m.loseSlot] = { type: "lose", code: m.matchCode };
    }
  });
  return result;
}

const BracketTreeSection = ({ stage, startingId, flashIds, onStart, onScore, onComplete, feedersMap, winnersBracketSize }) => {
  const containerRef = useRef(null);
  const nodesRef = useRef(new Map());
  const registerNode = useCallback((id, el) => {
    if (el) nodesRef.current.set(id, el); else nodesRef.current.delete(id);
  }, []);

  const matches = stage.matches ?? [];
  const rounds = {};
  matches.forEach(m => { (rounds[m.roundNo] ??= []).push(m); });
  const sortedRounds = Object.entries(rounds)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([roundNo, ms]) => [roundNo, [...ms].sort((a, b) => a.positionNo - b.positionNo)]);

  // WINNERS/LOSERS của DE cắt sớm (CUT_TO_SE) không tự nhiên hết ở vòng cuối cùng được sinh ra —
  // nhãn vòng đấu phải tính theo cỡ bracket gốc (winnersBracketSize), KHÔNG phải sortedRounds.length.
  let totalRounds = sortedRounds.length;
  if (winnersBracketSize) {
    if (stage.stageType === "WINNERS") totalRounds = log2(winnersBracketSize);
    else if (stage.stageType === "LOSERS") totalRounds = 2 * (log2(winnersBracketSize) - 1);
  }

  const links = matches.filter(m => m.nextMatchWinId).map(m => ({ from: m.id, to: m.nextMatchWinId }));
  const signal = matches.map(m => `${m.id}:${m.status}:${m.player1?.id}:${m.player2?.id}:${m.winner?.id}`).join("|");

  const doneCount = matches.filter(m => ["COMPLETED", "WALKOVER", "BYE"].includes(m.status)).length;
  const meta = STAGE_META[stage.stageType] ?? { icon: <Swords size={14} />, label: stage.stageType };

  if (matches.length === 0) {
    return (
      <AdminCard padding={false}>
        <div className="px-5 py-4 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/60">{meta.icon}</div>
          <div><p className="font-semibold text-slate-900 dark:text-white text-sm">{stage.name}</p><p className="text-xs text-slate-400 dark:text-white/40">{stage.stageType}</p></div>
        </div>
        <p className="text-sm text-slate-400 dark:text-white/40 text-center pb-6">Chưa có trận nào.</p>
      </AdminCard>
    );
  }

  return (
    <AdminCard padding={false}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/60">{meta.icon}</div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{stage.name}</p>
            <p className="text-xs text-slate-400 dark:text-white/40">{stage.stageType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
          <span>{doneCount}/{matches.length}</span>
          <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.round(doneCount / matches.length * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ConnectorOverlay đặt SAU khối node, không phải trước.

          React chạy layout effect theo thứ tự cây, nên nếu overlay đứng trước
          thì effect đo toạ độ của nó chạy khi ref các MatchNode chưa kịp gắn —
          `nodesRef` còn rỗng, không vẽ được đường nào, và vì `links`/`signal`
          không đổi sau đó nên effect không chạy lại: sơ đồ trống trơn.

          Overlay dùng `position: absolute` nên đổi chỗ trong DOM không làm nó
          đổi vị trí hiển thị; `zIndex` vẫn quyết định nó nằm dưới các node. */}
      <div ref={containerRef} className="relative overflow-x-auto">
        <div className="relative flex gap-14 px-6 py-6 min-w-max" style={{ zIndex: 1 }}>
          {sortedRounds.map(([roundNo, ms]) => (
            <div key={roundNo} className="flex flex-col" style={{ width: 224 }}>
              <div className="text-center text-xs font-semibold text-slate-500 dark:text-white/60 mb-3">
                {roundLabel(Number(roundNo), totalRounds)}
              </div>
              <div className="flex-1 flex flex-col justify-around gap-5">
                {ms.map(m => (
                  <MatchNode
                    key={m.id}
                    match={m}
                    nodeRef={el => registerNode(m.id, el)}
                    starting={startingId === m.id}
                    flashing={flashIds?.has(Number(m.id))}
                    onStart={onStart}
                    onScore={onScore}
                    onComplete={onComplete}
                    feeders={feedersMap?.get(m.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ConnectorOverlay containerRef={containerRef} nodesRef={nodesRef} links={links} signal={signal} />
      </div>
    </AdminCard>
  );
};

/* ══════════════════════════════════════════════════════════
   BracketDiagram — điểm vào chính. Stage dạng cây (KNOCKOUT/
   WINNERS/LOSERS/FINAL_BRACKET/PROGRESSIVE_PLAYOFF) → vẽ sơ đồ;
   GRAND_FINAL → 1 ô nổi bật; còn lại (vòng tròn PROGRESSIVE_ROUND/
   GROUP) → fallback sang ListStageSection (component danh sách
   sẵn có) vì vòng tròn không có hình cây để vẽ.
══════════════════════════════════════════════════════════ */
const BracketDiagram = ({ stages, startingId, flashIds, onStart, onScore, onComplete, ListStageSection, listProps }) => {
  const feedersMap = buildFeedersMap(stages.flatMap(s => s.matches ?? []));
  // Vòng 1 nhánh thắng luôn có đúng bracketSize/2 trận bất kể điểm cắt CUT_TO_SE ở đâu.
  const winnersR1Count = stages
    .find(s => s.stageType === "WINNERS")
    ?.matches?.filter(m => Number(m.roundNo) === 1)?.length;
  const winnersBracketSize = winnersR1Count ? winnersR1Count * 2 : null;

  return (
    <div className="space-y-5">
      {stages.map(stage => {
        if (TREE_STAGE_TYPES.has(stage.stageType)) {
          return (
            <BracketTreeSection
              key={stage.id}
              stage={stage}
              startingId={startingId}
              flashIds={flashIds}
              onStart={onStart}
              onScore={onScore}
              onComplete={onComplete}
              feedersMap={feedersMap}
              winnersBracketSize={winnersBracketSize}
            />
          );
        }
        if (stage.stageType === "GRAND_FINAL") {
          const m = stage.matches?.[0];
          return (
            <AdminCard key={stage.id} padding={false}>
              <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                  <Trophy size={14} />
                </div>
                <div><p className="font-semibold text-slate-900 dark:text-white text-sm">{stage.name}</p><p className="text-xs text-slate-400 dark:text-white/40">{stage.stageType}</p></div>
              </div>
              <div className="flex justify-center py-8">
                {m ? (
                  <MatchNode
                    match={m}
                    nodeRef={() => {}}
                    starting={startingId === m.id}
                    flashing={flashIds?.has(Number(m.id))}
                    onStart={onStart}
                    onScore={onScore}
                    onComplete={onComplete}
                    feeders={feedersMap.get(m.id)}
                  />
                ) : <p className="text-sm text-slate-400 dark:text-white/40">Chưa có trận nào.</p>}
              </div>
            </AdminCard>
          );
        }
        // Vòng tròn (PROGRESSIVE_ROUND / GROUP) — không có hình cây, dùng lại view danh sách.
        return <ListStageSection key={stage.id} stage={stage} {...listProps} />;
      })}
    </div>
  );
};

export default BracketDiagram;

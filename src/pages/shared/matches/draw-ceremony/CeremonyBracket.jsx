import { useCallback, useEffect, useMemo, useRef } from "react";
import { ConnectorOverlay, buildFeedersMap } from "../BracketDiagram";
import { roundLabel, slotKey } from "./buildDrawScript";
import { Avatar, rankLabel } from "./playerAtoms";

/* ══════════════════════════════════════════════════════════
   CeremonyBracket — cây thi đấu phiên bản màn chiếu.

   Không tái dùng BracketDiagram: bản đó gắn liền với thao tác quản
   trị (nút bắt đầu trận, nhập tỉ số, hover action, khung AdminCard
   nền sáng). Màn chiếu cần một cây "sạch", nền tối, chữ to, và biết
   phân biệt ô ĐÃ bốc / ĐANG bốc / CHƯA bốc — nên tách riêng.

   Riêng phần vẽ đường nối thì dùng lại ConnectorOverlay (đo toạ độ
   DOM thật), tránh chép lại logic đã chạy ổn định.
══════════════════════════════════════════════════════════ */

/** Ô chưa có người: ở vòng 1 là "chưa bốc", từ vòng 2 là "chờ kết quả trận trước". */
function EmptySlot({ roundNo, feeder }) {
  if (roundNo === 1) {
    return <span className="flex-1 truncate text-white/25 tracking-[0.2em] font-mono text-xs">? ? ?</span>;
  }
  return (
    <span className="flex-1 truncate text-white/30 italic text-xs">
      {feeder ? `${feeder.type === "win" ? "Thắng" : "Thua"} ${feeder.code}` : "Chờ kết quả"}
    </span>
  );
}

function FilledSlot({ player, landing }) {
  const rank = rankLabel(player.billiardRank);
  return (
    <>
      <Avatar player={player} size={24} />
      <span className={`flex-1 truncate font-semibold text-white ${landing ? "dc-land" : ""}`}>
        {player.displayName}
      </span>
      {rank && (
        <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-white/10 text-white/45 shrink-0">
          {rank}
        </span>
      )}
    </>
  );
}

const CeremonyMatchNode = ({
  match, roundNo, nodeRef, placedSet, activeStep,
  resolved, byeRevealed, feeders, justPlacedKey,
}) => {
  const isActive = activeStep?.matchId === match.id;
  const showBye  = resolved && (match.isBye || match.status === "BYE");

  return (
    <div
      ref={nodeRef}
      className={[
        "dc-node text-[13px]",
        isActive ? "dc-node--active" : "",
        showBye ? "dc-node--bye" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-2 py-1 bg-white/[0.03] border-b border-[var(--dc-line)]">
        <span className="font-mono text-[10px] text-white/35">{match.matchCode}</span>
        {showBye && (
          <span className="dc-bye-in font-semibold text-[9px] uppercase tracking-wider text-[var(--dc-gold)]">
            Miễn đấu
          </span>
        )}
      </div>

      {["player1", "player2"].map((slot) => {
        const key      = slotKey(match.id, slot);
        const player   = match[slot];
        const isPlaced = placedSet.has(key);
        /* Ô đích của lượt quay đang diễn ra: sáng lên và giữ dấu "? ? ?" cho tới
           khi người trúng được đẩy vào — khán giả biết ô nào đang chờ. */
        const isTarget = activeStep?.matchId === match.id && activeStep?.slot === slot;

        /* Vòng ≥2 chỉ có sẵn người khi BE tự đẩy người thắng BYE lên — chỉ lộ
           ra ở pha "byes"/"done", không phải ngay lúc bốc vòng 1. */
        const showAdvanced = roundNo > 1 && player && byeRevealed;

        return (
          <div
            key={slot}
            className={`dc-slot ${isTarget ? "dc-slot--spinning" : ""}`}
          >
            {isTarget && !isPlaced ? (
              <>
                <span className="w-6 h-6 rounded-full border border-dashed border-[var(--dc-gold)] shrink-0" />
                <span className="flex-1 truncate font-bold tracking-[0.2em] text-[var(--dc-gold)]">
                  ? ? ?
                </span>
              </>
            ) : isPlaced && player ? (
              <FilledSlot player={player} landing={justPlacedKey === key} />
            ) : showAdvanced ? (
              <div className="flex items-center gap-2 flex-1 min-w-0 dc-bye-in">
                <FilledSlot player={player} />
              </div>
            ) : resolved && roundNo === 1 && !player ? (
              <span className="flex-1 truncate text-white/25 text-xs italic">— trống —</span>
            ) : (
              <EmptySlot roundNo={roundNo} feeder={feeders?.[slot]} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function CeremonyBracket({
  script, placedSet, activeStep, resolvedMatchIds, byeRevealed, justPlacedKey,
}) {
  const containerRef = useRef(null);
  const nodesRef = useRef(new Map());
  const registerNode = useCallback((id, el) => {
    if (el) nodesRef.current.set(id, el);
    else nodesRef.current.delete(id);
  }, []);

  const { rounds, totalRounds, sizing, stage } = script;
  const matches = useMemo(() => stage.matches ?? [], [stage]);

  const feedersMap = useMemo(() => buildFeedersMap(matches), [matches]);
  const links = useMemo(
    () => matches.filter((m) => m.nextMatchWinId).map((m) => ({ from: m.id, to: m.nextMatchWinId })),
    [matches],
  );
  /* Đường nối phải vẽ lại mỗi khi có ô được điền: chiều cao node đổi theo nội
     dung (tên dài xuống dòng, badge Miễn đấu xuất hiện) nên tâm node dịch. */
  const signal = `${placedSet.size}:${byeRevealed}:${resolvedMatchIds.size}`;

  /* Camera bám theo ô đang bốc — bracket 32/64 người rộng hơn màn hình. */
  useEffect(() => {
    if (!activeStep) return;
    const el = nodesRef.current.get(activeStep.matchId);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeStep]);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-auto">
      <div
        className="relative flex px-10 py-8 min-w-max min-h-full"
        style={{ zIndex: 1, gap: sizing.colGap }}
      >
        {rounds.map(([roundNo, ms], colIdx) => (
          <div
            key={roundNo}
            className="dc-round flex flex-col"
            style={{ width: sizing.nodeW, animationDelay: `${colIdx * 110}ms` }}
          >
            <div className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 mb-3">
              {roundLabel(roundNo, totalRounds)}
            </div>
            <div className="flex-1 flex flex-col justify-around" style={{ gap: sizing.gap }}>
              {ms.map((m) => (
                <CeremonyMatchNode
                  key={m.id}
                  match={m}
                  roundNo={roundNo}
                  nodeRef={(el) => registerNode(m.id, el)}
                  placedSet={placedSet}
                  activeStep={activeStep}
                  resolved={resolvedMatchIds.has(m.id)}
                  byeRevealed={byeRevealed}
                  feeders={feedersMap.get(m.id)}
                  justPlacedKey={justPlacedKey}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Đặt SAU khối node: layout effect chạy theo thứ tự cây, overlay đứng
          trước sẽ đo lúc ref các node chưa gắn và vẽ ra sơ đồ trống.
          Xem chú thích dài ở BracketDiagram#BracketTreeSection. */}
      <ConnectorOverlay
        containerRef={containerRef}
        nodesRef={nodesRef}
        links={links}
        signal={signal}
        className="dc-connectors"
      />
    </div>
  );
}

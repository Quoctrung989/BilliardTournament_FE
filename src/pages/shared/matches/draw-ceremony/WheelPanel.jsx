import { Users, RotateCw } from "lucide-react";
import SpinWheel from "./SpinWheel";
import { Avatar, rankLabel } from "./playerAtoms";

/* ══════════════════════════════════════════════════════════
   WheelPanel — cột trái màn chiếu: vòng quay + thẻ công bố kết quả.
══════════════════════════════════════════════════════════ */

const SLOT_LABEL = { player1: "vị trí trên", player2: "vị trí dưới" };

export default function WheelPanel({
  players, rotation, spinMs, spinState, onSpin,
  nextStep, landedPlayer, drawnCount, total, canSpin,
}) {
  const spinning = spinState === "spinning";

  return (
    <aside className="dc-panel rounded-xl w-[380px] shrink-0 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--dc-line)] flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide">
          <Users size={15} className="text-[var(--dc-gold)]" />
          Vòng quay bốc thăm
        </span>
        <span className="font-mono text-xs text-white/50">{drawnCount}/{total}</span>
      </div>

      <div className="px-5 pt-5 pb-3">
        <SpinWheel
          players={players}
          rotation={rotation}
          spinMs={spinMs}
          onSpin={onSpin}
          disabled={!canSpin}
          landedId={spinState === "revealing" ? landedPlayer?.id : null}
        />
      </div>

      {/* Khung công bố — luôn chiếm chỗ sẵn để vòng quay không nhảy lên xuống. */}
      <div className="px-5 pb-3 min-h-[92px] flex items-center">
        {spinState === "revealing" && landedPlayer ? (
          <div className="dc-reveal w-full rounded-xl px-4 py-3 bg-[var(--dc-gold-soft)] border border-[var(--dc-gold)]">
            <div className="flex items-center gap-3">
              <Avatar player={landedPlayer} size={40} />
              <div className="min-w-0">
                <p className="font-black text-xl truncate leading-tight">{landedPlayer.displayName}</p>
                <p className="text-xs text-white/60 truncate">
                  {rankLabel(landedPlayer.billiardRank) && (
                    <span className="font-mono mr-1.5">{rankLabel(landedPlayer.billiardRank)}</span>
                  )}
                  → {nextStep?.matchCode} · {SLOT_LABEL[nextStep?.slot] ?? ""}
                </p>
              </div>
            </div>
          </div>
        ) : nextStep ? (
          <div className="w-full text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">
              {spinning ? "Đang quay…" : "Ô đang chờ"}
            </p>
            <p className="font-bold text-lg text-white/80">
              {nextStep.matchCode} · {SLOT_LABEL[nextStep.slot]}
            </p>
          </div>
        ) : (
          <p className="w-full text-center text-sm text-white/35">Đã bốc xong toàn bộ cơ thủ</p>
        )}
      </div>

      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={onSpin}
          disabled={!canSpin}
          className={[
            "w-full h-12 rounded-xl font-black text-base tracking-wide inline-flex items-center justify-center gap-2 transition-all",
            canSpin
              ? "bg-[var(--dc-gold)] text-[#1a1204] hover:brightness-110 shadow-lg shadow-amber-500/20"
              : "bg-white/10 text-white/30 cursor-not-allowed",
          ].join(" ")}
        >
          <RotateCw size={18} className={spinning ? "animate-spin" : ""} />
          {spinning ? "ĐANG QUAY" : "QUAY"}
        </button>
        <p className="text-center text-[11px] text-white/30 mt-2">
          Bấm vòng quay hoặc phím Space
        </p>
      </div>
    </aside>
  );
}

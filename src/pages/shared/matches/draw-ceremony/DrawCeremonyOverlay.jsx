import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X, FastForward, Maximize2, Minimize2,
  Gauge, Trophy, Sparkles, AlertTriangle, Loader2,
} from "lucide-react";
import { useWakeLock } from "../../../../hooks/useWakeLock";
import { buildDrawScript, slotKey } from "./buildDrawScript";
import { computeSpinRotation } from "./SpinWheel";
import CeremonyBracket from "./CeremonyBracket";
import WheelPanel from "./WheelPanel";
import { Avatar } from "./playerAtoms";
import "./drawCeremony.css";

/* ══════════════════════════════════════════════════════════
   DrawCeremonyOverlay — lễ bốc thăm công khai.

   Chạy hoàn toàn trên `drawResult` mà BE vừa trả về; không gọi thêm
   API nào, không sửa gì trên server. Đóng màn chiếu là DrawPage tự
   nạp lại như luồng cũ.

   Nhịp do QUẢN LÝ điều khiển: mỗi lần bấm quay là một cơ thủ được
   công bố rồi đẩy vào ô đang chờ. Không có bước nào tự chạy trong
   pha bốc thăm — người dẫn chương trình giữ nhịp.

   Pha: intro → build → drawing → byes → done.
══════════════════════════════════════════════════════════ */

const COUNTDOWN_FROM = 3;
const COUNT_MS   = 900;   // mỗi số đếm ngược
const BUILD_MS   = 1500;  // dựng cây trống
const SPIN_MS    = 4200;  // vòng quay chạy tới lúc dừng
const REVEAL_MS  = 1600;  // giữ tên người trúng trước khi đẩy vào ô
const SETTLE_MS  = 900;   // nghỉ sau người cuối cùng
const BYE_MS     = 1600;  // đẩy người thắng BYE lên vòng sau
const SPIN_TURNS = 5;

const SPEEDS = [1, 2, 4];

const PHASE_LABEL = {
  intro:   "Chuẩn bị",
  build:   "Dựng cây thi đấu",
  drawing: "Đang bốc thăm",
  byes:    "Xử lý miễn đấu",
  done:    "Hoàn tất",
};

const GHOST_NOTE = {
  LOSERS: "Hình thành theo kết quả nhánh thắng",
  FINAL_BRACKET: "Điền sau khi kết thúc vòng loại",
  GRAND_FINAL: "Chờ hai nhánh",
  PROGRESSIVE_PLAYOFF: "Chờ vòng bảng",
};

/* Trang trí — dựng một lần, không đổi theo state để không render lại mỗi nhịp. */
function useDecor() {
  return useMemo(() => ({
    dust: Array.from({ length: 26 }, () => ({
      left: `${Math.random() * 100}%`,
      duration: `${9 + Math.random() * 11}s`,
      delay: `${Math.random() * 12}s`,
      scale: 0.6 + Math.random() * 1.4,
    })),
    confetti: Array.from({ length: 70 }, () => ({
      left: `${Math.random() * 100}%`,
      duration: `${2.4 + Math.random() * 2.2}s`,
      delay: `${Math.random() * 1.6}s`,
      color: ["#f5b62c", "#6366f1", "#10b981", "#ec4899", "#0ea5e9"][Math.floor(Math.random() * 5)],
    })),
  }), []);
}

/* ── Nút điều khiển nhỏ trên thanh trên cùng ─────────── */
const CtrlBtn = ({ onClick, title, active, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={[
      "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold border transition-colors",
      active
        ? "bg-[var(--dc-gold)] text-[#1a1204] border-[var(--dc-gold)]"
        : "bg-white/5 text-white/75 border-[var(--dc-line)] hover:bg-white/10 hover:text-white",
      disabled ? "opacity-40 cursor-not-allowed" : "",
    ].join(" ")}
  >
    {children}
  </button>
);

export default function DrawCeremonyOverlay({ drawResult, tournament, onClose, onCancel, cancelling }) {
  const rootRef = useRef(null);
  const decor = useDecor();

  const script = useMemo(
    () => buildDrawScript(drawResult, tournament?.format),
    [drawResult, tournament?.format],
  );
  // useMemo chứ không phải `?? []`: literal rỗng đổi identity mỗi render, kéo
  // theo mọi useMemo phía dưới tính lại vô ích.
  const steps = useMemo(() => (script.supported ? script.steps : []), [script]);

  const [phase, setPhase]           = useState("intro");
  const [count, setCount]           = useState(COUNTDOWN_FROM);
  const [drawnCount, setDrawnCount] = useState(0);          // số cơ thủ đã vào cây
  const [spinState, setSpinState]   = useState("idle");     // idle | spinning | revealing
  const [rotation, setRotation]     = useState(0);          // góc cộng dồn của vòng quay
  const [speed, setSpeed]           = useState(1);
  const [isFull, setIsFull]         = useState(false);
  const [exitAsk, setExitAsk]       = useState(false);

  const spinMs = SPIN_MS / speed;

  useWakeLock(true);

  /* Khoá cuộn trang nền — overlay là `fixed`, để trang dưới cuộn được thì lăn
     chuột trên màn chiếu sẽ kéo trang phía sau. */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* ══ Vòng quay ════════════════════════════════════════
     Thứ tự múi trên vòng được xáo một lần rồi giữ nguyên: nếu xếp theo đúng
     thứ tự bốc thì người xem đoán được ngay ai sắp ra. Xáo lại sau mỗi lượt
     cũng không được — tên nhảy chỗ loạn xạ giữa hai lượt quay.               */
  const wheelOrder = useMemo(() => {
    const arr = steps.map((s) => s.player);
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [steps]);

  const remainingIds = useMemo(
    () => new Set(steps.slice(drawnCount).map((s) => s.player.id)),
    [steps, drawnCount],
  );
  const wheelPlayers = useMemo(
    () => wheelOrder.filter((p) => remainingIds.has(p.id)),
    [wheelOrder, remainingIds],
  );

  const nextStep = phase === "drawing" && drawnCount < steps.length ? steps[drawnCount] : null;
  const canSpin  = Boolean(nextStep) && spinState === "idle";

  /* ══ Máy trạng thái ═══════════════════════════════════ */

  // Pha 0 — đếm ngược 3·2·1·BẮT ĐẦU (số 0 giữ đúng một nhịp, không nháy qua)
  useEffect(() => {
    if (phase !== "intro") return undefined;
    const t = setTimeout(() => {
      if (count <= 0) setPhase("build");
      else setCount((c) => c - 1);
    }, COUNT_MS / speed);
    return () => clearTimeout(t);
  }, [phase, count, speed]);

  // Pha 1 — dựng cây trống
  useEffect(() => {
    if (phase !== "build") return undefined;
    const t = setTimeout(() => setPhase("drawing"), BUILD_MS / speed);
    return () => clearTimeout(t);
  }, [phase, speed]);

  // Pha 2 — quay: vòng chạy hết thời gian thì công bố tên
  useEffect(() => {
    if (spinState !== "spinning") return undefined;
    const t = setTimeout(() => setSpinState("revealing"), spinMs);
    return () => clearTimeout(t);
  }, [spinState, spinMs]);

  // Pha 2 — công bố xong thì đẩy cơ thủ vào ô và trả vòng quay về trạng thái chờ
  useEffect(() => {
    if (spinState !== "revealing") return undefined;
    const t = setTimeout(() => {
      setDrawnCount((c) => c + 1);
      setSpinState("idle");
    }, REVEAL_MS / speed);
    return () => clearTimeout(t);
  }, [spinState, speed]);

  // Hết người → chuyển pha (đây là bước tự động duy nhất trong pha bốc thăm)
  useEffect(() => {
    if (phase !== "drawing" || spinState !== "idle") return undefined;
    if (drawnCount < steps.length) return undefined;
    const t = setTimeout(
      () => setPhase(script.byeAdvances?.length ? "byes" : "done"),
      SETTLE_MS / speed,
    );
    return () => clearTimeout(t);
  }, [phase, spinState, drawnCount, steps.length, script.byeAdvances, speed]);

  // Pha 3 — người thắng BYE trôi lên vòng sau
  useEffect(() => {
    if (phase !== "byes") return undefined;
    const t = setTimeout(() => setPhase("done"), BYE_MS / speed);
    return () => clearTimeout(t);
  }, [phase, speed]);

  /* ══ Trạng thái dẫn xuất ══════════════════════════════ */

  const placedCount = phase === "intro" || phase === "build" ? 0
    : phase === "drawing" ? drawnCount
    : steps.length;

  const placedSet = useMemo(
    () => new Set(steps.slice(0, placedCount).map((s) => slotKey(s.matchId, s.slot))),
    [steps, placedCount],
  );

  const resolvedMatchIds = useMemo(() => {
    const set = new Set();
    script.lastStepIndexByMatch?.forEach((lastIdx, matchId) => {
      if (lastIdx < placedCount) set.add(matchId);
    });
    return set;
  }, [script.lastStepIndexByMatch, placedCount]);

  const landedPlayer  = spinState === "revealing" ? nextStep?.player ?? null : null;
  const justPlacedKey = drawnCount > 0 && steps[drawnCount - 1]
    ? slotKey(steps[drawnCount - 1].matchId, steps[drawnCount - 1].slot)
    : null;
  const byeRevealed = phase === "byes" || phase === "done";
  const progress    = steps.length ? Math.round((placedCount / steps.length) * 100) : 0;

  /* ══ Điều khiển ═══════════════════════════════════════ */

  const handleSpin = useCallback(() => {
    if (!canSpin || !nextStep) return;
    const idx = wheelPlayers.findIndex((p) => p.id === nextStep.player.id);
    if (idx < 0) return;
    setRotation((r) => computeSpinRotation(r, idx, wheelPlayers.length, SPIN_TURNS, Math.random() - 0.5));
    setSpinState("spinning");
  }, [canSpin, nextStep, wheelPlayers]);

  const skipToEnd = useCallback(() => {
    setDrawnCount(steps.length);
    setSpinState("idle");
    setPhase("done");
  }, [steps.length]);

  const cycleSpeed = useCallback(() => {
    setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  /* Thoát giữa chừng phải hỏi lại: bracket ĐÃ được sinh ở server rồi, đóng sớm
     chỉ là bỏ dở phần trình chiếu — người vận hành cần biết điều đó. */
  const requestClose = useCallback(() => {
    if (phase === "done") { onClose(); return; }
    setExitAsk(true);
  }, [phase, onClose]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (exitAsk && e.key !== "Escape") return;
      if (e.key === "Escape") { e.preventDefault(); requestClose(); }
      else if (e.code === "Space" || e.key === "ArrowRight") { e.preventDefault(); handleSpin(); }
      else if (e.key === "f" || e.key === "F") { toggleFullscreen(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exitAsk, requestClose, handleSpin, toggleFullscreen]);

  /* ══ Thể thức không trình chiếu được ══════════════════ */
  if (!script.supported) {
    return (
      <div className="dc-root items-center justify-center" ref={rootRef}>
        <div className="dc-panel relative rounded-2xl px-8 py-7 max-w-md text-center">
          <AlertTriangle size={30} className="mx-auto text-amber-400 mb-3" />
          <p className="font-bold text-lg mb-1.5">Không trình chiếu được</p>
          <p className="text-sm text-white/60 mb-5">{script.reason}</p>
          <p className="text-xs text-white/40 mb-5">
            Bracket vẫn đã được sinh thành công trên hệ thống.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg bg-white/10 hover:bg-white/15 font-semibold text-sm"
          >
            Xem bracket
          </button>
        </div>
      </div>
    );
  }

  const round1 = script.rounds[0]?.[1] ?? [];

  return (
    <div className="dc-root" ref={rootRef}>
      <div className="dc-dust">
        {decor.dust.map((d, i) => (
          <i
            key={i}
            style={{
              left: d.left,
              animationDuration: d.duration,
              animationDelay: d.delay,
              transform: `scale(${d.scale})`,
            }}
          />
        ))}
      </div>

      {phase === "done" && (
        <div className="dc-confetti">
          {decor.confetti.map((c, i) => (
            <i
              key={i}
              style={{
                left: c.left,
                background: c.color,
                animationDuration: c.duration,
                animationDelay: c.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Thanh trên cùng ───────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-3 border-b border-[var(--dc-line)] bg-black/25">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--dc-gold)]">
            <Sparkles size={12} />
            Lễ bốc thăm công khai
          </div>
          <h1 className="font-bold text-lg truncate">{tournament?.name ?? "Giải đấu"}</h1>
        </div>

        <div className="hidden md:flex items-center gap-5 text-xs text-white/55 shrink-0">
          {tournament?.formatName && <span>{tournament.formatName}</span>}
          <span>{steps.length} cơ thủ</span>
          <span className="font-semibold text-white/80">{PHASE_LABEL[phase]}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <CtrlBtn onClick={cycleSpeed} title="Đổi tốc độ quay" disabled={phase === "done"}>
            <Gauge size={14} /> {speed}x
          </CtrlBtn>
          <CtrlBtn onClick={skipToEnd} title="Bỏ qua tới kết quả" disabled={phase === "done"}>
            <FastForward size={14} /> Bỏ qua
          </CtrlBtn>
          <CtrlBtn onClick={toggleFullscreen} title="Toàn màn hình (F)" active={isFull}>
            {isFull ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </CtrlBtn>
          <CtrlBtn onClick={requestClose} title="Đóng (Esc)">
            <X size={14} />
          </CtrlBtn>
        </div>
      </header>

      {/* ── Thân ──────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex gap-4 p-4 min-h-0">
        <WheelPanel
          players={wheelPlayers}
          rotation={rotation}
          spinMs={spinMs}
          spinState={spinState}
          onSpin={handleSpin}
          nextStep={nextStep}
          landedPlayer={landedPlayer}
          drawnCount={placedCount}
          total={steps.length}
          canSpin={canSpin}
        />

        <div className="dc-panel flex-1 rounded-xl flex flex-col min-w-0 overflow-hidden">
          {/* Chỉ gắn cây từ pha "build" trở đi. Gắn sớm hơn thì hiệu ứng dựng
              cột (dc-round) chạy hết ngay sau màn đếm ngược đang che phía trên,
              tới lúc màn che tan thì cây đã đứng yên — mất luôn pha dựng cây. */}
          {phase !== "intro" && (
            <CeremonyBracket
              script={script}
              placedSet={placedSet}
              activeStep={nextStep}
              resolvedMatchIds={resolvedMatchIds}
              byeRevealed={byeRevealed}
              justPlacedKey={justPlacedKey}
            />
          )}
          {phase === "intro" && <div className="flex-1" />}

          {script.ghostStages.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-t border-[var(--dc-line)] bg-black/20">
              <span className="text-[10px] uppercase tracking-wider text-white/35">Giai đoạn sau</span>
              {script.ghostStages.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-dashed border-white/15 text-white/40"
                >
                  {g.name}
                  <span className="text-white/25">· {GHOST_NOTE[g.stageType] ?? "Chưa hình thành"}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Thanh dưới: tiến độ hoặc kết quả ──────────── */}
      <footer className="relative z-10 border-t border-[var(--dc-line)] bg-black/30">
        {phase === "done" ? (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="inline-flex items-center gap-2 font-bold">
                <Trophy size={16} className="text-[var(--dc-gold)]" />
                Cặp đấu vòng 1 đã xác định
              </p>
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-5 rounded-lg bg-[var(--dc-gold)] text-[#1a1204] font-bold text-sm hover:brightness-110"
              >
                Đóng & xem bracket
              </button>
            </div>
            <div className="grid gap-2 max-h-[22vh] overflow-y-auto pr-1
                            grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {round1.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-[var(--dc-line)] text-sm"
                >
                  <span className="font-mono text-[10px] text-white/35 w-12 shrink-0">{m.matchCode}</span>
                  <span className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Avatar player={m.player1} size={20} />
                    <span className="truncate">{m.player1?.displayName ?? "—"}</span>
                  </span>
                  <span className="text-[10px] font-bold text-white/30 shrink-0">VS</span>
                  <span className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="truncate text-right">
                      {m.player2?.displayName ?? (m.isBye || m.status === "BYE" ? "Miễn đấu" : "—")}
                    </span>
                    {m.player2 && <Avatar player={m.player2} size={20} />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-3.5 flex items-center gap-5">
            <div className="flex-1 min-w-0">
              {landedPlayer ? (
                <p className="text-lg font-bold truncate">
                  <span className="text-[var(--dc-gold)]">{landedPlayer.displayName}</span>
                  <span className="text-white/35 font-normal text-sm ml-2">
                    → {nextStep?.matchCode} · {nextStep?.slot === "player1" ? "vị trí trên" : "vị trí dưới"}
                  </span>
                </p>
              ) : nextStep ? (
                <p className="text-lg font-bold text-white/45">
                  {spinState === "spinning"
                    ? "Vòng quay đang chạy…"
                    : `Bấm QUAY để bốc cơ thủ vào ${nextStep.matchCode}`}
                </p>
              ) : (
                <p className="text-lg font-bold text-white/45">{PHASE_LABEL[phase]}…</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-sm text-white/55">{placedCount}/{steps.length}</span>
              <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--dc-gold)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </footer>

      {/* ── Màn mở đầu (đè lên tất cả) ─────────────────── */}
      {phase === "intro" && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6
                     bg-[#0a0e14]/92 backdrop-blur-sm cursor-pointer"
          onClick={() => { setCount(0); setPhase("drawing"); }}
          title="Bấm để vào thẳng phần bốc thăm"
        >
          <p className="dc-intro-title text-xs uppercase tracking-[0.4em] text-[var(--dc-gold)] mb-4">
            Lễ bốc thăm công khai
          </p>
          <h2 className="dc-intro-title dc-shine text-4xl md:text-6xl font-black mb-4"
              style={{ animationDelay: "120ms" }}>
            {tournament?.name ?? "Giải đấu"}
          </h2>
          <p className="dc-intro-title text-sm text-white/50 mb-10" style={{ animationDelay: "240ms" }}>
            {steps.length} cơ thủ · {tournament?.formatName ?? ""} · Bracket {script.bracketSize}
          </p>

          <div key={count} className="dc-count text-7xl md:text-9xl font-black text-[var(--dc-gold)]">
            {count > 0 ? count : "BẮT ĐẦU"}
          </div>
        </div>
      )}

      {/* ── Hỏi lại khi thoát giữa chừng ──────────────────
          Ba lựa chọn thật sự khác nhau, không gộp: bracket đã nằm trong DB từ
          giây bấm bốc, nên "đóng" và "huỷ" cho ra hai kết cục hoàn toàn khác. */}
      {exitAsk && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 px-6">
          <div className="dc-panel rounded-2xl px-7 py-6 w-full max-w-md">
            <p className="font-bold text-lg mb-1.5 text-center">Dừng lễ bốc thăm?</p>
            <p className="text-sm text-white/60 mb-5 text-center">
              Mới bốc được <span className="font-semibold text-white/85">{placedCount}/{steps.length}</span> cơ thủ,
              nhưng hệ thống đã sinh sẵn toàn bộ cặp đấu ngay từ lúc bắt đầu.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setExitAsk(false)}
                disabled={cancelling}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 transition-colors"
              >
                <span className="font-bold text-sm">Tiếp tục chiếu</span>
                <span className="block text-xs text-white/50 mt-0.5">Quay lại quay tiếp từ chỗ đang dở</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={cancelling}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 transition-colors"
              >
                <span className="font-bold text-sm">Giữ kết quả & đóng</span>
                <span className="block text-xs text-white/50 mt-0.5">
                  Bracket được giữ nguyên, xem và chỉnh tiếp ở trang quản lý
                </span>
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={cancelling}
                  className="w-full text-left px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/40 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
                >
                  <span className="font-bold text-sm text-red-300 inline-flex items-center gap-2">
                    {cancelling && <Loader2 size={14} className="animate-spin" />}
                    {cancelling ? "Đang hủy…" : "Hủy bốc thăm & xóa kết quả"}
                  </span>
                  <span className="block text-xs text-white/50 mt-0.5">
                    Xóa toàn bộ cặp đấu, giải trở về trạng thái chưa bốc thăm. Lần bốc sau sẽ ra
                    kết quả ngẫu nhiên khác.
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

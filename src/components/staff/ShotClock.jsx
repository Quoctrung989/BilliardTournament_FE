import {
  ArrowLeftRight,
  Pause,
  Play,
  PlusCircle,
  RotateCcw,
  Timer,
  TimerOff,
  Zap,
} from "lucide-react";
import { WARNING_SECONDS } from "../../utils/shotClock";

const DIAL_STROKE = 7;

/**
 * Đồng hồ đếm ngược đặt giữa hai bảng điểm.
 * Vòng cung rút ngắn dần theo thời gian còn lại, đổi sang đỏ khi vào 10 giây cuối.
 */
export const ShotClockDial = ({
  remainingSeconds,
  totalSeconds,
  accent,
  running,
  isWarning,
  isBreakShot,
  size = 128,
}) => {
  const radius = (size - DIAL_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = totalSeconds > 0 ? Math.min(1, remainingSeconds / totalSeconds) : 0;
  const color = isWarning ? "#ef4444" : accent;

  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-[#070b11]"
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 6px rgba(7,11,17,0.92), 0 0 34px -6px ${color}`,
        animation: isWarning ? "shotClockPulse 1s ease-in-out infinite" : undefined,
      }}
      role="timer"
      aria-live="off"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={DIAL_STROKE}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={DIAL_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.2s linear" }}
        />
      </svg>

      {/* Chỉ con số — mọi nhãn chữ đều rộng hơn mặt đồng hồ và sẽ tràn viền.
          Trạng thái dừng / cú mở ván thể hiện bằng biểu tượng nhỏ. */}
      <div className="relative flex flex-col items-center leading-none">
        <span
          className="font-black tabular-nums"
          style={{
            fontSize: size * 0.38,
            color: isWarning ? "#fecaca" : running ? "#fff" : "rgba(255,255,255,0.6)",
            textShadow: `0 0 18px ${color}`,
          }}
        >
          {remainingSeconds}
        </span>
        {!running ? (
          <Pause
            size={Math.round(size * 0.13)}
            fill="currentColor"
            className="mt-0.5 text-white/45"
          />
        ) : isBreakShot ? (
          <Zap
            size={Math.round(size * 0.13)}
            fill="currentColor"
            className="mt-0.5"
            style={{ color }}
          />
        ) : null}
      </div>
    </div>
  );
};

const ctrlBase =
  "inline-flex items-center justify-center gap-1.5 rounded-xl min-h-[44px] px-3.5 text-sm font-semibold transition-colors touch-manipulation disabled:opacity-35 disabled:pointer-events-none";

/** Hàng nút điều khiển đồng hồ, đặt ở footer màn chấm điểm. */
export const ShotClockControls = ({ clock, disabled }) => {
  if (!clock.enabled) {
    return (
      <button
        type="button"
        onClick={() => clock.setEnabled(true)}
        className={`${ctrlBase} bg-white/[0.06] text-slate-300 ring-1 ring-inset ring-white/[0.12] hover:bg-white/[0.1]`}
      >
        <Timer size={17} />
        Bật đồng hồ
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={clock.toggleRun}
        disabled={disabled}
        className={`${ctrlBase} ${
          clock.running
            ? "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/25"
            : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
        }`}
      >
        {clock.running ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
        {clock.running ? "Tạm dừng" : "Chạy giờ"}
      </button>

      <button
        type="button"
        onClick={clock.switchTurn}
        disabled={disabled}
        className={`${ctrlBase} bg-white/[0.06] text-slate-200 ring-1 ring-inset ring-white/[0.12] hover:bg-white/[0.12]`}
      >
        <ArrowLeftRight size={17} className="opacity-80" />
        Chuyển lượt
      </button>

      <button
        type="button"
        onClick={clock.grantExtension}
        disabled={disabled || !clock.canExtend}
        className={`${ctrlBase} bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30 hover:bg-sky-500/25`}
        title={
          clock.canExtend
            ? "Gia hạn 30 giây — mỗi cơ thủ 1 lần mỗi ván"
            : "Cơ thủ này đã dùng gia hạn trong ván"
        }
      >
        <PlusCircle size={17} />
        +30s
      </button>

      <button
        type="button"
        onClick={clock.resetShot}
        disabled={disabled}
        className={`${ctrlBase} bg-white/[0.06] text-slate-400 ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.1] hover:text-slate-200`}
      >
        <RotateCcw size={16} className="opacity-80" />
        Đặt lại
      </button>

      <button
        type="button"
        onClick={() => clock.setEnabled(false)}
        className={`${ctrlBase} text-slate-500 hover:text-slate-300 hover:bg-white/5 px-2.5`}
        title="Tắt đồng hồ cho trận này"
      >
        <TimerOff size={16} />
      </button>
    </div>
  );
};

/** Nhãn nhỏ mô tả luật đang áp dụng — hiện dưới hàng nút. */
export const ShotClockRuleHint = ({ clock }) => (
  <p className="text-center text-[11px] font-normal text-slate-500">
    30s/cú · cú mở ván 60s · mỗi cơ thủ 1 lần +30s mỗi ván · còn{" "}
    {WARNING_SECONDS}s sẽ báo · hết giờ là lỗi, mất lượt
    {clock.extensionUsed[clock.turnSlot] ? " · đã dùng gia hạn" : ""}
  </p>
);

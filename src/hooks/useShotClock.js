import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EXTENSION_SECONDS,
  WARNING_SECONDS,
  nextBreakSlot,
  otherSlot,
  shotDurationSeconds,
  toRemainingSeconds,
} from "../utils/shotClock";

const TICK_MS = 100;
const STORAGE_PREFIX = "btms.shotclock.";

const storageKey = (matchId) => `${STORAGE_PREFIX}${matchId}`;

/** Beep ngắn bằng WebAudio — không cần file âm thanh trong bundle. */
function beep(frequency, durationMs) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + durationMs / 1000
    );
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    /* Trình duyệt chặn autoplay audio — bỏ qua, vẫn còn cảnh báo thị giác */
  }
}

function initialState(breakSlot = 1) {
  const ms = shotDurationSeconds(true) * 1000;
  return {
    enabled: true,
    running: false,
    breakMode: "alternate",
    breakSlot,
    turnSlot: breakSlot,
    isBreakShot: true,
    endsAt: null,
    remainingMs: ms,
    extensionUsed: { 1: false, 2: false },
    rackIndex: 0,
  };
}

function readPersisted(matchId) {
  try {
    const raw = window.localStorage.getItem(storageKey(matchId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return { ...initialState(), ...parsed };
  } catch {
    return null;
  }
}

function persist(matchId, state) {
  try {
    window.localStorage.setItem(storageKey(matchId), JSON.stringify(state));
  } catch {
    /* hết quota / chế độ riêng tư — đồng hồ vẫn chạy trong phiên hiện tại */
  }
}

/**
 * Đồng hồ mỗi cú đánh cho trọng tài. Toàn bộ trạng thái nằm ở client và được
 * lưu theo matchId nên tải lại trang giữa trận không mất giờ đang đếm.
 *
 * @param {object} params
 * @param {string|number} params.matchId
 * @param {boolean} params.active trận đang diễn ra (chỉ khi đó mới đếm)
 * @param {number|null} params.rackIndex tổng số ván đã kết thúc (p1 + p2);
 *   truyền null khi chưa tải xong trận để không tính nhầm thành ván mới
 * @param {1|2|null} params.lastRackWinnerSlot ai vừa thắng ván gần nhất
 * @param {(slot: 1|2) => void} [params.onExpire] gọi khi một cơ thủ hết giờ
 */
export function useShotClock({
  matchId,
  active,
  rackIndex = null,
  lastRackWinnerSlot = null,
  onExpire,
}) {
  const [state, setState] = useState(() => initialState());
  const [now, setNow] = useState(() => Date.now());

  const hydratedFor = useRef(null);
  /** null = chưa từng đồng bộ số ván với server trong phiên này. */
  const knownRack = useRef(null);
  const warnedRef = useRef(false);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  /* Khôi phục trạng thái đã lưu khi đổi trận */
  useEffect(() => {
    if (matchId == null || hydratedFor.current === matchId) return;
    hydratedFor.current = matchId;
    const restored = readPersisted(matchId);
    setState(restored ?? initialState());
    knownRack.current = restored?.rackIndex ?? null;
    warnedRef.current = false;
    expiredRef.current = false;
    setNow(Date.now());
  }, [matchId]);

  useEffect(() => {
    if (matchId == null) return;
    persist(matchId, state);
  }, [matchId, state]);

  const ticking = state.enabled && state.running && active;

  useEffect(() => {
    if (!ticking) return undefined;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [ticking]);

  /* Trận kết thúc / rời trạng thái live -> dừng đồng hồ, giữ nguyên giờ còn lại */
  useEffect(() => {
    if (active) return;
    setState((s) => {
      if (!s.running) return s;
      const left = s.endsAt != null ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs;
      return { ...s, running: false, endsAt: null, remainingMs: left };
    });
  }, [active]);

  const remainingMs = useMemo(() => {
    if (!state.running || state.endsAt == null) return state.remainingMs;
    return Math.max(0, state.endsAt - now);
  }, [state.running, state.endsAt, state.remainingMs, now]);

  const remainingSeconds = toRemainingSeconds(remainingMs);
  const totalSeconds = shotDurationSeconds(state.isBreakShot);
  const isWarning = state.running && remainingSeconds <= WARNING_SECONDS;

  /** Đặt lại đồng hồ cho một cú đánh mới. */
  const armShot = useCallback((patch, { run }) => {
    setState((s) => {
      const merged = { ...s, ...patch };
      const ms = shotDurationSeconds(merged.isBreakShot) * 1000;
      return {
        ...merged,
        remainingMs: ms,
        endsAt: run ? Date.now() + ms : null,
        running: run,
      };
    });
    warnedRef.current = false;
    expiredRef.current = false;
    setNow(Date.now());
  }, []);

  /* Cảnh báo 10 giây */
  useEffect(() => {
    if (!ticking) return;
    if (remainingSeconds <= WARNING_SECONDS && remainingSeconds > 0) {
      if (!warnedRef.current) {
        warnedRef.current = true;
        beep(880, 180);
      }
    } else if (remainingSeconds > WARNING_SECONDS) {
      warnedRef.current = false;
    }
  }, [ticking, remainingSeconds]);

  /* Hết giờ -> phạm lỗi, chuyển lượt cho đối thủ và chạy tiếp */
  useEffect(() => {
    if (!ticking || remainingMs > 0 || expiredRef.current) return;
    expiredRef.current = true;
    const offender = state.turnSlot;
    beep(300, 600);
    armShot({ turnSlot: otherSlot(offender), isBreakShot: false }, { run: true });
    onExpireRef.current?.(offender);
  }, [ticking, remainingMs, state.turnSlot, armShot]);

  /* Ván mới: đổi người phá, trả lại quyền gia hạn cho cả hai */
  useEffect(() => {
    if (rackIndex == null) return;
    // Lần đầu biết số ván (vừa tải trận / mở lại trang giữa trận): chỉ ghi nhận.
    if (knownRack.current == null) {
      knownRack.current = rackIndex;
      setState((s) => (s.rackIndex === rackIndex ? s : { ...s, rackIndex }));
      return;
    }
    if (rackIndex === knownRack.current) return;
    const advanced = rackIndex > knownRack.current;
    knownRack.current = rackIndex;
    setState((s) => {
      const breakSlot = advanced
        ? nextBreakSlot(s.breakMode, s.breakSlot, lastRackWinnerSlot)
        : s.breakSlot;
      const ms = shotDurationSeconds(true) * 1000;
      return {
        ...s,
        rackIndex,
        breakSlot,
        turnSlot: breakSlot,
        isBreakShot: true,
        extensionUsed: { 1: false, 2: false },
        remainingMs: ms,
        endsAt: s.running && s.enabled ? Date.now() + ms : null,
      };
    });
    warnedRef.current = false;
    expiredRef.current = false;
    setNow(Date.now());
  }, [rackIndex, lastRackWinnerSlot]);

  const setEnabled = useCallback((value) => {
    setState((s) => ({
      ...s,
      enabled: value,
      running: value ? s.running : false,
      endsAt: null,
      remainingMs: value
        ? s.remainingMs
        : shotDurationSeconds(s.isBreakShot) * 1000,
    }));
  }, []);

  const toggleRun = useCallback(() => {
    setState((s) => {
      if (s.running) {
        const left = s.endsAt != null ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs;
        return { ...s, running: false, endsAt: null, remainingMs: left };
      }
      const left = s.remainingMs > 0 ? s.remainingMs : shotDurationSeconds(s.isBreakShot) * 1000;
      return { ...s, running: true, endsAt: Date.now() + left, remainingMs: left };
    });
    setNow(Date.now());
  }, []);

  const resetShot = useCallback(() => {
    armShot({}, { run: state.running });
  }, [armShot, state.running]);

  const switchTurn = useCallback(() => {
    armShot(
      { turnSlot: otherSlot(state.turnSlot), isBreakShot: false },
      { run: true }
    );
  }, [armShot, state.turnSlot]);

  const setTurn = useCallback(
    (slot) => {
      if (slot !== 1 && slot !== 2) return;
      armShot({ turnSlot: slot, isBreakShot: false }, { run: true });
    },
    [armShot]
  );

  const canExtend =
    state.enabled && active && !state.extensionUsed[state.turnSlot];

  const grantExtension = useCallback(() => {
    setState((s) => {
      if (s.extensionUsed[s.turnSlot]) return s;
      const bonus = EXTENSION_SECONDS * 1000;
      const left =
        s.running && s.endsAt != null
          ? Math.max(0, s.endsAt - Date.now())
          : s.remainingMs;
      return {
        ...s,
        extensionUsed: { ...s.extensionUsed, [s.turnSlot]: true },
        remainingMs: left + bonus,
        endsAt: s.running ? Date.now() + left + bonus : null,
      };
    });
    warnedRef.current = false;
    expiredRef.current = false;
    setNow(Date.now());
  }, []);

  const setBreakMode = useCallback((mode) => {
    setState((s) => ({ ...s, breakMode: mode }));
  }, []);

  return {
    enabled: state.enabled,
    setEnabled,
    running: state.running,
    ticking,
    remainingMs,
    remainingSeconds,
    totalSeconds,
    isWarning,
    isBreakShot: state.isBreakShot,
    turnSlot: state.turnSlot,
    breakSlot: state.breakSlot,
    breakMode: state.breakMode,
    setBreakMode,
    extensionUsed: state.extensionUsed,
    canExtend,
    grantExtension,
    toggleRun,
    resetShot,
    switchTurn,
    setTurn,
  };
}

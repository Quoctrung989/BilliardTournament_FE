import { useEffect } from "react";

/**
 * Giữ màn hình TV luôn sáng (Wake Lock API).
 * Tự xin lại khi tab được focus lại.
 */
export function useWakeLock(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return undefined;
    }

    /** @type {WakeLockSentinel | null} */
    let lock = null;

    const requestLock = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        if (lock && !lock.released) return;
        lock = await navigator.wakeLock.request("screen");
        lock.addEventListener("release", () => {
          lock = null;
        });
      } catch {
        /* Trình duyệt/TV có thể từ chối — bỏ qua */
      }
    };

    requestLock();

    const onVisibility = () => {
      if (document.visibilityState === "visible") requestLock();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => {});
    };
  }, [enabled]);
}

import { useCallback, useEffect, useRef, useState } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/** Người dùng đã tắt hiệu ứng chuyển động ở cấp hệ điều hành? */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Đếm tăng từ 0 tới `target`, chỉ bắt đầu khi phần tử cuộn vào viewport.
 *
 * `ref` là callback ref — cùng lý do như `useReveal`: component render có điều
 * kiện sẽ không có node ở lần mount đầu, observer gắn trong useEffect sẽ không
 * bao giờ chạy.
 *
 * @param {number} target Giá trị đích.
 * @param {object} [options]
 * @param {number} [options.duration=1600] Thời lượng đếm (ms).
 * @returns {{ ref: (node: HTMLElement | null) => void, value: number }}
 */
export function useCountUp(target, { duration = 1600 } = {}) {
  const observerRef = useRef(null);
  const frameRef = useRef(null);
  const [value, setValue] = useState(0);

  const ref = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Tôn trọng reduced-motion và môi trường không có observer: nhảy thẳng đích.
      if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
        setValue(target);
        return;
      }
      if (!node) return;

      const run = () => {
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          setValue(Math.round(easeOutCubic(progress) * target));
          if (progress < 1) frameRef.current = requestAnimationFrame(step);
        };
        frameRef.current = requestAnimationFrame(step);
      };

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            run();
          });
        },
        { threshold: 0.4 }
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [target, duration]
  );

  useEffect(
    () => () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return { ref, value };
}

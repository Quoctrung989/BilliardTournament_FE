import { useCallback, useEffect, useRef } from "react";

/**
 * Gắn class `is-in` cho phần tử khi nó cuộn vào viewport, rồi ngừng theo dõi.
 *
 * Dùng kèm class nền `hm-reveal` (xem `pages/Home/home-motion.css`): CSS giữ
 * phần tử ở trạng thái mờ + dịch xuống, `is-in` đưa về trạng thái cuối.
 * Chỉ kích hoạt một lần nên cuộn ngược lên không làm nội dung nhấp nháy.
 *
 * Trả về **callback ref**, không phải ref object. Đây là điểm mấu chốt: component
 * nào render skeleton trước rồi mới render nội dung sẽ có `ref.current === null`
 * ở lần mount đầu. Nếu observer gắn trong useEffect chạy một lần lúc mount thì
 * nó thoát sớm và không bao giờ được tạo lại — nội dung kẹt vô hình vĩnh viễn.
 * Callback ref được React gọi đúng lúc node vào/ra DOM nên xử lý được cả trường
 * hợp render có điều kiện.
 *
 * @param {object} [options]
 * @param {number} [options.threshold=0.15] Tỉ lệ phần tử phải lọt viewport.
 * @param {string} [options.rootMargin] Kích hoạt sớm trước khi chạm đáy màn hình.
 * @returns {(node: HTMLElement | null) => void}
 */
export function useReveal({
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
} = {}) {
  const observerRef = useRef(null);

  const setRef = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      // jsdom (test) và trình duyệt quá cũ không có API này — hiện nội dung ngay
      // để không bao giờ kẹt ở trạng thái vô hình.
      if (typeof IntersectionObserver === "undefined") {
        node.classList.add("is-in");
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          });
        },
        { threshold, rootMargin }
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [threshold, rootMargin]
  );

  useEffect(
    () => () => {
      if (observerRef.current) observerRef.current.disconnect();
    },
    []
  );

  return setRef;
}

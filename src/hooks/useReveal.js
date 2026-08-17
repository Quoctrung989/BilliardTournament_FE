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
  const timeoutRef = useRef(null);

  const setRef = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (!node) return;

      // jsdom (test) và trình duyệt quá cũ không có API này — hiện nội dung ngay
      // để không bao giờ kẹt ở trạng thái vô hình.
      if (typeof IntersectionObserver === "undefined") {
        node.classList.add("is-in");
        return;
      }

      const reveal = () => {
        node.classList.add("is-in");
        if (observerRef.current) observerRef.current.unobserve(node);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            reveal();
          });
        },
        { threshold, rootMargin }
      );

      observer.observe(node);
      observerRef.current = observer;

      // Lưới an toàn: layout/resize dồn dập ngay lúc trang vừa mount (VD đổi
      // kích thước viewport rồi đọc DOM gần như ngay sau đó) có thể khiến trình
      // duyệt chưa kịp tính toán xong lần intersect đầu tiên trước khi nội dung
      // cần hiển thị — nội dung kẹt ở opacity:0 vô thời hạn dù đã nằm sẵn trong
      // viewport. Không có cách nào phân biệt "sắp cuộn tới" với "kẹt do timing"
      // từ phía hook, nên chấp nhận trễ tối đa 400ms rồi hiện luôn, thay vì để
      // nội dung im lặng biến mất khỏi màn hình vô thời hạn.
      timeoutRef.current = setTimeout(reveal, 400);
    },
    [threshold, rootMargin]
  );

  useEffect(
    () => () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return setRef;
}

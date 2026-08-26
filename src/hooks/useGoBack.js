import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Nút "Quay lại" đúng nghĩa: lùi đúng 1 bước trong lịch sử điều hướng của app,
 * thay vì nhảy về một URL cố định (làm mất trang/bộ lọc người dùng đang đứng).
 *
 * Khi người dùng mở thẳng URL — dán link, F5, mở tab mới — thì không có bước
 * trước để lùi; react-router đánh dấu entry đầu tiên bằng `location.key ===
 * "default"`, lúc đó rơi về `fallback` để không văng khỏi app.
 */
export function useGoBack(fallback) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key !== "default") navigate(-1);
    else navigate(fallback);
  }, [navigate, location.key, fallback]);
}

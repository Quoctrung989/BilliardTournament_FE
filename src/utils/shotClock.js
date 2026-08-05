/**
 * Luật shot clock (đồng hồ mỗi cú đánh) theo chuẩn WPA / Matchroom WNT:
 *  - 30 giây cho mỗi cú đánh
 *  - Cú đầu tiên của ván (cú phá và cú kế sau phá) được cộng thêm 30 giây
 *  - Mỗi cơ thủ được 1 lần gia hạn 30 giây trong mỗi ván
 *  - Trọng tài hô "Time" khi còn 10 giây
 *  - Hết giờ = phạm lỗi: mất lượt, đối thủ được bi tự do (ball in hand)
 *
 * Toàn bộ tính giờ chạy phía client — backend hiện chưa lưu lượt đánh.
 */

export const SHOT_SECONDS = 30;
export const BREAK_BONUS_SECONDS = 30;
export const EXTENSION_SECONDS = 30;
export const WARNING_SECONDS = 10;

/** Số giây cho một cú đánh, cú mở ván được cộng thêm. */
export function shotDurationSeconds(isBreakShot) {
  return isBreakShot ? SHOT_SECONDS + BREAK_BONUS_SECONDS : SHOT_SECONDS;
}

/** Đối thủ của một slot. */
export function otherSlot(slot) {
  return slot === 1 ? 2 : 1;
}

/**
 * Ai phá ván tiếp theo.
 * @param {"alternate"|"winner"} mode luân phiên phá | người thắng ván phá
 * @param {1|2} previousBreakSlot
 * @param {1|2|null} rackWinnerSlot người vừa thắng ván (nếu biết)
 */
export function nextBreakSlot(mode, previousBreakSlot, rackWinnerSlot) {
  if (mode === "winner" && (rackWinnerSlot === 1 || rackWinnerSlot === 2)) {
    return rackWinnerSlot;
  }
  return otherSlot(previousBreakSlot);
}

/** Giây còn lại (làm tròn lên) từ mili-giây, không âm. */
export function toRemainingSeconds(remainingMs) {
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

/** mm:ss cho phần hiển thị phụ; đồng hồ chính chỉ hiện số giây. */
export function formatClock(remainingMs) {
  const total = toRemainingSeconds(remainingMs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

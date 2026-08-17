/* Các mảnh hiển thị cơ thủ dùng chung giữa vòng quay và cây thi đấu. */

const AVATAR_COLORS = ["#6366f1","#8b5cf6","#0ea5e9","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4"];

export const avatarColor = (id) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
export const initials    = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

/** Hạng "UNKNOWN" là mặc định của BE khi cơ thủ chưa xếp hạng — đừng chiếu lên màn hình. */
export const rankLabel = (rank) => (!rank || rank === "UNKNOWN" ? null : rank);

export function Avatar({ player, size = 28 }) {
  const url = player?.avatarUrl;
  return url ? (
    <img
      src={url}
      alt=""
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        backgroundColor: avatarColor(player?.id),
      }}
    >
      {initials(player?.displayName)}
    </span>
  );
}

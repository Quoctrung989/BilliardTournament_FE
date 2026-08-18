/* ══════════════════════════════════════════════════════════
   SpinWheel — vòng quay tên cơ thủ.

   Mỗi cơ thủ chưa được bốc là một múi trên vòng. Quản lý bấm quay,
   vòng dừng lại ở người mà BE ĐÃ bốc sẵn — phần "ngẫu nhiên" nằm
   trọn ở server (Collections.shuffle), vòng quay chỉ là cách công bố.

   Góc quy ước: 0° = 12 giờ, tăng theo chiều kim đồng hồ — trùng với
   chiều của CSS `rotate()`, nên phép tính điểm dừng ở
   {@link computeSpinRotation} đọc thẳng không phải đổi hệ.
══════════════════════════════════════════════════════════ */

const SIZE = 360;
const C = SIZE / 2;
const R = 168;

/* Màu múi: dịu, đủ tương phản với chữ trắng, không chói khi chiếu máy chiếu. */
const SEGMENT_COLORS = [
  "#4338ca", "#7c3aed", "#0369a1", "#047857",
  "#b45309", "#be123c", "#a21caf", "#0e7490",
];

const polar = (deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: C + R * Math.cos(rad), y: C + R * Math.sin(rad) };
};

function arcPath(a0, a1) {
  const p0 = polar(a0);
  const p1 = polar(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${C} ${C} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;
}

/** Cỡ chữ và độ dài tên co theo số múi — 32 người thì mỗi múi chỉ hơn 11°. */
function labelStyle(count) {
  if (count <= 8)  return { size: 17, maxChars: 16 };
  if (count <= 16) return { size: 14, maxChars: 14 };
  if (count <= 24) return { size: 11, maxChars: 12 };
  if (count <= 40) return { size: 9,  maxChars: 10 };
  return { size: 7, maxChars: 8 };
}

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Góc quay đích để múi `index` dừng đúng dưới kim chỉ ở đỉnh.
 *
 * Tách khỏi component để test được: đây là chỗ duy nhất quyết định vòng quay
 * có dừng đúng người BE đã bốc hay không.
 *
 * @param {number} current  góc hiện tại (độ, cộng dồn qua các lần quay)
 * @param {number} index    vị trí múi trên vòng
 * @param {number} count    tổng số múi
 * @param {number} turns    số vòng quay trọn trước khi dừng
 * @param {number} jitter   lệch ngẫu nhiên trong khoảng (-0.5, 0.5) của một múi
 */
export function computeSpinRotation(current, index, count, turns = 5, jitter = 0) {
  if (count <= 0) return current;
  const seg = 360 / count;
  const center = (index + 0.5) * seg;
  // Lệch tối đa 30% bề rộng múi để lần nào cũng dừng hơi khác nhau mà không lố sang múi bên.
  const offset = center - jitter * seg * 0.6;
  const target = ((360 - offset) % 360 + 360) % 360;
  const delta = ((target - (current % 360)) % 360 + 360) % 360;
  return current + turns * 360 + delta;
}

export default function SpinWheel({
  players, rotation, spinMs, onSpin, disabled, landedId,
}) {
  const count = players.length;
  const seg = count > 0 ? 360 / count : 360;
  const { size: fontSize, maxChars } = labelStyle(count);

  return (
    <div className="relative w-full aspect-square select-none">
      {/* Vòng quay: xoay cả khối div thay vì <g> trong SVG — transform-origin
          trên phần tử SVG lệch chuẩn giữa các trình duyệt, div thì luôn đúng. */}
      <div
        className="dc-wheel absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          /* Luôn để sẵn transition (không bật/tắt): đổi transition và transform
             trong cùng một lần commit thì trình duyệt bỏ qua hiệu ứng. */
          transition: `transform ${spinMs}ms cubic-bezier(0.12, 0.72, 0.12, 1)`,
        }}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full">
          {count === 0 && (
            <circle cx={C} cy={C} r={R} fill="#1b2333" stroke="rgba(255,255,255,0.1)" />
          )}

          {/* Một người còn lại thì không vẽ được cung (điểm đầu trùng điểm cuối) — vẽ hình tròn. */}
          {count === 1 && (
            <circle cx={C} cy={C} r={R} fill={SEGMENT_COLORS[0]} />
          )}

          {count > 1 && players.map((p, i) => (
            <path
              key={p.id}
              d={arcPath(i * seg, (i + 1) * seg)}
              fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
              stroke="rgba(0,0,0,0.28)"
              strokeWidth="1"
              opacity={landedId != null && p.id !== landedId ? 0.35 : 1}
              style={{ transition: "opacity 320ms ease" }}
            />
          ))}

          {/* Chữ chạy dọc bán kính, neo ở mép ngoài — kiểu vòng quay quen thuộc. */}
          {players.map((p, i) => {
            const mid = count === 1 ? 0 : (i + 0.5) * seg;
            return (
              <text
                key={p.id}
                transform={`rotate(${mid - 90} ${C} ${C})`}
                x={C + R - 14}
                y={C}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight="700"
                fill="#fff"
                opacity={landedId != null && p.id !== landedId ? 0.4 : 1}
                style={{ pointerEvents: "none", transition: "opacity 320ms ease" }}
              >
                {truncate(p.displayName ?? "", maxChars)}
              </text>
            );
          })}

          <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
        </svg>
      </div>

      {/* Kim chỉ ở đỉnh — nằm NGOÀI khối xoay nên đứng yên. */}
      <div className="dc-wheel-pointer" aria-hidden />

      {/* Trục giữa kiêm nút quay: bấm vào giữa vòng là quay, phản xạ tự nhiên nhất. */}
      <button
        type="button"
        onClick={onSpin}
        disabled={disabled}
        aria-label="Quay bốc thăm"
        className={[
          "dc-wheel-hub absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "rounded-full font-black tracking-wider flex items-center justify-center",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:brightness-110",
        ].join(" ")}
      >
        QUAY
      </button>
    </div>
  );
}

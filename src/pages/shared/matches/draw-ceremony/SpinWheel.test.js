import { computeSpinRotation } from "./SpinWheel";

/* Đây là phép tính quyết định vòng quay có dừng đúng người BE đã bốc hay không.
   Sai ở đây thì màn chiếu công bố nhầm tên so với bracket thật. */

/** Góc của tâm múi `index` so với kim chỉ (ở đỉnh) sau khi vòng đã xoay `rotation`. */
function lechSoVoiKim(rotation, index, count) {
  const seg = 360 / count;
  const center = (index + 0.5) * seg;
  const landed = (((center + rotation) % 360) + 360) % 360;
  return Math.min(landed, 360 - landed);
}

describe.each([2, 3, 4, 8, 16, 32, 64])("vòng %i múi", (count) => {
  const seg = 360 / count;

  test("mọi múi đều dừng đúng dưới kim", () => {
    for (let i = 0; i < count; i += 1) {
      const rot = computeSpinRotation(0, i, count, 5, 0);
      expect(lechSoVoiKim(rot, i, count)).toBeLessThan(0.001);
    }
  });

  test("lệch ngẫu nhiên tối đa vẫn nằm trong múi, không tràn sang múi bên", () => {
    for (let i = 0; i < count; i += 1) {
      [-0.5, -0.25, 0.25, 0.5].forEach((jitter) => {
        const rot = computeSpinRotation(0, i, count, 5, jitter);
        expect(lechSoVoiKim(rot, i, count)).toBeLessThan(seg / 2);
      });
    }
  });

  test("luôn quay tới trước, ít nhất trọn số vòng yêu cầu", () => {
    for (let i = 0; i < count; i += 1) {
      const rot = computeSpinRotation(1234, i, count, 5, 0);
      expect(rot).toBeGreaterThanOrEqual(1234 + 5 * 360);
      expect(rot).toBeLessThan(1234 + 6 * 360);
    }
  });
});

test("quay nhiều lượt liên tiếp vẫn dừng đúng, góc cộng dồn không trôi", () => {
  const count = 12;
  let rot = 0;
  [7, 0, 11, 3, 3, 9].forEach((i) => {
    rot = computeSpinRotation(rot, i, count, 5, Math.random() - 0.5);
    expect(lechSoVoiKim(rot, i, count)).toBeLessThan(360 / count / 2);
  });
});

test("vòng rỗng thì giữ nguyên góc, không sinh NaN", () => {
  expect(computeSpinRotation(500, 0, 0)).toBe(500);
});

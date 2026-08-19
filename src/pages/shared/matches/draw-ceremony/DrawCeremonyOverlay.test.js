import { act, fireEvent, render, screen } from "@testing-library/react";
import DrawCeremonyOverlay from "./DrawCeremonyOverlay";

/* jsdom thiếu 3 API mà cây bracket dùng thật (ConnectorOverlay + camera bám ô). */
beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  Element.prototype.scrollIntoView = jest.fn();
  Element.prototype.requestFullscreen = jest.fn(() => Promise.resolve());
});

const p = (id, name) => ({ id, displayName: name, billiardRank: "B", avatarUrl: null });

const drawResult = {
  tournamentFormat: "SINGLE_ELIMINATION",
  stages: [{
    id: 10, name: "Loại trực tiếp", stageType: "KNOCKOUT",
    matches: [
      { id: 1, matchCode: "R1-M1", roundNo: 1, positionNo: 1, player1: p(101, "An"), player2: p(102, "Bình"), status: "PENDING", isBye: false, nextMatchWinId: 3, winSlot: "player1" },
      { id: 2, matchCode: "R1-M2", roundNo: 1, positionNo: 2, player1: p(103, "Cường"), player2: null, status: "BYE", isBye: true, winner: p(103, "Cường"), nextMatchWinId: 3, winSlot: "player2" },
      { id: 3, matchCode: "R2-M1", roundNo: 2, positionNo: 1, player1: null, player2: p(103, "Cường"), status: "PENDING" },
    ],
  }],
};
const tournament = { name: "Giải Bi-a Mùa Thu", format: "SINGLE_ELIMINATION", formatName: "Loại trực tiếp" };

/* Mỗi pha đặt timer kế tiếp trong useEffect, mà effect chỉ chạy khi act() kết
   thúc — nên phải tua thành nhiều nhịp act nhỏ thay vì một cú nhảy dài. */
const tick = (nhip = 12, ms = 1200) => {
  for (let i = 0; i < nhip; i += 1) act(() => { jest.advanceTimersByTime(ms); });
};

/** Tua qua đếm ngược + dựng cây để tới pha bốc thăm. */
const toDrawing = () => tick(8);

/** Một lượt: bấm quay → vòng chạy → công bố → đẩy vào ô. */
const spinOnce = () => {
  fireEvent.click(screen.getByRole("button", { name: "Quay bốc thăm" }));
  tick(8);
};

/* Bộ đếm hiện ở hai chỗ (đầu panel vòng quay + thanh tiến độ dưới), nên phải
   dùng getAllByText — getByText sẽ báo "found multiple elements". */
const expectDaBoc = (n, total = 3) =>
  expect(screen.getAllByText(`${n}/${total}`).length).toBeGreaterThan(0);

test("pha bốc thăm KHÔNG tự chạy — phải bấm quay mới ra người", () => {
  jest.useFakeTimers();
  render(<DrawCeremonyOverlay drawResult={drawResult} tournament={tournament} onClose={jest.fn()} />);

  toDrawing();
  expect(screen.getByText("Đang bốc thăm")).toBeTruthy();
  expectDaBoc(0);

  // Để trôi thêm thời gian mà không bấm gì: tiến độ phải đứng yên
  tick(20);
  expectDaBoc(0);
  expect(screen.getByText("Bấm QUAY để bốc cơ thủ vào R1-M1")).toBeTruthy();

  spinOnce();
  expectDaBoc(1);
  jest.useRealTimers();
});

test("quay đủ số lượt thì lộ hết tên và hiện kết quả cuối", () => {
  jest.useFakeTimers();
  const onClose = jest.fn();
  render(<DrawCeremonyOverlay drawResult={drawResult} tournament={tournament} onClose={onClose} />);

  // Pha intro: tên giải hiện ở cả thanh trên lẫn màn mở đầu; cây chưa gắn
  expect(screen.getAllByText("Giải Bi-a Mùa Thu").length).toBe(2);
  expect(screen.getByText("Chuẩn bị")).toBeTruthy();
  expect(screen.queryByText("R1-M1")).toBeNull();

  toDrawing();
  spinOnce();
  spinOnce();
  spinOnce();
  tick(8); // nghỉ cuối + pha BYE

  expect(screen.getByText("Hoàn tất")).toBeTruthy();
  expect(screen.getByText("Cặp đấu vòng 1 đã xác định")).toBeTruthy();
  ["An", "Bình", "Cường"].forEach((n) => expect(screen.getAllByText(n).length).toBeGreaterThan(0));
  expect(screen.getAllByText("Miễn đấu").length).toBeGreaterThan(0);
  expectDaBoc(3);
  expect(screen.getByText("Đã bốc xong toàn bộ cơ thủ")).toBeTruthy();

  fireEvent.click(screen.getByText("Đóng & xem bracket"));
  expect(onClose).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});

test("phím Space cũng quay được (dành cho bút trình chiếu)", () => {
  jest.useFakeTimers();
  render(<DrawCeremonyOverlay drawResult={drawResult} tournament={tournament} onClose={jest.fn()} />);
  toDrawing();
  fireEvent.keyDown(window, { code: "Space" });
  tick(8);
  expectDaBoc(1);
  jest.useRealTimers();
});

test("đang quay thì không quay chồng lượt", () => {
  jest.useFakeTimers();
  render(<DrawCeremonyOverlay drawResult={drawResult} tournament={tournament} onClose={jest.fn()} />);
  toDrawing();

  const hub = screen.getByRole("button", { name: "Quay bốc thăm" });
  fireEvent.click(hub);
  act(() => { jest.advanceTimersByTime(300) });     // vòng còn đang chạy
  expect(hub.disabled).toBe(true);
  fireEvent.click(hub);
  fireEvent.keyDown(window, { code: "Space" });

  tick(8);
  expectDaBoc(1);     // vẫn chỉ 1 người ra
  jest.useRealTimers();
});

test("nút Bỏ qua nhảy thẳng tới kết quả", () => {
  jest.useFakeTimers();
  render(<DrawCeremonyOverlay drawResult={drawResult} tournament={tournament} onClose={jest.fn()} />);
  fireEvent.click(screen.getByTitle("Bỏ qua tới kết quả"));
  expect(screen.getByText("Hoàn tất")).toBeTruthy();
  expect(screen.getByText("Cặp đấu vòng 1 đã xác định")).toBeTruthy();
  jest.useRealTimers();
});

test("Esc giữa chừng hỏi lại thay vì đóng thẳng", () => {
  jest.useFakeTimers();
  const onClose = jest.fn();
  render(<DrawCeremonyOverlay drawResult={drawResult} tournament={tournament} onClose={onClose} />);
  toDrawing();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.getByText("Dừng lễ bốc thăm?")).toBeTruthy();
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Tiếp tục chiếu"));
  expect(screen.queryByText("Dừng lễ bốc thăm?")).toBeNull();
  jest.useRealTimers();
});

test("thoát giữa chừng: 3 lối ra khác nhau, huỷ gọi onCancel chứ không phải onClose", () => {
  jest.useFakeTimers();
  const onClose = jest.fn();
  const onCancel = jest.fn();
  render(
    <DrawCeremonyOverlay
      drawResult={drawResult} tournament={tournament}
      onClose={onClose} onCancel={onCancel}
    />,
  );
  toDrawing();
  spinOnce();
  fireEvent.keyDown(window, { key: "Escape" });

  // Nêu rõ đã bốc bao nhiêu / tổng bao nhiêu để người dẫn biết mình đang bỏ dở cỡ nào
  expectDaBoc(1);
  expect(screen.getByText("Tiếp tục chiếu")).toBeTruthy();
  expect(screen.getByText("Giữ kết quả & đóng")).toBeTruthy();

  fireEvent.click(screen.getByText("Hủy bốc thăm & xóa kết quả"));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();   // huỷ KHÔNG được đi qua đường đóng-giữ-kết-quả
  jest.useRealTimers();
});

test("không truyền onCancel thì ẩn lựa chọn huỷ, không hiện nút chết", () => {
  jest.useFakeTimers();
  render(<DrawCeremonyOverlay drawResult={drawResult} tournament={tournament} onClose={jest.fn()} />);
  toDrawing();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByText("Hủy bốc thăm & xóa kết quả")).toBeNull();
  expect(screen.getByText("Giữ kết quả & đóng")).toBeTruthy();
  jest.useRealTimers();
});

test("đang huỷ thì chặn mọi lối ra khác để không bấm chồng", () => {
  jest.useFakeTimers();
  render(
    <DrawCeremonyOverlay
      drawResult={drawResult} tournament={tournament}
      onClose={jest.fn()} onCancel={jest.fn()} cancelling
    />,
  );
  toDrawing();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.getByText("Đang hủy…")).toBeTruthy();
  expect(screen.getByText("Tiếp tục chiếu").closest("button").disabled).toBe(true);
  expect(screen.getByText("Giữ kết quả & đóng").closest("button").disabled).toBe(true);
  jest.useRealTimers();
});

test("thể thức không hỗ trợ thì báo rõ, không crash", () => {
  const onClose = jest.fn();
  render(
    <DrawCeremonyOverlay
      drawResult={{ tournamentFormat: "PROGRESSIVE_ROUND_ROBIN", stages: [] }}
      tournament={{ name: "X", format: "PROGRESSIVE_ROUND_ROBIN" }}
      onClose={onClose}
    />,
  );
  expect(screen.getByText("Không trình chiếu được")).toBeTruthy();
  fireEvent.click(screen.getByText("Xem bracket"));
  expect(onClose).toHaveBeenCalledTimes(1);
});


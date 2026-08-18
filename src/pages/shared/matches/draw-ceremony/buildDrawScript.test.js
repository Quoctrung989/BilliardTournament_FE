import {
  buildDrawScript, ceremonyAvailability, ceremonySizing, roundLabel, slotKey,
} from "./buildDrawScript";

const p = (id, name) => ({ id, displayName: name, billiardRank: "B", avatarUrl: null });

/** SE 6 người → bracketSize 8, 4 trận vòng 1, 2 trận BYE. */
function seSixPlayers() {
  const r1 = [
    { id: 1, matchCode: "R1-M1", roundNo: 1, positionNo: 1, player1: p(101, "An"),  player2: p(102, "Bình"), status: "PENDING", isBye: false, nextMatchWinId: 5, winSlot: "player1" },
    { id: 2, matchCode: "R1-M2", roundNo: 1, positionNo: 2, player1: p(103, "Cường"), player2: null,        status: "BYE",     isBye: true,  winner: p(103, "Cường"), nextMatchWinId: 5, winSlot: "player2" },
    { id: 3, matchCode: "R1-M3", roundNo: 1, positionNo: 3, player1: p(104, "Dũng"), player2: p(105, "Em"),  status: "PENDING", isBye: false, nextMatchWinId: 6, winSlot: "player1" },
    { id: 4, matchCode: "R1-M4", roundNo: 1, positionNo: 4, player1: p(106, "Phong"), player2: null,        status: "BYE",     isBye: true,  winner: p(106, "Phong"), nextMatchWinId: 6, winSlot: "player2" },
  ];
  const r2 = [
    { id: 5, matchCode: "R2-M1", roundNo: 2, positionNo: 1, player1: null, player2: p(103, "Cường"), status: "PENDING", nextMatchWinId: 7, winSlot: "player1" },
    { id: 6, matchCode: "R2-M2", roundNo: 2, positionNo: 2, player1: null, player2: p(106, "Phong"), status: "PENDING", nextMatchWinId: 7, winSlot: "player2" },
  ];
  const r3 = [{ id: 7, matchCode: "R3-M1", roundNo: 3, positionNo: 1, player1: null, player2: null, status: "PENDING" }];
  return {
    tournamentFormat: "SINGLE_ELIMINATION",
    stages: [{ id: 10, name: "Loại trực tiếp", stageType: "KNOCKOUT", matches: [...r3, ...r1, ...r2] }],
  };
}

test("SE: thứ tự bốc theo positionNo rồi player1→player2, bỏ qua slot BYE", () => {
  const s = buildDrawScript(seSixPlayers());
  expect(s.supported).toBe(true);
  expect(s.bracketSize).toBe(8);
  expect(s.totalRounds).toBe(3);
  expect(s.steps.map((x) => `${x.matchCode}:${x.slot}:${x.player.displayName}`)).toEqual([
    "R1-M1:player1:An",
    "R1-M1:player2:Bình",
    "R1-M2:player1:Cường",
    "R1-M3:player1:Dũng",
    "R1-M3:player2:Em",
    "R1-M4:player1:Phong",
  ]);
});

test("SE: vòng được sắp xếp tăng dần dù dữ liệu BE trả lộn xộn", () => {
  const s = buildDrawScript(seSixPlayers());
  expect(s.rounds.map(([r, ms]) => [r, ms.length])).toEqual([[1, 4], [2, 2], [3, 1]]);
  expect(s.rounds[0][1].map((m) => m.positionNo)).toEqual([1, 2, 3, 4]);
});

test("trận chỉ 'chốt' sau bước bốc cuối cùng của chính nó", () => {
  const { lastStepIndexByMatch } = buildDrawScript(seSixPlayers());
  expect(lastStepIndexByMatch.get(1)).toBe(1); // R1-M1 có 2 bước → chốt ở bước index 1
  expect(lastStepIndexByMatch.get(2)).toBe(2); // R1-M2 là BYE, 1 bước
  expect(lastStepIndexByMatch.get(4)).toBe(5);
});

test("BYE: lấy đúng người thắng và ô đích ở vòng sau", () => {
  const { byeAdvances } = buildDrawScript(seSixPlayers());
  expect(byeAdvances).toEqual([
    { matchId: 2, player: expect.objectContaining({ displayName: "Cường" }), nextMatchId: 5, nextSlot: "player2" },
    { matchId: 4, player: expect.objectContaining({ displayName: "Phong" }), nextMatchId: 6, nextSlot: "player2" },
  ]);
});

test("DE: bốc ở nhánh thắng, LOSERS/FINAL_BRACKET chỉ là stage mờ", () => {
  const s = buildDrawScript({
    tournamentFormat: "DOUBLE_ELIMINATION",
    stages: [
      { id: 1, name: "Nhánh thắng", stageType: "WINNERS", matches: [
        { id: 1, matchCode: "W1-M1", roundNo: 1, positionNo: 1, player1: p(1, "A"), player2: p(2, "B"), status: "PENDING", nextMatchWinId: 2, winSlot: "player1" },
        { id: 2, matchCode: "W2-M1", roundNo: 2, positionNo: 1, player1: null, player2: null, status: "PENDING" },
      ] },
      { id: 2, name: "Nhánh thua", stageType: "LOSERS", matches: [] },
      { id: 3, name: "Last 8", stageType: "FINAL_BRACKET", matches: [] },
    ],
  });
  expect(s.supported).toBe(true);
  expect(s.stage.stageType).toBe("WINNERS");
  expect(s.steps).toHaveLength(2);
  expect(s.ghostStages.map((g) => g.stageType)).toEqual(["LOSERS", "FINAL_BRACKET"]);
});

test("thể thức không hỗ trợ / bracket rỗng → supported=false kèm lý do", () => {
  expect(buildDrawScript({ tournamentFormat: "PROGRESSIVE_ROUND_ROBIN", stages: [] }).supported).toBe(false);
  expect(buildDrawScript({ tournamentFormat: "SINGLE_ELIMINATION", stages: [] }).reason).toMatch(/nhánh đấu/);
  expect(buildDrawScript({}, "SINGLE_ELIMINATION").supported).toBe(false); // không có stages
});

test("nhãn vòng tính theo cỡ bracket gốc, không theo số vòng có thật", () => {
  expect(roundLabel(3, 3)).toBe("Chung kết");
  expect(roundLabel(2, 3)).toBe("Bán kết");
  expect(roundLabel(1, 3)).toBe("Tứ kết");
  expect(roundLabel(1, 6)).toBe("Vòng 1");
});

describe("ceremonyAvailability — chỉ bốc thăm công khai khi xếp cặp ngẫu nhiên", () => {
  test("SE/DE + RANDOM → có lễ bốc thăm", () => {
    expect(ceremonyAvailability("SINGLE_ELIMINATION", "RANDOM")).toEqual({ available: true, blockedBy: null });
    expect(ceremonyAvailability("DOUBLE_ELIMINATION", "RANDOM")).toEqual({ available: true, blockedBy: null });
  });

  test("xếp theo hạng / hạt giống → chặn, lý do là seeding", () => {
    ["RANK", "SEED"].forEach((m) => {
      expect(ceremonyAvailability("SINGLE_ELIMINATION", m)).toEqual({ available: false, blockedBy: "seeding" });
      expect(ceremonyAvailability("DOUBLE_ELIMINATION", m)).toEqual({ available: false, blockedBy: "seeding" });
    });
  });

  test("thể thức không có cây thì chặn vì format, kể cả khi RANDOM", () => {
    expect(ceremonyAvailability("PROGRESSIVE_ROUND_ROBIN", "RANDOM").blockedBy).toBe("format");
    expect(ceremonyAvailability("GROUP_PLAYOFF", "RANDOM").blockedBy).toBe("format");
  });

  test("thiếu seedingMethod → chặn, KHÔNG mặc định coi là RANDOM", () => {
    expect(ceremonyAvailability("SINGLE_ELIMINATION", undefined).available).toBe(false);
    expect(ceremonyAvailability("SINGLE_ELIMINATION", null).available).toBe(false);
    expect(ceremonyAvailability("SINGLE_ELIMINATION", "").available).toBe(false);
  });

  test("không nhận chữ thường / biến thể — chỉ đúng mã BE mới qua", () => {
    expect(ceremonyAvailability("SINGLE_ELIMINATION", "random").available).toBe(false);
    expect(ceremonyAvailability("SINGLE_ELIMINATION", "ELO").available).toBe(false);
  });
});

test("kích thước node co lại khi bracket lớn", () => {
  expect(ceremonySizing(8).nodeW).toBeGreaterThan(ceremonySizing(16).nodeW);
  expect(ceremonySizing(32).nodeW).toBeGreaterThan(ceremonySizing(64).nodeW);
  expect(slotKey(7, "player2")).toBe("7:player2");
});

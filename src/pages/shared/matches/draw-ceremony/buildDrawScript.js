/* ══════════════════════════════════════════════════════════
   buildDrawScript — biến DrawResultResponse (BE trả về ngay khi
   POST /draw) thành "kịch bản" cho lễ bốc thăm công khai.

   Điểm mấu chốt: BE đã bốc xong và trả về đầy đủ ai vào slot nào.
   FE KHÔNG bốc lại gì cả — chỉ trình diễn dần kết quả có sẵn, nên
   thuật toán bốc thăm ở BE (Collections.shuffle + standardSeedOrder)
   giữ nguyên tuyệt đối. Toàn bộ file này là hàm thuần, không side effect.
══════════════════════════════════════════════════════════ */

/** Thể thức nào bốc ở stage nào. Chỉ những thể thức có hình cây mới trình diễn được. */
export const CEREMONY_STAGE_BY_FORMAT = {
  SINGLE_ELIMINATION: "KNOCKOUT",
  DOUBLE_ELIMINATION: "WINNERS",
};

/** Stage chỉ hiện mờ ("sẽ hình thành theo kết quả"), lúc bốc còn rỗng hoàn toàn. */
const GHOST_STAGE_TYPES = new Set(["LOSERS", "FINAL_BRACKET", "GRAND_FINAL", "PROGRESSIVE_PLAYOFF"]);

/** SeedingMethod.RANDOM ở BE — chế độ duy nhất mà kết quả thật sự là bốc thăm. */
export const SEEDING_RANDOM = "RANDOM";

/** Nhãn các chế độ xếp cặp KHÔNG phải bốc thăm, để giải thích cho BQT vì sao không có lễ bốc. */
export const NON_RANDOM_SEEDING_LABEL = {
  RANK: "theo hạng cơ thủ",
  SEED: "theo hạt giống do ban tổ chức nhập",
};

/**
 * Giải này có trình chiếu lễ bốc thăm được không.
 *
 * Hai điều kiện, và điều kiện thứ hai mới là điều kiện quan trọng:
 *
 * 1. Thể thức phải có hình cây (SE/DE) — vòng tròn không có cây để bốc vào.
 * 2. Chế độ xếp cặp phải là RANDOM. Với RANK/SEED thì vị trí mỗi cơ thủ do hạng
 *    hoặc số hạt giống quyết định, hoàn toàn tính trước được — dựng vòng quay
 *    cho nó là diễn một màn xổ số cho một kết quả đã định sẵn. Nhóm chế độ đó
 *    thuộc quyền sắp xếp của BQT (chỉnh cặp đấu, đổi chỗ), không phải bốc thăm.
 *
 * Thiếu `seedingMethod` thì trả về không hỗ trợ, KHÔNG mặc định RANDOM như
 * `BracketGenerationServiceImpl#generate`: đoán sai ở đây là chiếu một lễ bốc
 * thăm sai bản chất trước mặt cơ thủ, còn đoán sai theo hướng ẩn đi thì nút
 * "Sinh bracket" thường vẫn dùng được bình thường.
 *
 * @returns {{available: boolean, blockedBy: null | "format" | "seeding"}}
 */
export function ceremonyAvailability(format, seedingMethod) {
  if (!CEREMONY_STAGE_BY_FORMAT[format]) return { available: false, blockedBy: "format" };
  if (seedingMethod !== SEEDING_RANDOM)  return { available: false, blockedBy: "seeding" };
  return { available: true, blockedBy: null };
}

const log2 = (n) => Math.round(Math.log2(n));

/** Nhãn vòng — tính theo cỡ bracket gốc, KHÔNG theo số vòng thật có trong dữ liệu.
 *  Nhánh thắng của Double Elimination cắt sớm (CUT_TO_SE) dừng giữa chừng, lấy
 *  sortedRounds.length sẽ gọi nhầm vòng cắt là "Chung kết". Cùng lỗi với
 *  BracketDiagram#roundLabel — sửa thì sửa song song. */
export function roundLabel(roundNo, totalRounds) {
  const diff = totalRounds - roundNo;
  if (diff === 0) return "Chung kết";
  if (diff === 1) return "Bán kết";
  if (diff === 2) return "Tứ kết";
  return `Vòng ${roundNo}`;
}

/** Kích thước node/khoảng cách theo cỡ bracket — thay cho transform:scale.
 *  ConnectorOverlay đo toạ độ thật bằng getBoundingClientRect; nếu bọc cây trong
 *  một phần tử `scale()` thì SVG nằm trong cùng hệ toạ độ đó sẽ bị nhân tỉ lệ hai
 *  lần và mọi đường nối lệch. Thu nhỏ bằng số đo thật thì phép đo vẫn đúng. */
export function ceremonySizing(bracketSize) {
  if (bracketSize <= 8)  return { nodeW: 264, gap: 26, colGap: 64 };
  if (bracketSize <= 16) return { nodeW: 236, gap: 16, colGap: 56 };
  if (bracketSize <= 32) return { nodeW: 208, gap: 9,  colGap: 46 };
  return                        { nodeW: 182, gap: 5,  colGap: 38 };
}

export const slotKey = (matchId, slot) => `${matchId}:${slot}`;

function groupRounds(matches) {
  const byRound = {};
  matches.forEach((m) => { (byRound[m.roundNo] ??= []).push(m); });
  return Object.entries(byRound)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([roundNo, ms]) => [Number(roundNo), [...ms].sort((a, b) => a.positionNo - b.positionNo)]);
}

/**
 * @param {object} drawResult  DrawResultResponse từ api.generateDraw
 * @param {string} [fallbackFormat]  tournament.format, dùng khi response thiếu tournamentFormat
 * @returns {{
 *   supported: boolean, reason?: string,
 *   stage, rounds, bracketSize, totalRounds, sizing,
 *   steps: Array<{matchId, slot, player, matchCode}>,
 *   lastStepIndexByMatch: Map<number, number>,
 *   byeAdvances: Array<{matchId, player, nextMatchId, nextSlot}>,
 *   ghostStages: Array<{id, name, stageType}>,
 * }}
 */
export function buildDrawScript(drawResult, fallbackFormat) {
  const format = drawResult?.tournamentFormat || fallbackFormat;
  const stageType = CEREMONY_STAGE_BY_FORMAT[format];
  if (!stageType) {
    return { supported: false, reason: "Thể thức này chưa hỗ trợ bốc thăm công khai." };
  }

  const stages = Array.isArray(drawResult?.stages) ? drawResult.stages : [];
  const stage = stages.find((s) => s.stageType === stageType);
  const matches = stage?.matches ?? [];
  if (matches.length === 0) {
    return { supported: false, reason: "Kết quả bốc thăm không có nhánh đấu để trình chiếu." };
  }

  const rounds = groupRounds(matches);
  const round1 = rounds[0]?.[1] ?? [];
  // Vòng 1 luôn có đúng bracketSize/2 trận, kể cả khi DE cắt sớm ở vòng sau.
  const bracketSize = round1.length * 2;

  /* Thứ tự bốc: trận theo positionNo, trong mỗi trận player1 trước player2.
     Slot rỗng (do BYE) không sinh bước bốc — không có ai để bốc vào đó. */
  const steps = [];
  round1.forEach((m) => {
    ["player1", "player2"].forEach((slot) => {
      const player = m[slot];
      if (player) steps.push({ matchId: m.id, slot, player, matchCode: m.matchCode });
    });
  });

  /* Trận được coi là "chốt xong" khi bước bốc CUỐI CÙNG thuộc về nó đã đặt xuống —
     lúc đó mới hiện badge Miễn đấu cho slot còn trống. */
  const lastStepIndexByMatch = new Map();
  steps.forEach((s, i) => lastStepIndexByMatch.set(s.matchId, i));

  /* BE tự đẩy người thắng BYE lên vòng sau ngay lúc sinh bracket
     (assignSeededRound1 → placeParticipantInMatch). Ta chỉ hiện lại việc đó. */
  const byeAdvances = round1
    .filter((m) => (m.isBye || m.status === "BYE") && m.winner && m.nextMatchWinId)
    .map((m) => ({
      matchId: m.id,
      player: m.winner,
      nextMatchId: m.nextMatchWinId,
      nextSlot: m.winSlot,
    }));

  const ghostStages = stages
    .filter((s) => GHOST_STAGE_TYPES.has(s.stageType))
    .map((s) => ({ id: s.id, name: s.name, stageType: s.stageType }));

  return {
    supported: true,
    stage,
    rounds,
    bracketSize,
    totalRounds: log2(bracketSize),
    sizing: ceremonySizing(bracketSize),
    steps,
    lastStepIndexByMatch,
    byeAdvances,
    ghostStages,
  };
}

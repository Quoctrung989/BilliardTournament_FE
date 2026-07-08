import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (p) => p.then((r) => getApiData(r));

/**
 * Danh sách trận trọng tài được phân công.
 * @param {{ status?: string, tournamentName?: string }} [params]
 *   tournamentName — tìm theo tên giải (chỉ trong trận đã gán cho staff hiện tại)
 */
export const getRefereeMatches = ({ status, tournamentName } = {}) =>
  unwrap(
    axiosClient.get("/staff/matches", {
      params: {
        ...(status ? { status } : {}),
        ...(tournamentName?.trim() ? { tournamentName: tournamentName.trim() } : {}),
      },
    })
  );

export const startStaffMatch = (matchId) =>
  unwrap(axiosClient.patch(`/staff/matches/${matchId}/start`));

/** Delta +1 / -1 — body: { playerSlot: 1|2, delta: 1|-1 } */
export const incrementStaffScore = (matchId, body) =>
  unwrap(axiosClient.patch(`/staff/matches/${matchId}/score/increment`, body));

export const completeStaffMatch = (matchId, body) =>
  unwrap(axiosClient.post(`/staff/matches/${matchId}/complete`, body));

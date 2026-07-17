import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

export const getPlayerTournamentDetail = (tournamentId) =>
  unwrap(axiosClient.get(`/player/tournaments/${tournamentId}`));

/** Kiểm tra user đã đăng ký giải này chưa — trả null nếu chưa */
export const getMyRegistrationForTournament = (tournamentId) =>
  unwrap(axiosClient.get(`/player/tournaments/${tournamentId}/my-registration`));

export const getTournamentRegistrationForm = (tournamentId) =>
  unwrap(axiosClient.get(`/player/tournaments/${tournamentId}/registration-form`));

export const submitTournamentRegistration = (tournamentId, body) =>
  unwrap(axiosClient.post(`/player/tournaments/${tournamentId}/registrations`, body));

export const getMyRegistrations = (params) =>
  unwrapPaged(axiosClient.get("/player/registrations", { params }));

export const getMyRegistrationDetail = (id) =>
  unwrap(axiosClient.get(`/player/registrations/${id}`));

export const cancelMyRegistration = (id) =>
  unwrap(axiosClient.delete(`/player/registrations/${id}`));

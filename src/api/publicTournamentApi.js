import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

export const listPublicTournaments = (params) =>
  unwrapPaged(axiosClient.get("/tournaments", { params }));

export const getPublicTournamentDetail = (id) =>
  unwrap(axiosClient.get(`/tournaments/${id}`));

export const getPublicTournamentRankings = (id) =>
  unwrap(axiosClient.get(`/tournaments/${id}/rankings`));

export const getParticipantProfile = (participantId) =>
  unwrap(axiosClient.get(`/participants/${participantId}/profile`));

export const getPlayerProfileByUserId = (userId) =>
  unwrap(axiosClient.get(`/participants/user/${userId}/profile`));

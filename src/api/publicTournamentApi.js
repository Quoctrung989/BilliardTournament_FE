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

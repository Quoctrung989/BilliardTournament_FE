import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/** GET /admin/game-types?page=&size= */
export const getGameTypes = (params) =>
  unwrapPaged(axiosClient.get("/admin/game-types", { params }));

export const updateGameType = (code, body) =>
  unwrap(axiosClient.put(`/admin/game-types/${code}`, body));

import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

export const listPublicBranches = (params) =>
  unwrapPaged(axiosClient.get("/branches", { params }));

export const getPublicBranchDetail = (id) =>
  unwrap(axiosClient.get(`/branches/${id}`));

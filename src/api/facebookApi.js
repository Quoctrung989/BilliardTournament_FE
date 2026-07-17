import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (p) => p.then((r) => getApiData(r));
const unwrapPaged = (p, size) => p.then((r) => parsePagedResponse(getApiData(r), size));

/** API Facebook shared (Owner + Manager) */
export const facebookApi = {
  listPosts: (params) =>
    unwrapPaged(axiosClient.get("/shared/facebook/posts", { params }), params?.size),

  getPost: (postRecordId) =>
    unwrap(axiosClient.get(`/shared/facebook/posts/${postRecordId}`)),

  listPostsByTournament: (tournamentId) =>
    unwrap(axiosClient.get(`/shared/facebook/posts/tournament/${tournamentId}`)),

  getEngagement: (postRecordId, { refresh = false } = {}) =>
    unwrap(axiosClient.get(`/shared/facebook/posts/${postRecordId}/engagement`, {
      params: { refresh },
    })),

  getInsights: (postRecordId, { refresh = false } = {}) =>
    unwrap(axiosClient.get(`/shared/facebook/posts/${postRecordId}/insights`, {
      params: { refresh },
    })),
};

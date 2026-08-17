import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse, DEFAULT_PAGE_SIZE } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));
const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/**
 * Factory theo pattern owner/manager mirror — xem tableApi.js/tournamentManagementApi.js.
 * from/to là chuỗi ngày "yyyy-MM-dd" (hoặc undefined để BE tự lấy mặc định 12 tháng gần nhất).
 * filters (khi có) là { branchId, gameTypes, statuses } — gameTypes/statuses là mảng string, axios
 * tự serialize thành nhiều query param cùng tên (gameTypes=A&gameTypes=B) khớp với List<String> ở BE.
 */
export const createAnalyticsApi = (scope) => {
  const base = `/${scope}/analytics`;

  const downloadBlob = async (url, params, fallbackFilename) => {
    const res = await axiosClient.get(url, { params, responseType: "blob" });
    const disposition = res.headers?.["content-disposition"] || "";
    const match = disposition.match(/filename="?([^";\s]+)"?/i);
    const filename = match?.[1] || fallbackFilename;
    const blobUrl = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return {
    getOverview: (from, to, filters = {}) =>
      unwrap(axiosClient.get(`${base}/overview`, { params: { from, to, ...filters } })),
    getRevenue: (from, to, granularity, filters = {}) =>
      unwrap(axiosClient.get(`${base}/revenue`, { params: { from, to, granularity, ...filters } })),
    getTournaments: (from, to, filters = {}) =>
      unwrap(axiosClient.get(`${base}/tournaments`, { params: { from, to, ...filters } })),

    /** sortBy: PRIZE|POINTS|TOURNAMENTS|SPEND|WINS|MATCHES|RECENCY. segment: ALL|NEW|RETURNING|CHAMPION|AT_RISK. */
    getPlayers: ({ from, to, branchId, gameTypes, statuses, sortBy, limit, segment, search } = {}) =>
      unwrap(axiosClient.get(`${base}/players`, {
        params: { from, to, branchId, gameTypes, statuses, sortBy, limit, segment, search },
      })),
    getPlayerRetention: (from, to, filters = {}) =>
      unwrap(axiosClient.get(`${base}/players/retention`, { params: { from, to, ...filters } })),
    getPlayerDetail: (userId, branchId) =>
      unwrap(axiosClient.get(`${base}/players/${userId}`, { params: { branchId } })),

    getSocial: (from, to) => unwrap(axiosClient.get(`${base}/social`, { params: { from, to } })),
    getFunnel: (from, to, granularity, filters = {}) =>
      unwrap(axiosClient.get(`${base}/funnel`, { params: { from, to, granularity, ...filters } })),
    getGameTypes: (from, to) => unwrap(axiosClient.get(`${base}/game-types`, { params: { from, to } })),
    getPlayerGrowth: (from, to, granularity, filters = {}) =>
      unwrap(axiosClient.get(`${base}/player-growth`, { params: { from, to, granularity, ...filters } })),
    getInsights: (from, to, branchId) =>
      unwrap(axiosClient.get(`${base}/insights`, { params: { from, to, branchId } })),
    getTournamentDetail: (id) => unwrap(axiosClient.get(`${base}/tournaments/${id}`)),
    getTransactions: (from, to, granularity, filters = {}) =>
      unwrap(axiosClient.get(`${base}/transactions`, { params: { from, to, granularity, ...filters } })),
    listTransactions: ({ tournamentId, status, from, to, page = 0, size = DEFAULT_PAGE_SIZE } = {}) =>
      unwrapPaged(
        axiosClient.get(`${base}/transactions/list`, { params: { tournamentId, status, from, to, page, size } }),
        size
      ),

    /** from/to ở đây là chuỗi "yyyy-MM" (tháng), khác định dạng "yyyy-MM-dd" của các hàm phía trên. */
    getMonthlyReport: (from, to) => unwrap(axiosClient.get(`${base}/monthly-report`, { params: { from, to } })),

    downloadReport: (from, to) =>
      downloadBlob(`${base}/export`, { from, to }, "bao-cao-thong-ke.xlsx"),

    downloadTournamentReport: (id) =>
      downloadBlob(`${base}/tournaments/${id}/export`, {}, `bao-cao-giai-dau-${id}.xlsx`),

    downloadMonthlyReport: (from, to) =>
      downloadBlob(`${base}/monthly-report/export`, { from, to }, `bao-cao-doanh-thu-${from}_${to}.xlsx`),

    /** Truy vấn phân tích linh hoạt (Explore tab) — body dạng AnalyticsQueryRequest, xem BE. */
    runQuery: (body) => unwrap(axiosClient.post(`${base}/query`, body)),

    listSavedViews: () => unwrap(axiosClient.get(`${base}/views`)),
    createSavedView: (body) => unwrap(axiosClient.post(`${base}/views`, body)),
    deleteSavedView: (id) => unwrap(axiosClient.delete(`${base}/views/${id}`)),
  };
};

export const ownerAnalyticsApi = createAnalyticsApi("owner");
export const managerAnalyticsApi = createAnalyticsApi("manager");

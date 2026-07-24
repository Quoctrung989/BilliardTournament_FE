import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse, DEFAULT_PAGE_SIZE } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));
const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/**
 * Factory theo pattern owner/manager mirror — xem tableApi.js/tournamentManagementApi.js.
 * from/to là chuỗi ngày "yyyy-MM-dd" (hoặc undefined để BE tự lấy mặc định 12 tháng gần nhất).
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
    getOverview: (from, to) => unwrap(axiosClient.get(`${base}/overview`, { params: { from, to } })),
    getRevenue: (from, to, granularity) =>
      unwrap(axiosClient.get(`${base}/revenue`, { params: { from, to, granularity } })),
    getTournaments: (from, to) => unwrap(axiosClient.get(`${base}/tournaments`, { params: { from, to } })),
    getPlayers: (from, to) => unwrap(axiosClient.get(`${base}/players`, { params: { from, to } })),
    getSocial: (from, to) => unwrap(axiosClient.get(`${base}/social`, { params: { from, to } })),
    getFunnel: (from, to, granularity) =>
      unwrap(axiosClient.get(`${base}/funnel`, { params: { from, to, granularity } })),
    getGameTypes: (from, to) => unwrap(axiosClient.get(`${base}/game-types`, { params: { from, to } })),
    getPlayerGrowth: (from, to, granularity) =>
      unwrap(axiosClient.get(`${base}/player-growth`, { params: { from, to, granularity } })),
    getTournamentDetail: (id) => unwrap(axiosClient.get(`${base}/tournaments/${id}`)),
    getTransactions: (from, to, granularity) =>
      unwrap(axiosClient.get(`${base}/transactions`, { params: { from, to, granularity } })),
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
  };
};

export const ownerAnalyticsApi = createAnalyticsApi("owner");
export const managerAnalyticsApi = createAnalyticsApi("manager");

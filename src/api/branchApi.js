import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/**
 * Factory theo pattern owner/manager mirror — xem tournamentManagementApi.js.
 * Owner có full CRUD; Manager chỉ có listBranches/getBranch (chỉ đọc, giới hạn theo
 * BranchAccessService ở backend) nên các hàm ghi vẫn được expose nhưng sẽ 403 nếu gọi
 * từ scope "manager" (URL khác nhau: /owner/branches vs /manager/branches).
 */
export const createBranchApi = (scope) => {
  const base = `/${scope}/branches`;

  return {
    listBranches: (params) => unwrapPaged(axiosClient.get(base, { params })),
    getBranch: (id) => unwrap(axiosClient.get(`${base}/${id}`)),
    createBranch: (body) => unwrap(axiosClient.post(base, body)),
    updateBranch: (id, body) => unwrap(axiosClient.put(`${base}/${id}`, body)),
    updateStatus: (id, body) => unwrap(axiosClient.patch(`${base}/${id}/status`, body)),
  };
};

export const ownerBranchApi = createBranchApi("owner");
export const managerBranchApi = createBranchApi("manager");

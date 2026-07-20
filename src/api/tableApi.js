import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/**
 * Factory theo pattern owner/manager mirror — xem branchApi.js.
 * Owner có full CRUD trên pool bàn của chuỗi; Manager chỉ đọc (danh sách bàn ACTIVE)
 * để chọn khi gán lịch thi đấu — /manager/tables không có các hàm ghi.
 */
export const createTableApi = (scope) => {
  const base = `/${scope}/tables`;

  return {
    listTables: (params) => unwrapPaged(axiosClient.get(base, { params })),
    listActiveTables: () =>
      scope === "owner" ? unwrap(axiosClient.get(`${base}/active`)) : unwrap(axiosClient.get(base)),
    getTable: (id) => unwrap(axiosClient.get(`${base}/${id}`)),
    createTable: (body) => unwrap(axiosClient.post(base, body)),
    updateTable: (id, body) => unwrap(axiosClient.put(`${base}/${id}`, body)),
    updateStatus: (id, body) => unwrap(axiosClient.patch(`${base}/${id}/status`, body)),

    importExcel: (file) => {
      const form = new FormData();
      form.append("file", file);
      return unwrap(
        axiosClient.post(`${base}/import-excel`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      );
    },

    downloadImportTemplate: async () => {
      const res = await axiosClient.get(`${base}/import-template`, { responseType: "blob" });
      const disposition = res.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?([^";\s]+)"?/i);
      const filename = match?.[1] || "template_import_table.xlsx";
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
};

export const ownerTableApi = createTableApi("owner");
export const managerTableApi = createTableApi("manager");

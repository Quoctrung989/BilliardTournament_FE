import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (p) => p.then((r) => getApiData(r));

export const getOwnerStats   = () => unwrap(axiosClient.get("/owner/dashboard/stats"));
export const getManagerStats = () => unwrap(axiosClient.get("/manager/dashboard/stats"));
export const getAdminStats   = () => unwrap(axiosClient.get("/admin/dashboard/stats"));
export const getAdminSystemHealth = () => unwrap(axiosClient.get("/admin/dashboard/system-health"));

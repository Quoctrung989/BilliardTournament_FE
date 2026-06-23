import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (p) => p.then((r) => getApiData(r));

export const getOwnerStats   = () => unwrap(axiosClient.get("/owner/dashboard/stats"));
export const getManagerStats = () => unwrap(axiosClient.get("/manager/dashboard/stats"));

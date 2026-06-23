import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

export const login = (body) => axiosClient.post("/auth/login", body);

export const getMe = () => axiosClient.get("/auth/me").then((res) => getApiData(res));

export const register = (body) => axiosClient.post("/auth/register", body);

export const forgotPassword = (body) => axiosClient.post("/auth/forgot-password", body);

export const resetPassword = (body) => axiosClient.post("/auth/reset-password", body);

/** POST /auth/change-password — body: { oldPassword, newPassword } */
export const changePassword = (body) =>
  axiosClient.post("/auth/change-password", body);

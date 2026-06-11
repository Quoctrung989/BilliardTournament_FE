import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (promise) => promise.then((res) => getApiData(res));

/** GET /profile — hồ sơ user đang đăng nhập */
export const getProfile = () => unwrap(axiosClient.get("/profile"));

/** POST /player/profile — tạo hồ sơ lần đầu (PLAYER) */
export const createPlayerProfile = (body) =>
  unwrap(axiosClient.post("/player/profile", body));

/** PUT /profile — cập nhật hồ sơ */
export const updateProfile = (body) => unwrap(axiosClient.put("/profile", body));

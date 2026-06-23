import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (promise) => promise.then((res) => getApiData(res));

/**
 * POST /storage/images — multipart: file + folder
 * @returns {{ objectKey: string, url: string }} url chỉ preview tạm; lưu profile dùng objectKey
 */
export const uploadImage = (file, folder = "avatars") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  return unwrap(
    axiosClient.post("/storage/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

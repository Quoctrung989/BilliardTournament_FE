import axios from "axios";
import { useAuthStore } from "../store/authStore";

const baseURL = `${process.env.REACT_APP_API_URL || "http://localhost:8080"}/api/v1`;

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const payload = error?.response?.data;

    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    if (status === 403) {
      console.log("Forbidden");
    }

    if (status === 500) {
      console.log("Server error");
    }

    const wrappedError = new Error(
      payload?.message || error.message || "Có lỗi xảy ra. Vui lòng thử lại."
    );
    wrappedError.code = payload?.code;
    wrappedError.response = error.response;
    return Promise.reject(wrappedError);
  }
);

export default axiosClient;

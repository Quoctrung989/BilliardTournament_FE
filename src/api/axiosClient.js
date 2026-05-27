import axios from "axios";
import { useAuthStore } from "../store/authStore";

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
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
  (error) => {
    return Promise.reject(error);
  },
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.log("Token expired");

      // logout
      useAuthStore.getState().logout();

      // redirect login
      window.location.href = "/login";
    }

    if (status === 403) {
      console.log("Forbidden");
    }

    if (status === 500) {
      console.log("Server error");
    }

    return Promise.reject(error);
  },
);

export default axiosClient;

import axios from "axios";

// Development: Uses '/api' which is proxied by Vite to http://localhost:3000
// Production: Set VITE_API_BASE_URL to your backend API URL (e.g., https://api.9thwaka.app/api)
// The /api is part of your backend route structure, not the frontend URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config || {};

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";

    if (
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/forgotpassword") ||
      url.includes("/auth/verify-reset-code") ||
      url.includes("/auth/resetpassword") ||
      url.includes("/admin/auth")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = api.post("/auth/refresh").finally(() => {
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;

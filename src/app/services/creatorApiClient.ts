import axios from "axios";
import { authService, creatorTokenStorage } from "./authService";

const creatorApiClient = axios.create();

// 요청 interceptor: 모든 요청에 creatorAccessToken 자동 첨부
creatorApiClient.interceptors.request.use((config) => {
  const token = creatorTokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 interceptor: 401 시 토큰 재발급 후 재시도
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

creatorApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const message = error.response?.data?.message;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (message === "REFRESH_TOKEN_EXPIRED" || message !== "TOKEN_EXPIRED") {
      creatorTokenStorage.clearTokens();
      window.location.href = "/creator/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push(() => resolve(creatorApiClient(originalRequest)));
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await authService.creatorRefresh();
      refreshQueue.forEach((cb) => cb());
      refreshQueue = [];
      return creatorApiClient(originalRequest);
    } catch {
      refreshQueue = [];
      creatorTokenStorage.clearTokens();
      window.location.href = "/creator/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default creatorApiClient;

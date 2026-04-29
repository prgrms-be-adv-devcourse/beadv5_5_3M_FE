import axios from "axios";
import { authService, tokenStorage } from "./authService";

const apiClient = axios.create({
  baseURL: "",
});

// 요청 interceptor: 모든 요청에 accessToken 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 interceptor: 401 시 토큰 재발급 후 재시도
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const message = error.response?.data?.message;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (message === "REFRESH_TOKEN_EXPIRED") {
      tokenStorage.clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (message === "SESSION_EXPIRED") {
      // OAuth 콜백 페이지에서는 리다이렉트 금지 (googleLogin 흐름 보호)
      if (!window.location.pathname.startsWith("/oauth2")) {
        alert("다른 곳에서 로그인하여 현재 세션이 종료되었습니다.");
        tokenStorage.clearTokens();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (message !== "TOKEN_EXPIRED") {
      if (!window.location.pathname.startsWith("/oauth2")) {
        tokenStorage.clearTokens();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push(() => resolve(apiClient(originalRequest)));
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await authService.refresh();
      refreshQueue.forEach((cb) => cb());
      refreshQueue = [];
      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshQueue = [];
      if (refreshError instanceof Error && refreshError.message === "REFRESH_TOKEN_EXPIRED") {
        tokenStorage.clearTokens();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;

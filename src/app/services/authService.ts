import apiClient from "./apiClient";
import creatorApiClient from "./creatorApiClient";

interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
  ageGroup: number;
  gender: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const CREATOR_ACCESS_TOKEN_KEY = "creatorAccessToken";
const CREATOR_REFRESH_TOKEN_KEY = "creatorRefreshToken";

export const tokenStorage = {
  getAccessToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (tokens: TokenResponse) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clearTokens: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const creatorTokenStorage = {
  getAccessToken: () => sessionStorage.getItem(CREATOR_ACCESS_TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(CREATOR_REFRESH_TOKEN_KEY),
  setTokens: (tokens: TokenResponse) => {
    sessionStorage.setItem(CREATOR_ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(CREATOR_REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clearTokens: () => {
    sessionStorage.removeItem(CREATOR_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(CREATOR_REFRESH_TOKEN_KEY);
  },
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
const BASE_URL = "";

export const authService = {
  getGoogleLoginUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async googleLogin(code: string): Promise<void> {
    const res = await apiClient.post("/api/users/oauth2/google", { code });
    tokenStorage.setTokens(res.data);
  },

  async signup(data: SignupRequest): Promise<string> {
    try {
      const res = await apiClient.post("/api/users/join", data);
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data || "회원가입에 실패했습니다.");
    }
  },

  async login(email: string, password: string): Promise<void> {
    const res = await apiClient.post("/api/users/login", { email, password });
    tokenStorage.setTokens(res.data);
  },

  // refresh는 apiClient interceptor 내부에서 호출되므로 fetch 직접 사용 (무한루프 방지)
  async refresh(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error("리프레시 토큰이 없습니다.");
    const res = await fetch(`${BASE_URL}/api/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: refreshToken,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "토큰 재발급에 실패했습니다.");
    }
    const tokens: TokenResponse = await res.json();
    tokenStorage.setTokens(tokens);
  },

  async logout(): Promise<void> {
    await apiClient.post("/api/users/logout");
    tokenStorage.clearTokens();
  },

  async sendVerificationCode(email: string): Promise<void> {
    try {
      await apiClient.post("/api/users/email/verification/send", { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "인증 코드 발송에 실패했습니다.");
    }
  },

  async verifyEmailCode(email: string, code: string): Promise<void> {
    try {
      await apiClient.post("/api/users/email/verification/verify", { email, code });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "인증 코드가 올바르지 않습니다.");
    }
  },

  async checkEmailDuplicate(email: string): Promise<boolean> {
    const res = await apiClient.get(`/api/users/email/check?email=${encodeURIComponent(email)}`, {
      validateStatus: (s) => s === 200 || s === 409,
    });
    if (res.status === 200) return true;
    if (res.status === 409) return false;
    throw new Error("이메일 중복 확인에 실패했습니다.");
  },

  async checkNicknameDuplicate(nickname: string): Promise<boolean> {
    const res = await apiClient.get(`/api/users/nickname/check?nickname=${encodeURIComponent(nickname)}`, {
      validateStatus: (s) => s === 200 || s === 409,
    });
    if (res.status === 200) return true;
    if (res.status === 409) return false;
    throw new Error("닉네임 중복 확인에 실패했습니다.");
  },

  async creatorLogin(email: string, password: string): Promise<void> {
    const res = await apiClient.post("/api/creators/login", { email, password });
    creatorTokenStorage.setTokens(res.data);
  },

  async creatorSignup(data: {
    email: string;
    password: string;
    nickname: string;
    phoneNumber: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }): Promise<void> {
    try {
      await apiClient.post("/api/creators/join", data);
    } catch (error: any) {
      throw new Error(error.response?.data || "가입에 실패했습니다.");
    }
  },

  async checkCreatorEmailDuplicate(email: string): Promise<boolean> {
    const res = await apiClient.get(`/api/creators/email/check?email=${encodeURIComponent(email)}`, {
      validateStatus: (s) => s === 200 || s === 409,
    });
    if (res.status === 200) return true;
    if (res.status === 409) return false;
    throw new Error("이메일 중복 확인에 실패했습니다.");
  },

  async checkCreatorNicknameDuplicate(nickname: string): Promise<boolean> {
    const res = await apiClient.get(`/api/creators/nickname/check?nickname=${encodeURIComponent(nickname)}`, {
      validateStatus: (s) => s === 200 || s === 409,
    });
    if (res.status === 200) return true;
    if (res.status === 409) return false;
    throw new Error("닉네임 중복 확인에 실패했습니다.");
  },

  // creatorRefresh도 interceptor 내부 호출이므로 fetch 직접 사용
  async creatorRefresh(): Promise<void> {
    const refreshToken = creatorTokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error("리프레시 토큰이 없습니다.");
    const res = await fetch(`${BASE_URL}/api/creators/refresh`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: refreshToken,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "토큰 재발급에 실패했습니다.");
    }
    const tokens: TokenResponse = await res.json();
    creatorTokenStorage.setTokens(tokens);
  },

  async creatorLogout(): Promise<void> {
    await creatorApiClient.post("/api/creators/logout");
    creatorTokenStorage.clearTokens();
  },
};

import apiClient from "./apiClient";

export interface UserInfo {
  nickname: string;
  email: string;
  cookieBalance: number;
  profileUrl: string | null;
  phone: string | null;
}

export const userService = {
  async getMe(): Promise<UserInfo> {
    const res = await apiClient.get<UserInfo>("/api/users/me");
    return res.data;
  },

  async checkNickname(nickname: string): Promise<void> {
    await apiClient.get(`/api/users/nickname/check?nickname=${encodeURIComponent(nickname)}`);
  },

  async updateProfile(nickname: string, phone?: string, profileImage?: File): Promise<void> {
    const formData = new FormData();
    formData.append("nickname", nickname);
    if (phone) formData.append("phone", phone);
    if (profileImage) formData.append("profileImage", profileImage);
    await apiClient.put("/api/users/me", formData);
  },

  async withdraw(): Promise<void> {
    await apiClient.delete("/api/users/me");
  },
};

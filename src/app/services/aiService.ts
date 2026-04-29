import apiClient from "./apiClient";

export interface ApiRecommendation {
  logId: number;
  movieId: number;
}

export const aiService = {
  async getRecommendations(): Promise<ApiRecommendation[]> {
    const res = await apiClient.get<ApiRecommendation[]>("/api/recommendations");
    return res.data;
  },

  async clickRecommendation(logId: number): Promise<void> {
    await apiClient.patch("/api/recommendations/click", { logId });
  },
};

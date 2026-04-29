import apiClient from "./apiClient";
import { PageResult } from "./ticketService";

export interface ReviewResponse {
  reviewId: number;
  movieId: number;
  userId: string;
  rating: number;
  comment: string;
  updatedAt: string;
  status: string;
}

// In MyPage, the backend might return movieTitle or we might need to resolve it 
// but let's assume standard response first.
export interface MyReviewResponse extends ReviewResponse {
  movieTitle?: string;
  date?: string; // Client parsed
}

export const reviewService = {
  /** 리뷰 작성 */
  async createReview(movieId: number, rating: number, comment: string): Promise<ReviewResponse> {
    const res = await apiClient.post<ReviewResponse>("/api/reviews", { movieId, rating, comment });
    return res.data;
  },

  /** 리뷰 수정 */
  async updateReview(reviewId: number, rating: number, comment: string): Promise<ReviewResponse> {
    const res = await apiClient.put<ReviewResponse>(`/api/reviews/${reviewId}`, { rating, comment });
    return res.data;
  },

  /** 리뷰 삭제 */
  async deleteReview(reviewId: number): Promise<void> {
    await apiClient.delete(`/api/reviews/${reviewId}`);
  },

  /** 내 리뷰 목록 조회 */
  async getMyReviews(page = 0, size = 20): Promise<PageResult<MyReviewResponse>> {
    const res = await apiClient.get<PageResult<MyReviewResponse>>("/api/reviews/me", {
      params: { page, size }
    });
    return res.data;
  }
};

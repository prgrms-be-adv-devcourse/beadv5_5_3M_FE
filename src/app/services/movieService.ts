import apiClient from "./apiClient";
import creatorApiClient from "./creatorApiClient";
import { SETTLEMENTS, Movie, Creator, Settlement, CookieHistory, UserReview, MOCK_WATCHED_MOVIES, MOCK_COOKIE_HISTORY, MOCK_USER_REVIEWS, TOP_CREATORS } from "../data/mockData";

// ─── 사용자 대상 응답 타입 ────────────────────────────────────────────────────

export interface ApiMovieCard {
  movieId: number;
  creatorId: string;
  nickname: string;
  title: string;
  averageRating: number | null;
  categoryIds: number[];
  imageUrl?: string;
  highlightedTitle?: string | null;
  highlightedNickname?: string | null;
}

export interface ApiScheduledMovie {
  movieId: number;
  creatorId: string;
  nickname: string;
  title: string;
  startTime: string;
  categoryIds: number[];
  imageUrl?: string;
}

export interface ApiScheduleForUser {
  scheduleId: number;
  startTime: string;
  totalSeats: number;
  remainingSeats: number;
  status: string; // 'SCHEDULED' | 'WAITING' | 'ON_AIR' | 'COMPLETED'
}

export interface ApiTicket {
  ticketId: number;
  scheduleId: number;
  userId: string;
  status: string;
}

export interface ApiReviewSummary {
  reviewId: number;
  nickname: string;
  rating: number;
  comment: string;
  updatedAt: string;
  status: string;
}

export interface ApiMovieDetail {
  movieId: number;
  creatorId: string;
  nickname: string;
  title: string;
  description: string;
  categoryIds: number[];
  runningTime: number;
  averageRating: number | null;
  cookie: number;
  imageUrl?: string;
  schedules: ApiScheduleForUser[];
  reviews: ApiReviewSummary[];
}

export interface ApiMovieByCreator {
  movieId: number;
  title: string;
  averageRating: number | null;
  categoryIds: number[];
  imageUrl?: string;
}

export interface ApiCategory {
  categoryId: number;
  name: string;
}

// ─── 크리에이터 대상 응답 타입 ────────────────────────────────────────────────

export interface ApiMovieForCreator {
  movieId: number;
  title: string;
  imageUrl?: string;
  visibility: "PUBLIC" | "PRIVATE";
}

export interface ApiDetailForCreator {
  movieId: number;
  title: string;
  description: string;
  categoryIds: number[];
  baseCookie: number;
  additionalCookie: number;
}

export interface ApiMovieForSchedule {
  movieId: number;
  title: string;
  runningTime: number;
}

export interface ApiDraftSchedule {
  scheduleId: number;
  movieId: number;
  movieTitle: string;
  movieImageUrl: string;
  startTime: string;
  endTime: string;
  ticketingTime: string;
  isConfirmed: boolean;
  status: string;
  totalSeats: number;
  remainingSeats: number;
}

export interface ApiScheduleForCreator {
  scheduleId: number;
  title: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  remainingSeats: number;
  status?: string;
}

// ─── 포스터 플레이스홀더 (백엔드 이미지 미구현 동안 사용) ─────────────────────

const POSTER_PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1512070679279-8988d32161be?w=400&h=600&fit=crop",
];

export const getPlaceholderPoster = (movieId: number): string =>
  POSTER_PLACEHOLDERS[movieId % POSTER_PLACEHOLDERS.length];

export const getImageUrl = (imageUrl: string | undefined): string | undefined => {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith("http")) return imageUrl;
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `/files${path}`;
};

export interface ApiSettlement {
  id: number;
  creatorId: string;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "FAILED" | "CANCELLED";
  requestAmount: number;
  requestedAt: string;
  settlementDeadline: string;
}

// ─── 서비스 ───────────────────────────────────────────────────────────────────

export const movieService = {

  // ── 사용자 - 영화 조회 ───────────────────────────────────────────────────────

  async getOnAirMovies(): Promise<ApiMovieCard[]> {
    const res = await apiClient.get<ApiMovieCard[]>("/api/movies/on-air");
    return res.data;
  },

  async getScheduledMovies(): Promise<ApiScheduledMovie[]> {
    const res = await apiClient.get<ApiScheduledMovie[]>("/api/movies/scheduled");
    return res.data;
  },

  async getAllPublicMovies(): Promise<ApiMovieCard[]> {
    const res = await apiClient.get<ApiMovieCard[]>("/api/movies/public");
    return res.data;
  },

  async searchMovies(title: string): Promise<ApiMovieCard[]> {
    const res = await apiClient.get<ApiMovieCard[]>(`/api/movies/search?title=${encodeURIComponent(title)}`);
    return res.data;
  },

  // ── 검색 확장 기능 ───────────────────────────────────────────────────────

  async autocomplete(prefix: string, size: number = 5): Promise<{ suggestions: Array<{ movieId: number; title: string; creatorNickname: string }> }> {
    const res = await apiClient.get(`/api/movies/search/autocomplete?prefix=${encodeURIComponent(prefix)}&size=${size}`);
    return res.data;
  },

  async getPopularKeywords(size: number = 10): Promise<{ keywords: Array<{ keyword: string; count: number }> }> {
    const res = await apiClient.get(`/api/movies/search/popular?size=${size}`);
    return res.data;
  },

  async getFilterCounts(): Promise<{ categories: Array<{ categoryName: string; count: number }>; ratingRanges: Array<{ range: string; count: number }> }> {
    const res = await apiClient.get(`/api/movies/search/filters`);
    return res.data;
  },

  async getMovieDetail(id: number): Promise<ApiMovieDetail> {
    const res = await apiClient.get<Omit<ApiMovieDetail, "movieId">>(`/api/movies/${id}/detail`);
    return { ...res.data, movieId: id };
  },

  /** 특정 크리에이터의 공개 영화 목록 (사용자용) */
  async getPublicMoviesByCreatorId(creatorId: string): Promise<ApiMovieByCreator[]> {
    const res = await apiClient.get<ApiMovieByCreator[]>(`/api/movies/list?creatorId=${creatorId}`);
    return res.data;
  },

  /** 장르별 영화 목록 */
  async getMoviesByGenre(categoryId: number): Promise<ApiMovieCard[]> {
    const res = await apiClient.get<ApiMovieCard[]>(`/api/movies/genre/${categoryId}`);
    return res.data;
  },

  /** 특정 영화 상영 일정 조회 (사용자용) */
  async getSchedulesByMovieId(movieId: number): Promise<ApiScheduleForUser[]> {
    const res = await apiClient.get<ApiScheduleForUser[]>(`/api/movies/schedules?movieId=${movieId}`);
    return res.data;
  },

  /** 내 티켓 목록 조회 */
  async getUserTickets(): Promise<ApiTicket[]> {
    const res = await apiClient.get<{ content: ApiTicket[] }>("/api/tickets");
    return res.data.content || [];
  },

  // ── 크리에이터 - 영화 관리 ───────────────────────────────────────────────────

  /** 내 영화 목록 조회 */
  async getCreatorMovieList(): Promise<ApiMovieForCreator[]> {
    const res = await creatorApiClient.get<ApiMovieForCreator[]>("/api/creators/movies");
    return res.data;
  },

  /** 크리에이터용 영화 상세 조회 */
  async getCreatorMovieDetail(movieId: number): Promise<ApiDetailForCreator> {
    const res = await creatorApiClient.get<Omit<ApiDetailForCreator, "movieId">>(`/api/creators/movies/${movieId}/detail`);
    return { ...res.data, movieId };
  },

  /** 영화 등록 (영상 + 포스터 업로드) */
  async registerCreatorMovie(data: {
    title: string;
    description: string;
    additionalCookie: number;
    categoryIds: number[];
    image: File;
    video: File;
  }): Promise<number> {
    // 영상 파일에서 재생시간(초) 추출
    const runningTime = await new Promise<number>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration) || 60);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve(60);
      video.src = URL.createObjectURL(data.video);
    });
    // 파일 크기(MB) 기반 baseCookie 자동 계산
    const fileSizeMB = data.video.size / (1024 * 1024);
    const baseCookie = Math.max(1, Math.round(fileSizeMB));

    const formData = new FormData();
    formData.append(
      "request",
      new Blob(
        [JSON.stringify({
          title: data.title,
          description: data.description,
          runningTime,
          baseCookie,
          additionalCookie: data.additionalCookie,
          categoryIds: data.categoryIds,
        })],
        { type: "application/json" }
      )
    );
    formData.append("image", data.image);
    formData.append("video", data.video);
    const res = await creatorApiClient.post<number>("/api/creators/movies", formData);
    return res.data;
  },

  /** 영화 공개/비공개 변경 */
  async updateMovieVisibility(movieId: number, visibility: "PUBLIC" | "PRIVATE"): Promise<void> {
    await creatorApiClient.patch(`/api/creators/movies/${movieId}/visibility`, { visibility });
  },

  /** 영화 상세 정보 수정 */
  async updateMovieDetail(movieId: number, data: {
    title: string;
    description: string;
    additionalCookie: number;
    categoryIds: number[];
  }): Promise<void> {
    await creatorApiClient.patch(`/api/creators/movies/${movieId}/detail`, data);
  },

  /** 영화 삭제 */
  async deleteCreatorMovie(movieId: number): Promise<void> {
    await creatorApiClient.delete(`/api/creators/movies/${movieId}`);
  },

  // ── 영화 카테고리 관리 ───────────────────────────────────────────────────────

  /** 전체 카테고리 목록 */
  async getCategories(): Promise<ApiCategory[]> {
    const res = await apiClient.get<ApiCategory[]>("/api/movies/categories");
    return res.data;
  },

  /** 카테고리 등록 */
  async registerCategory(name: string): Promise<number> {
    const res = await creatorApiClient.post<number>("/api/creators/categories", { name });
    return res.data;
  },

  // ── 크리에이터 - 스케줄 관리 ─────────────────────────────────────────────────

  /** 스케줄 편성 가능한 공개 영화 목록 */
  async getSchedulableMovies(): Promise<ApiMovieForSchedule[]> {
    const res = await creatorApiClient.get<ApiMovieForSchedule[]>("/api/creators/movies/schedulable");
    return res.data;
  },

  /** 스케줄 등록 */
  async registerSchedule(data: {
    movieId: number;
    slots: { startTime: string; ticketingTime: string }[];
  }): Promise<void> {
    await creatorApiClient.post("/api/creators/schedules", data);
  },

  /** 날짜별 임시+확정 스케줄 목록 */
  async getDraftSchedules(date: string): Promise<ApiDraftSchedule[]> {
    const res = await creatorApiClient.get<ApiDraftSchedule[]>(`/api/creators/schedules/draft?date=${date}`);
    return res.data;
  },

  /** 스케줄 확정 */
  async confirmSchedules(scheduleIds: number[]): Promise<void> {
    await creatorApiClient.patch("/api/creators/schedules/confirm", { scheduleIds });
  },

  /** 미확정 스케줄 삭제 */
  async deleteSchedule(scheduleId: number): Promise<void> {
    await creatorApiClient.delete(`/api/creators/schedules/${scheduleId}`);
  },

  /** 날짜별 확정 일정 조회 (내 스케줄/프로필 공용) */
  async getConfirmedSchedules(date: string, creatorId?: string): Promise<ApiScheduleForCreator[]> {
    const id = creatorId || "me"; // 'me'는 헤더 기반, ID는 쿼리 기반 (백엔드 맞춰 처리)
    const res = await apiClient.get<ApiScheduleForCreator[]>(`/api/movies/schedules/search?creatorId=${id}&date=${date}`);
    return res.data;
  },

  /** 특정 크리에이터의 날짜별 확정 일정 조회 (프로필용) */
  async getConfirmedSchedulesByCreator(creatorId: string, date: string): Promise<ApiScheduleForCreator[]> {
    const res = await apiClient.get<ApiScheduleForCreator[]>(`/api/movies/schedules/search?creatorId=${creatorId}&date=${date}`);
    return res.data;
  },

  // ── Mock 유지 (백엔드 미구현 서비스) ──────────────────────────────────────────

  /** @mock 내가 본 영화 목록 */
  async getUserWatchedMovies(): Promise<Movie[]> {
    return MOCK_WATCHED_MOVIES;
  },

  /** @mock 쿠키 히스토리 */
  async getCookieHistory(): Promise<CookieHistory[]> {
    return MOCK_COOKIE_HISTORY;
  },

  /** @mock 내 리뷰 목록 */
  async getUserReviews(): Promise<UserReview[]> {
    return MOCK_USER_REVIEWS;
  },

  /** @mock 크리에이터 프로필 (공개 API 없음) */
  async getCreatorById(id: string | number): Promise<Creator | undefined> {
    const numId = Number(id);
    if (isNaN(numId)) return undefined;
    return TOP_CREATORS.find(c => c.id === numId);
  },

  /** 정산 목록 조회 */
  async getSettlements(): Promise<ApiSettlement[]> {
    const res = await creatorApiClient.get<any>("/api/settlements");
    // 리스트가 직접 오거나 content 내부에 래핑되어 오는 모든 상황 대응
    return Array.isArray(res.data) ? res.data : (res.data.content || []);
  },

  /** 정산 신청 */
  async requestSettlement(amount: number): Promise<ApiSettlement> {
    const res = await creatorApiClient.post<ApiSettlement>(
      "/api/settlements",
      { requestAmount: amount },
      { headers: { "Idempotency-Key": crypto.randomUUID() } }
    );
    return res.data;
  },

  /** 정산 취소 */
  async cancelSettlement(id: number): Promise<ApiSettlement> {
    const res = await creatorApiClient.post<ApiSettlement>(`/api/settlements/${id}/cancel`);
    return res.data;
  },

  /** 지갑 잔액 조회 */
  async getWalletBalance(): Promise<number> {
    const res = await creatorApiClient.get<any>("/api/wallets/me");
    const body = res.data;
    
    // 만약 백엔드가 { code, message, data } 형태로 감싸서 보냈다면 데이터 필드 내부를 확인
    const data = body.data !== undefined ? body.data : body;
    
    // 여러 가능성 있는 필드명 확인 (balance, amount, currentBalance, walletBalance 등)
    const val = data.balance ?? data.amount ?? data.currentBalance ?? data.walletBalance ?? (typeof data === 'number' ? data : 0);
    return Number(val) || 0;
  },
};

// ─── 좋아요 서비스 ─────────────────────────────────────────────────────────────

export interface LikedMovie {
  movieId: number;
  title: string;
  imageUrl?: string;
  likedAt: string;
}

const LIKED_MOVIES_KEY = "liked_movies";

// ─── 쿠키 로그 서비스 ──────────────────────────────────────────────────────────

export interface CookieLogItem {
  id: number;
  amount: number;
  paymentId: number | null;
  refundId: number | null;
  ticketId: number | null;
  createAt: string;
}

export const cookieLogService = {
  async getMyCookieLogs(): Promise<CookieLogItem[]> {
    const res = await apiClient.get<CookieLogItem[]>("/api/users/me/cookie-logs");
    return res.data;
  },
};

// ─── 좋아요 서비스 ─────────────────────────────────────────────────────────────

export const likeService = {
  getLikedMovies(): LikedMovie[] {
    try {
      return JSON.parse(localStorage.getItem(LIKED_MOVIES_KEY) || "[]");
    } catch {
      return [];
    }
  },

  isLiked(movieId: number): boolean {
    return this.getLikedMovies().some(m => m.movieId === movieId);
  },

  async like(movieId: number, title: string, imageUrl?: string): Promise<void> {
    await apiClient.post(`/api/movies/${movieId}/like`);
    const movies = this.getLikedMovies();
    if (!movies.some(m => m.movieId === movieId)) {
      movies.unshift({ movieId, title, imageUrl, likedAt: new Date().toISOString() });
      localStorage.setItem(LIKED_MOVIES_KEY, JSON.stringify(movies));
    }
  },

  async unlike(movieId: number): Promise<void> {
    await apiClient.delete(`/api/movies/${movieId}/like`);
    const movies = this.getLikedMovies().filter(m => m.movieId !== movieId);
    localStorage.setItem(LIKED_MOVIES_KEY, JSON.stringify(movies));
  },
};

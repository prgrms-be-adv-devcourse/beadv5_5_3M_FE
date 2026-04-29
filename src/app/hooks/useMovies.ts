import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import {
  movieService,
  getPlaceholderPoster,
  getImageUrl,
  ApiMovieCard,
  ApiScheduledMovie,
  ApiMovieDetail,
  ApiMovieByCreator,
  ApiCategory,
  ApiMovieForCreator,
  ApiMovieForSchedule,
  ApiDraftSchedule,
  ApiScheduleForCreator,
  ApiScheduleForUser,
  ApiSettlement,
  ApiTicket
} from "../services/movieService";
import { Movie, CookieHistory, UserReview, Creator, Settlement } from "../data/mockData";

// ─── 실제 API 훅 ──────────────────────────────────────────────────────────────

/** 현재 상영 중인 영화 목록 */
export function useMovies() {
  const [movies, setMovies] = useState<ApiMovieCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getOnAirMovies()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  return { movies, loading };
}

/** 상영 예정 영화 목록 */
export function useUpcomingMovies() {
  const [movies, setMovies] = useState<ApiScheduledMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getScheduledMovies()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  return { movies, loading };
}

/** 전체 공개 영화 목록 */
export function useAllPublicMovies() {
  const [movies, setMovies] = useState<ApiMovieCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getAllPublicMovies()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  return { movies, loading };
}

/** 영화 제목 검색 */
export function useSearchMovies(title: string) {
  const [movies, setMovies] = useState<ApiMovieCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!title) {
      setMovies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    movieService.searchMovies(title)
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [title]);

  return { movies, loading };
}

/** 영화 상세 (상영일정 + 리뷰 포함) */
export function useMovieDetail(id: string | undefined) {
  const [movie, setMovie] = useState<ApiMovieDetail | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!id || isNaN(Number(id))) return;
    setLoading(true);
    movieService.getMovieDetail(Number(id))
      .then(setMovie)
      .catch(() => setMovie(undefined))
      .finally(() => setLoading(false));
  }, [id, refreshKey]);

  return { movie, setMovie, loading, refetch: () => setRefreshKey(prev => prev + 1) };
}

/** 특정 크리에이터의 공개 영화 목록 (사용자용) */
export function usePublicMoviesByCreatorId(creatorId: string | undefined) {
  const [movies, setMovies] = useState<ApiMovieByCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creatorId) {
      setMovies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    movieService.getPublicMoviesByCreatorId(creatorId)
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [creatorId]);

  return { movies, loading };
}

/** 전체 카테고리 목록 */
export function useCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

/** 특정 영화의 상영 일정 목록 */
export function useSchedulesByMovieId(movieId: number | undefined) {
  const [schedules, setSchedules] = useState<ApiScheduleForUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    movieService.getSchedulesByMovieId(movieId)
      .then(setSchedules)
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [movieId]);

  return { schedules, loading };
}

/** 장르별 영화 목록 */
export function useMoviesByGenre(categoryId: number | null) {
  const [movies, setMovies] = useState<ApiMovieCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryId === null) {
      setMovies([]);
      return;
    }
    setLoading(true);
    movieService.getMoviesByGenre(categoryId)
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  return { movies, loading };
}

/** 크리에이터 - 내 영화 전체 목록 */
export function useCreatorMovieList() {
  const [movies, setMovies] = useState<ApiMovieForCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getCreatorMovieList()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  return { movies, setMovies, loading };
}

/** 크리에이터 - 스케줄 등록 가능한 공개 영화 목록 */
export function useSchedulableMovies() {
  const [movies, setMovies] = useState<ApiMovieForSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMovies = () => {
    setLoading(true);
    movieService.getSchedulableMovies()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMovies();
  }, [refreshKey]);

  return { movies, loading, refetch: () => setRefreshKey(prev => prev + 1) };
}

/** 크리에이터 - 날짜별 임시+확정 스케줄 목록 */
export function useDraftSchedules(date: string | undefined) {
  const [schedules, setSchedules] = useState<ApiDraftSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSchedules = () => {
    if (!date) {
      setSchedules([]);
      return;
    }
    setLoading(true);
    movieService.getDraftSchedules(date)
      .then(setSchedules)
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedules();
  }, [date, refreshKey]);

  return { schedules, setSchedules, loading, refetch: () => setRefreshKey(prev => prev + 1) };
}

/** 크리에이터 - 날짜별 확정 스케줄 목록 */
export function useConfirmedSchedules(date: string | undefined) {
  const [schedules, setSchedules] = useState<ApiScheduleForCreator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) {
      setSchedules([]);
      return;
    }
    setLoading(true);
    movieService.getConfirmedSchedules(date)
      .then(setSchedules)
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [date]);

  return { schedules, loading };
}

// ─── Mock 훅 (백엔드 미구현) ─────────────────────────────────────────────────

import { ticketService } from "../services/ticketService";
import { paymentService } from "../services/paymentService";
import { reviewService } from "../services/reviewService";
import { cookieLogService } from "../services/movieService";

export function useMyPageData() {
  const [watchedMovies, setWatchedMovies] = useState<any[]>([]);
  const [cookieHistory, setCookieHistory] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ticketsResult, cookieLogs, reviewsRes, allMovies] = await Promise.all([
        ticketService.getMyTickets(0, 100),
        cookieLogService.getMyCookieLogs(),
        reviewService.getMyReviews(),
        movieService.getAllPublicMovies()
      ]);

      // 1. 시청 기록 (상영 종료된 CONFIRMED 티켓)
      const watched = ticketsResult.content
        .filter(t => new Date(t.endTime) < new Date())
        .map(t => {
          const movie = allMovies.find(m => m.movieId === t.movieId);
          return {
            id: t.movieId,
            title: movie?.title || `영화 #${t.movieId}`,
            poster: movie ? (getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)) : "",
          };
        });
      setWatchedMovies(watched);

      // 2. 쿠키 사용 내역 (cookie-logs API)
      const combinedHistory = cookieLogs.map(log => {
        const isTicket = log.ticketId != null;
        const isRefund = log.refundId != null;
        const isPayment = log.paymentId != null;

        let movieTitle = "쿠키 충전";
        let type = "charge";
        let status = "충전";

        if (isTicket) {
          const ticket = ticketsResult.content.find(t => t.ticketId === log.ticketId);
          const movie = ticket ? allMovies.find(m => m.movieId === ticket.movieId) : null;
          movieTitle = movie?.title || (ticket ? `영화 #${ticket.movieId}` : "티켓");
          type = log.amount < 0 ? "usage" : "refund";
          status = log.amount < 0 ? "사용" : "환불";
        } else if (isRefund) {
          movieTitle = "쿠키 환불";
          type = "refund";
          status = "환불";
        } else if (isPayment) {
          movieTitle = "쿠키 충전";
          type = "charge";
          status = "충전";
        }

        return {
          id: `log-${log.id}`,
          movieTitle,
          amount: Math.abs(log.amount),
          date: new Date(log.createAt).toLocaleDateString(),
          playDate: "-",
          status,
          type,
          timestamp: new Date(log.createAt).getTime(),
        };
      });

      setCookieHistory(combinedHistory);

      // 3. 리뷰 관리
      const enrichedReviews = (reviewsRes.content || []).map((r: any) => {
        const movie = allMovies.find(m => m.movieId === r.movieId);
        return {
          ...r,
          id: r.reviewId, // For UI consistency
          movieTitle: movie ? movie.title : `영화 #${r.movieId}`,
          date: new Date(r.updatedAt || r.createdAt || new Date()).toLocaleDateString(),
          content: r.comment
        };
      });
      setUserReviews(enrichedReviews);

    } catch (error) {
      console.error("Failed to fetch MyPage data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return { watchedMovies, cookieHistory, setCookieHistory, userReviews, loading, refresh: fetchAllData };
}

/** 사용자 - 내 티켓 목록 */
export function useUserTickets() {
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getUserTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  return { tickets, loading };
}

/** 크리에이터 - 정산 내역 및 요청 */
export function useSettlements() {
  const [settlements, setSettlements] = useState<ApiSettlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    movieService.getSettlements()
      .then(setSettlements)
      .catch(() => setSettlements([]))
      .finally(() => setLoading(false));
  }, []);

  return { settlements, setSettlements, loading, refetch: () => movieService.getSettlements().then(setSettlements) };
}

/** 크리에이터 프로필 (공개 API 없음 - creator 정보는 mock, 영화/일정은 실제) */
export function useCreatorProfile(creatorId: string | undefined, date: string | undefined) {
  const [creator, setCreator] = useState<Creator | undefined>(undefined);
  const [movies, setMovies] = useState<ApiMovieByCreator[]>([]);
  const [schedules, setSchedules] = useState<ApiScheduleForCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creatorId) return;
    setLoading(true);

    // 1. 크리에이터의 공개 영화 목록 먼저 조회
    movieService.getPublicMoviesByCreatorId(creatorId)
      .then(async (mvList) => {
        setMovies(mvList);

        if (mvList.length > 0) {
          // 2. 첫 번째 영화의 상세 정보를 가져와서 크리에이터 닉네임 확보
          try {
            const detail = await movieService.getMovieDetail(mvList[0].movieId);
            setCreator({
              id: isNaN(Number(creatorId)) ? 0 : Number(creatorId),
              name: detail.nickname,
              nickname: detail.nickname,
              bio: "",
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorId}`,
              followers: "0",
              tags: []
            });
          } catch {
            setCreator({
              id: 0,
              name: `크리에이터`,
              nickname: `크리에이터`,
              followers: "0",
              tags: []
            });
          }
        } else {
          setCreator({
            id: 0,
            name: `크리에이터`,
            nickname: `크리에이터`,
            followers: "0",
            tags: []
          });
        }
      })
      .catch(() => {
        setMovies([]);
        setCreator(undefined);
      })
      .finally(() => setLoading(false));
  }, [creatorId]);

  useEffect(() => {
    if (!creatorId || !date) {
      setSchedules([]);
      return;
    }

    movieService.getConfirmedSchedulesByCreator(creatorId, date)
      .then(list => {
        const now = new Date();
        const inferred = list.map(s => {
          const start = new Date(s.startTime);
          const end = new Date(s.endTime);

          let status = s.status;
          if (!status) {
            if (now < start) status = "SCHEDULED";
            else if (now >= start && now < end) status = "ON_AIR";
            else status = "COMPLETED";
          }

          return { ...s, status };
        });
        inferred.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setSchedules(inferred);
      })
      .catch(() => setSchedules([]));
  }, [creatorId, date]);

  return { creator, movies, schedules, loading };
}

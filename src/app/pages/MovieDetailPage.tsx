import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Star, Clock, Cookie, User, Calendar, ShoppingCart, Loader2, Ticket, RefreshCw, Heart } from "lucide-react";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { Header } from "../components/ui/header";

import { useMovieDetail, useCategories } from "../hooks/useMovies";
import { useUser } from "../contexts/UserContext";
import { useMyTickets } from "../hooks/useTickets";
import { getPlaceholderPoster, getImageUrl, likeService } from "../services/movieService";
import { cartService, ticketService, MovieScheduleResponse } from "../services/ticketService";
import { reviewService } from "../services/reviewService";
import { TicketingQueueModal } from "../components/ticketing/TicketingQueueModal";

export function MovieDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { movie, setMovie, loading: movieLoading, refetch: refetchMovie } = useMovieDetail(id);
  const { categories, loading: categoriesLoading } = useCategories();
  const { tickets, loading: ticketsLoading, fetchTickets: refetchTickets } = useMyTickets(0, 100);
  
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState("");

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editReviewRating, setEditReviewRating] = useState(0);
  const [editReviewText, setEditReviewText] = useState("");

  const [schedules, setSchedules] = useState<MovieScheduleResponse[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [modalScheduleId, setModalScheduleId] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const { user: userInfo, refreshUser: refetchUserMe } = useUser();

  const purchasedSchedules = tickets.filter(t => t.status === "CONFIRMED").map(t => t.scheduleId);

  const movieIdNum = movie?.movieId;
  const fetchSchedules = useCallback(async () => {
    if (!userInfo || movieIdNum == null) return;
    setSchedulesLoading(true);
    try {
      const list = await ticketService.listSchedulesByMovieId(movieIdNum);
      setSchedules(list);
    } catch {
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }, [userInfo, movieIdNum]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (movie) setLiked(likeService.isLiked(movie.movieId));
  }, [movie]);

  const handleLike = async () => {
    if (!movie || likeLoading) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await likeService.unlike(movie.movieId);
        setLiked(false);
        toast.success("좋아요를 취소했습니다.");
      } else {
        await likeService.like(movie.movieId, movie.title, movie.imageUrl);
        setLiked(true);
        toast.success("좋아요를 눌렀습니다.");
      }
    } catch {
      toast.error("잠시 후 다시 시도해주세요.");
    } finally {
      setLikeLoading(false);
    }
  };

  if ((movieLoading && !movie) || (ticketsLoading && tickets.length === 0) || (categoriesLoading && categories.length === 0)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <h2 className="text-2xl font-bold mb-4">영화 정보를 찾을 수 없습니다.</h2>
        <Button onClick={() => navigate(-1)}>뒤로 가기</Button>
      </div>
    );
  }

  const handleCreateReview = async () => {
    if (!newReviewRating) {
      toast.error("별점을 선택해주세요.");
      return;
    }
    if (!newReviewText.trim()) {
      toast.error("리뷰 내용을 입력해주세요.");
      return;
    }
    const movieTicket = tickets.find(t => t.movieId === movie.movieId && t.status === "CONFIRMED");
    if (!movieTicket) {
      toast.error("해당 영화의 구매 이력이 없습니다.");
      return;
    }
    try {
      const newReviewData = await reviewService.createReview(movie.movieId, newReviewRating, newReviewText);
      toast.success("리뷰가 등록되었습니다.");
      
      setMovie(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: [
            {
              reviewId: newReviewData.reviewId,
              nickname: userInfo?.nickname || "나",
              rating: newReviewRating,
              comment: newReviewText,
              updatedAt: new Date().toISOString(),
              status: "ACTIVE"
            },
            ...prev.reviews
          ]
        };
      });

      setNewReviewRating(0);
      setNewReviewText("");
      // We still refetch in the background to ensure consistency
      refetchMovie();
    } catch {
      toast.error("리뷰 등록에 실패했습니다.");
    }
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId) return;
    try {
      await reviewService.updateReview(editingReviewId, editReviewRating, editReviewText);
      toast.success("리뷰가 수정되었습니다.");
      
      setMovie(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map(r => 
            r.reviewId === editingReviewId 
              ? { ...r, rating: editReviewRating, comment: editReviewText, updatedAt: new Date().toISOString() } 
              : r
          )
        };
      });

      setEditingReviewId(null);
      refetchMovie();
    } catch {
      toast.error("리뷰 수정에 실패했습니다.");
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await reviewService.deleteReview(reviewId);
      toast.success("리뷰가 삭제되었습니다.");
      
      setMovie(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.filter(r => r.reviewId !== reviewId)
        };
      });

      if (editingReviewId === reviewId) setEditingReviewId(null);
      refetchMovie();
    } catch {
      toast.error("리뷰 삭제에 실패했습니다.");
    }
  };

  const startEditReview = (review: any) => {
    setEditingReviewId(review.reviewId);
    setEditReviewRating(review.rating);
    setEditReviewText(review.comment);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
  };

  const handleAddToCart = async (scheduleId: number) => {
    try {
      await cartService.addCartItem(scheduleId);
      toast.success("장바구니에 담았습니다!", { icon: "🛒", action: { label: "장바구니 보기", onClick: () => navigate("/cart") } });
      window.dispatchEvent(new CustomEvent("cart-updated"));
      fetchSchedules();
    } catch (error: any) {
      const msg = error.response?.data?.message || "장바구니 담기에 실패했습니다.";
      toast.error(msg);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header title="영화 상세" showBackButton />

      <main className="container mx-auto px-6 py-8">
        {/* Movie Info */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <img
              src={getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)}
              alt={movie.title}
              className="w-full rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] transition-transform duration-500"
            />
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h1 className={`text-4xl font-black mb-2 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{movie.title}</h1>
              <div className={`flex items-center gap-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <div 
                  className={`flex items-center gap-1 font-medium cursor-pointer transition-colors hover:text-purple-500`}
                  onClick={() => navigate(`/creator/${movie.creatorId}`)}
                >
                  <User className="w-4 h-4" />
                  <span>{movie.nickname}</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor(movie.runningTime / 60)}분</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 border-none" />
                  <span className={isDark ? "text-white" : "text-slate-900"}>
                    {movie.averageRating != null ? movie.averageRating.toFixed(1) : "-"}
                  </span>
                </div>
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`flex items-center transition-colors ${liked ? "text-pink-500" : "hover:text-pink-400"}`}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.categoryIds.map(catId => {
                  const category = categories.find(c => c.categoryId === catId);
                  return (
                    <Badge 
                      key={catId} 
                      variant="secondary" 
                      className={`px-3 py-1 font-bold ${isDark ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-600 border-purple-100"}`}
                    >
                      {category ? category.name : "기타"}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <p className={`text-lg leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600 font-medium"}`}>
              {movie.description || "상세 설명이 준비 중입니다."}
            </p>

            <div className="flex items-center gap-4 pt-2">
              <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-purple-100 shadow-sm"}`}>
                <Cookie className="w-6 h-6 text-amber-400" />
                <span className={`text-xl font-black ${isDark ? "text-white" : "text-purple-600"}`}>{movie.cookie} <span className="text-sm font-bold opacity-70">쿠키</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedules */}
        <Card className={`border-none shadow-xl mb-8 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <CardHeader className="border-b border-slate-800/10 flex flex-row items-center justify-between">
            <CardTitle className={`flex items-center gap-2 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              <Calendar className="w-6 h-6 text-purple-500" />
              상영 일정
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSchedules}
              disabled={schedulesLoading || !userInfo}
              className="gap-1.5"
            >
              <RefreshCw className={cn("w-4 h-4", schedulesLoading && "animate-spin")} />
              새로고침
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {!userInfo ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Ticket className="w-10 h-10 text-muted-foreground/50" />
                <p className={`text-base font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  로그인하고 진행 중인 회차를 확인하세요
                </p>
                <Button onClick={() => navigate("/login")} className="bg-purple-600 hover:bg-purple-700 text-white">
                  로그인하기
                </Button>
              </div>
            ) : schedulesLoading && schedules.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (() => {
              const visible = schedules.filter(s => s.status !== "STREAMING" || purchasedSchedules.includes(s.scheduleId));
              if (visible.length === 0) {
                return (
                  <p className={`text-center py-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}>현재 예정된 상영 일정이 없습니다.</p>
                );
              }
              return (
                <div className="grid md:grid-cols-2 gap-4">
                  {visible.map((schedule) => {
                    const isPurchased = purchasedSchedules.includes(schedule.scheduleId);
                    const startDate = new Date(schedule.startTime);
                    const isTicketing = schedule.status === "TICKETING";
                    const soldOut = isTicketing && (schedule.availableSeats ?? 0) === 0;
                    return (
                      <div
                        key={schedule.scheduleId}
                        className={`p-5 rounded-2xl flex items-center justify-between transition-all border ${
                          soldOut
                            ? (isDark ? "bg-slate-800/20 border-slate-800 opacity-60" : "bg-slate-50 border-slate-100 opacity-60")
                            : isDark
                              ? "bg-slate-800/50 border-slate-800 hover:bg-slate-800 hover:border-purple-500/50"
                              : "bg-slate-50 border-slate-100 hover:bg-purple-50 hover:border-purple-200 shadow-sm"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                            {startDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}{" "}
                            <span className="text-purple-500">
                              {startDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {schedule.status === "STREAMING" && (
                              <Badge className="ml-2 bg-green-600 text-white text-[10px]">상영 중</Badge>
                            )}
                            {soldOut && (
                              <Badge variant="destructive" className="ml-2 text-[10px]">매진</Badge>
                            )}
                          </div>
                          <div className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {isTicketing && schedule.availableSeats != null ? (
                              <>잔여 좌석 <span className="text-purple-500">{schedule.availableSeats}</span>석 / 총 {schedule.totalSeats}석</>
                            ) : (
                              <>총 좌석 {schedule.totalSeats}석</>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {isPurchased ? (
                            <Button
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl"
                              onClick={() => navigate(`/theater/${schedule.scheduleId}`)}
                            >
                              입장하기
                            </Button>
                          ) : schedule.status === "CART" ? (
                            <Button
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 rounded-xl shadow-lg shadow-purple-500/20 gap-2"
                              onClick={() => handleAddToCart(schedule.scheduleId)}
                            >
                              <ShoppingCart className="w-4 h-4" />
                              장바구니
                            </Button>
                          ) : schedule.status === "IN_PROGRESSING" ? (
                            <Button
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 rounded-xl shadow-lg shadow-amber-500/20"
                              onClick={() => navigate("/cart")}
                            >
                              결제하러 가기
                            </Button>
                          ) : isTicketing ? (
                            <Button
                              disabled={soldOut}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-purple-500/20"
                              onClick={() => setModalScheduleId(schedule.scheduleId)}
                            >
                              {soldOut ? "매진" : "티켓팅 입장"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Review Form */}
        <Card className={`border-none shadow-xl mb-8 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <CardTitle className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>리뷰 작성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewReviewRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= newReviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : (isDark ? "text-slate-700" : "text-slate-200")
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="영화에 대한 솔직한 리뷰를 남겨주세요..."
                className={`min-h-[120px] rounded-2xl p-5 text-lg transition-colors ${
                  isDark 
                    ? "bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500" 
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500"
                }`}
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button onClick={handleCreateReview} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-10 rounded-xl shadow-lg shadow-purple-500/20">
                리뷰 등록
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review List */}
        <Card className={`border-none shadow-xl transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <CardHeader className="border-b border-slate-800/10">
            <CardTitle className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>관람 리뷰</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {movie.reviews.length === 0 ? (
              <p className={`text-center py-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}>아직 등록된 리뷰가 없습니다.</p>
            ) : (
              movie.reviews.map((review) => {
                const isMyReview = review.nickname === userInfo?.nickname;
                const isEditing = editingReviewId === review.reviewId;

                return (
                  <div key={review.reviewId} className={`p-6 rounded-2xl border transition-colors ${isDark ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setEditReviewRating(star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star className={`w-6 h-6 ${star <= editReviewRating ? "fill-yellow-400 text-yellow-400" : (isDark ? "text-slate-600" : "text-slate-300")}`} />
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={editReviewText}
                          onChange={(e) => setEditReviewText(e.target.value)}
                          className={`min-h-[100px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                        />
                        <div className="flex justify-end gap-2">
                          <Button onClick={cancelEditReview} variant="outline" size="sm">취소</Button>
                          <Button onClick={handleUpdateReview} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">저장</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{review.nickname}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : (isDark ? "text-slate-700" : "text-slate-200")}`} />
                            ))}
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {new Date((review as any).updatedAt || (review as any).createdAt || new Date()).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <div className="flex items-end justify-between gap-4">
                        <p className={`text-lg leading-relaxed flex-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{review.comment}</p>
                        {isMyReview && (
                          <div className="flex gap-1 shrink-0 -mr-2 mb-[-4px]">
                            <Button size="sm" variant="ghost" onClick={() => startEditReview(review)} className={`font-bold h-8 px-2 ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                              수정
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteReview(review.reviewId)} className="font-bold text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2">
                              삭제
                            </Button>
                          </div>
                        )}
                      </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>

      <TicketingQueueModal
        scheduleId={modalScheduleId}
        scheduleTitle={movie.title}
        open={modalScheduleId != null}
        onClose={() => setModalScheduleId(null)}
        onPurchaseSuccess={() => {
          fetchSchedules();
          refetchTickets();
          refetchUserMe();
        }}
      />
    </div>
  );
}
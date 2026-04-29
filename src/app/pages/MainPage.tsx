import { useTheme } from "next-themes";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { User, Cookie, LogOut, Sparkles, Video } from "lucide-react";
import { Header } from "../components/ui/header";
import { useMovies, useUpcomingMovies, useAllPublicMovies } from "../hooks/useMovies";
import { useUser } from "../contexts/UserContext";
import { authService, creatorTokenStorage } from "../services/authService";
import { getPlaceholderPoster, getImageUrl, movieService, ApiMovieDetail } from "../services/movieService";
import { RecommendedMoviesSection } from "../components/RecommendedMoviesSection";
import { toast } from "sonner";

export function MainPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { movies, loading: moviesLoading } = useMovies();
  const { movies: upcomingMovies, loading: upcomingLoading } = useUpcomingMovies();
  const { movies: allMovies } = useAllPublicMovies();
  const { user, refreshUser } = useUser();
  const isCreator = !!creatorTokenStorage.getAccessToken();
  const isDark = theme === "dark";

  const [topMovieDetail, setTopMovieDetail] = useState<ApiMovieDetail | null>(null);

  useEffect(() => {
    if (allMovies.length === 0) return;
    const top = [...allMovies]
      .filter((m) => m.averageRating !== null)
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))[0]
      ?? allMovies[0];
    movieService.getMovieDetail(top.movieId)
      .then(setTopMovieDetail)
      .catch(() => null);
  }, [allMovies]);

  const handleLogout = async () => {
    if (isCreator) {
      await authService.creatorLogout();
    } else {
      await authService.logout();
    }
    toast.success("로그아웃 되었습니다.");
    await refreshUser(); // 전역 유저 정보 초기화
    navigate("/");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header
        rightElement={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/mypage")}
              className={`transition-colors rounded-full ${isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              <User className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className={`transition-colors rounded-full ${isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        }
      >
        <nav className="hidden md:flex gap-6 ml-4">
          <Button
            variant="ghost"
            className={`hover:text-purple-400 transition-colors ${isDark ? "text-white" : "text-slate-700"}`}
            onClick={() => navigate("/all-movies")}
          >
            모든 영화
          </Button>
        </nav>
      </Header>

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        {topMovieDetail && (
          <section className="mb-12 relative rounded-3xl overflow-hidden aspect-[21/9] flex items-center shadow-2xl group">
            <img
              src={getImageUrl(topMovieDetail.imageUrl) || getPlaceholderPoster(topMovieDetail.movieId)}
              alt={topMovieDetail.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
            <div className="relative z-10 px-12 max-w-2xl">
              <Badge className="mb-4 bg-purple-600 text-white border-none px-3 py-1">지금 가장 핫한 영화</Badge>
              <h2 className="text-6xl font-black text-white mb-4 tracking-tighter">{topMovieDetail.title}</h2>
              {topMovieDetail.description && (
                <p className="text-slate-200 text-lg mb-8 leading-relaxed line-clamp-2">
                  {topMovieDetail.description}
                </p>
              )}
              <div className="flex gap-4">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 h-14 px-8 text-lg font-bold text-white shadow-xl shadow-purple-900/20 transition-transform active:scale-95" onClick={() => navigate(`/movie/${topMovieDetail.movieId}`)}>
                  관람하기
                </Button>
                <Button size="lg" variant="ghost" className="h-14 px-8 text-lg font-bold border border-white/40 text-white hover:bg-white/10 backdrop-blur-md transition-all active:scale-95" onClick={() => navigate(`/movie/${topMovieDetail.movieId}`)}>
                  정보 보기
                </Button>
              </div>
            </div>
          </section>
        )}

        <RecommendedMoviesSection />

        {/* Now Showing Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h3 className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>현재 상영 중인 영화</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {moviesLoading ? (
               Array(6).fill(0).map((_, i) => (
                 <div key={i} className="aspect-[2/3] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl" />
               ))
            ) : (
              movies.map((movie) => (
                <Card
                  key={movie.movieId}
                  className={`group cursor-pointer border-none transition-all duration-300 hover:-translate-y-2 bg-transparent shadow-none`}
                  onClick={() => navigate(`/movie/${movie.movieId}`)}
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-purple-500/20">
                    <img
                      src={getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Button className={`w-full font-bold shadow-lg ${isDark ? "bg-white text-slate-950 hover:bg-slate-200" : "bg-purple-600 text-white hover:bg-purple-700"}`}>
                        티켓 예매
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg truncate mb-1 transition-colors group-hover:text-purple-500 ${isDark ? "text-white" : "text-slate-900"}`}>{movie.title}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{movie.nickname}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 font-bold">★</span>
                        <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                          {movie.averageRating != null ? movie.averageRating.toFixed(1) : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Upcoming Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-500" />
              <h3 className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>상영 예정작</h3>
            </div>
            <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-400">
              달력 보기
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingLoading ? (
               Array(4).fill(0).map((_, i) => (
                 <div key={i} className="h-32 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl" />
               ))
            ) : (
              upcomingMovies.map((movie) => (
                <Card
                  key={movie.movieId}
                  className={`overflow-hidden border-none transition-all duration-300 hover:shadow-xl ${isDark ? "bg-slate-900" : "bg-white shadow-md border-slate-100 hover:border-purple-200"}`}
                  onClick={() => navigate(`/movie/${movie.movieId}`)}
                >
                  <div className="flex h-32">
                    <div className="w-24 shrink-0">
                      <img
                        src={getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getPlaceholderPoster(movie.movieId);
                          if (target.src !== fallback) target.src = fallback;
                        }}
                      />
                    </div>
                    <CardContent className="p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className={`font-bold truncate mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{movie.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{movie.nickname}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] h-5 border-purple-500/30 text-purple-500">상영 예정</Badge>
                          <span className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            {new Date(movie.startTime).toLocaleDateString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
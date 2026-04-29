import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Calendar } from "../components/ui/calendar";
import { ArrowLeft, Film, Star, Eye, Calendar as CalendarIcon, Plus, Sun, Moon } from "lucide-react";
import { Header } from "../components/ui/header";
import { movieService, getPlaceholderPoster, getImageUrl } from "../services/movieService";
import { Creator } from "../data/mockData";
import { useCreatorProfile, useCategories, useUserTickets } from "../hooks/useMovies";

export function CreatorProfilePage() {
  const navigate = useNavigate();
  const { creatorId } = useParams();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [date, setDate] = useState<Date | undefined>(new Date());

  const dateString = date ? format(date, "yyyy-MM-dd") : undefined;
  const { categories: allCategories } = useCategories();
  const { creator, movies, schedules, loading } = useCreatorProfile(creatorId, dateString);
  const { tickets } = useUserTickets();

  if (loading && !creator) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <h2 className="text-2xl font-bold mb-4">크리에이터를 찾을 수 없습니다.</h2>
        <Button onClick={() => navigate("/search")}>검색 페이지로 이동</Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header title="크리에이터 프로필" showBackButton backUrl="/search" />

      <main className="container mx-auto px-6 py-8 max-w-[1200px]">
        {/* Creator Profile Header */}
        <div className={`border rounded-2xl p-8 mb-8 shadow-xl transition-colors duration-300 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-800" : "bg-gradient-to-br from-white via-purple-50/50 to-white border-slate-200"}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-3">
                <h1 className={`text-4xl font-extrabold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                  {creator.nickname || creator.name}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Filmography Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-2xl font-bold transition-colors mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>필모그래피</h2>
              <p className={`transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>모든 작품을 한눈에 확인하세요</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <Card
                key={movie.movieId}
                className={`cursor-pointer hover:border-purple-500 transition-all overflow-hidden group shadow-sm hover:shadow-md hover:-translate-y-1 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                onClick={() => navigate(`/movie/${movie.movieId}`)}
              >
                <div className="aspect-[2/3] relative overflow-hidden">
                  <img
                    src={getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = getPlaceholderPoster(movie.movieId); }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="absolute top-2 right-2">
                    <Badge className="bg-slate-900/80 backdrop-blur-md shadow-md text-yellow-400 border border-slate-700">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400" /> {movie.averageRating != null ? movie.averageRating.toFixed(1) : "-"}
                    </Badge>
                  </div>
                </div>
                <CardContent className={`p-4 transition-colors ${isDark ? "bg-slate-900" : "bg-white"}`}>
                  <h3 className={`font-bold mb-1 truncate transition-colors group-hover:text-purple-500 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {movie.title}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {movie.categoryIds.slice(0, 3).map(id => {
                      const cat = allCategories.find(c => c.categoryId === id);
                      return (
                        <Badge key={id} variant="outline" className={`transition-colors text-[10px] ${isDark ? "text-purple-400 border-purple-400/50 bg-purple-400/10" : "text-purple-600 border-purple-200 bg-purple-50"}`}>
                          {cat ? cat.name : `#${id}`}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Schedule Section */}
        <div>
          <div className="mb-6">
            <h2 className={`text-2xl font-bold transition-colors mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>상영 일정</h2>
            <p className={`transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>관람을 원하는 날짜를 선택해주세요</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Column: Audience Calendar */}
            <div className="w-full lg:w-[350px] shrink-0 space-y-6">
              <Card className={`border shadow-sm transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <CardHeader className={`pb-3 border-b transition-colors ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <CardTitle className={`flex items-center gap-2 text-xl font-bold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                    <CalendarIcon className="w-5 h-5 text-purple-500" />
                    상영 일정 보기
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ko}
                    className={`rounded-md w-full scale-100 p-0 transition-colors ${isDark ? "text-slate-200 bg-transparent" : "text-slate-800 bg-transparent"}`}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Selected Schedule */}
            <div className="flex-1 w-full min-w-0">
              {date ? (
                <div className="animate-in slide-in-from-bottom-2">
                  <div className="mb-6">
                    <h3 className={`text-xl font-bold transition-colors mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                      {format(date, "M월 d일 (E)", { locale: ko })} 스케줄
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {schedules.length === 0 ? (
                      <div className={`p-12 text-center rounded-xl border border-dashed ${isDark ? "bg-slate-900/30 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                        해당 날짜에 예정된 확정 일정이 없습니다.
                      </div>
                    ) : (
                      schedules.map((schedule) => {
                        const start = new Date(schedule.startTime);
                        const end = new Date(schedule.endTime);
                        
                        // 현재 사용자가 해당 일정의 티켓을 가지고 있는지 확인
                        const hasTicket = tickets.some((t: any) => t.scheduleId === schedule.scheduleId);
                        
                        // 버튼 텍스트 및 상태 결정
                        let buttonText = "";
                        if (hasTicket) {
                          buttonText = "입장하기";
                        } else if (schedule.status === "ON_AIR") {
                          buttonText = "구매하기";
                        } else if (schedule.status === "SCHEDULED" || schedule.status === "WAITING") {
                          buttonText = "예매하기";
                        }

                        return (
                          <Card 
                            key={schedule.scheduleId}
                            className={`overflow-hidden border shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-purple-500/50 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                            onClick={() => navigate(`/theater/${schedule.scheduleId}`)}
                          >
                            <div className="flex flex-col sm:flex-row items-center">
                              <CardContent className="p-5 flex-1 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                  <Badge className="mb-2 bg-purple-500/10 text-purple-500 border-none font-bold">
                                    {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                  </Badge>
                                  <h3 className={`font-bold text-lg mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{schedule.title}</h3>
                                  <div className={`text-sm flex items-center gap-2 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    <span>좌석 현황: <b className="text-purple-500">{(schedule as any).remainingSeats || 0}</b> / {(schedule as any).totalSeats || 50}</span>
                                    {schedule.status === "COMPLETED" && (
                                      <Badge variant="outline" className="ml-2 text-slate-500 border-slate-300">상영 종료</Badge>
                                    )}
                                  </div>
                                </div>
                                {buttonText && (
                                  <Button className={`w-full sm:w-auto font-bold shadow-lg px-8 h-11 rounded-xl ${
                                    hasTicket ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20" : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20"
                                  }`}>
                                    {buttonText}
                                  </Button>
                                )}
                              </CardContent>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed transition-colors h-[380px] ${isDark ? "bg-slate-900/50 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                  <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-bold mb-2">날짜를 선택해주세요</p>
                  <p className="text-sm">좌측 달력에서 날짜를 선택하시면<br />해당일의 예매 가능한 상영 일정을 볼 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

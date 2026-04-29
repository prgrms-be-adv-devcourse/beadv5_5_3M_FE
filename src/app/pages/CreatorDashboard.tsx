import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar } from "../components/ui/calendar";
import { Switch } from "../components/ui/switch";
import { Film, Upload, LayoutDashboard, BarChart3, Calendar as CalendarIcon, DollarSign, Clock, LogOut } from "lucide-react";
import { Header } from "../components/ui/header";
import { toast } from "sonner";
import { authService } from "../services/authService";
import creatorApiClient from "../services/creatorApiClient";
import { movieService, getImageUrl, getPlaceholderPoster } from "../services/movieService";

import { useCreatorMovieList, useSettlements, useDraftSchedules, useSchedulableMovies } from "../hooks/useMovies";

export function CreatorDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { movies, setMovies, loading: moviesLoading } = useCreatorMovieList();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [wallet, setWallet] = useState(0);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedStartDatetime, setSelectedStartDatetime] = useState("");
  const [selectedTicketingDatetime, setSelectedTicketingDatetime] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);

  // 날짜를 yyyy-MM-dd 문자열로 변환
  const dateString = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : undefined;

  const { schedules, setSchedules, refetch: refetchDraftSchedules } = useDraftSchedules(dateString);
  const { movies: schedulableMovies, refetch: refetchSchedulableMovies } = useSchedulableMovies();

  useEffect(() => {
    movieService.getWalletBalance()
      .then(setWallet)
      .catch((error) => console.error("지갑 잔액 로드 실패:", error));
      
    movieService.getSettlements()
      .then(setSettlements)
      .catch((error) => console.error("정산 내역 로드 실패:", error));
  }, []);

  const handleLogout = async () => {
    await authService.creatorLogout();
    toast.success("로그아웃 되었습니다.");
    navigate("/creator/login");
  };

  const toggleMovieVisibility = async (movieId: number, currentVisibility: "PUBLIC" | "PRIVATE") => {
    const next = currentVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    try {
      await movieService.updateMovieVisibility(movieId, next);
      setMovies(prev => prev.map(m => m.movieId === movieId ? { ...m, visibility: next } : m));
      toast.success("영화 공개 상태가 변경되었습니다.");
      refetchSchedulableMovies();
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDeleteMovie = async (movieId: number) => {
    try {
      await movieService.deleteCreatorMovie(movieId);
      setMovies(prev => prev.filter(m => m.movieId !== movieId));
      toast.success("영화가 삭제되었습니다.");
      refetchSchedulableMovies();
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleSelectSchedule = (id: number) => {
    setSelectedSchedules(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSchedules.length === schedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(schedules.filter(s => !s.isConfirmed).map(s => s.scheduleId));
    }
  };

  const handleConfirmSchedules = async () => {
    if (selectedSchedules.length === 0) {
      toast.error("확정할 일정을 선택해주세요.");
      return;
    }
    try {
      await movieService.confirmSchedules(selectedSchedules);
      setSchedules(prev => prev.map(s =>
        selectedSchedules.includes(s.scheduleId) ? { ...s, isConfirmed: true } : s
      ));
      setSelectedSchedules([]);
      toast.success(`${selectedSchedules.length}개의 일정이 확정되었습니다.`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "일정 확정에 실패했습니다.");
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      await movieService.deleteSchedule(scheduleId);
      setSchedules(prev => prev.filter(s => s.scheduleId !== scheduleId));
      toast.success("일정이 삭제되었습니다.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "일정 삭제에 실패했습니다.");
    }
  };

  const handleRegisterSchedule = async () => {
    if (!selectedStartDatetime || !selectedTicketingDatetime || !selectedMovieId) {
      toast.error("영화, 상영 시작 시간, 티켓팅 시작 시간을 모두 선택해주세요.");
      return;
    }
    const movie = schedulableMovies.find(m => m.movieId.toString() === selectedMovieId);
    if (!movie) return;

    const startTime = selectedStartDatetime.length === 16
      ? `${selectedStartDatetime}:00`
      : selectedStartDatetime;
    const ticketingTime = selectedTicketingDatetime.length === 16
      ? `${selectedTicketingDatetime}:00`
      : selectedTicketingDatetime;

    try {
      await movieService.registerSchedule({
        movieId: movie.movieId,
        slots: [{ startTime, ticketingTime }],
      });
      toast.success("일정이 등록되었습니다.");
      setSelectedDate(new Date(startTime));
      refetchDraftSchedules();
      setSelectedStartDatetime("");
      setSelectedTicketingDatetime("");
      setSelectedMovieId("");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "일정 등록에 실패했습니다.");
    }
  };

  const handleRequestSettlement = async () => {
    const amount = Number(settlementAmount);
    if (!amount || amount <= 0) {
      toast.error("금액을 입력해주세요.");
      return;
    }
    if (amount < 50000) {
      toast.error("최소 정산 금액은 50,000원입니다.");
      return;
    }
    if (amount > wallet) {
      toast.error("잔액이 부족합니다.");
      return;
    }
    try {
      await movieService.requestSettlement(amount);
      toast.success("정산 요청이 완료되었습니다.");
      setWallet((prev) => prev - amount);
      setSettlementAmount("");
      
      // Update settlements history
      movieService.getSettlements()
        .then(setSettlements)
        .catch(() => {});
    } catch (e: any) {
      toast.error(e.response?.data?.message || "정산 요청에 실패했습니다.");
    }
  };

  const unconfirmedSchedules = schedules.filter(s => !s.isConfirmed);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header
        title="스튜디오"
        showBackButton
        rightElement={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={`transition-colors rounded-full ${isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        }
      />

      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="text-white/80 mb-1 font-medium">지갑 잔액</div>
                  <div className="text-3xl font-bold text-white truncate">
                    ₩{wallet.toLocaleString()}
                  </div>
                </div>
                <DollarSign className="w-12 h-12 text-white/40 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className={`border shadow-sm transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className={`font-medium mb-1 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>등록 영화</div>
                  <div className={`text-3xl font-bold truncate transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                    {movies.length} / 3
                  </div>
                </div>
                <Film className={`w-12 h-12 shrink-0 transition-colors ${isDark ? "text-slate-700" : "text-slate-300"}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="movies" className="space-y-6">
          <TabsList className={`border rounded-xl p-1 shadow-sm gap-1 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <TabsTrigger value="movies" className={`rounded-lg transition-all ${isDark ? "data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400" : "data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-slate-600"}`}>
              영화 관리
            </TabsTrigger>
            <TabsTrigger value="schedule" className={`rounded-lg transition-all ${isDark ? "data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400" : "data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-slate-600"}`}>
              상영 일정
            </TabsTrigger>
            <TabsTrigger value="settlement" className={`rounded-lg transition-all ${isDark ? "data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400" : "data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-slate-600"}`}>
              정산 관리
            </TabsTrigger>
          </TabsList>

          {/* Movies Management */}
          <TabsContent value="movies" className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-extrabold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>내 영화</h2>
              <Button
                onClick={() => {
                  if (movies.length >= 3) {
                    toast.error("개인별 영상은 최대 3개까지만 등록 가능합니다.");
                  } else {
                    navigate("/creator/movie/new");
                  }
                }}
                className={`transition-colors shadow-sm font-bold ${isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}`}
              >
                <Upload className="w-4 h-4 mr-2" />
                영화 등록
              </Button>
            </div>

            {moviesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-48 animate-pulse rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map((movie) => (
                  <Card key={movie.movieId} className={`border shadow-sm hover:shadow-md transition-all group ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <CardContent className="p-5">
                      <div className="aspect-video rounded-xl mb-5 overflow-hidden">
                        <img
                          src={getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-bold text-lg truncate transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>{movie.title}</h3>
                          <div className="flex items-center gap-2.5 px-0.5 shrink-0">
                            <Switch
                              id={`status-${movie.movieId}`}
                              checked={movie.visibility === "PUBLIC"}
                              onCheckedChange={() => toggleMovieVisibility(movie.movieId, movie.visibility)}
                            />
                            <Label
                              htmlFor={`status-${movie.movieId}`}
                              className={`text-xs font-bold cursor-pointer transition-colors w-10 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {movie.visibility === "PUBLIC" ? "공개" : "비공개"}
                            </Label>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-3 border-t transition-colors ${isDark ? 'border-slate-800' : 'border-slate-100'}">
                          <Button
                            size="sm"
                            variant="outline"
                            className={`flex-1 transition-colors font-semibold ${isDark ? "border-slate-700 hover:bg-slate-800 hover:text-white" : "border-slate-200 hover:bg-slate-50 hover:text-slate-900"}`}
                            onClick={() => navigate("/creator/movie/new", { state: { movieId: movie.movieId } })}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`flex-1 transition-colors font-semibold ${isDark ? "border-red-900/30 text-red-500 hover:bg-red-900/50 hover:text-red-400" : "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"}`}
                            onClick={() => handleDeleteMovie(movie.movieId)}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Schedule Management */}
          <TabsContent value="schedule" className="animate-in slide-in-from-bottom-2 space-y-6">
            {/* 일정 편성 폼 */}
            <Card className={`border shadow-sm transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <CardHeader className={`border-b transition-colors pb-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                <CardTitle className={`flex items-center gap-2 text-xl transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                  <Clock className="w-5 h-5 text-purple-500" />
                  일정 편성
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid lg:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2">
                    <Label className={`font-semibold ${isDark ? "text-white" : "text-slate-700"}`}>상영할 영화 선택</Label>
                    <Select value={selectedMovieId} onValueChange={setSelectedMovieId}>
                      <SelectTrigger className={`h-12 transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                        <SelectValue placeholder="영화를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className={isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white"}>
                        {schedulableMovies.map((movie) => (
                          <SelectItem key={movie.movieId} value={movie.movieId.toString()}>
                            {movie.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={`font-semibold ${isDark ? "text-white" : "text-slate-700"}`}>티켓팅 시작 시간 (상영 2일 이상 전)</Label>
                    <Input
                      type="datetime-local"
                      value={selectedTicketingDatetime}
                      onChange={(e) => setSelectedTicketingDatetime(e.target.value)}
                      className={`h-12 transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`font-semibold ${isDark ? "text-white" : "text-slate-700"}`}>상영 시작 시간</Label>
                    <Input
                      type="datetime-local"
                      value={selectedStartDatetime}
                      onChange={(e) => setSelectedStartDatetime(e.target.value)}
                      className={`h-12 transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleRegisterSchedule}
                  className={`mt-6 w-full h-12 text-base font-bold transition-colors ${isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}`}
                >
                  <Clock className="w-5 h-5 mr-3" />
                  일정 편성 완료하기
                </Button>
              </CardContent>
            </Card>

            {/* 달력 + 해당 날짜 일정 */}
            <Card className={`border shadow-sm transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <CardHeader className={`border-b transition-colors pb-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                <CardTitle className={`flex items-center gap-2 text-xl transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                  <CalendarIcon className="w-5 h-5 text-purple-500" />
                  일정 조회
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid lg:grid-cols-2 gap-10">
                  {/* Left: 달력 */}
                  <div className="flex justify-center lg:justify-start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className={`rounded-xl border shadow-sm p-4 w-full max-w-[350px] transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                    />
                  </div>

                  {/* Right: 해당 날짜 일정 */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <h4 className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {dateString ?? "날짜를 선택하세요"}
                          {dateString && <span className={`ml-2 text-sm font-normal ${isDark ? "text-slate-400" : "text-slate-500"}`}>편성 일정</span>}
                        </h4>
                        {unconfirmedSchedules.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={selectedSchedules.length === unconfirmedSchedules.length}
                              onCheckedChange={handleSelectAll}
                            />
                            <span className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>전체 선택</span>
                          </div>
                        )}
                      </div>
                      {selectedSchedules.length > 0 && (
                        <Button
                          size="sm"
                          onClick={handleConfirmSchedules}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg shadow-lg shadow-emerald-500/20"
                        >
                          선택 일정 확정 ({selectedSchedules.length})
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {schedules.map((item) => (
                        <div
                          key={item.scheduleId}
                          className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isDark
                              ? "bg-slate-800/50 border-slate-700"
                              : "bg-slate-50 border-slate-200"
                            } ${selectedSchedules.includes(item.scheduleId) ? "ring-2 ring-purple-500 border-transparent" : ""}`}
                        >
                          <div className="flex items-center gap-4">
                            {!item.isConfirmed && (
                              <Switch
                                checked={selectedSchedules.includes(item.scheduleId)}
                                onCheckedChange={() => handleSelectSchedule(item.scheduleId)}
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`font-bold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>{item.movieTitle}</div>
                                <Badge className={item.isConfirmed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                                  {item.isConfirmed ? "확정" : "임시"}
                                </Badge>
                              </div>
                              <div className={`text-sm font-medium flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-purple-600"}`}>
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(item.startTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                {" ~ "}
                                {new Date(item.endTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          {!item.isConfirmed && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSchedule(item.scheduleId)}
                              className={`font-bold transition-colors ${isDark ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-red-600 hover:text-red-700 hover:bg-red-50"}`}
                            >
                              취소
                            </Button>
                          )}
                        </div>
                      ))}
                      {schedules.length === 0 && (
                        <p className={`text-center py-8 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          해당 날짜에 편성된 일정이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settlement Management */}
          <TabsContent value="settlement" className="animate-in slide-in-from-bottom-2">
            <div className="space-y-6">
              <Card className={`border shadow-sm transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <CardHeader className={`border-b transition-colors pb-5 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <CardTitle className="flex items-center justify-between">
                    <span className={`text-xl transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>정산 금액 출금 요청</span>
                    <div className="text-2xl font-extrabold text-purple-500">₩{wallet.toLocaleString()}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className={`p-4 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${isDark ? "bg-slate-800/50 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
                    <DollarSign className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                    최소 정산 출금 금액은 50,000원이며, 정산은 매주 월요일에 처리됩니다.
                  </div>
                  <div className="space-y-3">
                    <Label className={`font-semibold ${isDark ? "text-white" : "text-slate-700"}`}>요청할 금액</Label>
                    <div className="relative">
                      <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <Input
                        type="number"
                        placeholder="금액을 입력하세요 (예: 50000)"
                        value={settlementAmount}
                        onChange={(e) => setSettlementAmount(e.target.value)}
                        className={`pl-10 h-14 text-lg font-bold transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-600" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-300"}`}
                      />
                    </div>
                  </div>
                  <Button onClick={handleRequestSettlement} className="w-full h-14 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white">
                    잔액 정산 요청하기
                  </Button>
                </CardContent>
              </Card>

              <Card className={`border shadow-sm transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <CardHeader className={`border-b transition-colors pb-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <CardTitle className={`transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>과거 정산 내역</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {settlements.map((settlement) => {
                      const statusLabel: Record<string, string> = {
                        REQUESTED: "요청",
                        CONFIRMED: "확정",
                        COMPLETED: "완료",
                        FAILED: "실패",
                        CANCELLED: "취소",
                      };
                      const label = statusLabel[settlement.status] ?? settlement.status;
                      const requestedAt = settlement.requestedAt
                        ? new Date(settlement.requestedAt).toLocaleDateString("ko-KR")
                        : "-";

                      const handleCancel = async () => {
                        try {
                          const updatedSettlement = await movieService.cancelSettlement(settlement.id);
                          setSettlements((prev) => prev.map((s) => s.id === settlement.id ? updatedSettlement : s));
                          
                          // Refund to wallet
                          movieService.getWalletBalance().then(setWallet).catch(() => {});
                          toast.success("정산 요청이 취소되었습니다.");
                        } catch (e: any) {
                          toast.error(e.response?.data?.message || "취소에 실패했습니다.");
                        }
                      };

                      return (
                        <div key={settlement.id} className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${isDark ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800/50" : "bg-white border-slate-100 shadow-sm hover:shadow-md"}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-xl font-bold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                                ₩{settlement.requestAmount.toLocaleString()}
                              </span>
                              <Badge
                                variant={
                                  label === "완료" ? "default" :
                                    label === "확정" ? "secondary" : "outline"
                                }
                                className={`font-semibold ${label === "완료" ? "bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800" :
                                    label === "확정" ? "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800" :
                                      label === "실패" || label === "취소" ? "bg-red-500/10 text-red-500 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800" :
                                        "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800"
                                  }`}
                              >
                                {label}
                              </Badge>
                            </div>
                            <div className={`text-sm font-medium flex items-center gap-2 transition-colors flex-wrap gap-y-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <span>요청일: {requestedAt}</span>
                            </div>
                          </div>
                          {settlement.status === "REQUESTED" && (
                            <Button
                              variant="outline"
                              className={`px-5 font-bold transition-colors ${isDark ? "border-slate-600 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50" : "border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"}`}
                              onClick={handleCancel}
                            >
                              요청 취소
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

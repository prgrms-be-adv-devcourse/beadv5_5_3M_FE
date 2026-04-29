import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Film, ArrowLeft, User, Mail, Phone, Camera, Lock, Trash2, Sun, Moon, History, MessageSquare, Star, Coins, Calendar, Heart } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/ui/header";

import { useMyPageData } from "../hooks/useMovies";
import { useUser } from "../contexts/UserContext";
import { useMyTickets } from "../hooks/useTickets";
import { userService } from "../services/userService";
import { tokenStorage } from "../services/authService";
import { reviewService } from "../services/reviewService";
import { likeService, type LikedMovie, getImageUrl, getPlaceholderPoster } from "../services/movieService";

export function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const initialTab = location.state?.tab || "tickets";

  const { watchedMovies, cookieHistory, setCookieHistory, userReviews, loading, refresh: refreshMyPageData } = useMyPageData();
  const { user: userInfo, loading: userLoading, refreshUser: refetchUserMe } = useUser();
  const { tickets, loading: ticketsLoading, cancelTicket } = useMyTickets(0, 100);

  const [profile, setProfile] = useState({
    nickname: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [editProfile, setEditProfile] = useState({ nickname: "", phone: "" });
  const ownCookies = userInfo?.cookieBalance || 0;
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [nicknameChecked, setNicknameChecked] = useState(false);

  const [likedMovies, setLikedMovies] = useState<LikedMovie[]>(() => likeService.getLikedMovies());

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editReviewText, setEditReviewText] = useState("");
  const [editReviewRating, setEditReviewRating] = useState(0);

  const startEditReview = (review: any) => {
    setEditingReviewId(review.id);
    setEditReviewText(review.content);
    setEditReviewRating(review.rating);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewText("");
    setEditReviewRating(0);
  };

  const saveEditReview = async () => {
    if (!editingReviewId) return;
    try {
      await reviewService.updateReview(editingReviewId, editReviewRating, editReviewText);
      toast.success("리뷰가 수정되었습니다.");
      setEditingReviewId(null);
      refreshMyPageData();
    } catch {
      toast.error("리뷰 수정에 실패했습니다.");
    }
  };

  const handleDeleteReviewFromMyPage = async (reviewId: number) => {
    try {
      await reviewService.deleteReview(reviewId);
      toast.success("리뷰가 삭제되었습니다.");
      refreshMyPageData();
    } catch {
      toast.error("리뷰 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    if (userInfo) {
      setProfile((prev) => ({ ...prev, nickname: userInfo.nickname, email: userInfo.email, avatar: userInfo.profileUrl ?? "" }));
      setEditProfile({ nickname: userInfo.nickname, phone: userInfo.phone ?? "" });
    }
  }, [userInfo]);

  if (loading || userLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfileImage(file);
  };

  const handleCheckNickname = async () => {
    if (!editProfile.nickname) return;
    try {
      await userService.checkNickname(editProfile.nickname);
      setNicknameChecked(true);
      toast.success("사용 가능한 닉네임입니다.");
    } catch {
      setNicknameChecked(false);
      toast.error("이미 사용 중인 닉네임입니다.");
    }
  };

  const handleUpdateProfile = async () => {
    if (editProfile.nickname !== profile.nickname && !nicknameChecked) {
      toast.error("닉네임 중복확인을 해주세요.");
      return;
    }
    try {
      await userService.updateProfile(editProfile.nickname, editProfile.phone, profileImage ?? undefined);
      toast.success("프로필이 업데이트되었습니다.");
      setProfile((prev) => ({ ...prev, nickname: editProfile.nickname }));
      setNicknameChecked(false);
      setProfileImage(null);
      refetchUserMe();
    } catch {
      toast.error("프로필 업데이트에 실패했습니다.");
    }
  };

  const handleRefund = (id: number, amount: number) => {
    setCookieHistory(prev => prev.map(item =>
      item.id === id ? { ...item, status: "환불됨" as const } : item
    ));
    toast.success(`${amount} 쿠키가 환불되었습니다.`, { icon: "🍪" });
    refetchUserMe();
  };

  const handleChangePassword = () => {
    toast.info("준비 중인 기능이에요. 곧 제공할게요.");
  };

  const isTicketPast = (endTime: string) => new Date(endTime).getTime() < Date.now();

  const handleDeleteAccount = async () => {
    try {
      await userService.withdraw();
      tokenStorage.clearTokens();
      toast.success("회원 탈퇴가 완료되었습니다.");
      navigate("/");
    } catch {
      toast.error("회원 탈퇴에 실패했습니다.");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header title="마이페이지" showBackButton />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-[1100px] mx-auto">
          <Tabs defaultValue={initialTab} className="flex flex-col md:flex-row gap-8 items-start w-full relative">
            {/* Sidebar Left */}
            <TabsList className={`flex flex-col justify-start h-auto w-full md:w-64 md:sticky md:top-28 shrink-0 border rounded-2xl p-3 shadow-sm gap-2 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <TabsTrigger value="tickets" className={`justify-start px-5 py-4 text-base font-semibold transition-all rounded-xl text-left shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white ${isDark ? "text-slate-300 data-[state=inactive]:hover:bg-slate-800" : "text-slate-600 data-[state=inactive]:hover:bg-purple-50"}`}>
                <History className="w-5 h-5 mr-3" />
                예매 내역
              </TabsTrigger>
              <TabsTrigger value="profile" className={`justify-start px-5 py-4 text-base font-semibold transition-all rounded-xl text-left shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white ${isDark ? "text-slate-300 data-[state=inactive]:hover:bg-slate-800" : "text-slate-600 data-[state=inactive]:hover:bg-purple-50"}`}>
                <User className="w-5 h-5 mr-3" />
                프로필 설정
              </TabsTrigger>
              <TabsTrigger value="watched" className={`justify-start px-5 py-4 text-base font-semibold transition-all rounded-xl text-left shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white ${isDark ? "text-slate-300 data-[state=inactive]:hover:bg-slate-800" : "text-slate-600 data-[state=inactive]:hover:bg-purple-50"}`}>
                <Film className="w-5 h-5 mr-3" />
                시청 기록
              </TabsTrigger>
              <TabsTrigger value="cookies" className={`justify-start px-5 py-4 text-base font-semibold transition-all rounded-xl text-left shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white ${isDark ? "text-slate-300 data-[state=inactive]:hover:bg-slate-800" : "text-slate-600 data-[state=inactive]:hover:bg-purple-50"}`}>
                <Coins className="w-5 h-5 mr-3" />
                쿠키 사용 내역
              </TabsTrigger>
              <TabsTrigger value="reviews" className={`justify-start px-5 py-4 text-base font-semibold transition-all rounded-xl text-left shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white ${isDark ? "text-slate-300 data-[state=inactive]:hover:bg-slate-800" : "text-slate-600 data-[state=inactive]:hover:bg-purple-50"}`}>
                <MessageSquare className="w-5 h-5 mr-3" />
                리뷰 관리
              </TabsTrigger>
              <TabsTrigger value="likes" className={`justify-start px-5 py-4 text-base font-semibold transition-all rounded-xl text-left shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white ${isDark ? "text-slate-300 data-[state=inactive]:hover:bg-slate-800" : "text-slate-600 data-[state=inactive]:hover:bg-purple-50"}`}>
                <Heart className="w-5 h-5 mr-3" />
                좋아요한 영화
              </TabsTrigger>
<TabsTrigger value="account" className={`justify-start px-5 py-4 text-base font-semibold transition-all rounded-xl text-left shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white ${isDark ? "text-slate-300 data-[state=inactive]:hover:bg-slate-800" : "text-slate-600 data-[state=inactive]:hover:bg-purple-50"}`}>
                <Lock className="w-5 h-5 mr-3" />
                계정 관리
              </TabsTrigger>
            </TabsList>

            {/* Main Content Right */}
            <div className="flex-1 w-full min-w-0">
              {/* Profile Header */}
              <Card className={`mb-8 transition-colors ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 shadow-md">
                        <AvatarImage src={profileImage ? URL.createObjectURL(profileImage) : profile.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-3xl font-bold flex items-center justify-center">
                          {profile.nickname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 hover:scale-105 transition-all shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer">
                        <Camera className="w-4 h-4 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                      </label>
                    </div>
                    <div>
                      <h2 className={`text-3xl font-extrabold mb-1 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>{profile.nickname}</h2>
                      <p className={`flex items-center gap-2 transition-colors font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <Mail className="w-4 h-4" />
                        {profile.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tickets Section */}
              <TabsContent value="tickets" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className={`transition-all ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/10 pb-6">
                    <CardTitle className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>나의 예매 내역</CardTitle>
                    <Badge variant="outline" className="px-3 py-1 bg-purple-500/10 text-purple-500 border-purple-500/20">
                      총 {tickets.length}건
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {ticketsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        <p className={isDark ? "text-slate-500" : "text-slate-400"}>내역을 불러오는 중...</p>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
                        <div className={`p-6 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                          <History className="w-12 h-12 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className={`text-xl font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>예매 내역이 없습니다.</p>
                          <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>지금 흥미로운 영화를 예매해보세요!</p>
                        </div>
                        <Button onClick={() => navigate("/")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-purple-500/20 transition-transform active:scale-95">
                          영화 보러 가기
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {tickets.map((ticket) => (
                          <div
                            key={ticket.ticketId}
                            className={`group relative overflow-hidden p-6 rounded-2xl border transition-all hover:scale-[1.01] ${
                              isDark ? "bg-slate-800/30 border-slate-800 hover:bg-slate-800/50" : "bg-white border-slate-100 shadow-sm hover:shadow-md"
                            }`}
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                              <div className="flex items-center gap-5">
                                <div className={`hidden sm:flex w-14 h-14 rounded-xl items-center justify-center shrink-0 ${isDark ? "bg-slate-800" : "bg-purple-50"}`}>
                                  <Film className={isDark ? "text-slate-400" : "text-purple-500"} />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{ticket.movieTitle || `영화 #${ticket.movieId}`}</h4>
                                    {(() => {
                                      const past = isTicketPast(ticket.endTime);
                                      const tone = ticket.status === 'RESERVED'
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : past
                                          ? 'bg-slate-500/10 text-slate-500'
                                          : 'bg-sky-500/10 text-sky-500';
                                      const label = ticket.status === 'RESERVED'
                                        ? '예약됨'
                                        : past ? '관람완료' : '예매완료';
                                      return (
                                        <Badge className={`${tone} border-none font-bold px-2 self-center`}>
                                          {label}
                                        </Badge>
                                      );
                                    })()}
                                  </div>
                                  <p className={`text-sm font-medium flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    <Calendar className="w-3 h-3" />
                                    {new Date(ticket.startTime).toLocaleString("ko-KR", { dateStyle: 'long', timeStyle: 'short' })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full md:w-auto">
                                {ticket.status === 'RESERVED' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" className={`flex-1 md:flex-none h-12 px-6 rounded-xl font-bold text-red-500 border-red-500/30 hover:bg-red-50 hover:border-red-500 transition-colors`}>
                                        예매 취소
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className={`border-none rounded-2xl ${isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold">예매를 취소하시겠습니까?</AlertDialogTitle>
                                        <AlertDialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
                                          결제 전 가예약을 취소합니다. 차감되지 않은 쿠키는 그대로 유지돼요.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="mt-4">
                                        <AlertDialogCancel className={`h-12 px-6 rounded-xl font-bold border-none ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>그만두기</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => cancelTicket(ticket.ticketId)}
                                          className="h-12 px-6 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          예매 취소
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {ticket.status === 'CONFIRMED' && !isTicketPast(ticket.endTime) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" className={`flex-1 md:flex-none h-12 px-6 rounded-xl font-bold text-red-500 border-red-500/30 hover:bg-red-50 hover:border-red-500 transition-colors`}>
                                        환불
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className={`border-none rounded-2xl ${isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold">티켓을 환불하시겠습니까?</AlertDialogTitle>
                                        <AlertDialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
                                          소모된 쿠키를 돌려받아요. 환불 후에는 입장이 불가능합니다.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="mt-4">
                                        <AlertDialogCancel className={`h-12 px-6 rounded-xl font-bold border-none ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>그만두기</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => cancelTicket(ticket.ticketId)}
                                          className="h-12 px-6 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          환불하기
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                <Button
                                  onClick={() => navigate(`/theater/${ticket.scheduleId}`)}
                                  disabled={ticket.status === 'RESERVED' || isTicketPast(ticket.endTime)}
                                  className={`flex-1 md:flex-none h-12 px-8 rounded-xl font-black bg-purple-600 hover:bg-purple-700 text-white transition-transform active:scale-95 shadow-md shadow-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  관람하기
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Settings */}
              <TabsContent value="profile" className="mt-0 outline-none">
                <Card className={`transition-all ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                  <CardHeader>
                    <CardTitle className={`transition-colors text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>프로필 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="nickname" className={`font-semibold transition-colors ${isDark ? "text-white" : "text-slate-700"}`}>닉네임</Label>
                      <div className="flex gap-2">
                        <Input
                          id="nickname"
                          value={editProfile.nickname}
                          onChange={(e) => { setEditProfile({ ...editProfile, nickname: e.target.value }); setNicknameChecked(false); }}
                          className={`transition-colors py-6 text-base ${isDark ? "bg-slate-800 border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500"}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCheckNickname}
                          className={`shrink-0 py-6 px-4 font-bold rounded-xl ${nicknameChecked ? "border-green-500 text-green-500" : isDark ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-700"}`}
                        >
                          {nicknameChecked ? "확인완료" : "중복확인"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className={`font-semibold transition-colors ${isDark ? "text-white" : "text-slate-700"}`}>이메일</Label>
                      <div className="flex items-center gap-3">
                        <Mail className={`w-5 h-5 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                        <Input
                          id="email"
                          value={profile.email}
                          disabled
                          className={`transition-colors py-6 text-base ${isDark ? "bg-slate-800/50 border-slate-700 text-slate-400 cursor-not-allowed" : "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className={`font-semibold transition-colors ${isDark ? "text-white" : "text-slate-700"}`}>연락처</Label>
                      <div className="flex items-center gap-3">
                        <Phone className={`w-5 h-5 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                        <Input
                          id="phone"
                          value={editProfile.phone}
                          onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                          className={`transition-colors py-6 text-base ${isDark ? "bg-slate-800 border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500"}`}
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button onClick={handleUpdateProfile} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 px-8 py-6 rounded-xl text-lg font-bold w-full md:w-auto transition-transform hover:scale-105">
                        프로필 업데이트
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Watched Movies */}
              <TabsContent value="watched" className="mt-0 outline-none">
                <Card className={`transition-all ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                  <CardHeader>
                    <CardTitle className={`transition-colors text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>시청한 영화</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {watchedMovies.map((movie) => (
                        <div
                          key={movie.id}
                          className="cursor-pointer group flex flex-col items-center"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          <div className="relative overflow-hidden rounded-xl shadow-md w-full aspect-[2/3] mb-3">
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                          <p className={`text-base font-bold truncate w-full text-center transition-colors group-hover:text-purple-500 ${isDark ? "text-white" : "text-slate-900"}`}>{movie.title}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cookie Usage History */}
              <TabsContent value="cookies" className="mt-0 outline-none">
                <Card className={`transition-all ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                  <CardHeader>
                    <CardTitle className={`transition-colors flex items-center gap-2 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      <History className="w-6 h-6 text-purple-500" />
                      쿠키 사용 내역
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cookieHistory.map((history) => {
                        const isUpcoming = new Date(history.playDate).getTime() > Date.now();
                        const isRefundable = isUpcoming && history.status === "사용";
                        
                        return (
                          <div key={history.id} className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${isDark ? "bg-slate-800/30 border-slate-800 hover:bg-slate-800/50" : "bg-white border-slate-100 shadow-sm hover:shadow-md"}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-lg font-bold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {history.movieTitle}
                                </span>
                                {history.status === "환불됨" && (
                                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-2 py-0 text-xs">환불됨</Badge>
                                )}
                                {history.type === "charge" && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0 text-xs">충전</Badge>
                                )}
                              </div>
                              <div className={`text-sm font-medium transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                일시: {history.date} {history.playDate !== "-" && `• 상영 예정: ${history.playDate}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-xl font-black ${
                                  history.type === "usage" ? "text-purple-600" : "text-emerald-500"
                                }`}>
                                  {history.type === "usage" ? "-" : "+"}{history.amount}
                                </span>
                                <span className={`text-sm font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>쿠키</span>
                              </div>
                              {isRefundable && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 font-bold px-4 rounded-xl">
                                      환불하기
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className={isDark ? "bg-slate-900 border-slate-800" : "bg-white"}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className={isDark ? "text-white" : "text-slate-900"}>쿠키를 환불하시겠습니까?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        상영 시작 전이므로 {history.amount} 쿠키가 즉시 반환됩니다. 환불 후에는 입장이 불가능합니다.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className={isDark ? "bg-slate-800 text-white border-none" : ""}>취소</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRefund(history.id, history.amount)}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                      >
                                        환불 승인
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Review Management */}
              <TabsContent value="reviews" className="mt-0 outline-none">
                <Card className={`transition-all ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                  <CardHeader>
                    <CardTitle className={`transition-colors flex items-center gap-2 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      <MessageSquare className="w-6 h-6 text-purple-500" />
                      리뷰 관리
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {userReviews.map((review) => {
                        const isEditing = editingReviewId === review.id;
                        return (
                          <div key={review.id} className={`p-6 rounded-2xl border transition-all ${isDark ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100 shadow-sm"}`}>
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
                                  <Button onClick={saveEditReview} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">저장</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h4 className={`text-lg font-bold transition-colors mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{review.movieTitle}</h4>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300 fill-slate-300"}`} />
                                      ))}
                                      <span className={`text-xs font-bold ml-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{review.date}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => startEditReview(review)} className={`font-bold ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>수정</Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="ghost" className={`font-bold text-red-500 hover:text-red-600 hover:bg-red-50`}>삭제</Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className={isDark ? "bg-slate-900 border-slate-800" : "bg-white"}>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className={isDark ? "text-white" : "text-slate-900"}>리뷰를 삭제하시겠습니까?</AlertDialogTitle>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className={isDark ? "bg-slate-800 text-white border-none" : ""}>취소</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteReviewFromMyPage(review.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                            삭제
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                                <p className={`text-base font-medium leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                                  {review.content}
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Liked Movies */}
              <TabsContent value="likes" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className={`transition-all ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/10 pb-6">
                    <CardTitle className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>좋아요한 영화</CardTitle>
                    <Badge variant="outline" className="px-3 py-1 bg-pink-500/10 text-pink-500 border-pink-500/20">
                      총 {likedMovies.length}편
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {likedMovies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
                        <div className={`p-6 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                          <Heart className="w-12 h-12 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className={`text-xl font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>좋아요한 영화가 없습니다.</p>
                          <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>마음에 드는 영화에 좋아요를 눌러보세요!</p>
                        </div>
                        <Button onClick={() => navigate("/")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 px-8 rounded-xl">
                          영화 보러 가기
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {likedMovies.map((movie) => (
                          <div
                            key={movie.movieId}
                            className="cursor-pointer group flex flex-col"
                            onClick={() => navigate(`/movie/${movie.movieId}`)}
                          >
                            <div className="relative overflow-hidden rounded-xl shadow-md w-full aspect-[2/3] mb-3">
                              <img
                                src={getImageUrl(movie.imageUrl) || getPlaceholderPoster(movie.movieId)}
                                alt={movie.title}
                                className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-500"
                                onError={(e) => { (e.target as HTMLImageElement).src = getPlaceholderPoster(movie.movieId); }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute top-2 right-2">
                                <Heart className="w-5 h-5 fill-pink-500 text-pink-500 drop-shadow" />
                              </div>
                            </div>
                            <p className={`text-sm font-bold truncate text-center transition-colors group-hover:text-purple-500 ${isDark ? "text-white" : "text-slate-900"}`}>{movie.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Management */}
              <TabsContent value="account" className="mt-0 outline-none">
                <div className="space-y-8">
                  <Card className={`transition-all ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-3 transition-colors text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        <Lock className="w-6 h-6 text-purple-500" />
                        비밀번호 변경
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className={`font-semibold transition-colors ${isDark ? "text-white" : "text-slate-700"}`}>현재 비밀번호</Label>
                        <Input
                          id="current-password"
                          type="password"
                          className={`transition-colors py-6 text-base ${isDark ? "bg-slate-800 border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500"}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className={`font-semibold transition-colors ${isDark ? "text-white" : "text-slate-700"}`}>새 비밀번호</Label>
                        <Input
                          id="new-password"
                          type="password"
                          className={`transition-colors py-6 text-base ${isDark ? "bg-slate-800 border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500"}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className={`font-semibold transition-colors ${isDark ? "text-white" : "text-slate-700"}`}>비밀번호 확인</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          className={`transition-colors py-6 text-base ${isDark ? "bg-slate-800 border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500"}`}
                        />
                      </div>
                      <div className="pt-4">
                        <Button onClick={handleChangePassword} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 px-8 py-6 rounded-xl text-lg font-bold w-full md:w-auto transition-transform hover:scale-105">
                          비밀번호 변경
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`transition-all ${isDark ? "bg-slate-900/50 border-red-900/50" : "bg-red-50/30 border-red-200 shadow-sm hover:shadow-md"}`}>
                    <CardHeader>
                      <CardTitle className="text-red-500 flex items-center gap-3 text-2xl font-bold">
                        <Trash2 className="w-6 h-6" />
                        회원 탈퇴
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className={`text-lg transition-colors ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        회원 탈퇴 시 모든 구독 기록과 구매 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="py-6 px-8 rounded-xl text-lg font-bold bg-red-600 hover:bg-red-700 transition-all hover:scale-105 shadow-lg shadow-red-500/20">
                            회원 탈퇴
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className={`transition-all border-none shadow-2xl ${isDark ? "bg-slate-900" : "bg-white"}`}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription className={`text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className={`py-6 px-6 rounded-xl font-bold transition-colors ${isDark ? "bg-slate-800 text-white border-slate-700 hover:bg-slate-700" : "bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200"}`}>
                              취소
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              className="py-6 px-6 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white"
                            >
                              탈퇴하기
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

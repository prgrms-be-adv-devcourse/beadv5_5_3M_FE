import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ShoppingCart, Trash2, Cookie, Calendar, Clock, Ticket, CheckCircle2, Users } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/ui/header";
import { cartService, CartItemResponse, ticketService, TicketResponse } from "../services/ticketService";
import { movieService, getPlaceholderPoster, getImageUrl } from "../services/movieService";
import { useUser } from "../contexts/UserContext";

interface ReservedTicketWithMovie extends TicketResponse {
  movieTitle: string;
  movieImageUrl: string;
  cookie: number;
}

export function CartPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user, refreshUser } = useUser();

  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [cartCounts, setCartCounts] = useState<Record<number, number>>({});
  const [reservedTickets, setReservedTickets] = useState<ReservedTicketWithMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingIds, setPayingIds] = useState<Set<number>>(new Set());
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [selectedCartIds, setSelectedCartIds] = useState<Set<number>>(new Set());
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<number>>(new Set());

  const ownCookies = user?.cookieBalance ?? 0;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cartRes, ticketRes] = await Promise.all([
        cartService.getCartItems(),
        ticketService.getMyTickets(0, 100),
      ]);

      setCartItems(cartRes);
      setSelectedCartIds(new Set(cartRes.map((i) => i.scheduleId)));

      const rawReserved = ticketRes.content.filter((t) => t.status === "RESERVED");

      // 영화 정보 병렬 fetch
      const enriched = await Promise.all(
        rawReserved.map(async (ticket) => {
          try {
            const movie = await movieService.getMovieDetail(ticket.movieId);
            return {
              ...ticket,
              movieTitle: movie.title,
              movieImageUrl: getImageUrl(movie.imageUrl) || getPlaceholderPoster(ticket.movieId),
              cookie: movie.cookie,
            } as ReservedTicketWithMovie;
          } catch {
            return {
              ...ticket,
              movieTitle: `영화 #${ticket.movieId}`,
              movieImageUrl: getPlaceholderPoster(ticket.movieId),
              cookie: 0,
            } as ReservedTicketWithMovie;
          }
        })
      );

      setReservedTickets(enriched);
      setSelectedTicketIds(new Set(enriched.map((t) => t.ticketId)));

      const counts = await Promise.all(
        cartRes.map((item) =>
          cartService.getCartCount(item.scheduleId).then((count) => ({ scheduleId: item.scheduleId, count }))
        )
      );
      setCartCounts(Object.fromEntries(counts.map(({ scheduleId, count }) => [scheduleId, count])));
    } catch {
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 장바구니 체크박스
  const toggleCartSelect = (scheduleId: number) => {
    setSelectedCartIds((prev) => {
      const next = new Set(prev);
      next.has(scheduleId) ? next.delete(scheduleId) : next.add(scheduleId);
      return next;
    });
  };
  const toggleCartSelectAll = () => {
    setSelectedCartIds(
      selectedCartIds.size === cartItems.length
        ? new Set()
        : new Set(cartItems.map((i) => i.scheduleId))
    );
  };

  // 가예약 체크박스
  const toggleTicketSelect = (ticketId: number) => {
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      next.has(ticketId) ? next.delete(ticketId) : next.add(ticketId);
      return next;
    });
  };
  const toggleTicketSelectAll = () => {
    setSelectedTicketIds(
      selectedTicketIds.size === reservedTickets.length
        ? new Set()
        : new Set(reservedTickets.map((t) => t.ticketId))
    );
  };

  const handleRemove = async (scheduleId: number) => {
    setRemovingId(scheduleId);
    try {
      await cartService.removeCartItem(scheduleId);
      setCartItems((prev) => prev.filter((item) => item.scheduleId !== scheduleId));
      setSelectedCartIds((prev) => { const next = new Set(prev); next.delete(scheduleId); return next; });
      toast.success("장바구니에서 제거했습니다.");
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch {
      toast.error("삭제에 실패했습니다.");
    } finally {
      setRemovingId(null);
    }
  };

  // 선택된 가예약 티켓 일괄 구매
  const handlePaySelected = async () => {
    const targets = reservedTickets.filter((t) => selectedTicketIds.has(t.ticketId));
    if (targets.length === 0) return;

    setPayingIds(new Set(targets.map((t) => t.ticketId)));
    try {
      // 낙관적 락 충돌 방지: 순차 구매
      for (const t of targets) {
        await ticketService.payTicket(t.ticketId);
      }
      setReservedTickets((prev) => prev.filter((t) => !selectedTicketIds.has(t.ticketId)));
      setSelectedTicketIds(new Set());
      refreshUser();
      toast.success(`${targets.length}건 티켓 구매 완료!`, { icon: "🎟️" });
      window.dispatchEvent(new CustomEvent("ticket-purchased"));
    } catch (error: any) {
      const msg = error.response?.data?.message || "구매에 실패했습니다.";
      toast.error(msg);
      fetchAll();
    } finally {
      setPayingIds(new Set());
    }
  };

  const selectedTickets = reservedTickets.filter((t) => selectedTicketIds.has(t.ticketId));
  const totalTicketCookies = selectedTickets.reduce((sum, t) => sum + t.cookie, 0);
  const isPaying = payingIds.size > 0;

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-gray-100"}`}>
        <Header title="장바구니" showBackButton />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
        </div>
      </div>
    );
  }

  const isEmpty = cartItems.length === 0 && reservedTickets.length === 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-gray-100"}`}>
      <Header title="장바구니" showBackButton />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {isEmpty ? (
          <div className={`text-center py-24 rounded-2xl ${isDark ? "bg-slate-900" : "bg-white"}`}>
            <ShoppingCart className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-slate-700" : "text-slate-200"}`} />
            <p className={`text-xl font-bold mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>장바구니가 비어있습니다</p>
            <p className={`text-sm mb-6 ${isDark ? "text-slate-600" : "text-slate-400"}`}>영화 상세 페이지에서 원하는 상영 일정을 담아보세요</p>
            <Button onClick={() => navigate("/main")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl">
              영화 보러가기
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 items-start">

            {/* ── 왼쪽: 장바구니 ── */}
            <div className="flex-1 min-w-0">
              <div className={`rounded-2xl overflow-hidden ${isDark ? "bg-slate-900" : "bg-white"}`}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-slate-800" : "border-gray-100"}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                      checked={selectedCartIds.size === cartItems.length && cartItems.length > 0}
                      onChange={toggleCartSelectAll}
                    />
                    <span className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-800"}`}>
                      전체선택 ({selectedCartIds.size}/{cartItems.length})
                    </span>
                  </div>
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    마감 후 가예약 전환
                  </span>
                </div>

                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <ShoppingCart className={`w-10 h-10 mb-3 ${isDark ? "text-slate-700" : "text-slate-200"}`} />
                    <p className={`text-sm font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>담은 일정이 없습니다</p>
                  </div>
                ) : (
                  <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-50"}`}>
                    {cartItems.map((item) => {
                      const startDate = new Date(item.startTime);
                      const endDate = new Date(item.endTime);
                      const isSelected = selectedCartIds.has(item.scheduleId);
                      return (
                        <div
                          key={item.scheduleId}
                          className={`flex items-start gap-4 px-5 py-4 transition-colors ${isSelected
                            ? isDark ? "bg-slate-900" : "bg-white"
                            : isDark ? "bg-slate-950/50" : "bg-gray-50"
                            }`}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 mt-1 accent-purple-600 cursor-pointer shrink-0"
                            checked={isSelected}
                            onChange={() => toggleCartSelect(item.scheduleId)}
                          />
                          <img
                            src={item.imageUrl || getPlaceholderPoster(item.movieId)}
                            alt={item.title}
                            className="w-16 h-24 object-cover rounded-lg shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => item.movieId && navigate(`/movie/${item.movieId}`)}
                          />
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-bold text-sm mb-2 cursor-pointer hover:text-purple-500 transition-colors line-clamp-2 ${isDark ? "text-white" : "text-slate-900"}`}
                              onClick={() => item.movieId && navigate(`/movie/${item.movieId}`)}
                            >
                              {item.title}
                            </h3>
                            <div className={`space-y-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                                <span>{startDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                                <span>
                                  {startDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                  {" ~ "}
                                  {endDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-purple-400 shrink-0" />
                                <span>
                                  <span className="font-bold text-purple-500">{cartCounts[item.scheduleId] ?? "-"}</span>
                                  명 담음
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <button
                              className={`transition-colors ${isDark ? "text-slate-600 hover:text-slate-400" : "text-gray-300 hover:text-gray-500"}`}
                              disabled={removingId === item.scheduleId}
                              onClick={() => handleRemove(item.scheduleId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1">
                              <Cookie className="w-4 h-4 text-amber-400" />
                              <span className="font-black text-amber-500 text-base">{item.cookie}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── 오른쪽: 가예약 ── */}
            <div className="w-full lg:w-80 shrink-0 sticky top-6">
              <div className={`rounded-2xl overflow-hidden ${isDark ? "bg-slate-900" : "bg-white"}`}>
                {/* 헤더 */}
                <div className={`flex items-center gap-2 px-5 py-4 border-b ${isDark ? "border-slate-800" : "border-gray-100"}`}>
                  {reservedTickets.length > 0 && (
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                      checked={selectedTicketIds.size === reservedTickets.length && reservedTickets.length > 0}
                      onChange={toggleTicketSelectAll}
                    />
                  )}
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-800"}`}>가예약</span>
                  {reservedTickets.length > 0 && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-bold">
                      {reservedTickets.length}건
                    </Badge>
                  )}
                </div>

                {/* 가예약 없을 때 */}
                {reservedTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                    <CheckCircle2 className={`w-10 h-10 mb-3 ${isDark ? "text-slate-700" : "text-slate-200"}`} />
                    <p className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      가예약 내역 없음
                    </p>
                    <p className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                      장바구니 마감 후<br />자동으로 생성됩니다
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 티켓 목록 */}
                    <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-gray-50"}`}>
                      {reservedTickets.map((ticket) => {
                        const startDate = new Date(ticket.startTime);
                        const endDate = new Date(ticket.endTime);
                        const isSelected = selectedTicketIds.has(ticket.ticketId);
                        return (
                          <div
                            key={ticket.ticketId}
                            className={`flex items-start gap-3 px-4 py-4 transition-colors ${isSelected
                              ? isDark ? "bg-slate-900" : "bg-white"
                              : isDark ? "bg-slate-950/50" : "bg-gray-50"
                              }`}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 mt-1 accent-emerald-600 cursor-pointer shrink-0"
                              checked={isSelected}
                              onChange={() => toggleTicketSelect(ticket.ticketId)}
                            />
                            {/* 포스터 */}
                            <img
                              src={ticket.movieImageUrl}
                              alt={ticket.movieTitle}
                              className="w-12 h-16 object-cover rounded-lg shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => ticket.movieId && navigate(`/movie/${ticket.movieId}`)}
                            />
                            {/* 정보 */}
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-bold text-xs mb-1.5 cursor-pointer hover:text-emerald-500 transition-colors line-clamp-2 ${isDark ? "text-white" : "text-slate-900"}`}
                                onClick={() => ticket.movieId && navigate(`/movie/${ticket.movieId}`)}
                              >
                                {ticket.movieTitle}
                              </h4>
                              <div className={`space-y-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                                  <span>{startDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                                  <span>
                                    {startDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                    ~
                                    {endDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Cookie className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="font-black text-amber-500">{ticket.cookie}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 구매 합계 + 버튼 */}
                    <div className={`px-5 py-4 border-t ${isDark ? "border-slate-800" : "border-gray-100"}`}>
                      <div className={`flex justify-between items-center mb-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <span>선택</span>
                        <span className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{selectedTicketIds.size}건</span>
                      </div>
                      <div className="flex justify-between items-center mb-4 text-sm">
                        <span className={isDark ? "text-slate-400" : "text-slate-500"}>합계</span>
                        <div className="flex items-center gap-1">
                          <Cookie className="w-4 h-4 text-amber-400" />
                          <span className="font-black text-amber-500 text-base">{totalTicketCookies}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11 text-sm"
                        disabled={selectedTicketIds.size === 0 || isPaying}
                        onClick={handlePaySelected}
                      >
                        <Ticket className="w-4 h-4 mr-1.5" />
                        {isPaying ? "구매 중..." : `선택 구매하기 (${selectedTicketIds.size}건)`}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

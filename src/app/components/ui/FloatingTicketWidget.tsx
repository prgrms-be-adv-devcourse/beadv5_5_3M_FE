import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { Card } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Calendar, Clock, ChevronRight, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ticketService } from "../../services/ticketService";
import { movieService, getPlaceholderPoster, getImageUrl } from "../../services/movieService";

interface DisplayTicket {
  id: number;
  movieId: number;
  title: string;
  time: string;
  playDate: string;
  status: "상영 중" | "상영 예정";
  poster: string;
}

export function FloatingTicketWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tickets, setTickets] = useState<DisplayTicket[]>([]);

  useEffect(() => {
    const fetchUpcomingTickets = async () => {
      if (location.pathname.startsWith("/creator")) return;
      try {
        const result = await ticketService.getMyTickets(0, 50);
        const now = new Date();

        const upcoming = result.content
          .filter((t) => t.status === "RESERVED" && new Date(t.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 2);

        const displayTickets = await Promise.all(
          upcoming.map(async (t) => {
            let title = `영화 #${t.movieId}`;
            let imageUrl: string | undefined;
            try {
              const detail = await movieService.getMovieDetail(t.movieId);
              title = detail.title;
              imageUrl = detail.imageUrl;
            } catch {
              // fallback to default title
            }

            const start = new Date(t.startTime);
            const end = new Date(t.endTime);
            const pad = (n: number) => String(n).padStart(2, "0");
            const timeStr = `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
            const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;

            const isOnAir = start <= now && now <= end;

            return {
              id: t.ticketId,
              movieId: t.movieId,
              title,
              time: timeStr,
              playDate: dateStr,
              status: isOnAir ? ("상영 중" as const) : ("상영 예정" as const),
              poster: getImageUrl(imageUrl) || getPlaceholderPoster(t.movieId),
            };
          })
        );

        setTickets(displayTickets);
      } catch {
        setTickets([]);
      }
    };

    fetchUpcomingTickets();

    window.addEventListener("ticket-purchased", fetchUpcomingTickets);
    return () => window.removeEventListener("ticket-purchased", fetchUpcomingTickets);
  }, [location.pathname]);

  if (location.pathname.startsWith("/creator")) return null;
  if (tickets.length === 0) return null;

  return (
    <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence mode="wait">
        {!isCollapsed ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="pointer-events-auto"
          >
            <Card className={`w-80 overflow-hidden shadow-2xl border-none transition-colors ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"
            } backdrop-blur-xl`}>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  <span className="font-bold text-sm">마이 티켓 ({tickets.length})</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                  onClick={() => setIsCollapsed(true)}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`flex gap-3 p-3 rounded-2xl transition-all cursor-pointer border ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800"
                        : "bg-slate-50 border-slate-200 hover:border-purple-300 hover:bg-white"
                    }`}
                    onClick={() => navigate(`/theater/${ticket.id}`)}
                  >
                    <img src={ticket.poster} alt={ticket.title} className="w-12 h-18 object-cover rounded-lg shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {ticket.status === "상영 중" ? (
                          <Badge className="bg-emerald-500 text-[10px] h-4 px-1.5 animate-pulse border-none">NOW</Badge>
                        ) : (
                          <Badge className="bg-purple-500 text-[10px] h-4 px-1.5 border-none">UPCOMING</Badge>
                        )}
                        <h4 className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{ticket.title}</h4>
                      </div>
                      <div className="flex flex-col gap-0.5 text-[10px] font-medium text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ticket.playDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ticket.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-3 border-t text-center ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                <Button
                  variant="ghost"
                  className="w-full h-8 text-xs font-bold text-purple-500 hover:bg-purple-500/10"
                  onClick={() => navigate("/mypage")}
                >
                  전체 내역 보기
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="pointer-events-auto"
          >
            <Button
              className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/40 hover:scale-110 transition-transform flex items-center justify-center p-0 relative group"
              onClick={() => setIsCollapsed(false)}
            >
              <Ticket className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                {tickets.length}
              </div>
              <div className="absolute right-full mr-4 bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                구매한 티켓 확인하기
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

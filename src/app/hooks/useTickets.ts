import { useState, useEffect } from "react";
import { ticketService, TicketResponse } from "../services/ticketService";
import { movieService } from "../services/movieService";
import { toast } from "sonner";

export function useMyTickets(page = 0, size = 20) {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const result = await ticketService.getMyTickets(page, size);
      const enriched: TicketResponse[] = await Promise.all(
        result.content.map(async (ticket) => {
          try {
            const detail = await movieService.getMovieDetail(ticket.movieId);
            return { ...ticket, movieTitle: detail.title };
          } catch {
            return { ...ticket, movieTitle: `영화 #${ticket.movieId}` };
          }
        }),
      );
      enriched.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      setTickets(enriched);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, size]);

  const cancelTicket = async (ticketId: number) => {
    try {
      await ticketService.refundTicket(ticketId);
      toast.success("티켓이 환불되었습니다.");
      fetchTickets();
      window.dispatchEvent(new CustomEvent("ticket-purchased"));
    } catch (error) {
      toast.error("티켓 환불에 실패했습니다.");
    }
  };

  return { tickets, loading, totalPages, fetchTickets, cancelTicket };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, RefreshCw, Ticket } from "lucide-react";
import {
  BackendPageResult,
  ScheduleStatus,
  TicketableScheduleResponse,
  ticketService,
} from "../services/ticketService";
import { useUser } from "../contexts/UserContext";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { cn } from "../components/ui/utils";
import { Header } from "../components/ui/header";
import { TicketableScheduleCard } from "../components/ticketing/TicketableScheduleCard";
import { TicketingQueueModal } from "../components/ticketing/TicketingQueueModal";

type TabValue = "all" | "cart" | "in_progress" | "ticketing";

const TAB_TO_STATUS: Record<TabValue, ScheduleStatus[] | undefined> = {
  all: undefined,
  cart: ["CART"],
  in_progress: ["IN_PROGRESSING"],
  ticketing: ["TICKETING"],
};

const PAGE_SIZE = 20;
const SORT = "ticketingTime,asc";

function buildPageNumbers(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const result: Array<number | "ellipsis"> = [0];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);
  if (start > 1) result.push("ellipsis");
  for (let i = start; i <= end; i++) result.push(i);
  if (end < totalPages - 2) result.push("ellipsis");
  result.push(totalPages - 1);
  return result;
}

export function OpenSchedulesPage() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();

  const [tab, setTab] = useState<TabValue>("all");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<BackendPageResult<TicketableScheduleResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalSchedule, setModalSchedule] = useState<TicketableScheduleResponse | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ticketService.listOpenSchedules({
        status: TAB_TO_STATUS[tab],
        page,
        size: PAGE_SIZE,
        sort: SORT,
      });
      setData(res);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? "조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, tab, page]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchData();
    }
  }, [fetchData, user, userLoading]);

  const handleTabChange = (next: string) => {
    setTab(next as TabValue);
    setPage(0);
  };

  const handleAction = (schedule: TicketableScheduleResponse) => {
    if (!user) {
      navigate("/login");
      return;
    }
    switch (schedule.status) {
      case "CART":
        navigate(`/movie/${schedule.movieId}`);
        break;
      case "IN_PROGRESSING":
        navigate("/cart");
        break;
      case "TICKETING":
        setModalSchedule(schedule);
        break;
      default:
        break;
    }
  };

  const pageNumbers = useMemo(
    () => (data ? buildPageNumbers(data.page, data.totalPages) : []),
    [data],
  );

  return (
    <>
    <Header title="티켓팅 현황" showBackButton backUrl="/main" />
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-purple-500" />
            티켓팅 진행중인 스케줄
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            장바구니·가결제·티켓팅 단계 회차를 한눈에 확인하세요.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading || !user}
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          새로고침
        </Button>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="cart">장바구니</TabsTrigger>
          <TabsTrigger value="in_progress">가결제</TabsTrigger>
          <TabsTrigger value="ticketing">티켓팅</TabsTrigger>
        </TabsList>
      </Tabs>

      {userLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !user ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Ticket className="w-12 h-12 text-muted-foreground/50" />
          <div className="text-lg font-medium">
            로그인하고 진행중인 회차를 확인하세요
          </div>
          <p className="text-sm text-muted-foreground">
            티켓팅 진입은 로그인 후 이용할 수 있습니다.
          </p>
          <Button onClick={() => navigate("/login")}>로그인하기</Button>
        </div>
      ) : loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="text-sm text-destructive">{error}</div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            다시 시도
          </Button>
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.content.map((s) => (
              <TicketableScheduleCard
                key={s.scheduleId}
                schedule={s}
                onAction={handleAction}
              />
            ))}
          </div>

          {data.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={cn(
                      data.page === 0 && "pointer-events-none opacity-50",
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.page > 0) setPage(data.page - 1);
                    }}
                  />
                </PaginationItem>
                {pageNumbers.map((n, idx) =>
                  n === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={n === data.page}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(n);
                        }}
                      >
                        {n + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={cn(
                      data.page >= data.totalPages - 1 &&
                        "pointer-events-none opacity-50",
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.page < data.totalPages - 1)
                        setPage(data.page + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Ticket className="w-12 h-12 text-muted-foreground/50" />
          <div className="text-lg font-medium">
            현재 진행중인 회차가 없습니다
          </div>
          <p className="text-sm text-muted-foreground">
            새로고침으로 최신 스케줄을 확인할 수 있습니다.
          </p>
        </div>
      )}

      <TicketingQueueModal
        scheduleId={modalSchedule?.scheduleId ?? null}
        scheduleTitle={modalSchedule?.title}
        open={modalSchedule != null}
        onClose={() => setModalSchedule(null)}
        onPurchaseSuccess={fetchData}
      />
    </div>
    </>
  );
}

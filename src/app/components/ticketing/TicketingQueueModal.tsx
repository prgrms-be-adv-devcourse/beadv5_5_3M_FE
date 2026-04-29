import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { ticketService } from "../../services/ticketService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const POLLING_INTERVAL_MS = 5000;

interface Props {
  scheduleId: number | null;
  scheduleTitle?: string;
  open: boolean;
  onClose: () => void;
  /** 구매 성공 시 호출 (cart 새로고침 등 후처리) */
  onPurchaseSuccess?: () => void;
}

type Phase = "entering" | "queued" | "closed";

export function TicketingQueueModal({
  scheduleId,
  scheduleTitle,
  open,
  onClose,
  onPurchaseSuccess,
}: Props) {
  const [phase, setPhase] = useState<Phase>("entering");
  const [position, setPosition] = useState<number | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open || scheduleId == null) return;

    setPhase("entering");
    setPosition(null);

    let cancelled = false;

    const stopPolling = () => {
      if (pollRef.current != null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const closeWith = () => {
      stopPolling();
      setPhase("closed");
      onClose();
    };

    const startPolling = () => {
      stopPolling();
      pollRef.current = window.setInterval(async () => {
        if (cancelled) return;
        try {
          const res = await ticketService.getQueuePosition(scheduleId);
          if (cancelled) return;
          if (res.position === 0) {
            stopPolling();
            const tickets = await ticketService.getMyTickets(0, 10);
            const justBought = tickets.content.find(
              (t) => t.scheduleId === scheduleId && t.status === "CONFIRMED",
            );
            if (justBought) {
              toast.success("티켓팅 성공! 마이페이지에서 확인하세요.", {
                icon: "🎟️",
              });
              onPurchaseSuccess?.();
            } else {
              toast.info("대기열에서 빠졌습니다.");
            }
            closeWith();
          } else {
            setPosition(res.position);
          }
        } catch (err) {
          stopPolling();
          toast.error("순번 조회에 실패했습니다.");
          closeWith();
        }
      }, POLLING_INTERVAL_MS);
    };

    ticketService
      .enterQueue(scheduleId)
      .then((res) => {
        if (cancelled) return;
        if (res.type === "PURCHASED") {
          toast.success("티켓팅 성공! 마이페이지에서 확인하세요.", {
            icon: "🎟️",
          });
          onPurchaseSuccess?.();
          closeWith();
        } else if (res.type === "QUEUED") {
          setPhase("queued");
          setPosition(res.position ?? null);
          startPolling();
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message: string | undefined = err?.response?.data?.message;
        const status: number | undefined = err?.response?.status;
        if (status === 409 || message?.includes("매진")) {
          toast.error("매진되었습니다.");
        } else {
          toast.error(message ?? "티켓팅 진입에 실패했습니다.");
        }
        closeWith();
      });

    return () => {
      cancelled = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scheduleId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {phase === "queued" ? "대기열에 진입했습니다" : "티켓팅 진행중"}
          </DialogTitle>
          <DialogDescription>
            {scheduleTitle ?? "선택한 회차"}
          </DialogDescription>
        </DialogHeader>

        {phase === "entering" && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            <div className="text-sm text-muted-foreground">
              티켓팅 진입 중...
            </div>
          </div>
        )}

        {phase === "queued" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span className="text-sm">현재 내 순번</span>
            </div>
            <div className="text-5xl font-bold text-purple-500 tabular-nums">
              {position != null ? `${position}번` : "—"}
            </div>
            <div className="text-xs text-muted-foreground text-center leading-relaxed">
              앞 사람의 결제가 완료되면 자동으로 차례가 옵니다.
              <br />
              차례가 되면 자동으로 결제 처리되며, 결과는 토스트로 알려드립니다.
              <br />
              <span className="text-foreground/70">
                창을 닫아도 대기열은 유지됩니다.
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useNavigate } from "react-router";
import { TicketX, Clock, ServerCrash, RefreshCcw, Ban } from "lucide-react";
import { Button } from "../ui/button";
import type { StreamingSessionErrorCode } from "../../services/streamingService";

export interface StreamErrorScreenProps {
  code: StreamingSessionErrorCode;
  onRetry?: () => void;
}

const COPY: Record<
  StreamingSessionErrorCode,
  {
    Icon: typeof TicketX;
    title: string;
    description: string;
    primaryLabel: string;
    primaryAction: "navigate-mypage" | "navigate-main" | "retry";
    secondaryLabel?: string;
  }
> = {
  NO_ENTITLEMENT: {
    Icon: TicketX,
    title: "관람 권한이 없습니다",
    description: "이 회차에 대한 티켓이 없어요. 내 티켓을 다시 확인해 주세요.",
    primaryLabel: "내 티켓 보기",
    primaryAction: "navigate-mypage",
    secondaryLabel: "메인으로",
  },
  SCHEDULE_NOT_FOUND: {
    Icon: Ban,
    title: "회차를 찾을 수 없습니다",
    description: "삭제되었거나 잘못된 회차일 수 있어요.",
    primaryLabel: "메인으로",
    primaryAction: "navigate-main",
  },
  WINDOW_CLOSED: {
    Icon: Clock,
    title: "관람 시간이 아닙니다",
    description: "시작 10분 전부터 입장할 수 있고, 종료 10분 후 자동 퇴장합니다.",
    primaryLabel: "내 티켓 보기",
    primaryAction: "navigate-mypage",
  },
  STREAM_LOCATION_UNAVAILABLE: {
    Icon: ServerCrash,
    title: "스트리밍을 준비 중입니다",
    description: "잠시 후 다시 시도해 주세요.",
    primaryLabel: "다시 시도",
    primaryAction: "retry",
    secondaryLabel: "내 티켓 보기",
  },
  SESSION_EXPIRED: {
    Icon: RefreshCcw,
    title: "세션이 만료되었어요",
    description: "다시 입장해 주세요.",
    primaryLabel: "다시 시도",
    primaryAction: "retry",
  },
  SESSION_MISMATCH: {
    Icon: RefreshCcw,
    title: "다른 곳에서 시청 중이에요",
    description: "한 계정은 한 곳에서만 시청할 수 있어요.",
    primaryLabel: "다시 시도",
    primaryAction: "retry",
    secondaryLabel: "내 티켓 보기",
  },
  INVALID_TOKEN: {
    Icon: RefreshCcw,
    title: "인증에 실패했어요",
    description: "다시 시도해 주세요.",
    primaryLabel: "다시 시도",
    primaryAction: "retry",
  },
  UNKNOWN: {
    Icon: ServerCrash,
    title: "스트리밍을 시작할 수 없어요",
    description: "일시적인 문제일 수 있어요. 잠시 후 다시 시도해 주세요.",
    primaryLabel: "다시 시도",
    primaryAction: "retry",
    secondaryLabel: "메인으로",
  },
};

export function StreamErrorScreen({ code, onRetry }: StreamErrorScreenProps) {
  const navigate = useNavigate();
  const copy = COPY[code];
  const { Icon } = copy;

  const handlePrimary = () => {
    if (copy.primaryAction === "navigate-mypage") navigate("/mypage");
    else if (copy.primaryAction === "navigate-main") navigate("/main");
    else onRetry?.();
  };

  const handleSecondary = () => {
    if (copy.secondaryLabel === "메인으로") navigate("/main");
    else navigate("/mypage");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 text-white">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <Icon className="w-8 h-8 text-white/90" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">{copy.title}</h1>
        <p className="text-white/70 mb-8">{copy.description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handlePrimary}>{copy.primaryLabel}</Button>
          {copy.secondaryLabel && (
            <Button variant="ghost" className="text-white" onClick={handleSecondary}>
              {copy.secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

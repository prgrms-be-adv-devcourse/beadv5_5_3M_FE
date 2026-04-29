import { Cookie } from "lucide-react";
import {
  ScheduleStatus,
  TicketableScheduleResponse,
} from "../../services/ticketService";
import { getImageUrl, getPlaceholderPoster } from "../../services/movieService";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardTitle } from "../ui/card";
import { cn } from "../ui/utils";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface Props {
  schedule: TicketableScheduleResponse;
  onAction: (schedule: TicketableScheduleResponse) => void;
}

interface PhaseInfo {
  label: string;
  cta: string;
  badgeClass: string;
}

const PHASE_INFO: Record<
  Extract<ScheduleStatus, "CART" | "IN_PROGRESSING" | "TICKETING">,
  PhaseInfo
> = {
  CART: {
    label: "장바구니",
    cta: "장바구니 담으러 가기",
    badgeClass: "bg-blue-500 text-white",
  },
  IN_PROGRESSING: {
    label: "가결제",
    cta: "결제하러 가기",
    badgeClass: "bg-amber-500 text-white",
  },
  TICKETING: {
    label: "티켓팅",
    cta: "티켓팅 입장",
    badgeClass: "bg-purple-600 text-white",
  },
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatShowTime(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endStr = sameDay
    ? `${pad(end.getHours())}:${pad(end.getMinutes())}`
    : `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return `${startStr} ~ ${endStr}`;
}

export function TicketableScheduleCard({ schedule, onAction }: Props) {
  const phaseInfo =
    PHASE_INFO[schedule.status as keyof typeof PHASE_INFO] ?? {
      label: schedule.status,
      cta: "자세히",
      badgeClass: "bg-slate-500 text-white",
    };
  const isTicketing = schedule.status === "TICKETING";
  const soldOut = isTicketing && (schedule.availableSeats ?? 0) === 0;
  const remaining = schedule.availableSeats ?? 0;

  const handleClick = () => {
    if (soldOut) return;
    onAction(schedule);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all p-0 gap-0",
        soldOut
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
      )}
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <ImageWithFallback
          src={
            getImageUrl(schedule.imageUrl ?? undefined) ??
            getPlaceholderPoster(schedule.movieId)
          }
          alt={schedule.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <Badge className={cn("border-0", phaseInfo.badgeClass)}>
            {phaseInfo.label}
          </Badge>
        </div>
        {soldOut && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">매진</Badge>
          </div>
        )}
      </div>
      <CardContent className="flex flex-col gap-2 px-4 py-4">
        <CardTitle className="line-clamp-2 min-h-[2.5em] text-base">
          {schedule.title}
        </CardTitle>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div>
            <span className="text-foreground/70">티켓팅 시작</span>{" "}
            {formatDateTime(schedule.ticketingTime)}
          </div>
          <div>
            <span className="text-foreground/70">상영</span>{" "}
            {formatShowTime(schedule.startTime, schedule.endTime)}
          </div>
          <div className="flex items-center gap-1.5">
            <Cookie className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium text-foreground">
              {schedule.cookie.toLocaleString()}
            </span>
          </div>
          {isTicketing && schedule.availableSeats != null && (
            <div
              className={cn(
                "font-medium",
                soldOut ? "text-destructive" : "text-foreground",
              )}
            >
              {soldOut
                ? "매진"
                : `남은 좌석 ${remaining}석 / 총 ${schedule.totalSeats}석`}
            </div>
          )}
        </div>
        <Button
          variant="default"
          className="w-full mt-2"
          disabled={soldOut}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {soldOut ? "매진" : phaseInfo.cta}
        </Button>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { Clock, Radio, Hourglass, CircleStop, AlertTriangle } from "lucide-react";
import type { StreamState } from "../../services/streamingService";

export interface StateBannerProps {
  state: StreamState;
  startTime: string;
  endTime: string;
  title: string;
  imageUrl: string | null;
}

const formatRemaining = (targetMs: number) => {
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((targetMs - now) / 1000));
  const m = Math.floor(diffSec / 60);
  const s = diffSec % 60;
  if (m > 0) return `${m}분 ${s.toString().padStart(2, "0")}초`;
  return `${s}초`;
};

export function StateBanner({ state, startTime, endTime, title, imageUrl }: StateBannerProps) {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const content = (() => {
    switch (state) {
      case "CLOSED":
      case "LOBBY_OPEN":
        return {
          Icon: Clock,
          tone: "text-sky-300",
          title: "곧 시작합니다",
          subtitle: `시작까지 ${formatRemaining(startMs)} 남았어요`,
          desc: "채팅으로 다른 시청자와 미리 인사를 나눠보세요.",
        };
      case "STARTING_SOON":
        return {
          Icon: Hourglass,
          tone: "text-amber-300",
          title: "잠시 후 시작",
          subtitle: `${formatRemaining(startMs)} 후 본방송이 시작돼요`,
          desc: "재생이 자동으로 시작됩니다.",
        };
      case "ENDING_SOON":
        return {
          Icon: Radio,
          tone: "text-amber-300",
          title: "곧 종료",
          subtitle: `종료까지 ${formatRemaining(endMs)} 남음`,
          desc: "마지막까지 함께해요.",
        };
      case "ENDED":
        return {
          Icon: CircleStop,
          tone: "text-rose-300",
          title: "방송이 종료되었습니다",
          subtitle: "관람해 주셔서 감사합니다.",
          desc: "잠시 후 채팅도 종료돼요.",
        };
      case "FORCE_EXIT":
        return {
          Icon: AlertTriangle,
          tone: "text-rose-400",
          title: "관람 시간이 종료되었어요",
          subtitle: "곧 메인 화면으로 이동합니다.",
          desc: "",
        };
      default:
        return null;
    }
  })();

  if (!content) return null;
  const { Icon, tone, title: caption, subtitle, desc } = content;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-black via-black/95 to-black/85 text-white px-6 text-center">
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center blur-md"
          style={{ backgroundImage: `url(${imageUrl})` }}
          aria-hidden
        />
      )}
      <div className="relative z-10 flex flex-col items-center max-w-md">
        <Icon className={`w-12 h-12 mb-4 ${tone}`} />
        <h2 className="text-2xl font-semibold mb-2">{caption}</h2>
        <p className="text-base text-white/90 mb-1">{subtitle}</p>
        {desc && <p className="text-sm text-white/60">{desc}</p>}
        <div className="mt-6 text-xs text-white/50">{title}</div>
      </div>
    </div>
  );
}

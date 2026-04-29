import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { attachHls, type HlsHandle } from "../../lib/streamingHls";

export interface StreamPlayerProps {
  manifestUrl: string;
  scheduleStartTime: string;
  enabled: boolean;
  onFatalError?: (kind: "AUTH" | "WINDOW_CLOSED" | "NETWORK" | "MEDIA" | "OTHER") => void;
}

export function StreamPlayer({
  manifestUrl,
  scheduleStartTime,
  enabled,
  onFatalError,
}: StreamPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsHandleRef = useRef<HlsHandle | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!enabled || !videoRef.current) return;
    const handle = attachHls({
      video: videoRef.current,
      manifestUrl,
      scheduleStartTime,
      onFatalError,
    });
    hlsHandleRef.current = handle;
    videoRef.current.play().catch(() => {
      // autoplay 정책으로 실패 시 사용자 클릭 필요 — 그대로 둠
    });
    return () => {
      handle.destroy();
      hlsHandleRef.current = null;
    };
  }, [enabled, manifestUrl, scheduleStartTime, onFatalError]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      hlsHandleRef.current?.jumpToLive();
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (next: number[]) => {
    const value = next[0] ?? 1;
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      if (value === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (videoRef.current.muted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleToggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden"
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={false}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={handleToggleMute}
          aria-label={isMuted ? "음소거 해제" : "음소거"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>

        <div className="w-32">
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={handleVolumeChange}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold tracking-wide">
            LIVE
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? "전체화면 해제" : "전체화면"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

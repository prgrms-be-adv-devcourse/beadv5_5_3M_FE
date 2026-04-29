import Hls, { type HlsConfig, type LoaderCallbacks, type LoaderConfig, type LoaderContext } from "hls.js";

/** http://백엔드 절대 URL → 상대 경로로 변환 (Mixed Content 방지) */
function rewriteToRelative(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" && u.hostname !== window.location.hostname) {
      return u.pathname + u.search;
    }
  } catch {
    // 이미 상대 경로인 경우
  }
  return url;
}

class RewriteLoader {
  private inner: Hls.Loader<LoaderContext>;
  constructor(config: HlsConfig) {
    this.inner = new (Hls.DefaultConfig.loader as new (cfg: HlsConfig) => Hls.Loader<LoaderContext>)(config);
  }
  load(ctx: LoaderContext, cfg: LoaderConfig, cbs: LoaderCallbacks<LoaderContext>) {
    ctx.url = rewriteToRelative(ctx.url);
    this.inner.load(ctx, cfg, cbs);
  }
  abort() { this.inner.abort(); }
  destroy() { this.inner.destroy(); }
  get stats() { return this.inner.stats; }
  get context() { return this.inner.context; }
}

export interface AttachHlsOptions {
  video: HTMLVideoElement;
  manifestUrl: string;
  scheduleStartTime: string;
  onFatalError?: (kind: "AUTH" | "WINDOW_CLOSED" | "NETWORK" | "MEDIA" | "OTHER") => void;
}

export interface HlsHandle {
  destroy: () => void;
  jumpToLive: () => void;
}

const enforceNormalRate = (video: HTMLVideoElement) => {
  if (video.playbackRate !== 1) video.playbackRate = 1;
  if (video.defaultPlaybackRate !== 1) video.defaultPlaybackRate = 1;
};

const computeLiveOffsetSeconds = (scheduleStartTime: string) => {
  const startMs = new Date(scheduleStartTime).getTime();
  const nowMs = Date.now();
  const diff = (nowMs - startMs) / 1000;
  return diff > 0 ? diff : 0;
};

export function attachHls({
  video,
  manifestUrl,
  scheduleStartTime,
  onFatalError,
}: AttachHlsOptions): HlsHandle {
  enforceNormalRate(video);

  const handleRateChange = () => enforceNormalRate(video);
  video.addEventListener("ratechange", handleRateChange);

  const seekToLiveEdge = () => {
    const target = computeLiveOffsetSeconds(scheduleStartTime);
    if (Number.isFinite(target)) {
      try {
        video.currentTime = target;
      } catch {
        // 시킹 가능 범위를 벗어난 경우 hls.js가 다음 manifest 갱신에서 보정
      }
    }
  };

  let hls: Hls | null = null;

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      loader: RewriteLoader as unknown as HlsConfig["loader"],
    });
    hls.on(Hls.Events.MANIFEST_PARSED, seekToLiveEdge);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      const status = data.response?.code;
      if (status === 401) {
        onFatalError?.("AUTH");
        return;
      }
      if (status === 410) {
        onFatalError?.("WINDOW_CLOSED");
        return;
      }
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        onFatalError?.("NETWORK");
        return;
      }
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        onFatalError?.("MEDIA");
        return;
      }
      onFatalError?.("OTHER");
    });
    hls.loadSource(manifestUrl);
    hls.attachMedia(video);
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = manifestUrl;
    video.addEventListener("loadedmetadata", seekToLiveEdge, { once: true });
  } else {
    onFatalError?.("OTHER");
  }

  const destroy = () => {
    video.removeEventListener("ratechange", handleRateChange);
    if (hls) {
      hls.destroy();
      hls = null;
    }
    video.removeAttribute("src");
    video.load();
  };

  return {
    destroy,
    jumpToLive: seekToLiveEdge,
  };
}

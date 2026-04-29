import { Client, type IFrame, type IMessage, type StompHeaders } from "@stomp/stompjs";
import type {
  ChatMessage,
  KickMessage,
  StateMessage,
  ViewerCountMessage,
  WsErrorMessage,
} from "../services/streamingService";

export type WsConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

export interface StreamStompHandlers {
  onState?: (msg: StateMessage) => void;
  onChat?: (msg: ChatMessage) => void;
  onViewers?: (msg: ViewerCountMessage) => void;
  onKick?: (msg: KickMessage) => void;
  onWsError?: (msg: WsErrorMessage) => void;
  onConnectionStateChange?: (state: WsConnectionState) => void;
  onConnectFailed?: (errorCode?: string, message?: string) => void;
}

export interface StreamStompOptions {
  wsEndpoint: string;
  sessionToken: string;
  scheduleId: number;
  handlers: StreamStompHandlers;
}

const MAX_BACKOFF_MS = 30_000;

const parseJson = <T,>(frame: IMessage): T | null => {
  try {
    return JSON.parse(frame.body) as T;
  } catch {
    return null;
  }
};

/**
 * 백엔드가 wsEndpoint로 절대 URL이 아닌 상대경로(예: "/ws/stream")를 반환하는 경우
 * VITE_API_BASE_URL(또는 현재 origin) 기준으로 ws[s]:// 절대 URL을 합성한다.
 * @stomp/stompjs는 brokerURL에 절대 ws[s]:// URL을 요구한다.
 *
 * Vercel rewrites는 WebSocket upgrade를 프록시하지 못하므로 WS는
 * Vercel을 우회해 백엔드 호스트(VITE_API_BASE_URL)로 직결해야 한다.
 */
function resolveWsUrl(raw: string): string {
  if (/^wss?:\/\//i.test(raw)) return raw;
  const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const baseUrl = new URL(apiBase);
  const wsScheme = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${wsScheme}//${baseUrl.host}${path}`;
}

export class StreamStomp {
  private client: Client;
  private kicked = false;
  private retryCount = 0;
  private state: WsConnectionState = "connecting";

  constructor(private opts: StreamStompOptions) {
    this.client = new Client({
      brokerURL: resolveWsUrl(opts.wsEndpoint),
      connectHeaders: {
        token: opts.sessionToken,
      } as StompHeaders,
      reconnectDelay: 1000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      // 자체 백오프 구현은 onWebSocketClose에서 reconnectDelay를 직접 갱신
      onConnect: () => this.handleConnected(),
      onStompError: (frame) => this.handleStompError(frame),
      onWebSocketClose: () => this.handleSocketClose(),
      onWebSocketError: () => this.handleSocketError(),
    });
  }

  activate() {
    this.setState("connecting");
    this.client.activate();
  }

  async disconnect() {
    this.kicked = true;
    try {
      await this.client.deactivate();
    } catch {
      // ignore
    }
    this.setState("disconnected");
  }

  sendChat(content: string) {
    if (!this.client.connected) return false;
    this.client.publish({
      destination: `/app/chat/schedule/${this.opts.scheduleId}`,
      body: JSON.stringify({ content }),
    });
    return true;
  }

  private setState(next: WsConnectionState) {
    if (this.state === next) return;
    this.state = next;
    this.opts.handlers.onConnectionStateChange?.(next);
  }

  private handleConnected() {
    this.retryCount = 0;
    this.client.reconnectDelay = 1000;
    this.setState("connected");

    const { scheduleId, handlers } = this.opts;

    this.client.subscribe(`/topic/state/schedule/${scheduleId}`, (frame) => {
      const msg = parseJson<StateMessage>(frame);
      if (msg) handlers.onState?.(msg);
    });

    this.client.subscribe(`/topic/chat/schedule/${scheduleId}`, (frame) => {
      const msg = parseJson<ChatMessage>(frame);
      if (msg) handlers.onChat?.(msg);
    });

    this.client.subscribe(`/topic/viewers/schedule/${scheduleId}`, (frame) => {
      const msg = parseJson<ViewerCountMessage>(frame);
      if (msg) handlers.onViewers?.(msg);
    });

    this.client.subscribe("/user/queue/kick", (frame) => {
      const msg = parseJson<KickMessage>(frame);
      if (!msg) return;
      this.kicked = true;
      this.client.reconnectDelay = 0;
      handlers.onKick?.(msg);
      this.client.deactivate().catch(() => {});
      this.setState("disconnected");
    });

    this.client.subscribe("/user/queue/errors", (frame) => {
      const msg = parseJson<WsErrorMessage>(frame);
      if (msg) handlers.onWsError?.(msg);
    });
  }

  private handleStompError(frame: IFrame) {
    // CONNECT 단계에서의 거부(NO_ENTITLEMENT/SESSION_EXPIRED 등)는 재연결 의미 없음
    const errorCode = frame.headers["message"];
    const detail = frame.body;
    this.kicked = true;
    this.client.reconnectDelay = 0;
    this.opts.handlers.onConnectFailed?.(errorCode, detail);
    this.setState("disconnected");
  }

  private handleSocketError() {
    if (this.kicked) return;
    this.setState("reconnecting");
  }

  private handleSocketClose() {
    if (this.kicked) {
      this.setState("disconnected");
      return;
    }
    this.retryCount += 1;
    const next = Math.min(1000 * 2 ** (this.retryCount - 1), MAX_BACKOFF_MS);
    this.client.reconnectDelay = next;
    this.setState("reconnecting");
  }
}

export function connectStreamStomp(opts: StreamStompOptions): StreamStomp {
  const stomp = new StreamStomp(opts);
  stomp.activate();
  return stomp;
}

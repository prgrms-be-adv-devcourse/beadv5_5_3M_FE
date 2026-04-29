import apiClient from "./apiClient";

export interface StreamingScheduleSummary {
  scheduleId: number;
  title: string;
  startTime: string;
  endTime: string;
  imageUrl: string | null;
}

export interface StreamingSessionResponse {
  sessionToken: string;
  sessionId: string;
  manifestUrl: string;
  wsEndpoint: string;
  expiresAt: string;
  schedule: StreamingScheduleSummary;
}

export type StreamState =
  | "CLOSED"
  | "LOBBY_OPEN"
  | "STARTING_SOON"
  | "STARTED"
  | "ENDING_SOON"
  | "ENDED"
  | "FORCE_EXIT";

export interface StateMessage {
  state: StreamState;
  at: string;
}

export interface ChatMessage {
  messageId: string;
  userId: string;
  nickname: string;
  content: string;
  at: string;
}

export interface ViewerCountMessage {
  count: number;
  at: string;
}

export type KickReason = "DUPLICATE_LOGIN" | "FORCE_EXIT";

export interface KickMessage {
  reason: KickReason;
  at: string;
}

export type WsErrorCode = "CHAT_RATE_LIMITED" | "CHAT_MESSAGE_TOO_LONG";

export interface WsErrorMessage {
  code: WsErrorCode;
  message: string;
}

export type StreamingSessionErrorCode =
  | "NO_ENTITLEMENT"
  | "SCHEDULE_NOT_FOUND"
  | "WINDOW_CLOSED"
  | "STREAM_LOCATION_UNAVAILABLE"
  | "SESSION_EXPIRED"
  | "SESSION_MISMATCH"
  | "INVALID_TOKEN"
  | "UNKNOWN";

function toRelativePath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

export const streamingService = {
  async createSession(scheduleId: number): Promise<StreamingSessionResponse> {
    const res = await apiClient.post<StreamingSessionResponse>(
      "/api/streaming/sessions",
      { scheduleId },
    );
    return {
      ...res.data,
      manifestUrl: toRelativePath(res.data.manifestUrl),
      wsEndpoint: toRelativePath(res.data.wsEndpoint),
    };
  },
};

export function mapStreamingError(err: unknown): StreamingSessionErrorCode {
  const anyErr = err as { response?: { status?: number; data?: { message?: string; code?: string } } };
  const status = anyErr?.response?.status;
  const code = anyErr?.response?.data?.code ?? anyErr?.response?.data?.message;
  if (code === "NO_ENTITLEMENT") return "NO_ENTITLEMENT";
  if (code === "SCHEDULE_NOT_FOUND") return "SCHEDULE_NOT_FOUND";
  if (code === "WINDOW_CLOSED") return "WINDOW_CLOSED";
  if (code === "STREAM_LOCATION_UNAVAILABLE") return "STREAM_LOCATION_UNAVAILABLE";
  if (code === "SESSION_EXPIRED") return "SESSION_EXPIRED";
  if (code === "SESSION_MISMATCH") return "SESSION_MISMATCH";
  if (code === "INVALID_TOKEN") return "INVALID_TOKEN";
  if (status === 403) return "NO_ENTITLEMENT";
  if (status === 404) return "SCHEDULE_NOT_FOUND";
  if (status === 410) return "WINDOW_CLOSED";
  if (status === 502) return "STREAM_LOCATION_UNAVAILABLE";
  return "UNKNOWN";
}

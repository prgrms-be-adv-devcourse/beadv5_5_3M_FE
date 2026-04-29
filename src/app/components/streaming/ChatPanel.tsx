import { useEffect, useRef, useState } from "react";
import { Send, Users, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import type { ChatMessage } from "../../services/streamingService";
import type { WsConnectionState } from "../../lib/streamingStomp";

const MAX_LEN = 500;
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX = 3;

export interface ChatPanelProps {
  messages: ChatMessage[];
  viewerCount: number;
  wsState: WsConnectionState;
  onSend: (content: string) => void;
  selfUserId: string | null;
}

export function ChatPanel({
  messages,
  viewerCount,
  wsState,
  onSend,
  selfUserId,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sendTimestampsRef = useRef<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;
    if (content.length > MAX_LEN) {
      setError(`메시지는 최대 ${MAX_LEN}자까지 입력할 수 있어요.`);
      return;
    }

    const now = Date.now();
    const recent = sendTimestampsRef.current.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS,
    );
    if (recent.length >= RATE_LIMIT_MAX) {
      setError("너무 자주 보내고 있어요. 잠시만요.");
      return;
    }
    recent.push(now);
    sendTimestampsRef.current = recent;

    onSend(content);
    setDraft("");
    setError(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const disabled = wsState !== "connected";

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            시청자 <span className="font-semibold">{viewerCount.toLocaleString()}</span>명
          </span>
        </div>
        <ConnectionBadge state={wsState} />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            아직 채팅이 없어요. 먼저 인사를 건네보세요.
          </div>
        ) : (
          messages.map((msg) => (
            <ChatRow key={msg.messageId} msg={msg} isMe={msg.userId === selfUserId} />
          ))
        )}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        {error && <div className="text-xs text-destructive">{error}</div>}
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            maxLength={MAX_LEN}
            placeholder={disabled ? "연결 중..." : "메시지를 입력하세요"}
            disabled={disabled}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={onKeyDown}
          />
          <Button
            size="icon"
            disabled={disabled || draft.trim().length === 0}
            onClick={handleSend}
            aria-label="전송"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {draft.length}/{MAX_LEN}
        </div>
      </div>
    </div>
  );
}

function ChatRow({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  return (
    <div className="text-sm leading-snug">
      <span
        className={cn(
          "font-semibold mr-2",
          isMe ? "text-primary" : "text-foreground/80",
        )}
      >
        {msg.nickname}
      </span>
      <span className="text-foreground/90 break-words">{msg.content}</span>
    </div>
  );
}

function ConnectionBadge({ state }: { state: WsConnectionState }) {
  if (state === "connected") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-500">
        <Wifi className="w-3.5 h-3.5" /> 연결됨
      </span>
    );
  }
  if (state === "reconnecting" || state === "connecting") {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {state === "connecting" ? "연결 중" : "재연결 중"}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <WifiOff className="w-3.5 h-3.5" /> 연결 끊김
    </span>
  );
}

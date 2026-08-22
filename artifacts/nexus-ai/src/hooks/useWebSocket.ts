import { useEffect, useRef, useState, useCallback } from "react";
import { getWsUrl } from "@/lib/api";

export interface AgentStance {
  role_id: string;
  role_name: string;
  stance: string;
  icon: string;
  content: string;
}

export interface ConflictAnalysis {
  agents?: AgentStance[];
  points_of_agreement?: string[];
  points_of_disagreement?: string[];
  verdict_summary?: string;
}

interface UseWebSocketOptions {
  onDebateStart?: (council: any) => void;
  onStancesComplete?: (responses: AgentStance[]) => void;
  onSynthesizerChunk?: (chunk: string) => void;
  onDebateComplete?: (fullText: string, conflictAnalysis: ConflictAnalysis, conversationId: string) => void;
  onError?: (message: string) => void;
  onStatusChange?: (status: string) => void;
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const [status, setStatus] = useState<string>("Disconnected");
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeStances, setActiveStances] = useState<AgentStance[]>([]);
  const [conflictAnalysis, setConflictAnalysis] = useState<ConflictAnalysis | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef<number>(1000);
  const pendingMessageRef = useRef<any>(null);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus("Connecting...");
    if (optionsRef.current?.onStatusChange) {
      optionsRef.current.onStatusChange("Connecting...");
    }

    const wsUrl = getWsUrl();

    const token = localStorage.getItem("nexus_token") || localStorage.getItem("clerk_session");
    const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("Connected");
      if (optionsRef.current?.onStatusChange) {
        optionsRef.current.onStatusChange("Connected");
      }
      reconnectDelayRef.current = 1000;
      setError(null);

      // Auto-flush queued message if sent while connecting
      if (pendingMessageRef.current) {
        const pending = pendingMessageRef.current;
        pendingMessageRef.current = null;
        try {
          ws.send(
            JSON.stringify({
              type: "user_message",
              content: pending.content,
              conversationId: pending.conversationId,
              provider: pending.provider,
              councilId: pending.councilId,
            })
          );
        } catch (e) {
          console.error("Failed to send queued message:", e);
        }
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "status":
            setStatus(msg.message);
            if (optionsRef.current?.onStatusChange) {
              optionsRef.current.onStatusChange(msg.message);
            }
            break;

          case "rate_limit_status":
            setRemaining(msg.remaining);
            setLimit(msg.limit);
            break;

          case "debate_start":
            setIsStreaming(true);
            setActiveStances([]);
            setConflictAnalysis(null);
            setStreamedContent("");
            if (optionsRef.current?.onDebateStart) {
              optionsRef.current.onDebateStart(msg.council);
            }
            break;

          case "agent_stances_complete":
            setActiveStances(msg.agent_responses || []);
            if (optionsRef.current?.onStancesComplete) {
              optionsRef.current.onStancesComplete(msg.agent_responses);
            }
            break;

          case "synthesizer_chunk":
          case "agent_response_chunk":
            setStreamedContent((prev) => prev + (msg.content || ""));
            if (optionsRef.current?.onSynthesizerChunk) {
              optionsRef.current.onSynthesizerChunk(msg.content);
            }
            break;

          case "debate_complete":
          case "final_response":
            setIsStreaming(false);
            if (msg.conflict_analysis) {
              setConflictAnalysis(msg.conflict_analysis);
            }
            if (optionsRef.current?.onDebateComplete) {
              optionsRef.current.onDebateComplete(
                msg.full_text || msg.content || "",
                msg.conflict_analysis || {},
                msg.conversationId
              );
            }
            break;

          case "error":
            setIsStreaming(false);
            setError(msg.message);
            if (optionsRef.current?.onError) {
              optionsRef.current.onError(msg.message);
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      setStatus("Disconnected");
      wsRef.current = null;
      setIsStreaming(false);
    };

    ws.onerror = (err) => {
      setError("WebSocket connection error.");
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close(1000, "Component unmounted");
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  const sendMessage = useCallback((content: string, conversationId?: string, provider: string = "groq", councilId: string = "general") => {
    setError(null);
    setStreamedContent("");
    setActiveStances([]);
    setConflictAnalysis(null);
    setIsStreaming(true);

    const messagePayload = { content, conversationId, provider, councilId };

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Queue message to send as soon as WebSocket connects
      pendingMessageRef.current = messagePayload;
      return true;
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          type: "user_message",
          content,
          conversationId,
          provider,
          councilId,
        })
      );
      return true;
    } catch (err) {
      console.error("Error sending WebSocket message:", err);
      pendingMessageRef.current = messagePayload;
      return false;
    }
  }, []);

  return {
    status,
    streamedContent,
    isStreaming,
    activeStances,
    conflictAnalysis,
    remaining,
    limit,
    error,
    sendMessage,
    reconnect: connect,
  };
}

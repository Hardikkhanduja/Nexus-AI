import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
  onMessage?: (chunk: string, agent: string) => void;
  onCompleted?: (content: string, conversationId: string, title: string) => void;
  onError?: (message: string) => void;
  onStatusChange?: (status: string) => void;
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const [status, setStatus] = useState<string>("Disconnected");
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef<number>(1000);
  const maxReconnectDelay = 30000;

  // Keep options in a ref so we don't trigger reconnections when they change
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

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_WS_HOST || "localhost:3000";
    const wsUrl = `${protocol}//${host}/ws/chat`;

    const token = localStorage.getItem("nexus_token");
    const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("Connected");
      if (optionsRef.current?.onStatusChange) {
        optionsRef.current.onStatusChange("Connected");
      }
      reconnectDelayRef.current = 1000; // Reset reconnect delay
      setError(null);
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

          case "agent_response_chunk":
            setStreamedContent((prev) => prev + msg.content);
            if (optionsRef.current?.onMessage) {
              optionsRef.current.onMessage(msg.content, msg.agent);
            }
            break;

          case "agent_completed":
            // Managed in final_response or here
            break;

          case "final_response":
            setIsStreaming(false);
            if (optionsRef.current?.onCompleted) {
              optionsRef.current.onCompleted(msg.content, msg.conversationId, msg.title || "New Conversation");
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
            console.warn("Unknown message type:", msg);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = (event) => {
      setStatus("Disconnected");
      if (optionsRef.current?.onStatusChange) {
        optionsRef.current.onStatusChange("Disconnected");
      }
      wsRef.current = null;
      setIsStreaming(false);

      // Don't reconnect on clean close or if authorization failed (status 4003)
      if (event.code !== 1000 && event.code !== 4008) {
        scheduleReconnect();
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection error.");
      if (optionsRef.current?.onError) {
        optionsRef.current.onError("WebSocket connection error.");
      }
    };
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnecting to WebSocket... (delay: ${reconnectDelayRef.current}ms)`);
      connect();
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, maxReconnectDelay);
    }, reconnectDelayRef.current);
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content: string, conversationId?: string, provider: string = "openai") => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Cannot send message. WebSocket is not connected.");
      return false;
    }

    setError(null);
    setStreamedContent("");
    setIsStreaming(true);

    wsRef.current.send(
      JSON.stringify({
        type: "user_message",
        content,
        conversationId,
        provider,
      })
    );

    return true;
  }, []);

  return {
    status,
    streamedContent,
    isStreaming,
    remaining,
    limit,
    error,
    sendMessage,
    reconnect: connect,
  };
}

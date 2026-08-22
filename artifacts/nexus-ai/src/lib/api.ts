/**
 * Centralized API & WebSocket Endpoint Resolver for Nexus AI
 * Automatically resolves Zerops production subdomains (app-xxx -> api-xxx-8000)
 */

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim().length > 0 && !envUrl.includes("nexus-ai.zerops.app")) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const host = window.location.host;
    // Handle Zerops production environment dynamically: app-24a.ny1.zerops.app -> https://api-24a-8000.ny1.zerops.app
    if (host.includes(".zerops.app")) {
      const apiHost = host.replace(/^app-/, "api-").replace(/(\.[a-z0-9]+\.zerops\.app)$/, "-8080$1");
      return `${window.location.protocol}//${apiHost}`;
    }
  }

  return "";
}

export function getApiUrl(endpointPath: string): string {
  const base = getApiBaseUrl();
  const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  return `${base}${cleanPath}`;
}

export function getWsUrl(): string {
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs && envWs.trim().length > 0 && !envWs.includes("nexus-ai.zerops.app")) {
    return envWs;
  }

  if (typeof window !== "undefined") {
    const host = window.location.host;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    if (host.includes(".zerops.app")) {
      const apiHost = host.replace(/^app-/, "api-").replace(/(\.[a-z0-9]+\.zerops\.app)$/, "-8080$1");
      return `${protocol}//${apiHost}/ws/chat`;
    }
    return `${protocol}//${host}/ws/chat`;
  }

  return "ws://localhost:8000/ws/chat";
}

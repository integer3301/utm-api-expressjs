import { logger } from "../utils/logger";

const STOMP_COMMANDS = {
  CONNECT: "CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\0",
  SUBSCRIBE_DOCS: "SUBSCRIBE\nid:sub-0\ndestination:/app/documents\n\n\0",
  SUBSCRIBE_TOPIC: "SUBSCRIBE\nid:sub-1\ndestination:/topic/documents\n\n\0",
};

const RECONNECT_INTERVALS = {
  ERROR: 10000,
  CLOSE: 5000,
};

export type WebSocketHandlers = {
  onMessage: (data: any) => void;
  onStatusChange: (status: "online" | "offline") => void;
};

interface ServerConfig {
  id: number;
  ip: string;
  port: number;
}

type ActiveConnection = {
  ws: WebSocket | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  isTerminated: boolean;
};

export class WebSocketService {
  private connections = new Map<number, ActiveConnection>();

  public connect(server: ServerConfig, handlers: WebSocketHandlers) {
    const { id, ip, port } = server;

    this.disconnectById(id);

    const connectionState: ActiveConnection = {
      ws: null,
      reconnectTimer: null,
      isTerminated: false,
    };
    this.connections.set(id, connectionState);

    const run = async () => {
      if (connectionState.isTerminated) return;

      try {
        const sid = Math.random().toString(36).substring(2, 10);
        const wsUrl = `ws://${ip}:${port}/websocket/000/${sid}/websocket`;

        await fetch(`http://${ip}:${port}/websocket/info?t=${Date.now()}`);

        const ws = new WebSocket(wsUrl);
        connectionState.ws = ws;

        this.setupEventListeners(ws, server, handlers, connectionState, run);
      } catch (err) {
        this.handleError(server, handlers, connectionState, run, err);
      }
    };

    logger.info(`Register connection for ${ip}:${port}`);
    run();
  }

  private setupEventListeners(
    ws: WebSocket,
    server: ServerConfig,
    handlers: WebSocketHandlers,
    state: ActiveConnection,
    reconnectFn: () => void
  ) {
    ws.onopen = () => {
      this.sendStompFrame(ws, STOMP_COMMANDS.CONNECT);
    };

    ws.onmessage = (event) => {
      this.processMessage(event.data.toString(), ws, handlers, server);
    };

    ws.onclose = () => {
      handlers.onStatusChange("offline");
      this.scheduleReconnect(state, reconnectFn, RECONNECT_INTERVALS.CLOSE);
    };

    ws.onerror = () => ws.close();
  }

  private processMessage(
    msg: string,
    ws: WebSocket,
    handlers: WebSocketHandlers,
    server: ServerConfig
  ) {
    if (msg === "h") return; // Heartbeat
    if (!msg.startsWith("a[")) return;

    try {
      const stompFrame = JSON.parse(msg.slice(1))[0];

      if (stompFrame.startsWith("CONNECTED")) {
        handlers.onStatusChange("online");
        this.sendStompFrame(ws, STOMP_COMMANDS.SUBSCRIBE_DOCS);
        this.sendStompFrame(ws, STOMP_COMMANDS.SUBSCRIBE_TOPIC);
        logger.info(`Connected to ${server.ip} success`);
      }

      if (stompFrame.startsWith("MESSAGE")) {
        const body = stompFrame.split("\n\n")[1]?.split("\0")[0];
        if (body) {
          const parsedData = JSON.parse(body);
          handlers.onMessage(parsedData);
        }
      }
    } catch (e) {
      logger.error(`Parsing error from ${server.ip}: ${e}`);
    }
  }

  private sendStompFrame(ws: WebSocket, frame: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify([frame]));
    }
  }

  private handleError(
    server: ServerConfig,
    handlers: WebSocketHandlers,
    state: ActiveConnection,
    reconnectFn: () => void,
    err: any
  ) {
    const reason = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Connection error ${server.ip}:${server.port} (${reason})`);

    handlers.onStatusChange("offline");
    this.scheduleReconnect(state, reconnectFn, RECONNECT_INTERVALS.ERROR);
  }

  private scheduleReconnect(
    state: ActiveConnection,
    reconnectFn: () => void,
    delay: number
  ) {
    if (state.isTerminated) return;
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
    state.reconnectTimer = setTimeout(reconnectFn, delay);
  }

  public disconnectById(id: number) {
    const conn = this.connections.get(id);
    if (!conn) return;

    logger.info(`Stopping connection: ${id}`);
    conn.isTerminated = true;
    if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);

    if (conn.ws) {
      conn.ws.onclose = null;
      conn.ws.close();
    }

    this.connections.delete(id);
  }
}

import { EventEmitter } from "events";
import { WebSocketService } from "./ws.service";

export class MonitoringService extends EventEmitter {
  private wsClient = new WebSocketService();
  public cache = new Map<number, any>();

  public start(server: { id: number; ip: string; port: number }) {
    this.wsClient.connect(server, {
      onStatusChange: (status) => this.update(server.id, { status }),
      onMessage: (data) =>
        this.update(server.id, {
          ...data,
          status: "online",
          updatedAt: new Date().toISOString(),
        }),
    });
  }
  public stop(id: number) {
    this.wsClient.disconnectById(id);
    this.cache.delete(id);
  }

  private update(id: number, data: any) {
    const current = this.cache.get(id) || { status: "offline" };
    const updated = { ...current, ...data };
    this.cache.set(id, updated);
    this.emit("update", { id, ...updated });
  }
  public getCacheArray() {
    return Array.from(this.cache.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }
  public getStatus(id: number) {
    return this.cache.get(id) || { status: "offline", documents: [] };
  }
}

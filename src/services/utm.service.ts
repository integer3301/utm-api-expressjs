import { NewUtm, Utm } from "../schemas/utms";
import { UtmRepository } from "../repositories/utm.repository";
import { MonitoringService } from "./monitor.service";

export class UtmService {
  constructor(
    private repo: UtmRepository,
    public monitoring: MonitoringService
  ) {
    this.init();
  }

  private async init() {
    const servers = await this.repo.findAll();
    servers.forEach((s) => this.monitoring.start(s));
  }

  async getAllUtms(): Promise<Utm[]> {
    const dbServers = await this.repo.findAll();
    return dbServers.map((server) => ({
      ...server,
      ...this.monitoring.getStatus(server.id),
    }));
  }

  async getUtmById(id: number): Promise<Utm> {
    const server = await this.repo.findById(id);
    if (!server) throw new Error(`УТМ с ID ${id} не найден`);
    return server;
  }

  async deleteUtm(id: number): Promise<boolean> {
    const deleted = await this.repo.delete(id);
    if (deleted) {
      this.monitoring.stop(id);
    }
    return deleted;
  }
  async addUtm(data: NewUtm): Promise<Utm> {
    const newServer = await this.repo.create(data);
    this.monitoring.start(newServer);
    return newServer;
  }
}

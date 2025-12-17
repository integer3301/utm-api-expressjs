import { NewUtm } from "../database/schema";
import { UtmModels } from "../models/utm.models";
import { UtmRepository } from "../repositories/utm.repository";

export class UtmService {
  constructor(private repo: UtmRepository) {}

  async getAllUtms(): Promise<UtmModels[]> {
    return await this.repo.findAll();
  }
  async getUtmById(id: number): Promise<UtmModels> {
    const server = await this.repo.findById(id);
    if (!server) {
      throw new Error(`УТМ с ID ${id} не найден`);
    }
    return server;
  }
  async addUtm(data: NewUtm): Promise<UtmModels> {
    return await this.repo.create(data);
  }
}

import { db } from "../database/db";
import { utms } from "../database/schema";
import { eq } from "drizzle-orm";
import { UtmModels } from "../models/utm.models";

export class UtmRepository {
  async findAll() {
    const rows = await db.select().from(utms).all();
    return rows.map((row) => new UtmModels(row));
  }

  async findById(id: number) {
    const row = await db.select().from(utms).where(eq(utms.id, id)).get();
    return row ? new UtmModels(row) : null;
  }

  async create(data: typeof utms.$inferInsert) {
    const row = await db
      .insert(utms)
      .values({
        name: data.name,
        ip: data.ip,
        port: data.port,
        location: data.location,
      })
      .returning()
      .get();

    return new UtmModels(row);
  }
  async update(id: number, data: Partial<typeof utms.$inferInsert>) {
    const row = await db
      .update(utms)
      .set({ ...data, updatedAt: new Date().toDateString() })
      .where(eq(utms.id, id))
      .returning()
      .get();

    return row ? new UtmModels(row) : null;
  }
}

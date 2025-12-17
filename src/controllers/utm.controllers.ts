import Elysia from "elysia";
import { UtmRepository } from "../repositories/utm.repository";
import { UtmService } from "../services/utm.service";

const utmService = new UtmService(new UtmRepository());

export const utmController = new Elysia({ prefix: "/utm" })
  .get("/", () => utmService.getAllUtms())
  .get("/:id", ({ params: { id } }) => utmService.getUtmById(Number(id)));

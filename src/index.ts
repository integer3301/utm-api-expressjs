import { Elysia } from "elysia";
import { logger } from "@bogeychan/elysia-logger";

import { utmController } from "./controllers/utm.controllers";

const app = new Elysia()
  .use(logger())
  .group("/api/v1", (app) => app.use(utmController))
  .get("/", () => "hello world")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

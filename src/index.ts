import { Elysia } from "elysia";
import { dbPlugin } from "./database/conection";

const app = new Elysia()
  .use(dbPlugin)
  .get("", () => "hello world")
  .get("/health", () => "OK")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

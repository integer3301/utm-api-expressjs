import { Elysia, t } from "elysia";
import { UtmService } from "../services/utm.service";
import { MonitoringService } from "../services/monitoring.service";
import { NewUtm } from "../schemas/utms";

export const UtmController = (
  utmService: UtmService,
  monitoringService: MonitoringService
) =>
  new Elysia({ prefix: "/utm" })

    .get("/", () => utmService.getAllUtms())

    .get("/:id", ({ params: { id } }) => utmService.getUtmById(Number(id)))

    .delete("/:id", ({ params: { id } }) => utmService.deleteUtm(Number(id)))

    .post(
      "/",
      async ({ body, set }) => {
        try {
          return await utmService.addUtm(body as NewUtm);
        } catch (e: any) {
          set.status = 400;
          return { error: e.message };
        }
      },
      {
        body: t.Object({
          name: t.String(),
          ip: t.String(),
          port: t.Number(),
          location: t.Optional(t.String()),
          environment: t.String({ enum: ["docker", "arm", "closed"] }),
        }),
      }
    )

    .ws("/monitor", {
      open(ws) {
        ws.send({
          type: "FULL_CACHE",
          data: monitoringService.getCacheArray(),
        });

        const onUpdate = (update: any) => {
          ws.send({ type: "UPDATE", data: update });
        };

        (ws.data as any).onUpdate = onUpdate;
        monitoringService.on("update", onUpdate);
      },

      close(ws) {
        const handler = (ws.data as any).onUpdate;
        if (handler) {
          monitoringService.off("update", handler);
        }
      },
    });

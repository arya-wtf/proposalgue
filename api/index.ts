import { getRequestListener } from "@hono/node-server";

// Surface init-time errors instead of silently crashing with FUNCTION_INVOCATION_FAILED.
const listenerPromise = (async () => {
  try {
    const mod = await import("../src/app");
    const app = mod.default;
    return getRequestListener(app.fetch);
  } catch (e: any) {
    const msg = e?.stack ?? e?.message ?? String(e);
    console.error("[api/index] init failed:", msg);
    return (_req: any, res: any) => {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("Init error:\n" + msg);
    };
  }
})();

export default async function handler(req: any, res: any) {
  try {
    const fn = await listenerPromise;
    return fn(req, res);
  } catch (e: any) {
    const msg = e?.stack ?? e?.message ?? String(e);
    console.error("[api/index] handler failed:", msg);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Handler error:\n" + msg);
  }
}

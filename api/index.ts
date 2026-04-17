import { getRequestListener } from "@hono/node-server";
import app from "../src/app";

const listener = getRequestListener(app.fetch);

export default async function handler(req: any, res: any) {
  try {
    return await listener(req, res);
  } catch (e: any) {
    const msg = e?.stack ?? e?.message ?? String(e);
    console.error("[api/index] handler error:", msg);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("Server error:\n" + msg);
    }
  }
}

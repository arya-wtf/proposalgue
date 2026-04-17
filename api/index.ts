// Diagnostic: progressively load the app, reporting which stage fails.
// Once we see the real error, we can fix it and restore the normal handler.

export default async function handler(req: any, res: any) {
  const log: string[] = [];
  const fail = (stage: string, e: any) => {
    const msg = e?.stack ?? e?.message ?? String(e);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(`FAIL at: ${stage}\n\n${msg}\n\nLog:\n${log.join("\n")}`);
  };

  try {
    log.push("stage 1: handler entered");
    log.push(`  node: ${process.version}`);
    log.push(`  cwd:  ${process.cwd()}`);
    log.push(`  __dirname (if any): ${typeof __dirname !== "undefined" ? __dirname : "n/a"}`);

    log.push("stage 2: listing cwd");
    const { readdirSync, existsSync } = await import("fs");
    const { join } = await import("path");
    try {
      log.push(`  cwd entries: ${readdirSync(process.cwd()).join(", ")}`);
    } catch (e: any) {
      log.push(`  cwd readdir failed: ${e.message}`);
    }

    log.push("stage 3: checking for proposals dir");
    const candidates = [
      join(process.cwd(), "proposals"),
      join(__dirname, "..", "..", "proposals"),
      join(__dirname, "..", "proposals"),
      "/var/task/proposals",
    ];
    for (const p of candidates) {
      log.push(`  ${p} exists=${existsSync(p)}`);
    }

    log.push("stage 4: importing hono");
    await import("hono");
    log.push("  hono ok");

    log.push("stage 5: importing @hono/node-server");
    const { getRequestListener } = await import("@hono/node-server");
    log.push("  node-server ok");

    log.push("stage 6: importing src/app");
    const appMod = await import("../src/app");
    const app = appMod.default;
    log.push("  app ok");

    log.push("stage 7: invoking request listener");
    const listener = getRequestListener(app.fetch);
    return await listener(req, res);
  } catch (e: any) {
    return fail("unknown", e);
  }
}

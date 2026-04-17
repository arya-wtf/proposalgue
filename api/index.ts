// Diagnostic handler: progressively load modules, report which step dies.
export default async function handler(req: any, res: any) {
  const log: string[] = [];
  const send = (status: number, stage: string, e?: any) => {
    const err = e ? `\n\n${e?.stack ?? e?.message ?? String(e)}` : "";
    res.statusCode = status;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(`${stage}${err}\n\n--- trace ---\n${log.join("\n")}`);
  };

  try {
    log.push(`node: ${process.version}`);
    log.push(`cwd: ${process.cwd()}`);
    log.push(`__dirname: ${typeof __dirname !== "undefined" ? __dirname : "n/a"}`);

    const { readdirSync, existsSync } = await import("fs");
    const { join } = await import("path");
    log.push("");
    log.push("proposals/ path probes:");
    const candidates = [
      join(process.cwd(), "proposals"),
      join(__dirname, "..", "..", "proposals"),
      join(__dirname, "..", "proposals"),
      join(__dirname, "proposals"),
      "/var/task/proposals",
    ];
    for (const p of candidates) {
      let entries = "-";
      try {
        if (existsSync(p)) entries = readdirSync(p).join(",") || "(empty)";
      } catch (e: any) {
        entries = `readdir err: ${e.message}`;
      }
      log.push(`  ${p} -> ${entries}`);
    }

    log.push("");
    log.push("imports:");

    try { await import("hono"); log.push("  hono OK"); }
    catch (e) { return send(500, "FAIL: import hono", e); }

    try { await import("@hono/node-server"); log.push("  @hono/node-server OK"); }
    catch (e) { return send(500, "FAIL: import @hono/node-server", e); }

    try { await import("gray-matter"); log.push("  gray-matter OK"); }
    catch (e) { return send(500, "FAIL: import gray-matter", e); }

    try { await import("js-yaml"); log.push("  js-yaml OK"); }
    catch (e) { return send(500, "FAIL: import js-yaml", e); }

    try { await import("marked"); log.push("  marked OK"); }
    catch (e) { return send(500, "FAIL: import marked", e); }

    try { await import("../src/env"); log.push("  src/env OK"); }
    catch (e) { return send(500, "FAIL: import src/env", e); }

    try { await import("../src/lib/proposals"); log.push("  src/lib/proposals OK"); }
    catch (e) { return send(500, "FAIL: import src/lib/proposals", e); }

    try { await import("../src/lib/tokens"); log.push("  src/lib/tokens OK"); }
    catch (e) { return send(500, "FAIL: import src/lib/tokens", e); }

    try { await import("../src/lib/pdf"); log.push("  src/lib/pdf OK"); }
    catch (e) { return send(500, "FAIL: import src/lib/pdf", e); }

    try { await import("../src/lib/email"); log.push("  src/lib/email OK"); }
    catch (e) { return send(500, "FAIL: import src/lib/email", e); }

    try { await import("../src/routes/public"); log.push("  src/routes/public OK"); }
    catch (e) { return send(500, "FAIL: import src/routes/public", e); }

    try { await import("../src/routes/sign"); log.push("  src/routes/sign OK"); }
    catch (e) { return send(500, "FAIL: import src/routes/sign", e); }

    try { await import("../src/routes/admin"); log.push("  src/routes/admin OK"); }
    catch (e) { return send(500, "FAIL: import src/routes/admin", e); }

    try { await import("../src/app"); log.push("  src/app OK"); }
    catch (e) { return send(500, "FAIL: import src/app", e); }

    return send(200, "ALL IMPORTS OK — swap back real handler to proceed");
  } catch (e: any) {
    return send(500, "FAIL: outer", e);
  }
}

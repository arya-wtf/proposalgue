import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import pub from "./routes/public";
import sign from "./routes/sign";
import admin from "./routes/admin";

const app = new Hono();

// Static files (public/)
app.use("/styles.css", serveStatic({ path: "./public/styles.css" }));
app.use("/viewer.js", serveStatic({ path: "./public/viewer.js" }));
app.use("/signature_pad.min.js", serveStatic({ path: "./public/signature_pad.min.js" }));

// Routes
app.route("/", pub);
app.route("/", sign);
app.route("/", admin);

// Root redirect
app.get("/", (c) => c.redirect("/admin"));

export default app;

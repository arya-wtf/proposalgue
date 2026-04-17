import { Hono } from "hono";
import pub from "./routes/public";
import sign from "./routes/sign";
import admin from "./routes/admin";

const app = new Hono();

// Routes
app.route("/", pub);
app.route("/", sign);
app.route("/", admin);

// Root redirect
app.get("/", (c) => c.redirect("/admin"));

export default app;

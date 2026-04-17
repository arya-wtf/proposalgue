import { serve } from "@hono/node-server";
import app from "./src/app";

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Proposal app running at http://localhost:${port}`);
  console.log(`Admin:    http://localhost:${port}/admin`);
});
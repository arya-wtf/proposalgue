export default function handler(req: any, res: any) {
  res.statusCode = 200;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.end("hello from vercel at " + new Date().toISOString());
}

import type { ParsedProposal, SignatureData } from "./types";
import { renderPdfHtml } from "../views/pdf";

export async function generatePdf(
  proposal: ParsedProposal,
  sig: SignatureData
): Promise<Buffer> {
  const html = renderPdfHtml(proposal, sig);

  // Dynamic import so the module doesn't blow up in dev without chromium
  const puppeteer = await import("puppeteer-core");

  let executablePath: string;
  let args: string[];

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Serverless: use sparticuz chromium
    const chromium = await import("@sparticuz/chromium-min");
    executablePath = await chromium.default.executablePath(
      process.env.CHROMIUM_EXECUTABLE_PATH ||
        `https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar`
    );
    args = chromium.default.args;
  } else {
    // Local: use system Chrome / Chromium
    const candidates = [
      process.env.CHROME_PATH,
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ].filter(Boolean) as string[];

    const { existsSync } = await import("fs");
    const found = candidates.find((p) => existsSync(p));
    if (!found) {
      throw new Error(
        "No Chrome/Chromium found. Set CHROME_PATH env var or install Chrome."
      );
    }
    executablePath = found;
    args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ];
  }

  const browser = await puppeteer.default.launch({
    executablePath,
    args,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const optional = (key: string, fallback = ""): string =>
  process.env[key] ?? fallback;

export const env = {
  PUBLIC_BASE_URL: optional("PUBLIC_BASE_URL", "http://localhost:3000"),
  SHARE_SECRET: optional("SHARE_SECRET", "dev-secret-change-in-prod"),
  RESEND_API_KEY: optional("RESEND_API_KEY", ""),
  AUTHOR_EMAIL: optional("AUTHOR_EMAIL", "hello@elux.space"),
  ADMIN_TOKEN: optional("ADMIN_TOKEN", ""),
  NODE_ENV: optional("NODE_ENV", "development"),
  // Internal token for PDF generation
  PDF_INTERNAL_TOKEN: optional("PDF_INTERNAL_TOKEN", "internal-pdf-token"),
};

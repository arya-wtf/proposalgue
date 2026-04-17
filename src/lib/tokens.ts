import { hmacSha256, hexToBase64Url } from "./hash";
import { env } from "../env";

export async function generateShareToken(
  slug: string,
  expiresAt: string
): Promise<string> {
  const hex = await hmacSha256(env.SHARE_SECRET, `${slug}:${expiresAt}`);
  return hexToBase64Url(hex);
}

export async function verifyShareToken(
  slug: string,
  expiresAt: string,
  token: string
): Promise<boolean> {
  const expected = await generateShareToken(slug, expiresAt);
  // Constant-time comparison
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

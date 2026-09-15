// Minimal signed-cookie session for the site-wide PIN gate.
// No user accounts — this just proves "someone who knows the PIN visited
// recently" so the app isn't wide open on the public internet.

const COOKIE_NAME = "diy_session";
const SESSION_DAYS = 30;

function getSecret(): string {
  const secret = process.env.SITE_SESSION_SECRET;
  if (!secret) {
    throw new Error("SITE_SESSION_SECRET is not set");
  }
  return secret;
}

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(sig).toString("hex");
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `ok.${expires}`;
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [marker, expiresStr, sig] = parts;
  if (marker !== "ok") return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const expectedSig = await hmac(`${marker}.${expiresStr}`);
  return expectedSig === sig;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

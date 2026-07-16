import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./db";

// Dependency-light auth for a single self-hosted school: a signed cookie holding
// { uid, role, exp }. No NextAuth, no external service — one SESSION_SECRET from
// the environment is all a self-hoster has to set. HMAC-SHA256 signed so the
// cookie can't be forged; httpOnly so client JS can't read it.

const COOKIE = "am_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = { id: string; name: string; email: string; role: string };
type Payload = { uid: string; role: string; exp: number };

function secret(): string {
  // A default keeps first-run frictionless; a real deployment sets its own so
  // sessions survive restarts and can't be guessed. We warn loudly at startup.
  return process.env.SESSION_SECRET || "aula-magna-community-dev-secret-change-me";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update(data).digest());
}
function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function encode(payload: Payload): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}
function decode(token: string | undefined): Payload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || !timingSafeEqual(sig, sign(body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()) as Payload;
    if (!p?.uid || typeof p.exp !== "number" || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

/** Write a fresh signed session cookie for a user. */
export async function createSession(userId: string, role: string) {
  const token = encode({ uid: userId, role, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function destroySession() {
  (await cookies()).set(COOKIE, "", { path: "/", maxAge: 0 });
}

/** The signed-in user (re-read from the DB so a deleted/changed account can't
 *  keep a stale cookie alive), or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const p = decode((await cookies()).get(COOKIE)?.value);
  if (!p) return null;
  const u = await prisma.user.findUnique({
    where: { id: p.uid },
    select: { id: true, name: true, email: true, role: true },
  });
  return u ?? null;
}

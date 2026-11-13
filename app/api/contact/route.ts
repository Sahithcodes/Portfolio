import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RateEntry = { count: number; expiresAt: number };
const globalRateLimit = globalThis as typeof globalThis & { __portfolioContactRateLimit?: Map<string, RateEntry> };
const rateLimit = globalRateLimit.__portfolioContactRateLimit ?? new Map<string, RateEntry>();
globalRateLimit.__portfolioContactRateLimit = rateLimit;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function json(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_000) return json("The message is too large.", 413);
  if (!request.headers.get("content-type")?.includes("application/json")) return json("Send the form as JSON.", 415);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json("The request could not be read.", 400);
  }

  const name = cleanText(payload.name, 80);
  const email = cleanText(payload.email, 254);
  const subject = cleanText(payload.subject, 160);
  const message = cleanText(payload.message, 4000);
  const captchaToken = cleanText(payload.captchaToken, 4096);
  const honeypot = cleanText(payload.website, 200);

  if (honeypot) return json("Thanks. Your message was received.", 200);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 3 || message.length < 20) {
    return json("Check the name, email, subject, and message fields and try again.", 400);
  }
  if (/[\r\n]/.test(subject) || /[\r\n]/.test(email)) return json("The email or subject is invalid.", 400);

  const now = Date.now();
  rateLimit.forEach((entry, key) => { if (entry.expiresAt <= now) rateLimit.delete(key); });
  if (rateLimit.size > 2000) rateLimit.clear();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const entry = rateLimit.get(ip);
  if (entry && entry.expiresAt > now && entry.count >= MAX_REQUESTS) return json("Too many messages were sent. Please try again later.", 429);
  rateLimit.set(ip, entry && entry.expiresAt > now ? { ...entry, count: entry.count + 1 } : { count: 1, expiresAt: now + WINDOW_MS });

  const resendKey = process.env.RESEND_API_KEY;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!resendKey || !turnstileSecret) return json("The contact form is not configured yet. Please email me directly.", 503);
  if (!captchaToken) return json("Complete the spam-protection check and try again.", 400);

  try {
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: turnstileSecret, response: captchaToken, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const challenge = await verification.json() as { success?: boolean; action?: string };
    if (!verification.ok || !challenge.success || (challenge.action && challenge.action !== "contact")) {
      return json("The spam-protection check expired. Please try again.", 400);
    }

    const recipient = process.env.CONTACT_EMAIL || "venkatasahith141@gmail.com";
    const from = process.env.RESEND_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";
    const delivery = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: email,
        subject: `Portfolio contact: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!delivery.ok) return json("The message could not be sent right now. Please email me directly.", 502);
    return json("Thanks. Your message was sent.", 200);
  } catch {
    return json("The message could not be sent right now. Please email me directly.", 502);
  }
}

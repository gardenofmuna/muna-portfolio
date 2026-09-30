import { NextResponse } from "next/server";

/*
 * Landing contact form → Resend → Muna's inbox.
 *
 * Env (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY  required.
 *   CONTACT_FROM    optional. Until munanzeribe.xyz is verified in Resend,
 *                   leave unset: the test sender only delivers to the email
 *                   the Resend account was opened with.
 *   CONTACT_TO      optional. Defaults to the address below.
 */

const DEFAULT_TO = "munachinzeribe@gmail.com";
const DEFAULT_FROM = "Talk to me <onboarding@resend.dev>";

const MAX = { name: 120, email: 200, subject: 200, message: 5000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  /** Honeypot. Hidden from people; bots fill it. */
  company?: unknown;
};

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  /* Answer bots as if it worked so they don't retry. */
  if (clean(body.company, 200)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  const subject = clean(body.subject, MAX.subject);
  const message = clean(body.message, MAX.message);

  if (!message) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "email_invalid" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("contact: RESEND_API_KEY is not set");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const from = name || email || "Someone";
  const text = [
    message,
    "",
    "—",
    name ? `Name: ${name}` : null,
    email ? `Email: ${email}` : null,
    "Sent from the contact form on munanzeribe.xyz",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || DEFAULT_FROM,
      to: [process.env.CONTACT_TO || DEFAULT_TO],
      subject: subject ? `${subject} — ${from}` : `Talk to me — ${from}`,
      text,
      ...(email ? { reply_to: email } : {}),
    }),
  });

  if (!res.ok) {
    console.error("contact: resend failed", res.status, await res.text());
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

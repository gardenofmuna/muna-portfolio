"use client";

import { useEffect, useRef, useState } from "react";

import type { CvTone } from "@/components/CvPane";

import "./tones.css";
import "./contact-form.css";

type Status = "idle" | "sending" | "sent" | "failed";

const SEND_LABEL: Record<Status, string> = {
  idle: "Send",
  sending: "Sending…",
  sent: "Sent — thank you",
  failed: "Didn’t send — try again",
};
/** How long "sent" / "failed" stay on the button before it resets. */
const SETTLE_MS = 4000;

type Props = {
  visible: boolean;
  /** Steps through the CV paper colours — one per opening of contact. */
  tone: CvTone;
} & (
  | {
      layout?: "stage";
      /** Stage-locked frame (layout px), matching the polaroid / wordmark column. */
      top: number;
      right: number;
      width: number;
      /** Height of the pink stub, not counting the tear below it. */
      height: number;
      /** Shared landing crossfade. */
      transition: string;
    }
  | {
      /** Mobile page: in flow, sized by the page's --cf-u. */
      layout: "page";
    }
);

export function ContactForm(props: Props) {
  const { visible, tone } = props;
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const onStage = props.layout !== "page";

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  /* The stage stub sits clear of the iPad keyboard, so while a field has
     focus the page stays put instead of Safari sliding it up and letting it
     scroll by the keyboard's height. */
  useEffect(() => {
    const form = formRef.current;
    if (!onStage || !visible || !form) return;
    const focused = () => form.contains(document.activeElement);
    const pin = () => {
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    };
    const onScroll = () => {
      if (focused()) pin();
    };
    const timers: number[] = [];
    const onFocusIn = () => {
      pin();
      requestAnimationFrame(pin);
      for (const ms of [120, 320, 600]) timers.push(window.setTimeout(pin, ms));
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!focused()) return;
      if (event.target instanceof Element && event.target.closest("input, textarea")) {
        return;
      }
      event.preventDefault();
    };
    const vv = window.visualViewport;
    form.addEventListener("focusin", onFocusIn);
    window.addEventListener("scroll", onScroll, { passive: true });
    vv?.addEventListener("scroll", onScroll);
    vv?.addEventListener("resize", onScroll);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      form.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("scroll", onScroll);
      vv?.removeEventListener("scroll", onScroll);
      vv?.removeEventListener("resize", onScroll);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [onStage, visible]);

  const settle = (next: Status) => {
    setStatus(next);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setStatus("idle"), SETTLE_MS);
  };

  const send = async () => {
    if (status === "sending") return;
    if (!message.trim()) {
      messageRef.current?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: from,
          subject,
          message,
          company,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setName("");
      setFrom("");
      setSubject("");
      setMessage("");
      settle("sent");
    } catch {
      settle("failed");
    }
  };

  return (
    <div
      className={
        props.layout === "page"
          ? "contact-form contact-form--page"
          : "contact-form absolute z-[40]"
      }
      data-tone={tone}
      aria-hidden={!visible}
      style={
        props.layout === "page"
          ? undefined
          : {
              top: props.top,
              right: props.right,
              width: props.width,
              height: props.height,
              opacity: visible ? 1 : 0,
              visibility: visible ? "visible" : "hidden",
              transition: props.transition,
              pointerEvents: visible ? "auto" : "none",
            }
      }
    >
      <form
        ref={formRef}
        className="contact-form__ticket"
        aria-label="Talk to me"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <h2 className="contact-form__title">Talk to me</h2>
        <label className="sr-only" htmlFor="contact-name">
          Your name
        </label>
        <input
          id="contact-name"
          className="contact-form__field"
          name="name"
          autoComplete="name"
          placeholder="Name"
          tabIndex={visible ? 0 : -1}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="sr-only" htmlFor="contact-email">
          Your email
        </label>
        <input
          id="contact-email"
          className="contact-form__field"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email Address"
          tabIndex={visible ? 0 : -1}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <label className="sr-only" htmlFor="contact-subject">
          What it’s about
        </label>
        <input
          id="contact-subject"
          className="contact-form__field"
          name="subject"
          placeholder="What it’s about"
          tabIndex={visible ? 0 : -1}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <label className="sr-only" htmlFor="contact-message">
          Your note
        </label>
        <textarea
          id="contact-message"
          ref={messageRef}
          className="contact-form__field"
          name="message"
          placeholder="Message"
          tabIndex={visible ? 0 : -1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Honeypot: off-screen rather than display:none, which bots skip. */}
        <input
          className="contact-form__trap"
          name="company"
          aria-hidden
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <button
          type="submit"
          className="contact-form__send"
          tabIndex={visible ? 0 : -1}
          aria-busy={status === "sending"}
        >
          <span aria-live="polite">{SEND_LABEL[status]}</span>
        </button>
      </form>
    </div>
  );
}

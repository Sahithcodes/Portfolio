"use client";

import React, { useEffect, useRef, useState } from "react";
import Container from "@/components/layout/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { Send, ArrowUpRight, CheckCircle2, Mail } from "lucide-react";
import { profile } from "@/data/profile";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function ContactSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formMessage, setFormMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const captchaWidget = useRef<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (!turnstileSiteKey || !captchaRef.current) return;
    let disposed = false;
    const renderWidget = () => {
      if (disposed || !captchaRef.current || !window.turnstile || captchaWidget.current) return;
      captchaWidget.current = window.turnstile.render(captchaRef.current, {
        sitekey: turnstileSiteKey,
        action: "contact",
        callback: (token: string) => { setCaptchaToken(token); setFormMessage(""); },
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => { setCaptchaToken(""); setFormMessage("Spam protection could not load. Refresh and try again."); },
      });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]');
    if (window.turnstile) renderWidget();
    else if (existing) existing.addEventListener("load", renderWidget, { once: true });
    else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }
    return () => {
      disposed = true;
      if (captchaWidget.current) window.turnstile?.remove(captchaWidget.current);
      captchaWidget.current = null;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setFormMessage("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken, website: (e.currentTarget.elements.namedItem("website") as HTMLInputElement)?.value || "" }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "The message could not be sent. Please try again.");
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setCaptchaToken("");
      if (captchaWidget.current) window.turnstile?.reset(captchaWidget.current);
    } catch (error) {
      setStatus("error");
      setFormMessage(error instanceof Error ? error.message : "The message could not be sent. Please try again.");
    }
  };

  return (
    <section
      id="contact"
      className="pt-24 sm:pt-32 pb-12 sm:pb-16 relative scroll-mt-20 transition-colors duration-300 overflow-hidden"
    >
      {/* Background subtle radial glow */}
      <div
        className="pointer-events-none absolute right-0 bottom-1/4 w-96 h-96 opacity-15 bg-[radial-gradient(circle_at_center,var(--ambient-teal),transparent_70%)] -z-10"
        aria-hidden="true"
      />

      <Container>
        <div>
          <SectionHeading
            index="06"
            eyebrow="Initiate Collaboration"
            title="Let's Build Something"
            highlight="Remarkable."
            description="Open to discussing full-time opportunities, AI/ML research collaborations, technical consulting, and high-impact engineering projects."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Direct channels */}
          <div className="lg:col-span-5 space-y-8">
            <div className="contact-panel p-7 sm:p-9 rounded-2xl bg-surface border border-surface-border space-y-6 hover:border-accent/50 hover:shadow-[0_0_35px_-5px_var(--accent-glow)] transition-all duration-300 relative overflow-hidden">
              {/* Top border accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/20 via-accent to-accent/20"
                aria-hidden="true"
              />

              <div>
                <span className="font-mono text-xs text-accent uppercase tracking-wider block mb-1 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Direct Line
                </span>
                <a
                  href={`mailto:${profile.email}`}
                  className="font-heading text-xl sm:text-2xl font-bold text-content-primary hover:text-accent transition-colors inline-flex items-center gap-2 group"
                >
                  <span>{profile.email}</span>
                  <ArrowUpRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>

              <div className="pt-6 border-t border-surface-border/60">
                <span className="font-mono text-xs text-accent uppercase tracking-wider block mb-1.5 font-semibold">
                  Availability Status
                </span>
                <p className="font-sans text-sm text-content-secondary leading-relaxed">
                  Currently receptive to software engineering roles, computer vision
                  research labs, and AI developer positions.
                </p>
              </div>

              <div className="pt-6 border-t border-surface-border/60 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sage opacity-55" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-sage shadow-[0_0_8px_var(--accent-glow)]" />
                </span>
                <span className="font-mono text-xs text-content-primary font-medium">
                  Active & Ready to Collaborate
                </span>
              </div>
            </div>
          </div>

          {/* Form Foundation */}
          <div className="lg:col-span-7">
            <div className="contact-panel p-7 sm:p-9 rounded-2xl bg-surface border border-surface-border hover:border-accent/40 transition-colors">
              {status === "success" ? (
                <div className="py-12 flex flex-col items-center text-center space-y-3.5">
                  <CheckCircle2 className="w-14 h-14 text-accent animate-bounce" />
                  <h3 className="font-heading text-2xl font-bold text-content-primary">
                    Message Received
                  </h3>
                  <p className="font-sans text-sm text-content-secondary max-w-md">
                    Thanks for reaching out. I’ll get back to you soon. You can also contact me at{" "}
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-accent underline hover:text-accent-hover font-medium"
                    >
                      {profile.email}
                    </a>
                    .
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setStatus("idle"); setFormMessage(""); }}
                    className="mt-4"
                  >
                    Send Another
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block font-mono text-xs text-content-muted uppercase tracking-wider mb-2"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        maxLength={80}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Ada Lovelace"
                        className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-content-primary placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block font-mono text-xs text-content-muted uppercase tracking-wider mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        maxLength={254}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="ada@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-content-primary placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block font-mono text-xs text-content-muted uppercase tracking-wider mb-2"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      maxLength={160}
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="AI Engineering / Opportunity Inquiry"
                      className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-content-primary placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block font-mono text-xs text-content-muted uppercase tracking-wider mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      minLength={20}
                      maxLength={4000}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Share details about your project, team, or opportunity..."
                      className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-surface-border text-content-primary placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors resize-none"
                    />
                  </div>

                  <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                  {turnstileSiteKey ? (
                    <div ref={captchaRef} className="min-h-[65px]" />
                  ) : (
                    <p className="rounded-lg border border-surface-border bg-surface-elevated/60 p-3 text-xs leading-relaxed text-content-muted">
                      The contact form needs Turnstile configuration before it can accept submissions. Email me directly at <a className="text-accent underline" href={`mailto:${profile.email}`}>{profile.email}</a> for now.
                    </p>
                  )}
                  {formMessage && <p role="alert" className="text-sm text-accent-terracotta">{formMessage}</p>}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center group"
                    disabled={status === "loading" || !turnstileSiteKey || !captchaToken}
                    rightIcon={
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                    }
                  >
                    {status === "loading" ? "Sending…" : "Transmit Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Luminous Bridge Line into Footer */}
        <div
          className="mt-20 h-px w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent shadow-[0_0_12px_var(--accent-glow)] origin-center"
          aria-hidden="true"
        />
      </Container>
    </section>
  );
}

# Deployment setup

Copy `.env.example` to `.env.local` and set the Resend API key, Cloudflare Turnstile site/secret keys, and the deployed site URL. Set `RESEND_FROM_EMAIL` to a sender domain verified in Resend before using production email delivery. Keep the secret values server-side; only the Turnstile site key and site URL use the `NEXT_PUBLIC_` prefix.

The contact endpoint uses a small per-process rate limit in addition to Turnstile. A multi-instance deployment should use a shared rate-limit store if stronger cross-instance limits are needed.

The current `public/resume.pdf` is a one-page placeholder, not a personal resume. Replace it with the actual PDF at `public/Sahith_Resume.pdf`; the resume controls are disabled until `resumeAvailable` is enabled in `data/profile.ts`.

The sitemap and canonical metadata use `NEXT_PUBLIC_SITE_URL`. Leave it unset until the portfolio domain is known.

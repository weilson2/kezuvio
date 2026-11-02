# Deployment and security guide

Prepared 31 October 2026. No public deployment or paid resource has been created. This guide supports a later, explicitly approved launch.

## Suitable initial architecture

Run one Node.js 24 process behind an HTTPS reverse proxy. The company pages are pre-rendered; two Next.js APIs maintain isolated fictional demo workspaces in process memory. A restart, deployment, idle shutdown or one-hour expiry loses sample changes by design. Do not use multiple replicas, clustered Node workers or serverless functions with the current store: requests may reach different stores and sessions will disappear or diverge.

For production business records or horizontal scaling, replace the memory store with a shared transactional database, add genuine user authentication/tenant authorization, and implement persistence, backups, migrations and operational monitoring. Booking and stock checks must become database transactions. Do not present the current demos as production accounting or payment systems.

## Local commands

```sh
npm ci
npm run build
npm run typecheck
npm test
npm run start
```

The normal start script binds to loopback. On an approved host, the network-facing command is:

```sh
node node_modules/next/dist/bin/next start apps/website --hostname 0.0.0.0
```

Set the host's `PORT` variable as required. Keep one process. Use HTTPS at the proxy and set `DEMO_ORIGIN` to the exact HTTPS origin without a trailing slash. Ensure the proxy routes both `/api/demo/*` endpoints to the same process and does not cache API responses.

## Environment

| Variable | Purpose / timing |
| --- | --- |
| `SITE_URL` | Confirmed canonical origin; set before build to generate public metadata |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Approved public email link; build time, intentionally public |
| `NEXT_PUBLIC_WHATSAPP` | Approved international phone digits; build time, intentionally public |
| `DEMO_ORIGIN` | Exact browser-facing origin; runtime origin allowlist and HTTPS cookie flag |
| `PORT` | Listening port for the host, default 3000 |

Leave contact fields blank when unknown. There are no payment or email-provider secrets in the application. Put future secrets in the hosting secret store, never `NEXT_PUBLIC_*` variables. `.env*` files are ignored except `.env.example`.

The Dockerfile builds in Node 24 and runs as the unprivileged `node` user. Public metadata/contact variables must be available at build time; the current Dockerfile does not expose build arguments for them. Add explicit non-secret build arguments or supply an approved build-time environment before a real container launch. Docker was unavailable on this workstation, so the image is prepared but not built or runtime-tested. The native Node production build was tested.

## Implemented safeguards

- Random 256-bit session IDs and separate CSRF tokens; HttpOnly, SameSite=Strict, API-scoped cookies, Secure under HTTPS.
- Exact-origin checks for writes, CSRF comparison, JSON validation and streaming 8 KB request-body cap.
- Server-side role checks for restricted mutations. Roles are intentionally selectable because each workspace contains only fictional data.
- Integer-sen prices, atomic state replacement within one process, booking/stock validation, and last-100 request ID replay protection.
- One-hour absolute session lifetime, maximum 100 active sessions, 300 session-creation attempts/minute globally, and 120 requests/minute per session.
- Bounded record counts and a bounded session-local audit history. API responses are private/no-store and excluded from indexing.
- React text escaping, no raw user HTML rendering, and framing/MIME/referrer/permissions response headers.

These controls limit ordinary demo abuse; they are not distributed DDoS protection. An attacker could occupy the 100-session capacity. Before a public demo launch, configure edge-level request and connection limits, timeouts and monitoring, test them under expected traffic, and verify HTTPS cookie/proxy behavior. A production CSP is not configured and should be introduced in report-only mode before enforcement. Audit entries reset with the workspace and are not a durable compliance log.

## Costs and hosting limitations

The completed local setup uses no paid hosted services: **US$0 hosting spend**, excluding the existing computer and internet connection. No new subscriptions were purchased.

For a low-traffic review deployment, Render documents a **US$0 free web-service option** with **750 instance hours per workspace per month** and shutdown after **15 minutes without inbound traffic**. Shutdown/restart loses this application's sample state. Bandwidth/build quotas can suspend service or create charges depending on billing configuration. This is a review option, not an uptime commitment. [Official free-service documentation](https://render.com/docs/free), checked 31 October 2026.

A paid single-instance Node host would avoid free-tier idle shutdown, but a current paid-instance quote was not verified; no paid plan is selected or proposed for purchase. Confirm the provider's current compute, bandwidth, build, tax and domain costs before approval. No database or email-provider costs are included because neither service is configured. [Render pricing](https://render.com/pricing).

## Launch checklist after approval

1. Confirm the brand name, public contact details, domain, privacy/terms operator details and approved hosting budget.
2. Decide whether to keep the honest enquiry builder or implement live delivery with server validation, spam controls, provider credentials and delivery tests.
3. Select an explicitly single-process host, pin the runtime, configure HTTPS, environment variables and edge abuse protection.
4. Run the production build, typecheck and full test suite; build/test Docker if choosing the container path.
5. Verify real-origin cookies, CSRF rejection, two independent browsers, reset, booking conflicts, POS refund and SME reconciliation through the proxy.
6. Check links, social metadata, mobile navigation, indexing policy, logs and restart behavior on the approved host. Confirm the memory limits suit expected review traffic.
7. Publish only after explicit deployment approval. Retain the previous build for rollback; restarting deliberately resets sample workspaces.

GitHub Actions is configured for install, build, typecheck, browser/domain checks and report upload. This workspace has not been pushed to a repository, so hosted CI has not run. Local test success does not imply an observed green GitHub run.

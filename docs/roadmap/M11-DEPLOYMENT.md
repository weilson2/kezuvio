# M11 deployment, cost and recovery runbook

Prepared **23 November 2026, Asia/Kuala_Lumpur**. Status: **reviewable local preparation**, with no public deployment, account change, purchase, domain registration or production operation performed. This document covers a future fictional portfolio/demo deployment after separate founder authorization. It does not authorize using the demonstrations for real customer business records.

The [master backlog](MASTER_BACKLOG.md) and [execution log](EXECUTION_LOG.md) own milestone status and actual verification evidence. The older [deployment guide](../deployment-guide.md) describes the original in-memory demonstrations; the PostgreSQL topology and private operations boundary below supersede its older infrastructure assumptions. Completed M5–M12 milestones stay REVIEW until explicit acceptance; unfinished milestones retain their actual backlog/in-progress state. A passing check does not create an acceptance tag or authorize deployment.

## 1. Target boundary and initial resource hypothesis

Use one Node.js **24** application process running the repository's pinned **Next.js 16.4.5**, with **PostgreSQL 18** on a private connection. Retain the tested PostgreSQL major version until a separately reviewed upgrade is verified. The six Labs products use independent workspace/product/generation scope inside the shared database. The original legacy demonstrations still hold their sample state in a single Node process; their state disappears on restart. Horizontal replicas, clustered workers, serverless request instances and automatic scale-to-zero therefore require additional architecture work before use.

The server does not render the 3D scene or run paid model inference: Interior 3D is a lazy-loaded browser scene. Browser WebGL capability, device memory and GPU speed remain separate acceptance concerns.

| Resource        | Planning hypothesis, not measured production capacity                                                                                   | Verification before selection                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application RAM | Start budgeting **1 GiB** for the running Node app.                                                                                     | Measure RSS/heap during concurrent six-product visits, image optimisation and largest permitted workspace actions.                                        |
| Database RAM    | Budget **0.5–1 GiB** for a small PostgreSQL instance.                                                                                   | Check connection count, query latency, lock waits, WAL/checkpoint behaviour and memory under the same workload.                                           |
| CPU             | A small shared CPU may serve low-volume review traffic; 2 vCPU gives more contention headroom if app and DB share a VM.                 | Measure request latency, CPU and transaction contention. No throughput promise is made.                                                                   |
| Host headroom   | A 2 GiB all-in VM is a constrained sizing trial after OS/proxy overhead; a 4 GiB option leaves more margin for app, DB and maintenance. | Compare actual peak use and service restart behaviour before committing to a tier.                                                                        |
| Build resources | Build separately from the smallest runtime host when possible.                                                                          | Measure a clean `npm ci` / `npm run build`; Next's build worker peak is not the runtime memory budget.                                                    |
| Disk            | Persistent PostgreSQL data/WAL, bounded logs and backup staging; release artifact/static assets on application storage.                 | Measure actual artifact and database size, then agree capacity, log retention and free-space alarms. No user-upload media service exists.                 |
| Connections     | Current app pool permits up to eight connections per process.                                                                           | Ensure the DB's usable connection budget also covers migration, backup and monitoring sessions; validate transaction-local RLS through any chosen pooler. |

These are initial resource assumptions. They do not establish an SLA, a production load benchmark or a fixed hosting bill.

## 2. Low-cost options checked against primary sources

Prices below are **USD**, checked on 23 November 2026. They exclude tax, payment-currency conversion, domains, off-host backup storage, support labour and any separately selected services. No MYR exchange rate is assumed. Availability, region and provider terms must be checked again at purchase review.

| Option                            | Verified price basis                                                                                                                                                                                                                                                                       | Expected architecture and costs still to add                                                                                                                                                                                                                                                 | Practical trade-off                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DigitalOcean Basic Regular VM** | **US$12/month**: 2 GiB RAM, 1 vCPU, 50 GiB SSD, 2,000 GiB transfer. **US$24/month**: 4 GiB RAM, 2 vCPU, 80 GiB SSD, 4,000 GiB transfer. These are published monthly VM caps, not a managed database price. [Official Droplet pricing](https://www.digitalocean.com/pricing/droplets).      | One app + private local PostgreSQL + TLS proxy on the VM. Database memory/disk share the VM allocation. Add separately priced backups/off-host copies, domain and maintenance.                                                                                                               | Direct control over network and private paths; operator owns OS updates, database administration, backup monitoring and restore. A single VM is a single failure domain.                     |
| **Railway container services**    | Hobby has a **US$5 monthly minimum including US$5 usage**; Pro has US$20 including US$20 usage. Container RAM **US$10/GB-month**, CPU **US$20/vCPU-month**, volume **US$0.15/GB-month**, egress **US$0.05/GB**. [Official plan and usage pricing](https://docs.railway.com/pricing/plans). | Separate app and persistent PostgreSQL service. For Hobby, `monthly = max(5, 10G + 20C + 0.15V + 0.05E)` for aggregate GB RAM, average vCPU, volume GB and egress GB. An assumed G=1.5, C=0.2, V=5, E=10 gives **US$20.25/month** before exclusions; this is arithmetic, not measured usage. | Check plan suitability, service/volume limits and region. A single-node database needs a backup/restore plan; a one-click service does not prove managed recovery or high availability.      |
| **Render app + Postgres**         | The official live pricing URL loaded, but its current numeric compute/database table was not available in the retrieved page. **No verified numeric total is quoted.** [Official pricing](https://render.com/pricing).                                                                     | Obtain a current app + PostgreSQL + storage/backup quote with the intended region and resources.                                                                                                                                                                                             | Potential separately managed app/database option; compare only after a complete quote and compatible PostgreSQL/role-permission checks. Do not assume an old free-tier or legacy-plan price. |

The Railway example assumes full-month container services at the stated average use. VM/sandbox rates differ; extra storage and traffic change the bill. [Published billing basis](https://docs.railway.com/pricing/plans).

DigitalOcean's backup service is separately charged according to the selected plan or restored-size usage; use its calculator rather than treating the VM cap as a complete backup budget. A provider disk image does not replace a tested PostgreSQL recovery procedure. [Official backup pricing](https://docs.digitalocean.com/products/backups/details/pricing/).

No Hetzner price or region is asserted because a current primary-source configuration was not verified for this comparison. No free trial, credit grant, subscription waiver, SLA or included production support is assumed.

**Review recommendation:** retain the existing local setup while acceptance and readiness items are open. For a later low-volume showcase, compare a measured 4 GiB VM trial with a measured app/database container budget. The VM's smaller published bill must be weighed against the operator time and recovery responsibilities. Founder approval must cover the complete recurring estimate and spending controls, not only the advertised entry price.

## 3. Public/private routing and authentication

Public traffic may reach the website, approved fictional demos and their scoped visitor APIs only. **The M10 desk remains loopback/private.** Exclude `/operations`, its trailing-path variants and `/api/operations` from every public proxy/CDN route. Do not package or mount `.local/operations`, its access/signing keys or its task state in the public runtime. Leave `OPERATIONS_TEST_MODE`, `OPERATIONS_TEST_KEY`, `OPERATIONS_TEST_SIGNING_KEY` and `LABS_ACCEPTANCE_MODE` unset there.

Keep Node on loopback behind the reviewed TLS proxy on a VM. Keep PostgreSQL on loopback or a private service network and allow connections only from authorised app/admin sources. Restrict SSH/admin access separately. A PaaS public ingress needs an equivalent tested path-deny layer; do not assume its default service URL supplies that policy. M10's own Host/origin/authentication checks are additional protection, and do not substitute for the public routing exclusion.

Example **review template only**, inside an otherwise verified Nginx server configuration:

```nginx
# Normalized public URI exclusions; verify encoded/slash variants at the edge.
location = /operations { return 404; }
location ^~ /operations/ { return 404; }
location = /api/operations { return 404; }
location ^~ /api/operations/ { return 404; }

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

This snippet was not installed or tested against a live proxy. It omits the separately required certificate, firewall, request/connection limits, timeouts, cache policy, privacy-reviewed access logging and deployment-specific response headers. Verify URI normalisation and trailing/encoded paths at both edge and origin; avoid alternate public origin URLs that bypass the policy. Its directive syntax follows the [official Nginx location reference](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) and [proxy header reference](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header). Private operations use the existing authenticated local workstation desk, or a separately approved private access arrangement. There is no publicly accessible Telegram/command endpoint.

The six product Manager/Customer/Viewer selectors are fictional capabilities in a visitor workspace. They are **not production employee/customer authentication**. Before handling real customer records, supply a separate reviewed authentication/tenant-authorisation design, onboarding, recovery, permission audit and data-handling agreement. This showcase must not be sold as production accounting, agency CRM, payment infrastructure or regulatory-certified software.

## 4. Environment and database identity

| Setting or boundary                                  | Required treatment                                                                                                                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                                           | Approved canonical HTTPS origin, set before build. Keep unset for private review so metadata remains non-indexable. Verify sitemap/canonical/social output after any change.                         |
| `LABS_ORIGIN` / `DEMO_ORIGIN`                        | Pin the exact approved browser-facing HTTPS origin, without a trailing slash. Test direct and proxy requests; reject other origins. Do not trust arbitrary forwarded hosts as authority.             |
| `DATABASE_URL`                                       | Runtime-only role through a private TLS-verified connection when remote. No schema ownership, superuser, BYPASSRLS, DDL or migration credentials in the web process.                                 |
| `MIGRATION_DATABASE_URL` / `DATABASE_RUNTIME_ROLE`   | Restricted migration job only. Use them for additive migrations and required grants, then remove them from the runtime environment.                                                                  |
| Development, test and future target                  | Separate database identities, credentials and backup destinations. Integration helpers require the dedicated `_test` database; never redirect those tests to the live target.                        |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_WHATSAPP` | Approved public contact information only. Leave blank until the founder approves communication and privacy arrangements. They are intentionally public build-time settings, never secret slots.      |
| Secrets and local files                              | Secret store or restrictive environment/service configuration. Exclude `.local`, `.env*` credentials, operations keys, archives and caches from Git, images, static files, logs and build artifacts. |

The runtime transaction establishes product/workspace/generation context from the visitor session; client-provided identity is never authority. Keep forced RLS and composite product/workspace foreign keys after migrations and restores. Under the actual runtime role, unscoped product reads must return zero rows and cross-scope read/write/reset attempts must fail. Owners and BYPASSRLS/superuser identities are unsuitable runtime identities because PostgreSQL treats them differently under RLS. [PostgreSQL 18 row-security documentation](https://www.postgresql.org/docs/18/ddl-rowsecurity.html).

Inspect the target's role, extension, ownership, backup and TLS capabilities before choosing a managed database. Do not use its default owner connection string as the web runtime credential merely because it is convenient. A connection-pool service must preserve the tested transaction-local scope and cannot leak it between requests.

## 5. Release preparation and future launch sequence

Everything in this section is a **future authorised runbook**, not a record that these target operations occurred.

1. **Review the release candidate.** Record current diff, intended product files, lockfile, pinned versions, migration IDs, known findings, test commands and actual results. Preserve unrelated Ledger Lite/navigation changes. Keep milestones REVIEW; stage exact paths and create commits/tags only within separately granted authority. An existing M4 acceptance tag does not identify a deployable M12 release.
2. **Close product and commercial review.** Confirm demonstration limitations, founder acceptance, brand/contact/operator details, pricing drafts, privacy/terms, permitted inquiry handling, support expectations and a complete provider budget. Real email/WhatsApp/API activation needs explicit approval.
3. **Prepare an isolated target.** Confirm provider/region and PostgreSQL 18 compatibility; set separate runtime/migration credentials, private networking, TLS, firewall, public path exclusions, edge limits, monitoring and encrypted off-host backup destination. Select one application instance initially.
4. **Rehearse recovery before migration.** Back up current target state, verify archive integrity, restore into an isolated scratch database with equivalent roles, check schema/content/permissions/RLS/sequences, and exercise the matching application. Preserve the original target. Do not choose a snapshot or switch connections without an explicit data-loss and cutover review.
5. **Build the exact artifact in isolation.** Use Node 24 and the committed/intended lockfile. `npm ci` then `npm run build`; do not install floating latest dependencies as part of deployment. Supply reviewed public metadata settings at build time. Test the artifact under target-like environment and runtime permissions. Preserve an immutable prior compatible artifact and configuration fingerprint for rollback.
6. **Apply additive migrations once.** A designated migration job supplies the target migration identity and safe runtime role to `npm run db:migrate`. This invokes `prisma migrate deploy` plus restricted runtime grants. Verify the intended target identity first; no local/test convenience file may silently select the wrong database. Do not run the CI bootstrap helper on a live database. Remove migration credentials from the runtime afterward.
7. **Run acceptance on the prepared target before opening traffic.** Recheck the six products, independent visitors and resets, role redaction, idempotency/concurrency, refresh/restart recovery, HTTPS cookie flags and no-store responses. Check ordinary acceptance-only routes return 404, APIs/demo routes remain non-indexable as designed and private operations paths are blocked at the public edge and origin. Test budget/rate/capacity recovery and response to unavailable DB/WebGL.
8. **Authorise the actual cutover.** Present the tested target, exact recurring budget, outstanding limitations and rollback plan. Public DNS, publication, resource purchase and production traffic changes remain separate approval steps. After an authorised cutover, verify the real hosted URLs, certificate, route boundaries and restoration alarms; do not call a prepared artifact “live”.

Required local commands, selected from the existing npm scripts, include the baseline and affected product checks:

```powershell
npm.cmd run build
npm.cmd run typecheck
node scripts/check-brand.mjs
npm.cmd run test:unit
npm.cmd run test:platform
npm.cmd run test:cafe
npm.cmd run test:commerce
npm.cmd run test:automation
npm.cmd run test:property
npm.cmd run test:accounting
npm.cmd run test:interior
npm.cmd run test:studio
npm.cmd run test:operations
node scripts/check-source-secrets.mjs
npm.cmd test
npm.cmd run test:labs
```

Read the Playwright configurations before starting previews. Use separate test data; the website suite binds port 3000 and Labs acceptance binds 3100. Stop/restart only identified task-owned previews when a fresh build requires it. Run browser report-producing suites sequentially to preserve artifacts. These commands are a verification requirement list; executed results belong in the current M11 report/execution log, not an assumed pass in this runbook.

The GitHub Actions workflow prepares PostgreSQL 18, roles/migrations, domain/database checks, browser suites and failure artifacts. **Hosted CI has not been executed or verified by this documentation task.** A passing local run is not proof of hosted network, Linux image, provider backup, deployment or TLS configuration. The existing Docker configuration is preparation until a current image build/run is actually recorded.

## 6. Abuse limits, indexing, privacy and monitoring

Current Labs ceilings include 500 active workspaces, 300 global new-session admissions per minute, 120 requests per session per minute, 500 accepted actions per generation, bounded generations/documents and streaming JSON body limits. These are application/database bounds, not a public traffic service guarantee. The shared admission ceiling can still be occupied by hostile visitors.

Before a public showcase, propose and test edge connection/request/session-creation limits against the expected audience, including shared office/mobile IPs. Set body/time limits compatible with the app's 8 KiB JSON cap and transaction budgets. Monitor rejection/rate counts, capacity utilisation, DB connections/locks, latency/error rates, disk/WAL/backup age, process restarts and memory. Alerts must identify an operator and response path. Rate changes or new telemetry providers require a reviewed configuration; no analytics collector or alerting subscription is activated here.

Keep API responses private/no-store; never cache session/action responses at the proxy. Sitemap and robots exclusions reduce indexing, not unauthorised access. Acceptance-only modes stay off; audit reset/session endpoints and demo noindex headers against the ordinary hosted build. Public marketing metadata uses only approved canonical URLs and factual claims.

The contact/quotation brief is a local demonstration, and the M9 controlled workflow accepts fictional `.test` inquiry details in its visitor workspace. Do not silently route real contact input into it, external email or a CRM. Development analytics remain local and bounded; approve privacy, consent, retention, access, breach response and provider agreements before activating production communications or analytics. Logs must omit credentials, cookies/tokens, contact text and real personal data. Provider selection alone establishes no Malaysian regulatory or tax compliance claim.

## 7. Backup and recovery procedure

### Current local rehearsal

`npm.cmd run db:backup` uses `scripts/labs-backup.mjs` with the repository's guarded `.local/postgresql` settings and Windows PostgreSQL `.exe` tools. It is pinned to loopback port 55432, the named dev/test databases and their owner roles. It creates private custom-format dumps/manifests, restores into generated scratch databases, compares content/schema/effective permissions/RLS/sequence safety and removes only those generated scratch databases. It does not replace an active database and does not contain role passwords.

This helper is **not a portable cloud backup installer**. Do not point it at a hosted production URL or remove its guards to make it do so. The current execution log should cite the actual manifest/rehearsal result. Local archive verification and graceful restart prove specific local recovery properties; they do not prove off-device recovery, provider disaster recovery or a production cutover.

### Future target backup plan

Before an authorised launch, define recovery-point and recovery-time objectives with the founder; they are currently unagreed. A candidate low-volume policy for review is daily logical exports plus at least seven daily and four weekly retained copies, encrypted and stored outside the application/DB failure domain. This policy would permit up to a day of unbacked writes, so it must not be represented as an accepted RPO. If that loss window is unacceptable, select and test provider/WAL point-in-time recovery with its cost and retention explicitly approved.

Use target-compatible PostgreSQL clients and secure credential files/environment, never password URLs on command lines. Prepare an environment-specific wrapper around custom-format `pg_dump` / `pg_restore` with validated target names, restrictive permissions, checksums, role/ownership mapping and sanitised error handling. A database dump does not include all cluster-global objects; separately provision equivalent runtime/migration roles and retain their protected configuration without publishing passwords. [PostgreSQL 18 dump documentation](https://www.postgresql.org/docs/18/app-pgdump.html), [restore documentation](https://www.postgresql.org/docs/18/app-pgrestore.html).

Each scheduled backup must report completion, size/hash, source DB identity/version, migration fingerprint and retention outcome. Alert on failed/stale backups and storage exhaustion. Keep restore credentials separate from web runtime credentials. A storage provider's “snapshot available” indicator is insufficient proof of a recoverable application.

### Isolated restore rehearsal

1. Select a trusted archive and verify its manifest/checksum, source PostgreSQL version, schema/migration IDs and expected role mapping. Use a separate scratch target, never an active data directory. Restores execute archive-defined database code, so inspect provenance and privileges before using an untrusted archive. [Official restore warning](https://www.postgresql.org/docs/18/app-pgrestore.html).
2. Provision equivalent restricted roles and an isolated scratch database/network. Restore with tested target-specific commands; preserve original ownership and policies, or explicitly review an equivalent remapping. Do not silently discard owners, ACLs or RLS to get a green import.
3. Compare table counts/content digests, schema/migrations, effective grants, forced RLS, control/foreign-key constraints and sequence safety. Runtime must remain non-owner/non-BYPASSRLS and fail closed without session scope.
4. Start the matching app artifact against the scratch database in isolation. Check all six product sessions/projections, safe mutations, concurrency/idempotency, independent resets, accounting reconciliation and saved scene transforms. Restart app and DB, then recheck persistence. Preserve evidence of the exact archive/artifact/configuration pair.
5. Record actual restore time and the snapshot's last included write. Remove only the generated scratch resources after verification and an absolute-target check. These steps rehearse recovery; they do not authorise an active connection switch or deletion of the previous database.

## 8. Rollback and incident sequence

**Application-only regression:** stop new traffic/actions at the approved ingress if necessary, preserve diagnostic evidence and current data, and select a previously tested artifact whose code remains compatible with the applied additive schemas. Restore its matching non-secret configuration and verify a private health/product smoke run before switching traffic. Keep the newer additive schema in place. Do not down-apply/drop schemas, rewrite `_prisma_migrations`, run a blanket reset or create an acceptance tag to disguise the rollback.

**Database migration failure:** retain the database and migration evidence, determine which statements committed, and keep traffic off any incompatible application. Prefer a reviewed forward fix or a known compatible prior application; rehearse it first. Never blindly resolve a failed migration as applied, rerun changed historical SQL or rebuild the database. Migration-owner operations require their own authorised scope and current backup.

**Data recovery required:** first back up current state, then restore the selected archive to a separate database with the matching roles and app artifact. Quantify writes after the snapshot and obtain explicit approval for any resulting loss, outage and connection switch. Validate the scratch restore, pause writers, perform the authorised switch, and verify all six products and isolation boundaries. Retain the old database read-only for the agreed review window. Reconcile or deliberately discard later writes through an approved recovery plan; do not merge databases ad hoc.

**Private operations incident:** keep public routing denied, stop the local runner, preserve private state/logs, invalidate affected sessions/keys under explicit authorisation, and inspect interrupted tasks before a newly approved retry. An unfinished run becomes interrupted; it must not automatically execute after restart. Never expose the local check runner as a public recovery shortcut.

## 9. Outstanding launch decisions and evidence limits

- Founder acceptance remains separate from local implementation REVIEW. Public hosting, account/budget approval, domain and DNS are unapproved.
- Region, actual measured runtime/build requirements, traffic capacity, spending alarms and a complete provider quote remain to be verified on a selected target.
- TLS/proxy/firewall/path-deny/cookie/origin behaviour, bypass prevention and hosting-specific secret handling have no hosted verification yet.
- The private operations desk remains a single-process local tool. Production worker authentication, distributed queues, real customer authentication and real communications are outside the current showcase implementation.
- Off-host encrypted backup storage, agreed RPO/RTO, scheduled alerts, target-specific role provisioning and an off-device restore/cutover rehearsal remain outstanding.
- Hosted CI/image execution, provider recovery and target performance are not established by the prepared workflow, Dockerfile or this document. Use current local results from the execution log without relabelling them as hosted evidence.
- No additional paid service was activated for this runbook. Research and documentation introduced **RM0 additional paid-service spend**; no current exchange-rate or AI-token invoice amount is asserted.

Document preparation checked repository configuration/scripts and the cited primary pricing/PostgreSQL pages. It did not run tests, back up/restore a database, provision resources, alter routing or publish anything. The integration owner records the current M11 validation evidence separately.

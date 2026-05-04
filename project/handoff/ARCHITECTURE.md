# Tenari — Architecture

## System diagram

```
                          ┌─────────────────────────────┐
                          │   MSP Operator (browser)    │
                          │   Customer (white-label)    │
                          └──────────────┬──────────────┘
                                         │ HTTPS
                          ┌──────────────▼──────────────┐
                          │   Next.js 15 App (Edge+SSR) │
                          │   - App Router pages        │
                          │   - tRPC + REST endpoints   │
                          │   - NextAuth (Entra)        │
                          └──────┬────────────────┬─────┘
                                 │                │
              ┌──────────────────┘                └──────────────────┐
              │                                                      │
   ┌──────────▼───────────┐                              ┌───────────▼──────────┐
   │  PostgreSQL 16       │                              │  Redis 7             │
   │  - tenants, users    │                              │  - sessions          │
   │  - cost_facts        │                              │  - BullMQ queues     │
   │  - policy_findings   │                              │  - rate-limit tokens │
   │  - audit_log (RLS)   │                              └──────────────────────┘
   └──────────────────────┘
              ▲
              │
   ┌──────────┴────────────────────────────────────────────────────────────┐
   │  Worker pool (Node.js, BullMQ consumers)                              │
   │  - cost-ingest         (hourly per customer tenant)                   │
   │  - policy-scan         (6-hourly)                                     │
   │  - alert-poll          (5-minute)                                     │
   │  - bicep-validate      (on-demand, Docker sandbox)                    │
   │  - report-render       (scheduled + ad-hoc)                           │
   │  - notification-fanout (email/Teams/webhook)                          │
   └───────────────────────────────────────────────────────────────────────┘
              │
              │  delegated tokens (per customer tenant)
              ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │  Customer Azure Tenants (1..N)                                         │
   │  - Microsoft Graph        (org info, users)                            │
   │  - Azure Resource Manager (resources, deployments)                     │
   │  - Cost Management API    (usage, forecasts)                           │
   │  - Azure Policy           (definitions, assignments, compliance)       │
   │  - Defender for Cloud     (recommendations, secure score)              │
   │  - Azure Monitor          (alerts, metrics)                            │
   └────────────────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────────────────────┐
   │  Anthropic API  (Claude Sonnet 4.5 + Haiku)                            │
   │  - Bicep generation     (Sonnet)                                       │
   │  - Cost/policy summaries (Haiku)                                       │
   │  - Alert triage classification (Haiku)                                 │
   └────────────────────────────────────────────────────────────────────────┘
```

## Logical layers

### 1. Edge / SSR layer (Next.js)
- Auth gate (NextAuth + Entra multi-tenant)
- All UI pages — App Router, RSC where possible, client components for interactive screens
- tRPC for typed UI→server calls
- Rate limiting per Tenari-tenant (Redis token bucket)

### 2. Application services
Logical modules, all in the same Node process initially. Split into separate services only if a specific module needs independent scaling.

| Service | Owns |
|---|---|
| `auth` | Entra OAuth, session, RBAC checks |
| `tenancy` | Tenari customers (MSPs) and their managed Azure tenants |
| `azure-connector` | Token refresh, ARM/Graph/Cost/Policy/Defender clients |
| `cost` | Ingestion, aggregation, forecasts, recommendations |
| `policy` | Compliance scoring, drift detection, drilldowns |
| `alerts` | Polling, deduplication, routing, drawer state |
| `bicep` | Generation, validation, deployment plans |
| `reports` | Templates, scheduling, rendering |
| `audit` | Append-only event log, query API |
| `billing` | Tenari's own billing of MSPs (Stripe) |
| `portal` | White-label customer portal — separate Next.js route group |
| `notifications` | Email (Resend), Teams, webhook delivery |

### 3. Worker layer (BullMQ)
Same Node codebase, separate process. Critical for Azure rate limits — never call Azure APIs from a request handler.

### 4. Sandboxes
- **Bicep sandbox:** Disposable Docker container with `azure-cli` + `bicep`. Runs `bicep build` + `az deployment what-if`. Network-locked to the target customer tenant only. Killed after each invocation.

## Multi-tenancy model

### Two layers of tenancy

This is the most-confused thing in the codebase. Be precise:

- **Tenari customer** = an MSP that pays Tenari (e.g. "Acme MSP"). Owns users, settings, branding, billing. *Internally we call this `org` to disambiguate.*
- **Managed tenant** = a customer-of-the-MSP's Azure tenant that the MSP manages (e.g. "Contoso Ltd"). The MSP onboards these via Entra consent.

A Tenari `org` has many `users` and many `managed_tenants`. Each `managed_tenant` has its own delegated Azure access.

### Isolation strategy

**Postgres Row-Level Security (RLS).** Every table that holds org-scoped data has an `org_id` column and an RLS policy:

```sql
CREATE POLICY org_isolation ON cost_facts
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

The application sets `app.current_org_id` per connection from the session. A bug in app code cannot leak data across orgs unless it also escalates database role — defense in depth.

Tables holding `managed_tenant_id` (most tables) layer a second policy: a user can only see managed tenants they're entitled to via `org_user_managed_tenant` ACL.

### Token storage

Customer Azure refresh tokens are **encrypted at rest with a per-org KEK** stored in Azure Key Vault. The application server holds only DEKs in memory, decrypted on demand. Never log tokens. Never include them in error reports.

## Request flow examples

### Operator views the Overview page

1. Browser → `/dashboard` → NextAuth checks session
2. RSC server component reads `org_id` from session, sets Postgres session var
3. Calls `getOverview(orgId)` — single query joining `cost_facts_daily`, `policy_summary`, `alerts_summary`, `managed_tenants`
4. Returns rendered HTML with embedded JSON for client components (chart interactions)
5. Client components hydrate, no further data fetch on initial load

### A scheduled cost ingestion

1. Cron-triggered BullMQ producer enqueues `cost-ingest` jobs (one per `managed_tenant`)
2. Worker picks job, looks up encrypted refresh token, decrypts, exchanges for access token
3. Calls Cost Management `query` API with day-grain aggregation, last 24h
4. Upserts to `cost_facts_daily` with idempotency key `(managed_tenant_id, date, scope)`
5. Updates `managed_tenants.last_cost_sync_at`
6. On rate-limit (429), respects `Retry-After`, requeues with exponential backoff
7. Emits OpenTelemetry span; failures alert the on-call engineer (you, initially)

### AI Bicep generation

1. Operator types prompt in chat mode → tRPC `bicep.generate.mutate({ prompt, managedTenantId })`
2. Server fetches managed tenant context (subscription IDs, region preferences, naming conventions from `org_branding`)
3. Calls Claude Sonnet with system prompt from `prompts/bicep-system.md` + context
4. Receives Bicep + explanation
5. Enqueues `bicep-validate` job; returns `generationId` immediately
6. Worker spins up Docker sandbox, runs `bicep build`, then `az deployment what-if --no-pretty-print` against target tenant (read-only)
7. Stores result in `bicep_generations.validation_result`
8. Browser long-polls or websockets for completion
9. Operator reviews diagram + what-if output; clicks Deploy → second confirmation → real `az deployment create`

## Deployment

### Local (Mac, Docker Compose)
- Single `docker compose up` runs Next.js (dev mode), Postgres, Redis, MinIO, Grafana stack, mailhog
- Hot reload on Next.js
- See `SETUP.md`

### Production (Azure, post-MVP)
- **Azure Container Apps** for Next.js + workers (one app each)
- **Azure Database for PostgreSQL Flexible Server** with private endpoint
- **Azure Cache for Redis**
- **Azure Blob Storage** (reports, exports, logos)
- **Azure Key Vault** (KEKs, app secrets)
- **Azure Front Door** + WAF
- **Azure Monitor + Log Analytics** for OTel
- **Azure Container Registry** for images
- IaC: **Bicep** (eat your own dogfood) — under `infra/`

## Backup / DR

- Postgres: PITR enabled, 35-day retention, daily logical backup to a separate region's blob storage
- Redis: ephemeral, no backup needed (regenerable state)
- Blob storage: GRS replication
- Test restore quarterly. Document RTO (4h) / RPO (1h) in `runbooks/`.

## Threat model summary

See `SECURITY.md` for full STRIDE analysis. The two scariest threats:

1. **Cross-org data leak** — mitigated by RLS + per-request session var + integration tests that try to read across orgs
2. **Customer Azure token theft** — mitigated by KEK-in-Key-Vault, encrypted-at-rest, no logging of tokens, scoped permissions

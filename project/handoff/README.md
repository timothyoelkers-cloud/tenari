# Tenari — Multi-Tenant Azure Management for MSPs

> **Status:** Pre-development. Prototype complete. This package is the spec.
> **Owner:** Tim Oelkers
> **Legal entity:** Proactive Systems Management Ltd *(placeholder — will change)*
> **GitHub:** `github.com/timothyoelkers-cloud/tenari`
> **Production domain (TBD):** `tenari.io` / `tenari.cloud` *(verify availability + trademark before committing)*

---

## What Tenari is

A SaaS control plane that lets Managed Service Providers (MSPs) operate dozens or hundreds of customer Azure tenants from a single console. The prototype (`../Aegis Cloud.html`) is the canonical UI spec — every screen in it is in scope for V1.

**Core value props:**
1. **Unified visibility** across all customer Azure tenants — cost, compliance, security, alerts
2. **AI-assisted Bicep generation** with validation, so MSP engineers can deploy infra by describing it
3. **One-click cost optimization** with risk-tiered apply flow + rollback
4. **White-label customer portal** so MSPs can give their clients a branded view
5. **Full audit + compliance instrumentation** — SOC 2 ready from day one

---

## How to use this handoff package

| Doc | Read this when... |
|---|---|
| `ARCHITECTURE.md` | You're standing up the system or onboarding a new dev |
| `DATA_MODEL.md` | You're writing migrations or designing a new feature |
| `API_CONTRACTS.md` | You're building a screen or wiring up an endpoint |
| `AZURE_INTEGRATION.md` | You're touching anything that talks to a customer tenant |
| `AI_BICEP_SPEC.md` | You're working on the Bicep generator |
| `COMPONENT_INVENTORY.md` | You're translating a prototype screen to real React |
| `SECURITY.md` | Always. Read first, re-read often. |
| `COMPLIANCE_ROADMAP.md` | Before adding logging, secret handling, or tenant data flow |
| `MILESTONES.md` | Planning what to build next |
| `SETUP.md` | First time running locally |
| `prompts/claude-code-system.md` | Configuring Claude Code in VS Code |

---

## V1 scope — nothing dropped

Per the founder's directive: every screen in the prototype is in V1. That includes:

- Tenant onboarding + Entra multi-tenant consent
- Overview dashboard (KPIs, spend trend, service donut, top-tenant table, health heatmap, critical-attention queue)
- Tenants list + grid + per-tenant deep dive (overview, resources, cost, policies, alerts tabs)
- Policies — compliance scoring, severity/category filters, drilldown drawer with risk + impacted tenants
- AI Bicep — three modes (chat, form builder, plan upload) + validation + diagram view
- Cost & Savings — recommendations table with risk-tiered apply flow + rollback
- Alerts with detailed drawer (impact, remediation, timeline, comments)
- Billing — run schedule, invoice list, plan/usage
- Reports — five clickable templates + scheduled-reports table with open rates
- Audit log — full event stream with filter/search
- Users & RBAC — role definitions, permissions matrix
- Customer Portal — multi-tab white-labeled preview
- Mobile companion — three phone frames (alerts, cost, approvals)
- Settings — eight sections (Workspace, Identity & SSO, Integrations, Branding, Billing & Plan, API & Webhooks, Notifications, Data & Retention)

**This is delivered in 5 phases (see `MILESTONES.md`)** — not because anything is dropped, but because building all of it before showing anything to your 3 test tenants is how products die.

---

## Tech stack — picked for solo + Mac + Docker → Azure

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + React 19 + TypeScript** | Largest talent pool, fastest iteration, deploys to Azure App Service |
| UI | **shadcn/ui + Tailwind CSS v4** | Direct match for prototype's component palette |
| Backend | **Next.js API routes + tRPC** for typed RPC; **Hono** for any non-Next API workers | Zero context-switching, single deploy unit for v1 |
| ORM | **Drizzle ORM** | Honest SQL, good migrations, fast TS types |
| DB | **PostgreSQL 16** with **Row-Level Security** for tenant isolation | Multi-tenancy done right, single DB instance |
| Cache + queue | **Redis 7** + **BullMQ** | Cost ingestion, scheduled reports, async Bicep validation |
| Auth | **Microsoft Entra ID (multi-tenant app)** + **NextAuth v5** with custom Entra provider | Required anyway for Azure access; gives you SSO for free |
| Object storage | **Azure Blob Storage** (S3-compatible local via **MinIO** in Docker for dev) | Reports, exported Bicep, logos for white-label |
| Bicep validation | **Docker sandbox** running `az bicep build` + `az deployment what-if` | Only safe way to validate AI-generated Bicep |
| AI | **Anthropic Claude Sonnet 4.5** via API (with Haiku for cheap classification tasks) | Best Bicep generation quality |
| Observability | **OpenTelemetry → Azure Monitor** (local: **Grafana + Tempo + Loki** in Docker) | Required for SOC 2 |
| Secrets | **Azure Key Vault** (prod), `.env.local` + Doppler (dev) | Customer Azure tokens NEVER hit application logs |
| Local dev | **Docker Compose** orchestrating all of the above | One `docker compose up` to run everything |

See `SETUP.md` for the bootstrap.

---

## Reading the prototype as spec

The prototype is in `../Aegis Cloud.html`. **Treat it as functional spec, not visual spec.**

- **Take from it:** information architecture, data shapes, every interaction state, copy, the apply-flow risk modal pattern, the alert-drawer pattern, the AI Bicep three-mode UX
- **Replace:** the inline data generators with real API calls, the localStorage tweaks with real settings, the placeholder logos with real branding (once Tenari brand is locked)
- **Improve:** accessibility (the prototype is keyboard/SR-incomplete), real loading + error states, optimistic updates

When implementing a screen, the workflow is:
1. Open the screen in the prototype, click around every state
2. Read `COMPONENT_INVENTORY.md` for the shadcn equivalents
3. Read `API_CONTRACTS.md` for that screen's endpoints
4. Read the relevant section of `DATA_MODEL.md`
5. Build it. Match the prototype's behavior, not its hex codes — final design tokens come later.

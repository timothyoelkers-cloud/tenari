# Tenari — API Contracts

Every endpoint implied by the prototype, with request/response shapes. tRPC for browser→server, REST for external/webhook/portal.

> **Conventions**
> - All amounts in **pence** (integer), currency `GBP` unless explicit.
> - All timestamps **ISO 8601 UTC** in JSON.
> - All IDs are **UUID v4** unless they're Azure-native (which keep their original format).
> - Pagination: `?cursor=<opaque>&limit=50` returning `{ items, nextCursor }`.
> - Errors: `{ code, message, details? }` with HTTP status. Codes namespaced like `TENANT_NOT_FOUND`, `BICEP_VALIDATION_FAILED`.
> - Every mutation is logged to `audit_events`.

---

## Auth & session (NextAuth-managed)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/auth/signin` | NextAuth → Entra |
| GET | `/api/auth/callback/azure-ad` | NextAuth handles |
| POST | `/api/auth/signout` | |
| GET | `/api/auth/session` | `{ user, org, role, permissions[] }` |

After first Entra sign-in, if the user has no `org_users` row they're redirected to `/onboarding/org` (create or join an org).

---

## Org / settings

### `org.get`
```ts
input:  void
output: {
  id, slug, name, plan, trialEndsAt, defaultRegion,
  brand: { logoUrl, primary, secondary },
  portalSubdomain
}
```

### `org.update`
```ts
input: { name?, defaultRegion?, brand?, portalSubdomain? }
output: Org
```

### `org.usage`
For Settings → Billing & Plan.
```ts
output: {
  plan: 'starter'|'growth'|'enterprise',
  managedTenants: { used: 14, limit: 25 },
  aiBicepGenerations: { used: 1240, limit: 5000, periodEnd },
  seats: { used: 7, limit: 10 },
  storageGb: { used: 4.2, limit: 50 },
}
```

### `org.integrations.list` / `.connect` / `.disconnect`
```ts
list  → Integration[]
connect input: { kind: 'slack'|'teams'|'servicenow'|'pagerduty'|'github'|'webhook', config }
       output: Integration
disconnect input: { id } → void
```

### `org.apiKeys.list` / `.create` / `.revoke`
```ts
create input: { name, scopes: string[], expiresAt? }
       output: { id, name, fullKey: 'tnri_live_...' }   // shown ONCE
list   → { id, name, prefix, lastUsedAt, createdAt, expiresAt }[]
revoke input: { id } → void
```

### `org.webhooks.*` — list, create, update, delete, test
```ts
create input: { url, events: WebhookEvent[] }
       output: { id, signingSecret: '...' }   // shown ONCE
test   input: { id } → { delivered: bool, statusCode, body }
```

`WebhookEvent` enum: `tenant.added`, `tenant.health.degraded`, `alert.fired`, `alert.resolved`, `bicep.deployed`, `cost.recommendation.applied`, `report.delivered`, `audit.event`.

---

## Users & RBAC

### `users.list`
```ts
output: {
  user: { id, email, displayName, avatarUrl, lastSignInAt },
  role: string,
  status: 'active'|'invited'|'suspended',
  managedTenants: { id, displayName }[]   // empty = all
}[]
```

### `users.invite`
```ts
input: { email, role, managedTenantIds?: string[] }
output: { invitationUrl }   // for copy-paste / re-send
```

### `users.updateRole` / `.suspend` / `.remove`

### `roles.list` / `.create` / `.update` / `.delete`
```ts
Role: { id, name, description, permissions: string[], isSystemRole, userCount }
```

Permissions enum (curated, append-only):
```
tenants:read   tenants:write   tenants:delete
cost:read      cost:apply
policy:read    policy:exempt   policy:assign
alerts:read    alerts:ack      alerts:resolve
bicep:read     bicep:generate  bicep:deploy
reports:read   reports:create  reports:schedule
audit:read     billing:read    billing:write
settings:read  settings:write  rbac:write
```

---

## Managed tenants (the customer Azure tenants)

### `tenants.list`
For the Tenants list/grid screens.
```ts
input:  { filter?, sort?, view?: 'list'|'grid', cursor?, limit? }
output: {
  items: ManagedTenantSummary[],
  nextCursor,
  totals: { all, active, degraded, suspended }
}

ManagedTenantSummary = {
  id, azureTenantId, displayName, domain, status,
  contractTier, mrrPence,
  health: { score: 0..100, alerts: { sev1, sev2 } },
  cost: { mtdPence, forecastMonthPence, deltaPct },
  compliance: { score: 0..100, criticalFindings: number },
  lastFullSyncAt, onboardedAt
}
```

### `tenants.get`
```ts
input:  { id }
output: ManagedTenant + {
  subscriptions: Subscription[],
  primaryContacts: Contact[],
  notes,
  tags: string[]
}
```

### `tenants.connect` (the onboarding flow)
```ts
// Step 1: get the consent URL
input:  { displayName?, expectedAzureTenantId? }
output: { consentUrl, state }

// Step 2: callback handled by /api/tenants/connect/callback
// Server exchanges code → tokens, encrypts, stores managed_tenant_credentials
// Returns: { managedTenantId, displayName, subscriptionsDiscovered }
```

### `tenants.update` / `.suspend` / `.offboard` / `.refreshTokens`

### `tenants.overviewTab` (per-tenant deep dive — Overview tab)
```ts
output: {
  health: HealthBreakdown,
  costMtd: { pence, deltaPct, sparkline: number[] },
  topServices: { service, pence, pct }[],
  openAlerts: AlertSummary[],
  complianceScore: number,
  recentEvents: AuditEvent[]
}
```

Other tabs follow this pattern: `tenants.resourcesTab`, `.costTab`, `.policiesTab`, `.alertsTab`, `.tagsTab`, `.accessTab`. Each returns the data shape that screen renders. **Do not return a giant `tenant.everything` blob — pay only for the tab in view.**

---

## Overview (the home dashboard)

### `overview.kpis`
```ts
output: {
  totalManagedTenants: number,
  totalMrrPence: number,
  totalSpendMtdPence: number,
  totalSpendForecastMonthPence: number,
  spendDeltaPctVsLastMonth: number,
  openAlerts: { sev1, sev2, sev3, sev4 },
  avgComplianceScore: number,
  potentialSavingsPence: number,
  bicepGenerationsThisMonth: number
}
```

### `overview.spendTrend`
```ts
input:  { months: 12 }
output: { month: 'YYYY-MM', actualPence: bigint, forecastPence: bigint }[]
```

### `overview.serviceBreakdown`
```ts
output: { service: string, pence: bigint, pct: number }[]   // top 8 + 'Other'
```

### `overview.topTenants`
```ts
input:  { sort: 'cost'|'alerts'|'mrr'|'compliance', limit: 10 }
output: ManagedTenantSummary[]
```

### `overview.healthHeatmap`
The grid on the home page.
```ts
output: {
  tenantId, displayName,
  cells: {
    cost: 'good'|'warn'|'bad',
    compliance: 'good'|'warn'|'bad',
    security: 'good'|'warn'|'bad',
    backups: 'good'|'warn'|'bad',
    patches: 'good'|'warn'|'bad'
  }
}[]
```

### `overview.criticalQueue`
```ts
output: ({ kind: 'alert', alert: AlertSummary } |
         { kind: 'compliance', finding: PolicyFindingSummary } |
         { kind: 'cost', recommendation: CostRecSummary })[]
```

---

## Policies

### `policies.list`
```ts
input:  { severity?, category?, state?, search?, cursor?, limit? }
output: {
  items: {
    id, displayName, category, severity,
    impactedTenants: number, totalFindings: number, complianceScore: number
  }[],
  nextCursor,
  filters: { categories: string[], severities: string[] }
}
```

### `policies.get`
For the drilldown drawer.
```ts
output: PolicyDefinition + {
  riskAnalysis: { businessImpact, blastRadius, exploitability, narrative },
  remediationSteps: string[],
  controlMappings: { framework, controlId, controlName }[],
  impactedTenants: { tenantId, displayName, findings: number, score }[],
  trend: { date, complianceScore }[]   // 30 days
}
```

### `policies.exempt`
```ts
input: { findingId, reason, until? }
output: void
```

### `policies.scan` (manual trigger)
```ts
input: { managedTenantId? }   // null = all
output: { jobId }
```

---

## Cost & savings

### `cost.summary`
For Cost & Savings header tiles.
```ts
input: { managedTenantId? }
output: {
  mtdPence, forecastMonthPence, lastMonthPence,
  potentialSavingsPence,
  recommendationsByRisk: { low: number, medium: number, high: number }
}
```

### `cost.byService` / `cost.byTenant` / `cost.byTag`
```ts
input: { groupBy, period: 'mtd'|'last30d'|'last90d', managedTenantId? }
output: { key, pence, pct, deltaPct }[]
```

### `cost.recommendations.list`
```ts
input: { riskTier?, category?, managedTenantId?, status? }
output: {
  id, managedTenant: { id, displayName },
  category, title, description, riskTier,
  estimatedSavingsPenceMonthly, resourceId, status
}[]
```

### `cost.recommendations.apply`
The risk-tiered apply flow.
```ts
input: {
  ids: string[],
  acknowledgeRollbackWindow?: bool   // required for medium+
}
output: {
  applied: { id, jobId }[],
  rejected: { id, reason }[]   // e.g. wrong-risk-tier acknowledgement
}
```

For **medium/high risk**, the server REJECTS the call without `acknowledgeRollbackWindow=true`. The client renders the prototype's confirmation modal and only retries with the flag set.

### `cost.recommendations.rollback`
```ts
input: { id }
output: { jobId }
```

Only available within `rollback_deadline_at`.

### `cost.recommendations.dismiss`
```ts
input: { id, reason }
output: void
```

---

## Alerts

### `alerts.list`
```ts
input: { severity?, state?, managedTenantId?, search?, cursor? }
output: AlertSummary[]
```

### `alerts.get`  (drawer)
```ts
output: Alert + {
  timeline: AlertEvent[],
  comments: { id, user, body, createdAt }[],
  related: AlertSummary[],
  recommendedSteps: string[],
  impactedResources: { id, type, name }[]
}
```

### `alerts.acknowledge` / `.assign` / `.resolve` / `.suppress` / `.reopen`

### `alerts.comment`
```ts
input: { alertId, body }
output: AlertEvent
```

---

## AI Bicep

### `bicep.generate`
```ts
input:
  | { mode: 'chat', managedTenantId, prompt, conversationId? }
  | { mode: 'form', managedTenantId, form: BicepForm }
  | { mode: 'plan_upload', managedTenantId, planUploadId }

output: {
  generationId,
  bicep: string,
  summary: string,
  diagramDot: string,
  followUpSuggestions: string[]   // 3 short prompts
}
```

Streams via SSE: text deltas, then a final event with the full record.

### `bicep.validate`
Auto-enqueued by `generate`; can be re-run.
```ts
input: { generationId }
output: { jobId }   // poll bicep.validation.get
```

### `bicep.validation.get`
```ts
output: {
  status: 'queued'|'running'|'pass'|'fail',
  buildOutput: string,
  whatIf: { changes: WhatIfChange[] },
  errors: { code, message, line?, column? }[]
}
```

### `bicep.deploy`
```ts
input: {
  generationId,
  targetSubscriptionId, targetResourceGroup,
  parameters: Record<string, any>,
  dryRun: bool
}
output: { deploymentId, jobId }
```

### `bicep.history.list`
```ts
output: BicepGenerationSummary[]
```

### `bicep.uploadPlan`
For mode = `plan_upload`.
```ts
multipart: file (PDF, Visio, Lucid export, or text)
output: { planUploadId, extractedRequirements: string[] }
```

---

## Reports

### `reports.templates.list` / `.get`
```ts
Template = {
  id, kind, name, description,
  sections: { id, title, kind, config }[],
  isSystem: bool
}
```

### `reports.templates.create` / `.update` / `.delete`

### `reports.schedules.list` / `.create` / `.update` / `.delete`
```ts
Schedule = {
  id, templateId, name, cronExpr, timezone,
  recipients: { email, displayName }[],
  channels: ('email'|'portal'|'webhook')[],
  enabled, lastRunAt, nextRunAt,
  stats: { sent, opens, clicks }
}
```

### `reports.runNow`
```ts
input: { templateId, managedTenantId?, recipients }
output: { runId }
```

### `reports.runs.list`
```ts
output: ReportRun[]   // with delivery + open/click stats
```

### `reports.runs.download`
```ts
input: { runId }
output: { signedUrl }   // expiring 15 min
```

---

## Audit

### `audit.events.list`
```ts
input: {
  q?, actorUserId?, action?, managedTenantId?,
  from?, to?, cursor?, limit?
}
output: { items: AuditEvent[], nextCursor }
```

### `audit.events.export`
```ts
input: { format: 'csv'|'json', filter }
output: { jobId }   // sent to user's email when ready
```

---

## Customer portal (white-label)

Mounted under a separate route group, served on `<orgSlug>.tenariportal.com` (prod) or `localhost:3000/portal/<orgSlug>` (dev). Auth via `portal_users` (magic link or Entra B2B).

### `portal.session`
```ts
output: {
  brand, customer: { id, displayName },
  permissions: { canSeeCost, canRaiseTickets, canSeeCompliance, canSeeBilling }
}
```

### `portal.dashboard`
### `portal.cost`
### `portal.compliance`
### `portal.support.tickets.*`
### `portal.billing`
### `portal.team.list`

Each is the read-only customer-facing version of the operator equivalent.

---

## Webhooks (outbound — Tenari → MSP integrations)

Delivered as `POST <configured_url>` with:
```
Content-Type: application/json
Tenari-Event: <event>
Tenari-Delivery-Id: <uuid>
Tenari-Signature: t=<timestamp>,v1=<hmac-sha256>
```

Body shape per event documented in `prompts/claude-code-system.md` — keep them small and stable.

Retry on 4xx (excl. 410/422), 5xx, timeout: 6 attempts, exponential backoff.

---

## Rate limits

| Surface | Limit |
|---|---|
| UI tRPC per user | 600 req/min |
| Public REST per API key | 60 req/sec, 100k/day |
| Webhook deliveries per org | 50/sec |
| Bicep generations per org | plan-dependent |

Token bucket in Redis; expose remaining/reset in headers.

---

## Pagination, filtering, sorting — be consistent

```
GET /api/foo?
  cursor=<opaque>&
  limit=50&
  filter[severity]=high,critical&
  filter[managedTenantId]=...&
  sort=-firedAt
```

`-` prefix = descending. Multiple values comma-separated. Don't invent new schemes per endpoint.

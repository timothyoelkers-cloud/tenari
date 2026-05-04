# Tenari — Azure Integration Guide

Every Azure surface Tenari touches, with the exact APIs, scopes, rate limits, and consent flow.

**Read this before writing any code that calls a customer Azure tenant.**

---

## 1. The multi-tenant app registration

Tenari is a single Entra app registered in *your* tenant (`Tenari Inc.`). It's marked `signInAudience = AzureADMultipleOrgs`. When a customer admin consents, a service principal for Tenari is created in *their* tenant. From then on, Tenari can request delegated tokens for that tenant.

### 1.1 Required permissions

Mix of **Microsoft Graph** (delegated, app-level) and **Azure Service Management** (`https://management.azure.com/user_impersonation`).

| API | Permission | Type | Why |
|---|---|---|---|
| Microsoft Graph | `User.Read` | Delegated | Sign in operator |
| Microsoft Graph | `Directory.Read.All` | Delegated, admin consent | Read tenant org info, users |
| Microsoft Graph | `Organization.Read.All` | Delegated, admin consent | Tenant display name, verified domains |
| Azure SM | `user_impersonation` | Delegated, admin consent | Everything ARM, Cost, Policy, Defender |
| Microsoft Graph | `RoleManagement.Read.Directory` | Delegated, admin consent | Read role assignments for the access screen |

**Don't** request `Directory.ReadWrite.All` or any `*.ReadWrite.*` you don't need. Customer admins read these and back out. Principle of least privilege is also a sales tool.

### 1.2 Consent flow

Operator clicks "Add managed tenant" → server generates state + PKCE verifier → redirects browser to:

```
https://login.microsoftonline.com/organizations/v2.0/adminconsent
  ?client_id=<TENARI_APP_ID>
  &scope=https://graph.microsoft.com/.default
         https://management.azure.com/.default
         offline_access
  &redirect_uri=<TENARI_HOST>/api/tenants/connect/callback
  &state=<state>
  &prompt=consent
```

Customer admin signs in, sees the consent screen, approves. Browser comes back with `?tenant=<azure_tenant_id>&state=...&admin_consent=True`.

Server then does an **authorization code flow on behalf of the operator** for the same scopes against the customer tenant, to get the first refresh token:

```
POST https://login.microsoftonline.com/<azure_tenant_id>/oauth2/v2.0/token
grant_type=authorization_code (or client_credentials for daemon scenarios)
```

Encrypt the refresh token (`SECURITY.md`) and store. Mark `managed_tenants.status = 'active'`.

### 1.3 Consent failures — the things that will trip you

- **Tenant restriction policies (TRPv2):** customer's IT blocks unknown apps. Surface a clear error with link to the docs page they should send to their admin.
- **App can't consent:** customer admin lacks privileged role. Detect `AADSTS65001` and tell the operator.
- **Cross-cloud (Gov/China):** different login authority. Out of scope for V1; explicitly reject these tenants with a clear message.

---

## 2. Token management

### 2.1 Storage
- One refresh token per `managed_tenant`, encrypted at rest (see `SECURITY.md` §3).
- Access tokens cached in Redis with `expires_at - 60s` TTL. Never persisted to disk.
- Refresh on demand; on `invalid_grant`, mark tenant `degraded` and surface the reconnect CTA.

### 2.2 Scope expansion
If a feature later needs a new scope (e.g. you add Sentinel integration), you must:
1. Add to the app registration
2. Trigger an **incremental consent** flow for affected tenants
3. Show a banner in the UI: "Some features require additional access. Reconnect this tenant."

Don't silently swallow scope failures.

---

## 3. Microsoft Graph

| Endpoint | When |
|---|---|
| `GET /v1.0/organization` | After consent, capture display name, verified domains |
| `GET /v1.0/users?$top=999&$select=id,displayName,mail,userType` | Access screen |
| `GET /v1.0/directoryRoles` + `GET /v1.0/directoryRoles/{id}/members` | Privileged role audit |

Rate limits: per-tenant per-app, [documented here](https://learn.microsoft.com/graph/throttling). Respect `Retry-After`. Use `$select` to keep payloads small.

---

## 4. Azure Resource Manager (ARM)

Base URL: `https://management.azure.com`

### 4.1 Subscription discovery
```
GET /subscriptions?api-version=2022-12-01
```
Loop on consent + once per day. Upsert into `managed_tenant_subscriptions`.

### 4.2 Resource inventory
**Use Resource Graph**, not the per-RG list endpoint — Graph is paginated, indexed, and rate-friendly.

```
POST /providers/Microsoft.ResourceGraph/resources?api-version=2022-10-01
{
  "subscriptions": ["..."],
  "query": "Resources | project id, name, type, location, resourceGroup, tags, sku, properties | limit 1000",
  "options": { "$top": 1000, "$skipToken": "..." }
}
```

Sync hourly. Use `$skipToken` for pagination. Diff against `resources` table; mark missing rows with `last_seen_at` older than the run as deleted.

### 4.3 Deployments (for Bicep)
```
PUT /subscriptions/{sub}/resourcegroups/{rg}/providers/Microsoft.Resources/deployments/{name}?api-version=2024-03-01

{ "properties": { "mode": "Incremental", "template": {...}, "parameters": {...} } }
```

For what-if (always run before deploy):
```
POST .../deployments/{name}/whatIf?api-version=2024-03-01
```

Store full what-if response in `bicep_validations.what_if_output`. Show the prototype's "what will change" diff in the UI before user confirms.

---

## 5. Cost Management

Base: `https://management.azure.com`. **Most rate-limited surface in Azure** — handle 429 carefully.

### 5.1 Daily cost facts
```
POST /subscriptions/{sub}/providers/Microsoft.CostManagement/query?api-version=2023-11-01
{
  "type": "ActualCost",
  "timeframe": "Custom",
  "timePeriod": { "from": "2026-04-01", "to": "2026-04-30" },
  "dataset": {
    "granularity": "Daily",
    "aggregation": { "totalCost": { "name": "Cost", "function": "Sum" } },
    "grouping": [
      { "type": "Dimension", "name": "ServiceName" },
      { "type": "Dimension", "name": "ResourceGroupName" }
    ]
  }
}
```

Parse `properties.rows` against `properties.columns`. Convert to pence; multiply by 100 and round.

### 5.2 Forecasts
```
POST .../forecast?api-version=2023-11-01
{ "type": "ActualCost", "timeframe": "MonthToDate", "dataset": {...} }
```

Forecast horizon = end of current billing period. Cache per tenant for 4h.

### 5.3 Recommendations (Advisor)
```
GET /subscriptions/{sub}/providers/Microsoft.Advisor/recommendations
  ?api-version=2023-01-01&$filter=Category eq 'Cost'
```

Map each recommendation to a `cost_recommendations` row. `risk_tier` derived from category:
- `low` — unattached disks, idle public IPs, idle network gateways
- `medium` — VM rightsize (down a size), storage tier change
- `high` — reserved instance commitment, VM shutdown, license change

The risk tier drives the apply-flow modal in the UI.

### 5.4 Rate limits & retry
- Cost Management: ~100 req/min per subscription. Worker enqueues with subscription-keyed rate limiter.
- 429s come with `x-ms-ratelimit-microsoft.costmanagement-...-remaining-*` headers and `Retry-After`. Always honour `Retry-After`.
- Cost data has a 24-72h delay. Display "as of <last_cost_sync_at>" in the UI.

---

## 6. Azure Policy

### 6.1 Definitions + assignments
```
GET /providers/Microsoft.Authorization/policyDefinitions?api-version=2023-04-01
GET /subscriptions/{sub}/providers/Microsoft.Authorization/policyAssignments?api-version=2023-04-01
```

Mirror built-in definitions (~1,400 of them) into `policy_definitions` once and refresh weekly.

### 6.2 Compliance state
```
POST /subscriptions/{sub}/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults?api-version=2019-10-01
```

Returns rows of `(policyDefinitionId, resourceId, complianceState)`. Upsert into `policy_findings`. Refresh `policy_compliance_summary` materialized view after.

Run every 6h. Custom Tenari checks (`policy_definitions.custom = true`) run as native code in the worker — don't try to round-trip through Azure Policy.

---

## 7. Defender for Cloud

Optional but high-value for the Security column on the heatmap.

### 7.1 Secure score
```
GET /subscriptions/{sub}/providers/Microsoft.Security/secureScores/ascScore?api-version=2020-01-01
```

### 7.2 Recommendations
```
GET /subscriptions/{sub}/providers/Microsoft.Security/assessments?api-version=2020-01-01
```

Surface alongside policy findings; tag source = `defender`.

### 7.3 Alerts
```
GET /subscriptions/{sub}/providers/Microsoft.Security/alerts?api-version=2022-01-01
```

Feed into `alerts` table with `source = 'defender'`.

---

## 8. Azure Monitor (alerts + metrics)

### 8.1 Alerts
```
GET /subscriptions/{sub}/providers/Microsoft.AlertsManagement/alerts?api-version=2023-07-12
```

Poll every 5 min per active tenant. Dedup on `external_id`. Map `severity`: `Sev0→sev1`, `Sev1→sev2`, etc.

### 8.2 Action groups
For Tenari to receive alerts via webhook from customer tenants, you can ask the customer to add a Tenari webhook to their action groups — but **don't make this required**. Polling is fine for MVP and avoids the customer having to configure things.

---

## 9. Microsoft Cloud for Sovereignty / Gov / China

**Out of scope for V1.** Detect tenants in these clouds during consent and explicitly refuse with a "coming soon" message. Don't half-support them.

---

## 10. Worker patterns

```ts
// pseudocode — see /apps/worker/src/azure/client.ts
async function azureCall<T>(tenantId, scope, fn): Promise<T> {
  const token = await getAccessToken(tenantId, scope);
  try {
    return await fn(token);
  } catch (e) {
    if (e.status === 401) {
      await refreshTokens(tenantId);
      return azureCall(tenantId, scope, fn);
    }
    if (e.status === 429) {
      await sleep(parseRetryAfter(e.headers) ?? 30_000);
      return azureCall(tenantId, scope, fn);
    }
    throw e;
  }
}
```

Wrap **every** Azure call this way. No exceptions.

Telemetry per call:
- `azure.api`: `graph` | `arm` | `cost` | `policy` | `defender` | `monitor`
- `azure.tenant_id`
- `http.status_code`
- `azure.subscription_id` (if applicable)
- `azure.retry_count`

Goes to OTel; Grafana dashboards alert on per-tenant 429 rates and 5xx rates.

---

## 11. Eat-your-own-dogfood checklist

Before V1 launch:
- [ ] Run Tenari against your own dev tenant — every feature works on real data
- [ ] Run against your 2 friendly test tenants for 4 weeks of background ingestion
- [ ] Compare cost numbers to Azure portal — they should match within rounding
- [ ] Bicep validation has zero false-positive failures across 50 generated templates
- [ ] Disconnecting + reconnecting a tenant cleanly restores all data

---

## 12. References

- [Azure REST API reference](https://learn.microsoft.com/rest/api/azure/)
- [Microsoft Graph throttling](https://learn.microsoft.com/graph/throttling)
- [Cost Management throttling](https://learn.microsoft.com/azure/cost-management-billing/costs/api-throttling)
- [Multi-tenant apps](https://learn.microsoft.com/entra/identity-platform/howto-convert-app-to-be-multi-tenant)
- [Bicep what-if](https://learn.microsoft.com/azure/azure-resource-manager/bicep/deploy-what-if)

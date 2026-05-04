# Tenari — Data Model

PostgreSQL 16 with Row-Level Security. All schemas in the `tenari` database.

> **Convention:** all tables have `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` unless noted. Soft-delete via `deleted_at timestamptz`. Triggers maintain `updated_at`.
>
> All org-scoped tables have `org_id uuid not null references orgs(id)` and an RLS policy.

---

## Core: orgs and identity

### `orgs`
The MSP itself — a Tenari customer.
```
id                  uuid pk
slug                citext unique not null    -- url-safe, used in subdomain
name                text not null
legal_name          text
plan                text not null check (plan in ('starter','growth','enterprise'))
trial_ends_at       timestamptz
billing_email       citext not null
billing_address     jsonb
default_region      text not null default 'eastus'
brand_logo_url      text
brand_primary_color text
brand_secondary_color text
portal_subdomain    citext unique          -- e.g. 'acme' → acme.tenariportal.com
created_at, updated_at, deleted_at
```

### `users`
Tenari operators. One user can belong to multiple orgs (rare but supported).
```
id                  uuid pk
email               citext unique not null
display_name        text not null
avatar_url          text
entra_object_id     uuid unique           -- 'oid' claim from Entra
locale              text default 'en-GB'
mfa_enrolled        bool default false
last_sign_in_at     timestamptz
created_at, updated_at
```

### `org_users`
Membership + role at the org level.
```
id                  uuid pk
org_id              uuid fk → orgs
user_id             uuid fk → users
role                text not null check (role in ('owner','admin','operator','viewer','billing'))
status              text not null default 'active' check (status in ('active','invited','suspended'))
invited_by          uuid fk → users
invited_at          timestamptz
joined_at           timestamptz
unique (org_id, user_id)
```

### `roles` and `role_permissions`
For the per-org custom roles seen in the prototype's RBAC screen.
```
roles
  id, org_id, name, description, is_system_role bool, created_at

role_permissions
  role_id fk → roles
  permission text          -- e.g. 'tenants:read', 'bicep:deploy'
  primary key (role_id, permission)
```

### `org_user_managed_tenant`
ACL — which managed tenants a user can see. If absent for a user, they see all (controlled by role).
```
org_user_id  fk → org_users
managed_tenant_id  fk → managed_tenants
permission text         -- 'read' | 'write' | 'admin'
primary key (org_user_id, managed_tenant_id)
```

---

## Managed tenants (the customer Azure tenants the MSP manages)

### `managed_tenants`
```
id                  uuid pk
org_id              uuid fk → orgs
azure_tenant_id     uuid not null            -- the customer's Entra tenant ID
display_name        text not null
domain              citext                   -- e.g. 'contoso.onmicrosoft.com'
status              text not null default 'pending' check (status in
                      ('pending','active','degraded','suspended','offboarded'))
onboarded_at        timestamptz
last_full_sync_at   timestamptz
last_cost_sync_at   timestamptz
last_policy_sync_at timestamptz
last_alert_sync_at  timestamptz
contract_tier       text                     -- 'bronze'|'silver'|'gold'|'platinum'
contract_start      date
contract_end        date
mrr_pence           integer                  -- monthly contract value in pence
notes               text
tags                jsonb default '[]'
unique (org_id, azure_tenant_id)
```

### `managed_tenant_subscriptions`
A managed tenant can have many Azure subscriptions.
```
id                  uuid pk
managed_tenant_id   fk
subscription_id     uuid not null
display_name        text
state               text                     -- Enabled | Warned | PastDue | Disabled
spending_limit      text
quota_id            text
unique (managed_tenant_id, subscription_id)
```

### `managed_tenant_credentials`
Encrypted refresh tokens. **READ `SECURITY.md` BEFORE TOUCHING.**
```
id                  uuid pk
managed_tenant_id   fk unique
encrypted_refresh_token bytea not null     -- AES-256-GCM, KEK from Key Vault
nonce               bytea not null
kek_version         int not null
granted_scopes      text[] not null
expires_at          timestamptz
last_refreshed_at   timestamptz
```

---

## Resources (the inventory)

### `resources`
Lightweight inventory; we don't try to be a full CMDB.
```
id                  uuid pk
org_id              uuid fk
managed_tenant_id   uuid fk
subscription_id     uuid not null
resource_group      text not null
azure_id            text unique not null     -- full ARM ID
type                text not null            -- 'Microsoft.Compute/virtualMachines'
name                text not null
location            text
sku                 jsonb
tags                jsonb default '{}'
properties          jsonb                    -- selected fields, not full ARM blob
last_seen_at        timestamptz not null
```

Index on `(managed_tenant_id, type)` and GIN on `tags`.

---

## Cost

### `cost_facts_daily`
The atomic cost record. One row per (tenant, subscription, service, day).
```
id                  uuid pk
org_id              uuid fk
managed_tenant_id   uuid fk
subscription_id     uuid
date                date not null
service_name        text not null            -- 'Virtual Machines', 'Storage', etc
service_tier        text
meter_category      text
meter_subcategory   text
resource_group      text
cost_pence          bigint not null
quantity            numeric(20,6)
currency            char(3) not null default 'GBP'
billing_period      date not null            -- first day of month
unique (managed_tenant_id, subscription_id, date, service_name, meter_subcategory)
```

Partition by `billing_period` monthly.

### `cost_recommendations`
Mirrors what the prototype shows on the Savings page.
```
id                  uuid pk
org_id              uuid fk
managed_tenant_id   uuid fk
azure_advisor_id    text                     -- if from Advisor
resource_id         text                     -- ARM ID of impacted resource
category            text not null            -- 'rightsize'|'shutdown'|'reservation'|'storage_tier'|'unattached'
title               text not null
description         text
risk_tier           text not null check (risk_tier in ('low','medium','high'))
estimated_savings_pence_monthly bigint not null
applied_at          timestamptz
applied_by          uuid fk → users
applied_status      text                     -- 'pending'|'in_progress'|'success'|'rolled_back'|'failed'
rollback_deadline_at timestamptz
dismissed_at        timestamptz
dismissed_reason    text
```

---

## Policy & compliance

### `policy_definitions`
Mostly mirrored from Azure Policy + a handful of Tenari custom checks.
```
id                  uuid pk
azure_policy_id     text unique              -- if mirrored from Azure Policy
custom              bool not null default false
display_name        text not null
description         text
category            text not null            -- 'Identity', 'Network', 'Encryption', etc
severity            text not null check (severity in ('critical','high','medium','low','info'))
control_mappings    jsonb                    -- {soc2: [...], iso27001: [...]}
remediation_guidance text
```

### `policy_assignments`
Where a definition is applied (org-wide template, per-tenant, etc).
```
id, org_id, managed_tenant_id (nullable), policy_definition_id,
scope text, parameters jsonb, enforcement_mode text, created_at
```

### `policy_findings`
Current state of compliance per resource per policy.
```
id                  uuid pk
org_id              uuid fk
managed_tenant_id   uuid fk
policy_definition_id fk
resource_id         text                     -- ARM ID
state               text not null check (state in ('compliant','non_compliant','exempt','error'))
first_observed_at   timestamptz not null
last_observed_at    timestamptz not null
exempt_until        timestamptz
exempt_reason       text
unique (managed_tenant_id, policy_definition_id, resource_id)
```

### `policy_compliance_summary`  (materialized view)
Refreshed every 15 min. Drives the prototype's compliance scores.
```
managed_tenant_id, total, compliant, non_compliant, score_pct, by_severity jsonb, refreshed_at
```

---

## Alerts

### `alerts`
```
id                  uuid pk
org_id              uuid fk
managed_tenant_id   uuid fk
external_id         text                     -- Azure Monitor alert ID for dedup
source              text not null            -- 'azure_monitor'|'defender'|'tenari_synthetic'
severity            text not null check (severity in ('sev1','sev2','sev3','sev4'))
state               text not null check (state in ('new','acknowledged','in_progress','resolved','suppressed'))
title               text not null
description         text
resource_id         text
fired_at            timestamptz not null
acknowledged_at     timestamptz
acknowledged_by     uuid fk → users
resolved_at         timestamptz
resolved_by         uuid fk → users
suppressed_until    timestamptz
metadata            jsonb
unique (managed_tenant_id, external_id)
```

### `alert_events`
Timeline events shown in the alert drawer.
```
id, alert_id, kind text, actor_id, payload jsonb, occurred_at
   -- kinds: 'fired','acknowledged','assigned','commented','escalated','resolved','reopened'
```

### `alert_comments`
```
id, alert_id, user_id, body text, created_at
```

---

## AI Bicep

### `bicep_generations`
```
id                  uuid pk
org_id              uuid fk
managed_tenant_id   uuid fk
user_id             uuid fk
mode                text not null check (mode in ('chat','form','plan_upload'))
prompt              text                     -- raw user prompt or stringified form
plan_upload_url     text                     -- if mode = plan_upload
context_used        jsonb                    -- subscription, naming convention, etc
generated_bicep     text
generated_summary   text                     -- LLM's plain-language explanation
diagram_dot         text                     -- Graphviz dot for diagram view
generation_status   text not null default 'pending' check (
                      generation_status in ('pending','generating','generated','failed'))
generation_error    text
generation_tokens_in int
generation_tokens_out int
generation_model    text                     -- 'claude-sonnet-4-5-20250929'
created_at, updated_at
```

### `bicep_validations`
Result of running the Docker sandbox.
```
id                  uuid pk
generation_id       fk → bicep_generations
status              text                     -- 'queued'|'running'|'pass'|'fail'
build_output        text
what_if_output      jsonb
errors              jsonb
ran_at              timestamptz
duration_ms         int
```

### `bicep_deployments`
A user actually deployed it.
```
id, generation_id, deployed_by, target_subscription_id, target_resource_group,
deployment_name, deployment_id (Azure), status, started_at, completed_at, output jsonb
```

---

## Reports

### `report_templates`
The five prototype templates plus user-created ones.
```
id, org_id (nullable for system templates), name, description, kind
  -- kinds: 'executive_summary','cost_deep_dive','compliance_audit','tag_governance','sla_uptime','custom'
config jsonb         -- which sections, filters, branding
created_by, created_at
```

### `report_schedules`
```
id, org_id, template_id, name, cron_expr text, timezone, recipients jsonb,
delivery_channels text[], enabled bool, last_run_at, next_run_at, created_at
```

### `report_runs`
```
id, schedule_id (nullable, for ad-hoc), template_id, run_at, status,
output_url text, recipients_delivered int, opens int, clicks int, error text
```

---

## Audit log

### `audit_events`
Append-only, queried by the audit screen.
```
id                  uuid pk
org_id              uuid fk
actor_user_id       uuid fk → users
actor_kind          text not null            -- 'user'|'system'|'integration'
managed_tenant_id   uuid fk (nullable)
action              text not null            -- 'tenant.connect','bicep.deploy','cost.recommendation.apply'
target_kind         text
target_id           text
ip_address          inet
user_agent          text
metadata            jsonb
occurred_at         timestamptz not null default now()
```

Index on `(org_id, occurred_at desc)`. Partition monthly. Retention via `COMPLIANCE_ROADMAP.md`.

---

## Settings

### `org_integrations`
Slack, Teams, ServiceNow, etc.
```
id, org_id, kind, display_name, config jsonb (encrypted secrets), enabled,
created_by, created_at, last_used_at
```

### `org_api_keys`
For programmatic access.
```
id, org_id, name, key_prefix text, key_hash text (sha256), scopes text[],
created_by, created_at, last_used_at, expires_at, revoked_at
```

### `org_webhooks`
```
id, org_id, url, secret_hash, events text[], enabled, created_at, last_delivery_at, failure_count int
```

### `org_notification_prefs`
Per-org defaults; users can override on their own.
```
id, org_id, channel_email_default text[], channel_teams_default text[],
quiet_hours_start time, quiet_hours_end time, timezone text
```

---

## Customer portal (white-label)

Reuses most of the above. The customer-side users are a separate table:

### `portal_users`
```
id                  uuid pk
org_id              uuid fk                  -- the MSP that owns this portal
managed_tenant_id   uuid fk                  -- which customer this user belongs to
email               citext not null
display_name        text
auth_method         text                     -- 'magic_link'|'entra_b2b'|'sso'
last_sign_in_at     timestamptz
created_at
unique (managed_tenant_id, email)
```

---

## Billing (Tenari's own billing of MSPs)

### `subscriptions`
```
id, org_id, plan, stripe_subscription_id, status, current_period_start, current_period_end,
cancel_at_period_end bool, mrr_pence, seats_purchased int, created_at
```

### `invoices`
```
id, org_id, stripe_invoice_id, number text, amount_pence, currency, status,
period_start, period_end, due_date, paid_at, pdf_url
```

### `usage_meters`
```
id, org_id, period_start, period_end,
managed_tenants_count int, ai_bicep_generations int, reports_run int, api_calls bigint
```

---

## RLS — the boilerplate

Every org-scoped table gets:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON <table>
  USING (org_id = current_setting('app.current_org_id', true)::uuid)
  WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid);
```

Every connection from the app sets:

```sql
SET LOCAL app.current_org_id = '<uuid>';
```

The app role has `BYPASSRLS = false`. Migrations use a separate role with `BYPASSRLS = true`.

Integration test in CI: try every CRUD operation across two orgs and assert zero leakage.

import {
  pgTable, text, integer, boolean, timestamp, real,
  primaryKey, index, uuid,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ── NextAuth required tables ───────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  role: text('role').default('viewer'), // 'owner' | 'admin' | 'engineer' | 'finops' | 'viewer'
  orgId: text('org_id').references(() => orgs.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);

// ── Tenari core tables ─────────────────────────────────────────────────────

export const orgs = pgTable('orgs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#3b82f6'),
  plan: text('plan').default('starter'), // 'starter' | 'growth' | 'enterprise'
  createdAt: timestamp('created_at').defaultNow(),
});

export const managedTenants = pgTable('managed_tenants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Azure identifiers
  azureTenantId: uuid('azure_tenant_id').notNull(),
  subscriptionCount: integer('subscription_count').default(0),
  // Display
  color: text('color').notNull().default('#3b82f6'),
  initials: text('initials').notNull(),
  // Status
  status: text('status').default('healthy'), // 'healthy' | 'warning' | 'critical' | 'onboarding'
  monthlySpend: real('monthly_spend').default(0),
  complianceScore: integer('compliance_score').default(0),
  // Metadata
  environment: text('environment').default('production'),
  region: text('region').default('East US'),
  tags: text('tags').array().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('managed_tenants_org_idx').on(t.orgId),
]);

export const policies = pgTable('policies', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // 'security' | 'cost' | 'governance' | 'compliance'
  severity: text('severity').notNull(), // 'critical' | 'high' | 'medium' | 'low'
  enabled: boolean('enabled').default(true),
  autoRemediate: boolean('auto_remediate').default(false),
  // Compliance framework tags
  frameworks: text('frameworks').array().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

export const policyFindings = pgTable('policy_findings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  policyId: text('policy_id').notNull().references(() => policies.id),
  tenantId: text('tenant_id').notNull().references(() => managedTenants.id, { onDelete: 'cascade' }),
  resource: text('resource').notNull(),
  status: text('status').notNull(), // 'pass' | 'fail' | 'exempt'
  detail: text('detail'),
  detectedAt: timestamp('detected_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
}, (t) => [
  index('policy_findings_tenant_idx').on(t.tenantId),
  index('policy_findings_policy_idx').on(t.policyId),
]);

export const costFacts = pgTable('cost_facts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull().references(() => managedTenants.id, { onDelete: 'cascade' }),
  date: timestamp('date', { mode: 'date' }).notNull(),
  service: text('service').notNull(),
  resourceGroup: text('resource_group'),
  amountUsd: real('amount_usd').notNull(),
  currency: text('currency').default('USD'),
  tags: text('tags'), // JSON string of key:value tag pairs
}, (t) => [
  index('cost_facts_tenant_date_idx').on(t.tenantId, t.date),
]);

export const savingsOpportunities = pgTable('savings_opportunities', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => managedTenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'Reserved Instance' | 'Right-size' | 'Storage tier' | etc
  resource: text('resource').notNull(),
  fromConfig: text('from_config'),
  toConfig: text('to_config'),
  monthlySavings: real('monthly_savings').notNull(),
  risk: text('risk').notNull(), // 'low' | 'med' | 'high'
  confidence: integer('confidence').notNull(), // 0–100
  rationale: text('rationale'),
  status: text('status').default('open'), // 'open' | 'applied' | 'dismissed'
  appliedAt: timestamp('applied_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('savings_org_idx').on(t.orgId),
  index('savings_tenant_idx').on(t.tenantId),
]);

export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => managedTenants.id, { onDelete: 'cascade' }),
  severity: text('severity').notNull(), // 'crit' | 'high' | 'med' | 'low'
  status: text('status').default('open'), // 'open' | 'ack' | 'resolved'
  rule: text('rule').notNull(),
  resource: text('resource'),
  detail: text('detail'),
  assignee: text('assignee'),
  firedAt: timestamp('fired_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
}, (t) => [
  index('alerts_org_idx').on(t.orgId),
  index('alerts_tenant_idx').on(t.tenantId),
  index('alerts_status_idx').on(t.status),
]);

export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id),
  actorEmail: text('actor_email'),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  detail: text('detail'), // JSON string
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('audit_log_org_idx').on(t.orgId),
  index('audit_log_created_idx').on(t.createdAt),
]);

export const bicepTemplates = pgTable('bicep_templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  prompt: text('prompt').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('bicep_templates_org_idx').on(t.orgId),
]);

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => managedTenants.id, { onDelete: 'cascade' }),
  period: text('period').notNull(), // e.g. '2026-04'
  amountUsd: real('amount_usd').notNull(),
  status: text('status').default('draft'), // 'draft' | 'sent' | 'paid' | 'overdue'
  issuedAt: timestamp('issued_at'),
  dueAt: timestamp('due_at'),
  paidAt: timestamp('paid_at'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('invoices_org_idx').on(t.orgId),
  index('invoices_tenant_idx').on(t.tenantId),
]);

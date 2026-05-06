export type TenantStatus = 'ok' | 'warn' | 'crit';

export interface Tenant {
  id: string;
  tenantId: string;
  name: string;
  initials: string;
  subs: number;
  monthly: number;
  compliance: number;
  alerts: number;
  critical: number;
  sla: number;
  savings: number;
  region: string;
  plan: string;
  tier: string;
  status: TenantStatus;
  trend: number;
  tags: number;
  color: string;
}

export interface Policy {
  id: string;
  name: string;
  category: string;
  severity: 'crit' | 'high' | 'med' | 'low';
  compliant: number;
  nonCompliant: number;
  exempt: number;
}

export type SavingsRisk = 'low' | 'med' | 'high';

export interface SavingsOpportunity {
  id: string;
  tenant: string;
  resource: string;
  type: string;
  from: string;
  to: string;
  monthly: number;
  risk: SavingsRisk;
  confidence: number;
  rationale: string;
}

export type AlertSeverity = 'crit' | 'high' | 'med' | 'low';
export type AlertStatus = 'open' | 'ack' | 'snoozed' | 'resolved';

export interface Alert {
  id: string;
  sev: AlertSeverity;
  tenant: string;
  resource: string;
  rule: string;
  when: string;
  status: AlertStatus;
  owner: string | null;
}

export type InvoiceStatus = 'paid' | 'sent' | 'overdue' | 'draft';

export interface Invoice {
  id: string;
  tenant: string;
  period: string;
  amount: number;
  status: InvoiceStatus;
  issued: string;
  due: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenants: number;
  mfa: boolean;
  last: string;
  avatar: string;
}

export interface Role {
  name: string;
  users: number;
  scope: string;
  perms: string;
}

export interface AuditEntry {
  when: string;
  actor: string;
  action: string;
  target: string;
  tenant: string;
}

export interface SpendSegment {
  name: string;
  value: number;
  color: string;
}

import type {
  Tenant, Policy, SavingsOpportunity, Alert,
  Invoice, User, Role, AuditEntry, SpendSegment,
} from './types';

// Deterministic PRNG so data is stable across renders
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const round = (n: number, p = 2) => {
  const f = 10 ** p;
  return Math.round(n * f) / f;
};

export const fmtMoney = (n: number) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export const fmtMoneyK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'k';
  return '$' + Math.round(n);
};

export const fmtNum = (n: number) => n.toLocaleString('en-US');
export const fmtPct = (n: number, p = 1) => n.toFixed(p) + '%';

const ORG_NAMES = [
  'Northwind Logistics', 'Halcyon Biotech', 'Meridian Capital', 'Polaris Engineering', 'Vermilion Retail',
  'Bluegrass Insurance', 'Cascadia Hospitals', 'Threadbare Apparel', 'Larkspur Media', 'Foundry Mechanics',
  'Quill & Type Press', 'Ironbark Mining', 'Saltwater Ferries', 'Lantern Education', 'Birchwood Realty',
  'Greenfield Agritech', 'Kestrel Defense', 'Marble Hill Bank', 'Olive Branch NGO', 'Periwinkle Studios',
  'Quartzline Steel', 'Riverstone Hotels', 'Sablefin Seafood', 'Tessera Robotics', 'Umbral Security',
  'Vellum Publishing', 'Walnut Creek Foods', 'Xenith Telecom', 'Yarrow Pharma', 'Zephyr Aerospace',
  'Argentum Mining', 'Belgrave Holdings', 'Cobalt Ridge', 'Dunsworth Legal', 'Ember Power',
  'Fairhaven School', 'Glasshouse Wines', 'Hartwell Fabrics', 'Indigo Marine', 'Junction Rail',
  'Kindred Care', 'Lyric Music', 'Mossglen Parks', 'Nordic Bakers', 'Onyx Construction',
  'Pinegrove Resort', 'Quayside Imports', 'Ravenstone Tech', 'Selsey Cinema', 'Tideline Surf',
  'Underwood Books', 'Velvet Coffee', 'Wexford Cycles', 'Aldenbrook Group', 'Brockwell Physics',
  'Coppermint Lab', 'Drystone Quarry', 'Embergate AI', 'Foxglove Florals', 'Granite & Co',
];

const REGIONS = ['East US', 'West US 2', 'North Europe', 'UK South', 'Southeast Asia', 'Australia East', 'Central US', 'Japan East'];
const PLANS = ['Pay-As-You-Go', 'EA', 'CSP', 'MCA', 'Sponsorship'];
const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];
const COLORS = ['#3b82f6', '#22d3ee', '#a3e635', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#facc15'];

export const TENANTS: Tenant[] = ORG_NAMES.map((name, i) => {
  const r = mulberry32(100 + i);
  const subs = 1 + Math.floor(r() * 12);
  const monthly = 800 + Math.floor(r() * 240_000);
  const compliance = round(55 + r() * 44, 1);
  const alerts = Math.floor(r() * 12);
  const critical = Math.floor(r() * 4);
  const sla = round(99.0 + r() * 0.99, 3);
  const savings = Math.floor(monthly * (0.05 + r() * 0.22));
  const region = REGIONS[Math.floor(r() * REGIONS.length)];
  const plan = PLANS[Math.floor(r() * PLANS.length)];
  const tier = TIERS[Math.floor(r() * TIERS.length)];
  const status = critical > 1 ? 'crit' : alerts > 6 ? 'warn' : 'ok';
  const trend = round((r() - 0.4) * 30, 1);
  const tags = round(60 + r() * 39, 0);
  return {
    id: 'T-' + String(1000 + i),
    tenantId: [r, r, r, r, r]
      .map((f) => Math.floor(f() * 16_777_215).toString(16).padStart(6, '0'))
      .join('-')
      .slice(0, 36),
    name,
    initials: name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
    subs,
    monthly,
    compliance,
    alerts,
    critical,
    sla,
    savings,
    region,
    plan,
    tier,
    status: status as Tenant['status'],
    trend,
    tags,
    color: COLORS[i % 8],
  };
});

export const TOTAL_SPEND = TENANTS.reduce((s, t) => s + t.monthly, 0);
export const TOTAL_SAVINGS = TENANTS.reduce((s, t) => s + t.savings, 0);
export const AVG_COMPLIANCE = TENANTS.reduce((s, t) => s + t.compliance, 0) / TENANTS.length;
export const TOTAL_ALERTS = TENANTS.reduce((s, t) => s + t.alerts, 0);
export const TOTAL_CRITICAL = TENANTS.reduce((s, t) => s + t.critical, 0);
export const TOTAL_SUBS = TENANTS.reduce((s, t) => s + t.subs, 0);

export const POLICIES: Policy[] = [
  { id: 'POL-001', name: 'Require encryption for SQL DBs', category: 'Security', severity: 'crit', compliant: 612, nonCompliant: 47, exempt: 3 },
  { id: 'POL-002', name: 'Allowed locations (EU + UK only)', category: 'Geo', severity: 'high', compliant: 894, nonCompliant: 12, exempt: 0 },
  { id: 'POL-003', name: 'Storage accounts must use HTTPS', category: 'Security', severity: 'crit', compliant: 421, nonCompliant: 8, exempt: 1 },
  { id: 'POL-004', name: 'VMs must use managed disks', category: 'Resilience', severity: 'med', compliant: 308, nonCompliant: 24, exempt: 0 },
  { id: 'POL-005', name: 'Required tags: cost-center, owner', category: 'Governance', severity: 'med', compliant: 1142, nonCompliant: 173, exempt: 12 },
  { id: 'POL-006', name: 'No public IP on VMs', category: 'Network', severity: 'high', compliant: 287, nonCompliant: 19, exempt: 4 },
  { id: 'POL-007', name: 'NSG required on subnets', category: 'Network', severity: 'high', compliant: 504, nonCompliant: 11, exempt: 0 },
  { id: 'POL-008', name: 'AKS clusters must use RBAC', category: 'Security', severity: 'crit', compliant: 38, nonCompliant: 4, exempt: 0 },
  { id: 'POL-009', name: 'Diagnostic logs must be enabled', category: 'Observability', severity: 'med', compliant: 712, nonCompliant: 89, exempt: 6 },
  { id: 'POL-010', name: 'Key Vault soft-delete required', category: 'Security', severity: 'high', compliant: 124, nonCompliant: 3, exempt: 0 },
  { id: 'POL-011', name: 'Allowed VM SKUs (cost guardrail)', category: 'Cost', severity: 'low', compliant: 287, nonCompliant: 41, exempt: 8 },
  { id: 'POL-012', name: 'App Service min TLS 1.2', category: 'Security', severity: 'high', compliant: 198, nonCompliant: 6, exempt: 0 },
];

export const SAVINGS: SavingsOpportunity[] = [
  { id: 'S-101', tenant: 'Northwind Logistics', resource: 'vm-prod-app-04', type: 'Right-size VM', from: 'Standard_D8s_v5', to: 'Standard_D4s_v5', monthly: 412, risk: 'low', confidence: 92, rationale: 'CPU < 18% over 90 days' },
  { id: 'S-102', tenant: 'Meridian Capital', resource: 'sqldb-warehouse-01', type: 'Reserved Instance', from: 'PAYG', to: '3yr RI', monthly: 1840, risk: 'med', confidence: 87, rationale: 'Stable usage 24/7 for 14 months' },
  { id: 'S-103', tenant: 'Polaris Engineering', resource: 'storage-archive', type: 'Storage tier', from: 'Hot', to: 'Cool', monthly: 248, risk: 'low', confidence: 94, rationale: 'Last access > 60 days' },
  { id: 'S-104', tenant: 'Halcyon Biotech', resource: 'aks-research', type: 'Spot instances', from: 'On-demand', to: 'Spot (60%)', monthly: 2100, risk: 'high', confidence: 71, rationale: 'Batch workloads, restartable' },
  { id: 'S-105', tenant: 'Cascadia Hospitals', resource: 'app-svc-plan-legacy', type: 'Idle resource', from: 'P1v3', to: 'Delete', monthly: 320, risk: 'med', confidence: 89, rationale: 'No traffic in 45 days' },
  { id: 'S-106', tenant: 'Quartzline Steel', resource: 'snapshot-collection', type: 'Orphan cleanup', from: '47 snapshots', to: 'Delete', monthly: 178, risk: 'low', confidence: 96, rationale: 'Source disks deleted' },
  { id: 'S-107', tenant: 'Vermilion Retail', resource: 'sql-mi-prod', type: 'Savings Plan', from: 'PAYG', to: '1yr SP', monthly: 1240, risk: 'low', confidence: 91, rationale: '93% utilization baseline' },
  { id: 'S-108', tenant: 'Tessera Robotics', resource: 'vmss-batch-04', type: 'Auto-shutdown', from: '24/7', to: '6pm-8am off', monthly: 680, risk: 'med', confidence: 83, rationale: 'Dev workload, business-hours only' },
  { id: 'S-109', tenant: 'Bluegrass Insurance', resource: 'cosmos-shared', type: 'Autoscale', from: 'Manual 4000 RU/s', to: 'Autoscale 400-4000', monthly: 540, risk: 'low', confidence: 88, rationale: 'P95 < 1200 RU/s' },
  { id: 'S-110', tenant: 'Zephyr Aerospace', resource: 'public-ip-unattached', type: 'Orphan cleanup', from: '12 IPs', to: 'Release', monthly: 44, risk: 'low', confidence: 99, rationale: 'No NIC association' },
  { id: 'S-111', tenant: 'Marble Hill Bank', resource: 'log-analytics-workspace', type: 'Retention tune', from: '730 days', to: '180 days', monthly: 412, risk: 'med', confidence: 80, rationale: 'Compliance allows 90+' },
  { id: 'S-112', tenant: 'Embergate AI', resource: 'gpu-vm-research', type: 'Right-size VM', from: 'NC24ads_A100', to: 'NC12ads_A100', monthly: 1820, risk: 'med', confidence: 76, rationale: 'GPU < 40% utilization' },
];

export const ALERTS: Alert[] = [
  { id: 'AL-9012', sev: 'crit', tenant: 'Halcyon Biotech', resource: 'sqldb-clinical-01', rule: 'TDE disabled on production database', when: '8m ago', status: 'open', owner: null },
  { id: 'AL-9011', sev: 'crit', tenant: 'Cascadia Hospitals', resource: 'kv-patient-data', rule: 'Public network access enabled on Key Vault', when: '24m ago', status: 'open', owner: 'sarah.chen' },
  { id: 'AL-9010', sev: 'high', tenant: 'Marble Hill Bank', resource: 'storage-audit-logs', rule: 'Storage soft-delete < 30 days', when: '1h ago', status: 'ack', owner: 'mike.r' },
  { id: 'AL-9009', sev: 'high', tenant: 'Northwind Logistics', resource: 'vnet-prod-eus', rule: 'NSG flow logs disabled', when: '2h ago', status: 'open', owner: null },
  { id: 'AL-9008', sev: 'high', tenant: 'Zephyr Aerospace', resource: 'aks-prod', rule: 'AKS API server publicly exposed', when: '3h ago', status: 'open', owner: null },
  { id: 'AL-9007', sev: 'med', tenant: 'Vermilion Retail', resource: 'app-svc-checkout', rule: 'TLS < 1.2 allowed', when: '4h ago', status: 'ack', owner: 'jamie.k' },
  { id: 'AL-9006', sev: 'med', tenant: 'Foundry Mechanics', resource: 'vm-cad-station-7', rule: 'Backup policy missing', when: '6h ago', status: 'open', owner: null },
  { id: 'AL-9005', sev: 'med', tenant: 'Larkspur Media', resource: 'cosmos-content', rule: 'Diagnostic settings not configured', when: '8h ago', status: 'open', owner: null },
  { id: 'AL-9004', sev: 'low', tenant: 'Threadbare Apparel', resource: 'rg-staging', rule: 'Resources missing required tag: cost-center', when: '12h ago', status: 'snoozed', owner: 'jamie.k' },
  { id: 'AL-9003', sev: 'high', tenant: 'Polaris Engineering', resource: 'fw-prod-hub', rule: 'Firewall rule allows 0.0.0.0/0 on port 22', when: '14h ago', status: 'open', owner: null },
  { id: 'AL-9002', sev: 'crit', tenant: 'Olive Branch NGO', resource: 'sqlserver-donations', rule: 'Auditing disabled', when: '1d ago', status: 'open', owner: null },
  { id: 'AL-9001', sev: 'low', tenant: 'Periwinkle Studios', resource: 'storage-renders', rule: 'Untagged orphan resources', when: '1d ago', status: 'ack', owner: 'sarah.chen' },
];

export const INVOICES: Invoice[] = [
  { id: 'INV-2026-0412', tenant: 'Northwind Logistics', period: 'Apr 2026', amount: 18402.18, status: 'paid', issued: '2026-05-01', due: '2026-05-15' },
  { id: 'INV-2026-0411', tenant: 'Meridian Capital', period: 'Apr 2026', amount: 142881.40, status: 'sent', issued: '2026-05-01', due: '2026-05-15' },
  { id: 'INV-2026-0410', tenant: 'Halcyon Biotech', period: 'Apr 2026', amount: 67214.92, status: 'sent', issued: '2026-05-01', due: '2026-05-15' },
  { id: 'INV-2026-0409', tenant: 'Polaris Engineering', period: 'Apr 2026', amount: 24710.05, status: 'paid', issued: '2026-05-01', due: '2026-05-15' },
  { id: 'INV-2026-0408', tenant: 'Cascadia Hospitals', period: 'Apr 2026', amount: 89004.71, status: 'overdue', issued: '2026-04-01', due: '2026-04-15' },
  { id: 'INV-2026-0407', tenant: 'Vermilion Retail', period: 'Apr 2026', amount: 31488.20, status: 'draft', issued: '—', due: '—' },
  { id: 'INV-2026-0406', tenant: 'Tessera Robotics', period: 'Apr 2026', amount: 56120.00, status: 'sent', issued: '2026-05-01', due: '2026-05-15' },
  { id: 'INV-2026-0405', tenant: 'Marble Hill Bank', period: 'Apr 2026', amount: 78422.16, status: 'paid', issued: '2026-05-01', due: '2026-05-15' },
  { id: 'INV-2026-0404', tenant: 'Zephyr Aerospace', period: 'Apr 2026', amount: 198223.83, status: 'sent', issued: '2026-05-01', due: '2026-05-15' },
  { id: 'INV-2026-0403', tenant: 'Quartzline Steel', period: 'Apr 2026', amount: 14201.50, status: 'paid', issued: '2026-05-01', due: '2026-05-15' },
];

export const USERS: User[] = [
  { id: 'U-01', name: 'Sarah Chen', email: 'sarah.chen@tenari.io', role: 'Owner', tenants: 60, mfa: true, last: '2m ago', avatar: 'SC' },
  { id: 'U-02', name: 'Michael Rodriguez', email: 'mike.r@tenari.io', role: 'MSP Admin', tenants: 60, mfa: true, last: '14m ago', avatar: 'MR' },
  { id: 'U-03', name: 'Jamie Kowalski', email: 'jamie.k@tenari.io', role: 'Tenant Admin', tenants: 18, mfa: true, last: '1h ago', avatar: 'JK' },
  { id: 'U-04', name: 'Aisha Patel', email: 'aisha.p@tenari.io', role: 'Read-Only Auditor', tenants: 60, mfa: true, last: '4h ago', avatar: 'AP' },
  { id: 'U-05', name: 'Daniel Brooks', email: 'd.brooks@northwind.com', role: 'Customer (Northwind)', tenants: 1, mfa: false, last: '2d ago', avatar: 'DB' },
  { id: 'U-06', name: 'Lena Hofmann', email: 'lena@meridiancap.com', role: 'Customer (Meridian)', tenants: 1, mfa: true, last: '3h ago', avatar: 'LH' },
  { id: 'U-07', name: 'Tomás Ribeiro', email: 't.ribeiro@tenari.io', role: 'Billing', tenants: 60, mfa: true, last: '32m ago', avatar: 'TR' },
  { id: 'U-08', name: 'Priya Sharma', email: 'p.sharma@tenari.io', role: 'FinOps Analyst', tenants: 60, mfa: true, last: '11m ago', avatar: 'PS' },
];

export const ROLES: Role[] = [
  { name: 'Owner', users: 1, scope: 'All tenants', perms: 'Full access' },
  { name: 'MSP Admin', users: 4, scope: 'All tenants', perms: 'Read/write minus billing' },
  { name: 'Tenant Admin', users: 9, scope: 'Assigned tenants', perms: 'Read/write within tenant' },
  { name: 'FinOps Analyst', users: 3, scope: 'All tenants', perms: 'Cost + savings, no apply' },
  { name: 'Read-Only Auditor', users: 7, scope: 'All tenants', perms: 'Read only' },
  { name: 'Billing', users: 2, scope: 'All tenants', perms: 'Invoices + payments' },
  { name: 'Customer', users: 23, scope: 'Single tenant', perms: 'White-label portal' },
];

export const AUDIT: AuditEntry[] = [
  { when: '2m ago', actor: 'sarah.chen', action: 'Applied savings recommendation', target: 'S-103 (storage-archive → Cool)', tenant: 'Polaris Engineering' },
  { when: '8m ago', actor: 'system', action: 'Policy assignment created', target: 'POL-008 → Halcyon Biotech', tenant: 'Halcyon Biotech' },
  { when: '14m ago', actor: 'mike.r', action: 'Acknowledged alert', target: 'AL-9010', tenant: 'Marble Hill Bank' },
  { when: '32m ago', actor: 'priya.s', action: 'Generated report', target: 'Monthly Cost Review — May', tenant: 'All tenants' },
  { when: '1h ago', actor: 'sarah.chen', action: 'Invited user', target: 'd.brooks@northwind.com (Customer)', tenant: 'Northwind Logistics' },
  { when: '2h ago', actor: 'system', action: 'Deployed Bicep template', target: 'mig-erp-westeu.bicep', tenant: 'Meridian Capital' },
  { when: '4h ago', actor: 'jamie.k', action: 'Updated tag policy', target: 'Required tags: cost-center, owner, env', tenant: 'Vermilion Retail' },
  { when: '6h ago', actor: 'system', action: 'Invoice issued', target: 'INV-2026-0411', tenant: 'Meridian Capital' },
];

export const SPEND_TREND: number[] = Array.from({ length: 12 }, (_, i) => {
  const r = mulberry32(200 + i)();
  return Math.floor(2_400_000 + i * 80_000 + r * 240_000);
});

export const DAILY_SPEND: number[] = Array.from({ length: 30 }, (_, i) => {
  const r = mulberry32(300 + i)();
  return Math.floor(80_000 + r * 30_000 + (i % 7 < 5 ? 18_000 : 0));
});

export const RESOURCE_BREAKDOWN: SpendSegment[] = [
  { name: 'Compute', value: 1_840_000, color: '#3b82f6' },
  { name: 'Storage', value: 480_000, color: '#22d3ee' },
  { name: 'Networking', value: 312_000, color: '#a3e635' },
  { name: 'Databases', value: 720_000, color: '#a78bfa' },
  { name: 'AI/ML', value: 268_000, color: '#f472b6' },
  { name: 'Other', value: 148_000, color: '#fb923c' },
];

// Re-export utilities
export { pick, range, round };

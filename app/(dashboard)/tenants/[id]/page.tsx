'use client';

import { useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { Icon } from '@/components/icons';
import { KpiCard } from '@/components/kpi-card';
import { SpendChart } from '@/components/charts/spend-chart';
import { TENANTS, POLICIES, SAVINGS, ALERTS, fmtMoney, fmtMoneyK, fmtPct, range } from '@/lib/data/mock';

type TabId = 'overview' | 'resources' | 'policies' | 'savings' | 'alerts' | 'tags' | 'access';

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = TENANTS.find(x => x.id === id) || TENANTS[0];
  const [tab, setTab] = useState<TabId>('overview');

  const tHash = t.id.charCodeAt(2) + t.id.charCodeAt(3);
  const tenantSavings = SAVINGS.filter(s => s.tenant === t.name);
  const savingsCount = tenantSavings.length || (3 + (tHash % 5));
  const policyViolations = Math.max(0, Math.round((100 - t.compliance) / 8));

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'resources', label: 'Resources', count: 247 },
    { id: 'policies', label: 'Policies', count: 12 },
    { id: 'savings', label: 'Savings', count: savingsCount },
    { id: 'alerts', label: 'Alerts', count: t.alerts },
    { id: 'tags', label: 'Tags' },
    { id: 'access', label: 'Access' },
  ];

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        <Link href="/tenants" className="btn-ghost" style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: 12 }}>Tenants</Link>
        <Icon name="chevron-right" size={12} />
        <span style={{ color: 'var(--text)' }}>{t.name}</span>
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="tenant-pip" style={{ background: t.color, width: 44, height: 44, fontSize: 16, borderRadius: 10 }}>{t.initials}</div>
          <div>
            <h1 className="page-title">{t.name}</h1>
            <p className="page-sub mono">{t.tenantId} · {t.region} · {t.plan}</p>
          </div>
        </div>
        <div className="page-actions">
          <span className={`pill ${t.status === 'crit' ? 'danger' : t.status === 'warn' ? 'warn' : 'ok'}`}>
            <span className="dot" />{t.status === 'crit' ? 'Critical' : t.status === 'warn' ? 'Warning' : 'Healthy'}
          </span>
          <button className="btn"><Icon name="external-link" size={14} /> Open in Azure</button>
          <Link href="/bicep" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Icon name="sparkles" size={14} /> Generate Bicep
          </Link>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tb => (
          <button key={tb.id} className={`tab ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
            {tb.label}
            {tb.count !== undefined && <span className="count">{tb.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && <TenantOverview t={t} />}
      {tab === 'resources' && <TenantResources t={t} />}
      {tab === 'policies' && <TenantPolicies t={t} />}
      {tab === 'savings' && <TenantSavings t={t} tenantSavings={tenantSavings} />}
      {tab === 'alerts' && <TenantAlerts t={t} />}
      {tab === 'tags' && <TenantTags t={t} />}
      {tab === 'access' && <TenantAccess t={t} />}
    </div>
  );
}

function TenantOverview({ t }: { t: typeof TENANTS[0] }) {
  const days = range(30).map(i => {
    const r = ((i * 9301 + t.subs * 49297) % 233280) / 233280;
    return Math.floor(t.monthly / 30 * (0.7 + r * 0.6));
  });
  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Monthly Spend" value={fmtMoneyK(t.monthly)} delta={`${t.trend > 0 ? '+' : ''}${t.trend}%`} deltaDir={t.trend > 0 ? 'down' : 'up'} sub="vs last month" spark={days} />
        <KpiCard label="Compliance Score" value={`${t.compliance}%`} delta="+1.4pp" deltaDir="up" sub={`${Math.floor(t.compliance / 8)}/12 policies`} sparkColor="var(--accent-2)" spark={[80, 82, 81, 83, 84, 85, 86, t.compliance]} />
        <KpiCard label="SLA (30d)" value={`${t.sla}%`} delta="No incidents" sub="" spark={Array(12).fill(0).map((_, i) => i + 10)} sparkColor="var(--ok)" />
        <KpiCard label="Identified Savings" value={fmtMoneyK(t.savings)} delta={fmtPct(t.savings / t.monthly * 100)} deltaDir="up" sub="of spend" sparkColor="var(--accent-3)" spark={[10, 14, 12, 18, 16, 20, 22, t.savings / 100]} />
      </div>

      <div className="split-2-1" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daily Spend (30d)</div>
            <div className="row">
              <span className="pill accent"><span className="dot" />{t.name}</span>
            </div>
          </div>
          <div className="card-body">
            <SpendChart data={days} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Subscriptions</div>
            <span className="muted mono">{t.subs}</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {range(Math.min(t.subs, 6)).map(i => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: i < Math.min(t.subs, 6) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="cloud" size={14} className="dim" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{['prod-eus', 'prod-weu', 'dev-eus', 'staging-uks', 'sandbox', 'dr-secondary'][i]}</div>
                  <div className="mono dim" style={{ fontSize: 10 }}>{['8a4f', '3c91', '7e22', '2b56', '4d18', '9f01'][i]}-…</div>
                </div>
                <span className="mono tabular" style={{ fontSize: 12 }}>{fmtMoneyK(t.monthly / t.subs * (0.6 + i * 0.15))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TenantResources({ t }: { t: typeof TENANTS[0] }) {
  const types = [
    { name: 'Virtual Machines', count: 47, icon: 'cpu', spend: t.monthly * 0.4 },
    { name: 'Storage Accounts', count: 23, icon: 'database', spend: t.monthly * 0.12 },
    { name: 'SQL Databases', count: 12, icon: 'database', spend: t.monthly * 0.18 },
    { name: 'App Services', count: 18, icon: 'cloud', spend: t.monthly * 0.09 },
    { name: 'Key Vaults', count: 7, icon: 'lock', spend: t.monthly * 0.02 },
    { name: 'Networking', count: 34, icon: 'globe', spend: t.monthly * 0.08 },
  ];
  return (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Resource Type</th>
              <th style={{ textAlign: 'right' }}>Count</th>
              <th style={{ textAlign: 'right' }}>Monthly Spend</th>
              <th>Compliant</th>
              <th>Tagged</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {types.map(r => (
              <tr key={r.name}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name={r.icon} size={14} className="dim" />
                    <span style={{ fontWeight: 500 }}>{r.name}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }} className="mono tabular">{r.count}</td>
                <td style={{ textAlign: 'right' }} className="mono tabular">{fmtMoney(r.spend)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="bar" style={{ width: 60 }}><span style={{ width: '92%', background: 'var(--ok)' }} /></div>
                    <span className="mono dim" style={{ fontSize: 12 }}>92%</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="bar" style={{ width: 60 }}><span style={{ width: t.tags + '%', background: t.tags > 85 ? 'var(--ok)' : 'var(--warn)' }} /></div>
                    <span className="mono dim" style={{ fontSize: 12 }}>{t.tags}%</span>
                  </div>
                </td>
                <td><Icon name="chevron-right" size={14} className="dim" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TenantPolicies({ t }: { t: typeof TENANTS[0] }) {
  const seed = t.id.charCodeAt(2) + t.id.charCodeAt(3) + t.id.charCodeAt(4);
  const tPolicies = POLICIES.map((p, i) => {
    const r = ((seed + i * 37) % 100);
    const total = 8 + (r % 35);
    let nc = 0;
    if (t.compliance < 75) nc = Math.floor(total * (0.10 + (r % 18) / 100));
    else if (t.compliance < 90) nc = Math.floor(total * ((r % 8) / 100));
    else nc = (r % 3 === 0 && p.severity !== 'low') ? 1 : 0;
    return { ...p, t_total: total, t_nc: nc, t_compliant: total - nc, t_compliance: ((total - nc) / total) * 100 };
  });
  const violations = tPolicies.filter(p => p.t_nc > 0);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Compliance" value={`${t.compliance}%`} delta="+1.4pp" deltaDir="up" sub="across all policies" sparkColor="var(--accent-2)" spark={[78, 79, 80, 82, 83, 84, 85, t.compliance]} />
        <KpiCard label="Assigned Policies" value="12" delta="0 changes" sub="last 30 days" />
        <KpiCard label="Violations" value={String(violations.reduce((s, p) => s + p.t_nc, 0))} delta={`${violations.length} policies`} deltaDir={violations.length > 3 ? 'down' : 'up'} sub="" sparkColor="var(--danger)" spark={[18, 16, 14, 12, 10, 8, 7, violations.reduce((s, p) => s + p.t_nc, 0)]} />
        <KpiCard label="Exemptions" value="3" delta="2 expiring soon" sub="" sparkColor="var(--warn)" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Policy Assignments</div>
            <div className="card-sub">Inherited from MSP defaults · {t.name}-specific overrides shown</div>
          </div>
          <button className="btn btn-sm"><Icon name="plus" size={12} />Assign policy</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Policy</th><th>Severity</th><th>Category</th><th style={{ textAlign: 'right' }}>Resources</th><th>Compliance</th><th>Source</th><th></th></tr>
            </thead>
            <tbody>
              {tPolicies.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                    <div className="mono dim" style={{ fontSize: 11 }}>{p.id}</div>
                  </td>
                  <td><span className={`sev ${p.severity}`}>{p.severity === 'crit' ? 'Critical' : p.severity === 'high' ? 'High' : p.severity === 'med' ? 'Medium' : 'Low'}</span></td>
                  <td><span className="pill">{p.category}</span></td>
                  <td style={{ textAlign: 'right' }} className="mono tabular">{p.t_total}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="bar" style={{ width: 60 }}><span style={{ width: p.t_compliance + '%', background: p.t_compliance > 90 ? 'var(--ok)' : p.t_compliance > 70 ? 'var(--warn)' : 'var(--danger)' }} /></div>
                      <span className="mono dim tabular" style={{ fontSize: 12, minWidth: 36 }}>{p.t_nc > 0 ? `${p.t_nc} fail` : '✓'}</span>
                    </div>
                  </td>
                  <td><span className="pill">{p.id === 'POL-005' ? 'Tenant override' : 'MSP default'}</span></td>
                  <td><Icon name="chevron-right" size={14} className="dim" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TenantSavings({ t, tenantSavings }: { t: typeof TENANTS[0]; tenantSavings: typeof SAVINGS }) {
  const seed = t.id.charCodeAt(2) + t.id.charCodeAt(3);
  const generateSavings = () => {
    const types = [
      { type: 'Right-size VM', from: 'D8s_v5', to: 'D4s_v5', icon: 'cpu', risk: 'low' as const, conf: 92, rationale: 'CPU < 18% over 90 days' },
      { type: 'Reserved Instance', from: 'PAYG', to: '3yr RI', icon: 'piggy-bank', risk: 'med' as const, conf: 87, rationale: 'Stable usage 24/7 for 14 months' },
      { type: 'Storage tier', from: 'Hot', to: 'Cool', icon: 'database', risk: 'low' as const, conf: 94, rationale: 'Last access > 60 days' },
    ];
    return range(3 + (seed % 3)).map(i => ({
      id: `S-${t.id.slice(2)}-${i}`,
      resource: ['vm-prod-app-04', 'sqldb-warehouse-01', 'storage-archive'][i % 3],
      ...types[(seed + i) % types.length],
      monthly: 80 + ((seed * (i + 1) * 13) % 1900),
    }));
  };
  const items = tenantSavings.length ? tenantSavings.map(s => ({ ...s, conf: s.confidence })) : generateSavings();
  const total = items.reduce((a, b) => a + b.monthly, 0);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Monthly Savings Available" value={fmtMoneyK(total)} delta={fmtPct(total / t.monthly * 100)} deltaDir="up" sub="of monthly spend" sparkColor="var(--accent-3)" spark={[8, 12, 16, 20, 22, 26, 28, 30]} />
        <KpiCard label="Annualized" value={fmtMoneyK(total * 12)} delta="+12%" deltaDir="up" sub="vs Q1" sparkColor="var(--ok)" spark={[20, 30, 40, 50, 60, 68, 72, 76]} />
        <KpiCard label="Low-risk" value={fmtMoneyK(items.filter(s => s.risk === 'low').reduce((a, b) => a + b.monthly, 0))} delta={`${items.filter(s => s.risk === 'low').length} items`} sub="auto-applicable" sparkColor="var(--ok)" spark={[5, 8, 10, 12, 14, 16, 18, 20]} />
        <KpiCard label="Applied YTD" value={fmtMoneyK(t.savings * 0.18)} delta="6 actions" deltaDir="up" sub="" sparkColor="var(--accent)" spark={[2, 4, 6, 8, 10, 12, 14, 14]} />
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Savings Opportunities · {t.name}</div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-sm"><Icon name="filter" size={12} />Filter</button>
            <button className="btn btn-sm btn-primary"><Icon name="play" size={12} />Apply all low-risk</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Resource</th><th>Recommendation</th><th>Change</th><th>Risk</th><th>Confidence</th><th style={{ textAlign: 'right' }}>Monthly</th><th></th></tr></thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id}>
                  <td className="mono" style={{ fontSize: 12 }}>{s.resource}</td>
                  <td><span className="pill accent">{s.type}</span></td>
                  <td>
                    <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="mono dim" style={{ textDecoration: 'line-through' }}>{s.from}</span>
                      <Icon name="arrow-right" size={12} className="dim" />
                      <span className="mono">{s.to}</span>
                    </div>
                  </td>
                  <td><span className={`pill ${s.risk === 'low' ? 'ok' : s.risk === 'med' ? 'warn' : 'danger'}`}><span className="dot" />{s.risk}</span></td>
                  <td className="mono tabular dim" style={{ fontSize: 12 }}>{s.conf}%</td>
                  <td className="mono tabular" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoney(s.monthly)}</td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn-sm">Review</button>
                      {s.risk === 'low' && <button className="btn btn-sm btn-primary"><Icon name="play" size={10} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TenantAlerts({ t }: { t: typeof TENANTS[0] }) {
  const tenantAlerts = ALERTS.filter(a => a.tenant === t.name);
  return (
    <div className="card">
      {tenantAlerts.length === 0 ? (
        <div className="empty"><Icon name="check" size={24} /><p style={{ marginTop: 8 }}>No alerts for {t.name}</p></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Sev</th><th>Rule</th><th>Resource</th><th>Status</th><th>Triggered</th></tr></thead>
            <tbody>
              {tenantAlerts.map(a => (
                <tr key={a.id}>
                  <td><span className={`sev ${a.sev}`}>{a.sev}</span></td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{a.rule}</td>
                  <td className="mono dim" style={{ fontSize: 12 }}>{a.resource}</td>
                  <td><span className={`pill ${a.status === 'open' ? 'danger' : a.status === 'ack' ? 'info' : 'warn'}`}><span className="dot" />{a.status}</span></td>
                  <td className="dim" style={{ fontSize: 12 }}>{a.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TenantTags({ t }: { t: typeof TENANTS[0] }) {
  const required = ['cost-center', 'owner', 'environment', 'project', 'managed-by'];
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Tag Governance</div>
        <div className="row" style={{ gap: 6 }}>
          <span style={{ fontSize: 12 }} className="muted">{t.tags}% tagged</span>
          <button className="btn btn-sm btn-primary"><Icon name="tag" size={12} />Enforce tags</button>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Required tags</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {required.map((tag, i) => {
            const compliant = t.tags > 70 || i < 3;
            return (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elev-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <Icon name="tag" size={14} className="dim" />
                <span style={{ fontWeight: 500, flex: 1 }}>{tag}</span>
                <span className={`pill ${compliant ? 'ok' : 'danger'}`}>
                  {compliant ? 'Compliant' : 'Missing on some resources'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TenantAccess({ t }: { t: typeof TENANTS[0] }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Access & RBAC</div>
        <button className="btn btn-sm btn-primary"><Icon name="plus" size={12} />Grant access</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>User</th><th>Role</th><th>Scope</th><th>Granted</th><th></th></tr></thead>
          <tbody>
            {[
              { user: 'sarah.chen', role: 'Owner', scope: 'All subscriptions', granted: '2025-01-01' },
              { user: 'mike.r', role: 'MSP Admin', scope: 'All subscriptions', granted: '2025-02-15' },
              { user: `d.brooks@${t.name.toLowerCase().replace(/\s+/g, '')}.com`, role: 'Reader', scope: 'Prod subscription', granted: '2025-04-20' },
            ].map(a => (
              <tr key={a.user}>
                <td className="mono" style={{ fontSize: 12 }}>{a.user}</td>
                <td><span className="pill">{a.role}</span></td>
                <td className="muted" style={{ fontSize: 12 }}>{a.scope}</td>
                <td className="dim" style={{ fontSize: 12 }}>{a.granted}</td>
                <td><button className="btn btn-sm btn-ghost"><Icon name="trash" size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

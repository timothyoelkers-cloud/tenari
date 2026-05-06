'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { KpiCard } from '@/components/kpi-card';
import { Donut } from '@/components/charts/donut';
import { Sparkline } from '@/components/charts/sparkline';
import { RESOURCE_BREAKDOWN, SPEND_TREND, fmtMoney, fmtMoneyK } from '@/lib/data/mock';

const TEMPLATES = [
  { id: 'exec', name: 'Executive Summary', desc: 'Spend, savings, posture · 2 pages', icon: 'file-text', kind: 'executive' },
  { id: 'cost', name: 'Cost & Savings Deep Dive', desc: 'Per-resource breakdown', icon: 'piggy-bank', kind: 'cost' },
  { id: 'comp', name: 'Compliance & Audit', desc: 'Policy state + exceptions', icon: 'shield-check', kind: 'compliance' },
  { id: 'tag', name: 'Tag Governance', desc: 'Untagged + violations', icon: 'tag', kind: 'tag' },
  { id: 'sla', name: 'SLA / Uptime', desc: 'Per-tenant 30/90 day', icon: 'activity', kind: 'sla' },
];

const SCHEDULED = [
  ['Monthly Cost Review', 'Executive Summary', '3 customers', '1st of month', 'PDF + CSV', '1 May 06:00', '82%'],
  ['Compliance Posture (CISO)', 'Compliance & Audit', 'sarah.chen, ciso@*', 'Weekly Mon', 'PDF', '5 May 08:00', '94%'],
  ['Savings Realized', 'Cost & Savings', 'customer.cfo@*', 'Quarterly', 'PDF', '1 Apr 09:00', '71%'],
  ['Security Incidents', 'Custom', 'ops@tenari.io', 'Daily', 'Email', '5 May 07:00', '68%'],
  ['Tag Governance', 'Tag Governance', 'jamie.k', 'Weekly Fri', 'CSV', '3 May 10:00', '—'],
  ['SLA Quarterly', 'SLA / Uptime', 'customer.coo@*', 'Quarterly', 'PDF', '1 Apr 09:00', '79%'],
];

interface Template { id: string; name: string; desc: string; icon: string; kind: string; }

function ReportHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid var(--border)' }}>
        <div className="row" style={{ gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Meridian Capital · Cloud Report</div>
            <div className="muted" style={{ fontSize: 11 }}>Powered by Tenari</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>April 2026</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Generated 1 May 2026</div>
        </div>
      </div>
      <h1 style={{ fontSize: 24, margin: '0 0 4px', fontWeight: 700 }}>{title}</h1>
      {subtitle && <p className="muted" style={{ margin: '0 0 24px', fontSize: 13 }}>{subtitle}</p>}
    </>
  );
}

function ExecReport() {
  const kpis = [
    ['Monthly Spend', '$142,881', '+4.2% vs Mar', 'var(--accent)'],
    ['Compliance', '94%', '+2pp', 'var(--ok)'],
    ['Savings YTD', '$28,140', '14 actions', 'var(--accent-3)'],
    ['SLA', '99.97%', 'no incidents', 'var(--ok)'],
  ];
  return (
    <>
      <ReportHeader title="Executive Summary" subtitle="High-level snapshot of cloud posture · for distribution to leadership" />
      <div className="report-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
          {kpis.map(k => (
            <div key={k[0]} className="report-stat">
              <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k[0]}</div>
              <div className="mono tabular" style={{ fontSize: 22, fontWeight: 600 }}>{k[1]}</div>
              <div style={{ fontSize: 11, color: k[3], marginTop: 2 }}>{k[2]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="report-section">
        <h2 className="report-h2">Highlights</h2>
        <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 13, lineHeight: 1.7 }}>
          <li>Spend up 4.2% MoM — driven primarily by new SQL DB warehouse provisioning in West Europe.</li>
          <li>Compliance score improved 2pp — TLS enforcement remediation completed across 12 App Services.</li>
          <li>Identified $1,840/mo additional savings via reserved instance recommendations.</li>
          <li>Zero critical incidents this period · MTTR avg 42 min · down 18% from Q1.</li>
        </ul>
      </div>
      <div className="report-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h2 className="report-h2">Spend Trend</h2>
          <div style={{ height: 140, padding: '12px 0' }}>
            <Sparkline data={SPEND_TREND.slice(-6)} w={280} h={120} color="var(--accent)" area />
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>Last 6 months · USD</div>
        </div>
        <div>
          <h2 className="report-h2">Service Mix</h2>
          <div className="donut-wrap" style={{ padding: '8px 0' }}>
            <Donut size={120} thickness={16} segments={RESOURCE_BREAKDOWN.slice(0, 5)} />
            <div className="legend">
              {RESOURCE_BREAKDOWN.slice(0, 5).map(s => (
                <div key={s.name} className="legend-item">
                  <span className="legend-swatch" style={{ background: s.color }} />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="report-section">
        <h2 className="report-h2">Top Recommendations</h2>
        <table className="table" style={{ fontSize: 12 }}>
          <thead><tr><th>Action</th><th>Resource</th><th>Risk</th><th style={{ textAlign: 'right' }}>Monthly Save</th></tr></thead>
          <tbody>
            <tr><td>Reserved Instance · 3yr</td><td className="mono dim">sqldb-warehouse-01</td><td><span className="pill warn"><span className="dot" />med</span></td><td className="mono tabular" style={{ textAlign: 'right' }}>$1,840</td></tr>
            <tr><td>Right-size VM</td><td className="mono dim">vm-prod-app-04</td><td><span className="pill ok"><span className="dot" />low</span></td><td className="mono tabular" style={{ textAlign: 'right' }}>$412</td></tr>
          </tbody>
        </table>
      </div>
      <div className="report-footer">
        <span>Tenari · MSP Console</span><span className="mono">Page 1 of 2 · CONFIDENTIAL</span>
      </div>
    </>
  );
}

function CostReport() {
  const rows = [
    ['Compute · VMs', 58420, '+3.2%', 41, [40, 42, 45, 52, 48, 55, 58]],
    ['SQL Databases', 31206, '+12.1%', 22, [20, 22, 25, 28, 30, 29, 31]],
    ['Storage', 18402, '−2.8%', 13, [22, 21, 20, 19, 19, 18, 18]],
    ['App Services', 14288, '+1.4%', 10, [12, 13, 13, 14, 14, 14, 14]],
  ] as const;
  return (
    <>
      <ReportHeader title="Cost & Savings Deep Dive" subtitle="Per-service and per-resource cost decomposition" />
      <div className="report-section">
        <h2 className="report-h2">Spend by Service · April 2026</h2>
        <table className="table" style={{ fontSize: 12 }}>
          <thead><tr><th>Service</th><th style={{ textAlign: 'right' }}>Spend</th><th style={{ textAlign: 'right' }}>Δ MoM</th><th style={{ textAlign: 'right' }}>% of total</th><th>Trend</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r[0]}>
                <td style={{ fontWeight: 500 }}>{r[0]}</td>
                <td className="mono tabular" style={{ textAlign: 'right' }}>{fmtMoney(r[1])}</td>
                <td className="mono tabular" style={{ textAlign: 'right', color: (r[2] as string).startsWith('+') ? 'var(--danger)' : 'var(--ok)' }}>{r[2]}</td>
                <td className="mono tabular dim" style={{ textAlign: 'right' }}>{r[3]}%</td>
                <td><Sparkline data={(r[4] as unknown as number[])} w={80} h={20} color="var(--accent)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="report-footer">
        <span>Tenari · Cost Report</span><span className="mono">CONFIDENTIAL</span>
      </div>
    </>
  );
}

function ComplianceReport() {
  return (
    <>
      <ReportHeader title="Compliance & Audit Posture" subtitle="Policy state · April 2026 · for CISO review" />
      <div className="report-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        {[['Compliance Score', '94%', 'var(--ok)'], ['Policy Violations', '8', 'var(--warn)'], ['Open Exemptions', '3', 'var(--info)']].map(s => (
          <div key={s[0]} className="report-stat" style={{ borderLeft: `3px solid ${s[2]}` }}>
            <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{s[0]}</div>
            <div className="mono tabular" style={{ fontSize: 22, fontWeight: 600 }}>{s[1]}</div>
          </div>
        ))}
      </div>
      <div className="report-section">
        <h2 className="report-h2">Policy Status</h2>
        <table className="table" style={{ fontSize: 12 }}>
          <thead><tr><th>Policy</th><th>Category</th><th style={{ textAlign: 'right' }}>Resources</th><th>Status</th></tr></thead>
          <tbody>
            {[
              ['Require encryption for SQL DBs', 'Security', 14, 'Compliant'],
              ['Storage accounts must use HTTPS', 'Security', 8, 'Compliant'],
              ['VMs must use managed disks', 'Resilience', 3, '2 violations'],
              ['Required tags: cost-center, owner', 'Governance', 22, '4 violations'],
              ['No public IP on VMs', 'Network', 9, 'Compliant'],
            ].map(r => (
              <tr key={r[0] as string}>
                <td style={{ fontWeight: 500 }}>{r[0]}</td>
                <td><span className="pill">{r[1]}</span></td>
                <td className="mono tabular" style={{ textAlign: 'right' }}>{r[2]}</td>
                <td><span className={`pill ${(r[3] as string).includes('violation') ? 'warn' : 'ok'}`}>{r[3]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="report-footer">
        <span>Tenari · Compliance Report</span><span className="mono">CONFIDENTIAL</span>
      </div>
    </>
  );
}

function TagReport() {
  return (
    <>
      <ReportHeader title="Tag Governance" subtitle="Untagged resource discovery · April 2026" />
      <div className="report-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
          {[['Tagged Resources', '847/1,024', 'var(--ok)'], ['Untagged', '177', 'var(--warn)'], ['Tag Coverage', '82.7%', 'var(--accent)']].map(s => (
            <div key={s[0]} className="report-stat">
              <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{s[0]}</div>
              <div className="mono tabular" style={{ fontSize: 22, fontWeight: 600, color: s[2] }}>{s[1]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="report-section">
        <h2 className="report-h2">Required Tags Coverage</h2>
        {['cost-center', 'owner', 'environment', 'project'].map(tag => (
          <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, flex: 1 }}>{tag}</code>
            <div className="bar" style={{ width: 120 }}><span style={{ width: `${[94, 88, 76, 62][['cost-center', 'owner', 'environment', 'project'].indexOf(tag)]}%`, background: 'var(--ok)' }} /></div>
            <span className="mono dim" style={{ fontSize: 12, minWidth: 36 }}>{[94, 88, 76, 62][['cost-center', 'owner', 'environment', 'project'].indexOf(tag)]}%</span>
          </div>
        ))}
      </div>
      <div className="report-footer">
        <span>Tenari · Tag Governance</span><span className="mono">CONFIDENTIAL</span>
      </div>
    </>
  );
}

function SLAReport() {
  return (
    <>
      <ReportHeader title="SLA & Uptime Report" subtitle="Per-tenant availability · 30-day and 90-day view" />
      <div className="report-section">
        <h2 className="report-h2">SLA Summary · April 2026</h2>
        <table className="table" style={{ fontSize: 12 }}>
          <thead><tr><th>Subscription</th><th>Target SLA</th><th>Actual (30d)</th><th>Actual (90d)</th><th>Incidents</th></tr></thead>
          <tbody>
            {[
              ['prod-eus', '99.9%', '99.97%', '99.95%', '0'],
              ['prod-weu', '99.9%', '99.91%', '99.88%', '1'],
              ['dev-eus', '99.5%', '99.81%', '99.74%', '0'],
              ['staging-uks', '99.0%', '99.62%', '99.60%', '0'],
            ].map(r => (
              <tr key={r[0]}>
                <td className="mono">{r[0]}</td>
                <td className="mono dim">{r[1]}</td>
                <td className="mono" style={{ color: parseFloat(r[2]) >= parseFloat(r[1]) ? 'var(--ok)' : 'var(--danger)' }}>{r[2]}</td>
                <td className="mono" style={{ color: parseFloat(r[3]) >= parseFloat(r[1]) ? 'var(--ok)' : 'var(--danger)' }}>{r[3]}</td>
                <td className="mono tabular" style={{ color: r[4] === '0' ? 'var(--ok)' : 'var(--warn)' }}>{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="report-footer">
        <span>Tenari · SLA Report</span><span className="mono">CONFIDENTIAL</span>
      </div>
    </>
  );
}

function ReportPreviewModal({ tpl, onClose }: { tpl: Template; onClose: () => void }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 880, width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{tpl.name}</h2>
            <div className="muted" style={{ fontSize: 11 }}>Preview · Meridian Capital · April 2026</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-sm"><Icon name="download" size={12} />PDF</button>
            <button className="btn btn-sm"><Icon name="download" size={12} />CSV</button>
            <button className="btn btn-sm btn-primary"><Icon name="bell" size={12} />Schedule</button>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
          </div>
        </div>
        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'var(--bg)', padding: 0 }}>
          <div className="report-page">
            {tpl.kind === 'executive' && <ExecReport />}
            {tpl.kind === 'cost' && <CostReport />}
            {tpl.kind === 'compliance' && <ComplianceReport />}
            {tpl.kind === 'tag' && <TagReport />}
            {tpl.kind === 'sla' && <SLAReport />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [previewing, setPreviewing] = useState<Template | null>(null);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Build, schedule, and white-label customer reports · click any template to preview</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="palette" size={14} />Branding</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} />New report</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Reports Generated" value="142" delta="+18 this month" deltaDir="up" sub="all tenants" sparkColor="var(--accent)" spark={[20, 28, 32, 40, 52, 68, 82, 98]} />
        <KpiCard label="Scheduled" value="14" delta="3 customer-facing" sub="" />
        <KpiCard label="Avg Open Rate" value="76%" delta="+4pp" deltaDir="up" sub="customers reading reports" sparkColor="var(--ok)" />
        <KpiCard label="Branded" value="9 of 14" delta="white-labeled" sub="" sparkColor="var(--accent-3)" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Templates · click to preview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
          {TEMPLATES.map(tpl => (
            <button key={tpl.id} className="report-template-card" onClick={() => setPreviewing(tpl)}>
              <div className="report-template-icon"><Icon name={tpl.icon} size={18} /></div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{tpl.name}</div>
                <div className="dim" style={{ fontSize: 11, marginTop: 1 }}>{tpl.desc}</div>
              </div>
              <Icon name="eye" size={14} className="dim" />
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Scheduled Reports</div>
          <span className="muted mono" style={{ fontSize: 11 }}>Next run: 1 Jun · 06:00 UTC</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Report</th><th>Recipients</th><th>Schedule</th><th>Format</th><th>Last sent</th><th>Open rate</th><th></th></tr>
            </thead>
            <tbody>
              {SCHEDULED.map((r, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{r[0]}</div>
                    <div className="dim" style={{ fontSize: 11 }}>from &quot;{r[1]}&quot;</div>
                  </td>
                  <td className="muted mono" style={{ fontSize: 12 }}>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td><span className="pill">{r[4]}</span></td>
                  <td className="dim" style={{ fontSize: 12 }}>{r[5]}</td>
                  <td className="mono tabular" style={{ fontSize: 12 }}>{r[6]}</td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn-sm btn-ghost"><Icon name="play" size={12} /></button>
                      <button className="btn btn-sm btn-ghost"><Icon name="edit" size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewing && <ReportPreviewModal tpl={previewing} onClose={() => setPreviewing(null)} />}
    </div>
  );
}

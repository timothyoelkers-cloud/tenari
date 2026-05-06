'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { KpiCard } from '@/components/kpi-card';
import { Donut } from '@/components/charts/donut';
import { SpendChart } from '@/components/charts/spend-chart';
import { TENANTS, RESOURCE_BREAKDOWN, fmtMoney, fmtMoneyK, range } from '@/lib/data/mock';

// ── Shared mini line chart for compliance trend ────────────────────────────

function MiniLineChart({ data, color = 'var(--ok)' }: { data: number[]; color?: string }) {
  const w = 200, h = 60;
  const max = Math.max(...data), min = Math.min(...data) - 2;
  const xs = (i: number) => (i / (data.length - 1)) * w;
  const ys = (v: number) => h - ((v - min) / (max - min)) * h * 0.85 - h * 0.075;
  const pts = data.map((v, i) => `${xs(i)},${ys(v)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', width: '100%' }}>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color.replace(')', ',.12)').replace('var(', 'color-mix(in srgb, ')} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Portal tab content ─────────────────────────────────────────────────────

function PortalHome() {
  return (
    <>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Welcome back, Lena</h2>
      <p className="muted" style={{ margin: '0 0 22px', fontSize: 13 }}>Your Azure environment at a glance</p>

      <div className="kpi-grid">
        <KpiCard label="This Month" value="$142,881" delta="+4.2%" deltaDir="up" sub="vs last month" sparkColor="var(--accent)" spark={[100, 110, 120, 118, 125, 130, 135, 142]} />
        <KpiCard label="Compliance" value="94%" delta="+2pp" deltaDir="up" sub="" sparkColor="var(--ok)" spark={[88, 89, 90, 91, 92, 93, 94, 94]} />
        <KpiCard label="Open Tickets" value="2" delta="1 in progress" sub="" sparkColor="var(--info)" spark={[5, 4, 3, 2, 3, 2, 3, 2]} />
        <KpiCard label="Savings YTD" value="$28,140" delta="14 actions applied" deltaDir="up" sub="" sparkColor="var(--accent-3)" spark={[2, 5, 8, 12, 16, 20, 24, 28]} />
      </div>

      <div className="split-2-1" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <button className="btn btn-sm btn-ghost">View all</button>
          </div>
          <div style={{ padding: '4px 0' }}>
            {[
              ['check', 'Savings applied', 'Reserved Instance · sqldb-warehouse-01 · saving $1,840/mo', '2h ago', 'var(--ok)'],
              ['file-text', 'Monthly cost report ready', 'April 2026 · executive summary', '1d ago', 'var(--accent)'],
              ['shield-check', 'Compliance check passed', 'POL-001 · Encryption for SQL DBs', '2d ago', 'var(--ok)'],
              ['bell', 'Alert resolved', 'TLS < 1.2 on app-svc-checkout · auto-remediated', '3d ago', 'var(--info)'],
              ['users', 'New user invited', 'm.singh@meridiancap.com · Tenant Admin', '5d ago', 'var(--text-muted)'],
            ].map((a, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12 }}>
                <div style={{ flex: 'none', width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a[4] as string }}>
                  <Icon name={a[0] as string} size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a[1]}</div>
                  <div className="dim" style={{ fontSize: 11, marginTop: 1 }}>{a[2]}</div>
                </div>
                <div className="dim" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{a[3]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pending Approvals</div>
            <span className="muted mono" style={{ fontSize: 11 }}>2</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ padding: 14, background: 'var(--bg-hover)', borderRadius: 8, marginBottom: 10, border: '1px solid var(--border)' }}>
              <div className="pill ok" style={{ marginBottom: 6 }}>Saving $1,840/mo</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Reserved Instance · 3yr</div>
              <div className="dim mono" style={{ fontSize: 11, marginBottom: 10 }}>sqldb-warehouse-01 · medium risk</div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-sm btn-primary" style={{ flex: 1 }}>Approve</button>
                <button className="btn btn-sm" style={{ flex: 1 }}>Defer</button>
              </div>
            </div>
            <div style={{ padding: 14, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div className="pill warn" style={{ marginBottom: 6 }}>Policy exemption</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>storage-public-assets</div>
              <div className="dim" style={{ fontSize: 11, marginBottom: 10 }}>HTTPS-only exemption · CDN origin · permanent</div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-sm btn-primary" style={{ flex: 1 }}>Approve</button>
                <button className="btn btn-sm" style={{ flex: 1 }}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PortalCost() {
  return (
    <>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Cost &amp; Spend</h2>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>Monthly invoice and where your spend goes</p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <select className="select"><option>April 2026</option><option>March 2026</option></select>
          <button className="btn btn-sm"><Icon name="download" size={12} />CSV</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="This Month" value="$142,881" delta="+4.2%" deltaDir="up" sub="vs March" sparkColor="var(--accent)" spark={[100, 110, 118, 125, 132, 138, 140, 142]} />
        <KpiCard label="Forecast EOM" value="$148,200" delta="+3.7%" deltaDir="up" sub="based on trend" spark={[100, 105, 110, 118, 125, 135, 142, 148]} />
        <KpiCard label="Budget" value="$160,000" delta="89% used" sub="" sparkColor="var(--warn)" spark={[60, 65, 70, 75, 78, 82, 86, 89]} />
        <KpiCard label="Savings YTD" value="$28,140" delta="14 actions" deltaDir="up" sub="" sparkColor="var(--accent-3)" spark={[2, 5, 8, 12, 16, 20, 24, 28]} />
      </div>

      <div className="split-2-1" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daily Spend</div>
            <span className="muted mono" style={{ fontSize: 11 }}>April 2026</span>
          </div>
          <div className="card-body" style={{ padding: '16px 24px' }}>
            <SpendChart data={range(30).map(i => 4000 + ((i * 7 + 13) % 30) * 120 + (i % 7 < 5 ? 1500 : 0))} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Where it goes</div></div>
          <div className="card-body">
            <div className="donut-wrap">
              <Donut size={140} thickness={18} segments={RESOURCE_BREAKDOWN.slice(0, 5).map(s => ({ ...s, value: s.value * 0.05 }))} />
              <div className="legend">
                {RESOURCE_BREAKDOWN.slice(0, 5).map(s => (
                  <div key={s.name} className="legend-item">
                    <span className="legend-swatch" style={{ background: s.color }} />
                    <span style={{ minWidth: 80 }}>{s.name}</span>
                    <span className="muted mono tabular">{fmtMoneyK(s.value * 0.05)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Savings Recommendations</div>
          <button className="btn btn-sm btn-primary"><Icon name="play" size={12} />Apply all low-risk</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Recommendation</th><th>Resource</th><th>Risk</th><th style={{ textAlign: 'right' }}>Monthly</th><th></th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Reserved Instance · 3yr</td>
                <td className="mono dim">sqldb-warehouse-01</td>
                <td><span className="pill warn"><span className="dot" />med</span></td>
                <td className="mono tabular" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--ok)' }}>−$1,840</td>
                <td><button className="btn btn-sm">Review</button></td>
              </tr>
              <tr>
                <td>Right-size VM</td>
                <td className="mono dim">vm-prod-app-04</td>
                <td><span className="pill ok"><span className="dot" />low</span></td>
                <td className="mono tabular" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--ok)' }}>−$412</td>
                <td><button className="btn btn-sm btn-primary">Approve</button></td>
              </tr>
              <tr>
                <td>Storage tier</td>
                <td className="mono dim">storage-archive</td>
                <td><span className="pill ok"><span className="dot" />low</span></td>
                <td className="mono tabular" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--ok)' }}>−$248</td>
                <td><button className="btn btn-sm btn-primary">Approve</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function PortalPosture() {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Security &amp; Compliance</h2>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Posture across your Azure environment</p>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Compliance Score" value="94%" delta="+2pp" deltaDir="up" sub="across all policies" sparkColor="var(--ok)" spark={[88, 89, 90, 91, 92, 93, 94, 94]} />
        <KpiCard label="Open Issues" value="3" delta="2 high · 1 med" deltaDir="down" sub="" sparkColor="var(--warn)" spark={[8, 7, 6, 5, 4, 4, 3, 3]} />
        <KpiCard label="MFA Coverage" value="100%" delta="all users" sub="" sparkColor="var(--ok)" spark={[92, 94, 96, 98, 100, 100, 100, 100]} />
        <KpiCard label="Frameworks" value="4 met" delta="SOC 2, ISO, CIS, NIST" sub="" spark={[1, 2, 2, 3, 3, 4, 4, 4]} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Open Issues</div>
          <span className="muted" style={{ fontSize: 11 }}>Tenari is on it · ETA 24h</span>
        </div>
        <div style={{ padding: '4px 0' }}>
          {[
            ['high', 'TLS < 1.2 on app-svc-checkout', '3 resources', 'Tenari remediation in progress', '2h ago'],
            ['high', 'NSG flow logs disabled', 'vnet-prod-eus', 'Awaiting your approval', '2h ago'],
            ['med', 'Storage soft-delete < 30 days', 'storage-audit-logs', 'Auto-fix queued for tonight', '4h ago'],
          ].map((r, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`sev ${r[0]}`} style={{ flex: 'none', minWidth: 60 }}>{r[0] === 'high' ? 'High' : 'Medium'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r[1]}</div>
                <div className="dim" style={{ fontSize: 11, marginTop: 2 }}><span className="mono">{r[2]}</span> · {r[3]}</div>
              </div>
              <span className="dim" style={{ fontSize: 11 }}>{r[4]}</span>
              <button className="btn btn-sm">View</button>
            </div>
          ))}
        </div>
      </div>

      <div className="split-2-1" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Framework Coverage</div></div>
          <div style={{ padding: '4px 0' }}>
            {[
              ['SOC 2 Type II', 96, 'var(--ok)'],
              ['ISO 27001:2022', 92, 'var(--ok)'],
              ['CIS Azure Benchmark', 88, 'var(--warn)'],
              ['NIST 800-53', 91, 'var(--ok)'],
            ].map((f, i) => (
              <div key={f[0] as string} style={{ padding: '14px 16px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div className="between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{f[0]}</span>
                  <span className="mono tabular" style={{ fontSize: 13, fontWeight: 600, color: f[2] as string }}>{f[1]}%</span>
                </div>
                <div className="bar" style={{ height: 6 }}><span style={{ width: f[1] + '%', background: f[2] as string }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Compliance Trend</div>
            <span className="muted" style={{ fontSize: 11 }}>last 6 months</span>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <MiniLineChart data={[88, 89, 90, 91, 92, 94]} />
            <div className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>+6pp improvement since Nov 2025</div>
          </div>
        </div>
      </div>
    </>
  );
}

function PortalSupport() {
  return (
    <>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Support</h2>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>Get help from your Tenari team · avg response 14 min</p>
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={14} />New ticket</button>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Open Tickets" value="2" delta="1 in progress" sub="" sparkColor="var(--info)" spark={[5, 4, 3, 2, 3, 2, 3, 2]} />
        <KpiCard label="Avg Response" value="14m" delta="vs 2h SLA" deltaDir="up" sub="" sparkColor="var(--ok)" spark={[60, 45, 35, 28, 22, 18, 14, 14]} />
        <KpiCard label="Satisfaction" value="4.8/5" delta="last 30d" sub="" sparkColor="var(--accent-3)" spark={[4.2, 4.4, 4.5, 4.6, 4.7, 4.7, 4.8, 4.8]} />
        <KpiCard label="Closed YTD" value="34" delta="all resolved" sub="" spark={[2, 6, 10, 14, 18, 24, 30, 34]} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Your Tickets</div>
          <select className="select"><option>All statuses</option><option>Open</option><option>Closed</option></select>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Subject</th><th>Status</th><th>Assignee</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {[
                ['TKT-4012', 'Need help configuring private endpoint for storage-data', 'open', 'Sarah C.', '12m ago', 'danger'],
                ['TKT-4011', 'Question about reserved instance pricing for SQL', 'in_progress', 'Mike R.', '2h ago', 'warn'],
                ['TKT-4010', 'Add new admin user (m.singh@)', 'closed', 'Jamie K.', '1d ago', 'ok'],
                ['TKT-4009', 'Spike in traffic April 18 — cause?', 'closed', 'Priya S.', '3d ago', 'ok'],
                ['TKT-4008', 'Set up NSG for new VNet (eu-west-2)', 'closed', 'Sarah C.', '1w ago', 'ok'],
                ['TKT-4007', 'Policy exemption for legacy SQL', 'closed', 'Mike R.', '2w ago', 'ok'],
              ].map((t, i) => (
                <tr key={i} className="clickable">
                  <td className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{t[0]}</td>
                  <td>{t[1]}</td>
                  <td>
                    <span className={`pill ${t[5]}`}><span className="dot" />
                      {t[2] === 'open' ? 'Open' : t[2] === 'in_progress' ? 'In Progress' : 'Closed'}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{t[3]}</td>
                  <td className="dim" style={{ fontSize: 12 }}>{t[4]}</td>
                  <td><Icon name="chevron-right" size={14} className="dim" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="split-2-1" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Your Tenari Team</div></div>
          <div style={{ padding: '4px 0' }}>
            {[
              ['Sarah Chen', 'Account Lead', 'SC', 'online'],
              ['Mike Rodriguez', 'Senior Cloud Engineer', 'MR', 'online'],
              ['Priya Sharma', 'FinOps Analyst', 'PS', 'away'],
              ['Tomás Ribeiro', 'Billing', 'TR', 'offline'],
            ].map((p, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <div className="avatar">{p[2]}</div>
                  <span style={{
                    position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%',
                    background: p[3] === 'online' ? 'var(--ok)' : p[3] === 'away' ? 'var(--warn)' : 'var(--text-muted)',
                    border: '2px solid var(--card)',
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p[0]}</div>
                  <div className="dim" style={{ fontSize: 11 }}>{p[1]}</div>
                </div>
                <button className="btn btn-sm btn-ghost"><Icon name="message" size={12} /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Knowledge Base</div></div>
          <div style={{ padding: '4px 0' }}>
            {[
              ['Setting up private endpoints', 'Networking · 4 min'],
              ['Understanding reserved instances', 'FinOps · 6 min'],
              ['Tag governance best practices', 'Governance · 3 min'],
              ['Disaster recovery checklist', 'Resilience · 8 min'],
            ].map((k, i) => (
              <button key={i} className="nav-item" style={{ padding: '12px 16px', textAlign: 'left', width: '100%' }}>
                <Icon name="file-text" size={14} className="dim" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{k[0]}</div>
                  <div className="dim" style={{ fontSize: 11 }}>{k[1]}</div>
                </div>
                <Icon name="external-link" size={12} className="dim" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function PortalBilling() {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Billing</h2>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Invoices and payment history</p>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Current Balance" value="$142,881" delta="due 15 May" sub="auto-pay enabled" sparkColor="var(--accent)" spark={[100, 110, 120, 125, 130, 135, 140, 142]} />
        <KpiCard label="YTD" value="$498,420" delta="+8% vs 2025" sub="" spark={[50, 100, 160, 220, 290, 360, 430, 498]} />
        <KpiCard label="Payment Method" value="ACH ··3491" delta="default" sub="" spark={[1, 1, 1, 1, 1, 1, 1, 1]} />
        <KpiCard label="Discounts" value="$8,140" delta="annual commit + 5%" deltaDir="up" sub="" sparkColor="var(--ok)" spark={[1, 2, 3, 4, 5, 6, 7, 8]} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Invoices</div>
          <select className="select"><option>2026</option><option>2025</option></select>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Invoice</th><th>Period</th><th style={{ textAlign: 'right' }}>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {[
                ['INV-2026-0411', 'Apr 2026', 142881.40, '2026-05-01', '2026-05-15', 'sent', 'info'],
                ['INV-2026-0311', 'Mar 2026', 136920.10, '2026-04-01', '2026-04-15', 'paid', 'ok'],
                ['INV-2026-0211', 'Feb 2026', 128440.85, '2026-03-01', '2026-03-15', 'paid', 'ok'],
                ['INV-2026-0111', 'Jan 2026', 124201.00, '2026-02-01', '2026-02-15', 'paid', 'ok'],
                ['INV-2025-1211', 'Dec 2025', 119804.42, '2026-01-01', '2026-01-15', 'paid', 'ok'],
              ].map((r, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{r[0]}</td>
                  <td className="muted">{r[1]}</td>
                  <td className="mono tabular" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoney(r[2] as number)}</td>
                  <td className="dim" style={{ fontSize: 12 }}>{r[3]}</td>
                  <td className="dim" style={{ fontSize: 12 }}>{r[4]}</td>
                  <td><span className={`pill ${r[6]}`}><span className="dot" />{r[5] === 'paid' ? 'Paid' : 'Sent'}</span></td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn-sm btn-ghost"><Icon name="eye" size={12} /></button>
                      <button className="btn btn-sm btn-ghost"><Icon name="download" size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Payment Methods</div>
          <button className="btn btn-sm"><Icon name="plus" size={12} />Add method</button>
        </div>
        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: 14, border: '2px solid var(--accent)', borderRadius: 8, background: 'rgba(59,130,246,.06)' }}>
            <div className="between">
              <span className="pill accent">Default</span>
              <Icon name="check" size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>ACH · ending 3491</div>
            <div className="dim" style={{ fontSize: 11 }}>Bank of America · auto-pay enabled</div>
          </div>
          <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Visa · ending 0042</div>
            <div className="dim" style={{ fontSize: 11 }}>Backup method · expires 09/27</div>
          </div>
        </div>
      </div>
    </>
  );
}

function PortalTeam({ tenantId }: { tenantId: string }) {
  const tenant = TENANTS.find(t => t.id === tenantId) || TENANTS[2];
  return (
    <>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Team</h2>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>Manage who has access to your {tenant.name} portal</p>
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={14} />Invite user</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>User</th><th>Role</th><th>MFA</th><th>Last sign-in</th><th></th></tr></thead>
            <tbody>
              {[
                ['Lena Hofmann', 'lena@meridiancap.com', 'Admin', 'LH', true, 'just now'],
                ['Marcus Singh', 'm.singh@meridiancap.com', 'Tenant Admin', 'MS', true, '2h ago'],
                ['Diana Liu', 'd.liu@meridiancap.com', 'Cost Reader', 'DL', true, '1d ago'],
                ['Felix Brand', 'f.brand@meridiancap.com', 'Read-only', 'FB', false, '3d ago'],
                ['Yuki Tanaka', 'y.tanaka@meridiancap.com', 'Read-only', 'YT', true, '5d ago'],
              ].map((u, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{u[3]}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{u[0]}</div>
                        <div className="dim mono" style={{ fontSize: 11 }}>{u[1]}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pill">{u[2]}</span></td>
                  <td>
                    {u[4]
                      ? <span className="pill ok"><Icon name="check" size={10} />On</span>
                      : <span className="pill danger"><Icon name="x" size={10} />Off</span>}
                  </td>
                  <td className="dim" style={{ fontSize: 12 }}>{u[5]}</td>
                  <td><button className="btn btn-sm btn-ghost"><Icon name="more-horizontal" size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Single Sign-On</div>
          <span className="pill ok"><Icon name="check" size={10} />Active</span>
        </div>
        <div style={{ padding: 18 }}>
          <div className="row" style={{ gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#0078D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>M</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Microsoft Entra ID</div>
              <div className="dim mono" style={{ fontSize: 11 }}>meridiancap.onmicrosoft.com · {tenant.tenantId.slice(0, 16)}…</div>
            </div>
            <button className="btn btn-sm" style={{ marginLeft: 'auto' }}>Configure</button>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 6, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon name="info" size={12} />
            <span>All users must sign in via SSO. MFA enforced by your IdP policy.</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Portal Page ────────────────────────────────────────────────────────────

type PortalTab = 'home' | 'cost' | 'posture' | 'support' | 'billing' | 'team';

const TABS: [PortalTab, string, string][] = [
  ['home', 'Dashboard', 'home'],
  ['cost', 'Cost & Spend', 'piggy-bank'],
  ['posture', 'Security & Compliance', 'shield'],
  ['support', 'Support', 'message'],
  ['billing', 'Billing', 'receipt'],
  ['team', 'Team', 'users'],
];

export default function PortalPage() {
  const [portalTab, setPortalTab] = useState<PortalTab>('home');
  const [selectedTenantId, setSelectedTenantId] = useState(TENANTS[2].id);
  const tenant = TENANTS.find(t => t.id === selectedTenantId) || TENANTS[2];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Portal Preview</h1>
          <p className="page-sub">
            White-labeled view your customers see · viewing as <strong>Lena Hofmann</strong> from {tenant.name}
          </p>
        </div>
        <div className="page-actions">
          <select
            className="select"
            value={selectedTenantId}
            onChange={e => setSelectedTenantId(e.target.value)}
          >
            {TENANTS.slice(0, 12).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button className="btn"><Icon name="palette" size={14} />Branding</button>
          <button className="btn btn-primary"><Icon name="external-link" size={14} />Open as customer</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="browser-chrome">
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="dot-r" /><div className="dot-y" /><div className="dot-g" />
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 12 }}>
            https://{tenant.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.tenari.io
          </div>
          <span className="pill ok" style={{ marginLeft: 'auto' }}><Icon name="lock" size={10} />SSL</span>
        </div>

        <div className="portal-shell">
          <div className="portal-header">
            <div className="row" style={{ gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `linear-gradient(135deg,${tenant.color}cc,${tenant.color})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14,
              }}>
                {tenant.initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{tenant.name} · Cloud</div>
                <div className="muted" style={{ fontSize: 11 }}>Powered by Tenari</div>
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="pill ok"><span className="dot" />All systems healthy</span>
              <button className="icon-btn"><Icon name="bell" size={14} /></button>
              <div className="avatar">LH</div>
            </div>
          </div>

          <div className="portal-tabs">
            {TABS.map(([id, label, icon]) => (
              <button
                key={id}
                className={`portal-tab ${portalTab === id ? 'active' : ''}`}
                onClick={() => setPortalTab(id)}
              >
                <Icon name={icon} size={13} />{label}
              </button>
            ))}
          </div>

          <div className="portal-body">
            {portalTab === 'home' && <PortalHome />}
            {portalTab === 'cost' && <PortalCost />}
            {portalTab === 'posture' && <PortalPosture />}
            {portalTab === 'support' && <PortalSupport />}
            {portalTab === 'billing' && <PortalBilling />}
            {portalTab === 'team' && <PortalTeam tenantId={selectedTenantId} />}
          </div>
        </div>
      </div>
    </div>
  );
}

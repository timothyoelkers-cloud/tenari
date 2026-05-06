'use client';

import { useState } from 'react';
import { KpiCard } from '@/components/kpi-card';
import { Icon } from '@/components/icons';
import { POLICIES, TENANTS } from '@/lib/data/mock';
import type { Policy } from '@/lib/data/types';

// ── Score Ring ──────────────────────────────────────────────────────────────

interface ScoreRingProps {
  score: number;
  size?: number;
  thickness?: number;
}

function ScoreRing({ score, size = 100, thickness = 8 }: ScoreRingProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const len = (score / 100) * c;
  const color =
    score > 90 ? 'var(--ok)' : score > 75 ? 'var(--warn)' : 'var(--danger)';
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--bg-hover)"
        strokeWidth={thickness}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={thickness}
        fill="none"
        strokeDasharray={`${len} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fontSize={size / 4.5}
        fontWeight="600"
        fill="var(--text)"
        className="tabular"
      >
        {score.toFixed(0)}
      </text>
    </svg>
  );
}

// ── Policy Drawer ────────────────────────────────────────────────────────────

interface PolicyDrawerProps {
  policy: Policy;
  onClose: () => void;
}

function PolicyDrawer({ policy, onClose }: PolicyDrawerProps) {
  const impacted = TENANTS.slice(0, 8).map((t, i) => ({
    ...t,
    nc: Math.max(1, Math.floor((policy.nonCompliant / 8) * (1 + (i % 3)))),
    resource: [
      'vm-prod-app-04',
      'sqldb-warehouse',
      'storage-archive',
      'aks-cluster',
      'vault-secrets',
      'app-svc-checkout',
      'cosmos-content',
      'func-batch',
    ][i],
  }));

  const sevLabel = (sev: Policy['severity']) => {
    if (sev === 'crit') return 'Critical';
    if (sev === 'high') return 'High';
    if (sev === 'med') return 'Medium';
    return 'Low';
  };

  return (
    <>
      <div className="drawer-bg" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span className={`sev ${policy.severity}`}>{sevLabel(policy.severity)}</span>
              <span className="pill">{policy.category}</span>
            </div>
            <h2 style={{ margin: '8px 0 4px', fontSize: 16, fontWeight: 600 }}>
              {policy.name}
            </h2>
            <div className="mono dim" style={{ fontSize: 11 }}>
              {policy.id}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-body">
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}
          >
            <div className="card" style={{ padding: '14px 16px' }}>
              <div
                className="muted"
                style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}
              >
                Compliant
              </div>
              <div
                className="mono tabular"
                style={{ fontSize: 22, fontWeight: 600, color: 'var(--ok)' }}
              >
                {policy.compliant}
              </div>
            </div>
            <div className="card" style={{ padding: '14px 16px' }}>
              <div
                className="muted"
                style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}
              >
                Non-compliant
              </div>
              <div
                className="mono tabular"
                style={{ fontSize: 22, fontWeight: 600, color: 'var(--danger)' }}
              >
                {policy.nonCompliant}
              </div>
            </div>
          </div>

          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              color: 'var(--text-muted)',
            }}
          >
            Risk Analysis
          </h3>
          <div className="risk-step danger" style={{ marginBottom: 8 }}>
            <div
              className="icon-circle"
              style={{ background: 'rgba(248,113,113,.2)', color: 'var(--danger)' }}
            >
              <Icon name="alert-triangle" size={14} />
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--danger)' }}>Data exposure risk:</strong> Resources
              without this policy may expose customer data over public networks. Likely{' '}
              <strong>regulatory impact</strong> (ISO 27001, SOC 2).
            </div>
          </div>
          <div className="risk-step warn" style={{ marginBottom: 20 }}>
            <div
              className="icon-circle"
              style={{ background: 'rgba(251,191,36,.2)', color: 'var(--warn)' }}
            >
              <Icon name="info" size={14} />
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <strong>Auto-remediation available</strong> via deployIfNotExists. Estimated impact:{' '}
              <strong>{policy.nonCompliant} resources</strong> across 8 tenants. Brief connection
              reset on apply.
            </div>
          </div>

          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              color: 'var(--text-muted)',
            }}
          >
            Top Impacted Tenants
          </h3>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Non-comp</th>
                  <th>Resource</th>
                </tr>
              </thead>
              <tbody>
                {impacted.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          className="tenant-pip"
                          style={{ background: t.color, width: 20, height: 20, fontSize: 9 }}
                        >
                          {t.initials}
                        </div>
                        <span style={{ fontSize: 12 }}>{t.name}</span>
                      </div>
                    </td>
                    <td className="mono tabular" style={{ color: 'var(--danger)' }}>
                      {t.nc}
                    </td>
                    <td className="mono dim" style={{ fontSize: 11 }}>
                      {t.resource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row" style={{ marginTop: 20, gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }}>
              <Icon name="play" size={14} />
              Auto-remediate ({policy.nonCompliant})
            </button>
            <button className="btn">
              <Icon name="sparkles" size={14} />
              Generate Bicep
            </button>
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 8, width: '100%' }}>
            <Icon name="eye" size={14} /> View raw policy JSON
          </button>
        </div>
      </div>
    </>
  );
}

// ── Policies Page ────────────────────────────────────────────────────────────

type SevFilter = 'all' | 'crit' | 'high' | 'med' | 'low';

export default function PoliciesPage() {
  const [selected, setSelected] = useState<Policy | null>(null);
  const [sevFilter, setSevFilter] = useState<SevFilter>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  const totalCompliant = POLICIES.reduce((s, p) => s + p.compliant, 0);
  const totalNonCompliant = POLICIES.reduce((s, p) => s + p.nonCompliant, 0);
  const totalExempt = POLICIES.reduce((s, p) => s + p.exempt, 0);
  const overall = (totalCompliant / (totalCompliant + totalNonCompliant)) * 100;

  const filtered = POLICIES.filter(
    (p) =>
      (sevFilter === 'all' || p.severity === sevFilter) &&
      (catFilter === 'all' || p.category === catFilter),
  );

  const cats = Array.from(new Set(POLICIES.map((p) => p.category)));

  const sevLabel = (sev: Policy['severity']) => {
    if (sev === 'crit') return 'Critical';
    if (sev === 'high') return 'High';
    if (sev === 'med') return 'Medium';
    return 'Low';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Policy Compliance</h1>
          <p className="page-sub">
            Multi-tenant Azure Policy enforcement · {POLICIES.length} active policies ·{' '}
            {TENANTS.length} tenants
          </p>
        </div>
        <div className="page-actions">
          <button className="btn">
            <Icon name="refresh" size={14} /> Re-evaluate
          </button>
          <button className="btn">
            <Icon name="download" size={14} /> Export
          </button>
          <button className="btn btn-primary">
            <Icon name="plus" size={14} /> Assign policy
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Overall Compliance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScoreRing score={overall} size={70} />
            <div>
              <div className="kpi-value tabular">{overall.toFixed(1)}%</div>
              <div className="kpi-delta">
                <span style={{ color: 'var(--ok)' }}>+1.4pp</span>{' '}
                <span className="muted">vs last week</span>
              </div>
            </div>
          </div>
        </div>
        <KpiCard
          label="Compliant Resources"
          value={totalCompliant.toLocaleString()}
          delta="+312"
          deltaDir="up"
          sub="this week"
          sparkColor="var(--ok)"
          spark={[800, 820, 840, 860, 880, 900, 920, 950]}
        />
        <KpiCard
          label="Non-Compliant"
          value={totalNonCompliant.toLocaleString()}
          delta="-47"
          deltaDir="up"
          sub="this week"
          sparkColor="var(--danger)"
          spark={[600, 580, 540, 520, 490, 470, 450, 440]}
        />
        <KpiCard
          label="Exempted"
          value={totalExempt.toLocaleString()}
          delta="3 expiring"
          deltaDir="down"
          sub="<7 days"
          sparkColor="var(--warn)"
          spark={[20, 22, 24, 28, 30, 32, 34, 34]}
        />
      </div>

      <div className="filter-bar">
        <select
          className="select"
          value={sevFilter}
          onChange={(e) => setSevFilter(e.target.value as SevFilter)}
        >
          <option value="all">All severities</option>
          <option value="crit">Critical</option>
          <option value="high">High</option>
          <option value="med">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="select"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
          {filtered.length} policies
        </span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Category</th>
                <th>Severity</th>
                <th style={{ minWidth: 200 }}>Compliance</th>
                <th style={{ textAlign: 'right' }}>Compliant</th>
                <th style={{ textAlign: 'right' }}>Non-Compliant</th>
                <th style={{ textAlign: 'right' }}>Exempt</th>
                <th>Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const total = p.compliant + p.nonCompliant + p.exempt;
                const pct = (p.compliant / total) * 100;
                return (
                  <tr key={p.id} className="clickable" onClick={() => setSelected(p)}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div className="mono dim" style={{ fontSize: 11 }}>
                        {p.id}
                      </div>
                    </td>
                    <td>
                      <span className="pill">{p.category}</span>
                    </td>
                    <td>
                      <span className={`sev ${p.severity}`}>{sevLabel(p.severity)}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="bar" style={{ width: 120 }}>
                          <span
                            style={{
                              width: pct + '%',
                              background:
                                pct > 95
                                  ? 'var(--ok)'
                                  : pct > 85
                                  ? 'var(--warn)'
                                  : 'var(--danger)',
                            }}
                          />
                        </div>
                        <span className="mono tabular" style={{ fontSize: 12 }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono tabular">
                      {p.compliant}
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono tabular">
                      <span
                        style={{
                          color: p.nonCompliant > 0 ? 'var(--danger)' : 'var(--text-muted)',
                        }}
                      >
                        {p.nonCompliant}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono tabular dim">
                      {p.exempt}
                    </td>
                    <td>
                      {p.severity === 'crit' && p.nonCompliant > 0 ? (
                        <span className="pill danger">
                          <Icon name="alert-triangle" size={10} />
                          High
                        </span>
                      ) : p.severity === 'high' && p.nonCompliant > 5 ? (
                        <span className="pill warn">
                          <Icon name="alert-circle" size={10} />
                          Med
                        </span>
                      ) : (
                        <span className="pill ok">
                          <Icon name="check" size={10} />
                          Low
                        </span>
                      )}
                    </td>
                    <td>
                      <Icon name="chevron-right" size={14} className="dim" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <PolicyDrawer policy={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

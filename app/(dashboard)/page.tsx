'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KpiCard } from '@/components/kpi-card';
import { SpendChart } from '@/components/charts/spend-chart';
import { Donut } from '@/components/charts/donut';
import { Sparkline } from '@/components/charts/sparkline';
import { Icon } from '@/components/icons';
import {
  TENANTS,
  TOTAL_SPEND,
  TOTAL_SAVINGS,
  AVG_COMPLIANCE,
  TOTAL_ALERTS,
  TOTAL_CRITICAL,
  TOTAL_SUBS,
  SPEND_TREND,
  DAILY_SPEND,
  RESOURCE_BREAKDOWN,
  fmtMoney,
  fmtMoneyK,
  fmtPct,
  fmtNum,
} from '@/lib/data/mock';

export default function OverviewPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('30d');

  const top10 = [...TENANTS].sort((a, b) => b.monthly - a.monthly).slice(0, 10);
  const criticalTenants = TENANTS.filter((t) => t.status === 'crit').slice(0, 6);
  const heatmap = TENANTS.slice(0, 60);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Multi-Tenant Overview</h1>
          <p className="page-sub">
            Consolidated view across {TENANTS.length} tenants · {TOTAL_SUBS} subscriptions
          </p>
        </div>
        <div className="page-actions">
          <select
            className="select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
          </select>
          <button className="btn">
            <Icon name="download" size={14} /> Export
          </button>
          <button className="btn btn-primary">
            <Icon name="plus" size={14} /> Add tenant
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Monthly Spend"
          value={fmtMoneyK(TOTAL_SPEND)}
          delta="+8.2%"
          deltaDir="up"
          sub="vs last month"
          spark={SPEND_TREND.slice(-12)}
        />
        <KpiCard
          label="Identified Savings"
          value={fmtMoneyK(TOTAL_SAVINGS)}
          delta={fmtPct((TOTAL_SAVINGS / TOTAL_SPEND) * 100)}
          deltaDir="up"
          sub="of monthly spend"
          spark={DAILY_SPEND.slice(-12).map((x) => x * 0.18)}
          sparkColor="var(--accent-3)"
        />
        <KpiCard
          label="Avg. Compliance"
          value={fmtPct(AVG_COMPLIANCE)}
          delta="+2.1pp"
          deltaDir="up"
          sub="across policies"
          spark={[78, 76, 77, 79, 80, 82, 81, 83, 84, 86, 85, AVG_COMPLIANCE]}
          sparkColor="var(--accent-2)"
        />
        <KpiCard
          label="Open Alerts"
          value={fmtNum(TOTAL_ALERTS)}
          delta={`${TOTAL_CRITICAL} critical`}
          deltaDir="down"
          spark={[12, 18, 15, 22, 17, 28, 19, 24, 21, 26, 23, TOTAL_ALERTS].map((x) => x * 5)}
          sparkColor="var(--danger)"
        />
      </div>

      <div className="split-2-1" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Spend Trend</div>
              <div className="card-sub">12-month view, all tenants</div>
            </div>
            <div className="row">
              <span className="pill accent">
                <span className="dot" />
                Actuals
              </span>
              <span className="pill">
                <span className="dot" style={{ background: 'var(--text-muted)' }} />
                Forecast
              </span>
            </div>
          </div>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <SpendChart data={SPEND_TREND} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Spend by Service</div>
            <button className="btn btn-sm btn-ghost">
              <Icon name="more-horizontal" size={14} />
            </button>
          </div>
          <div className="card-body">
            <div className="donut-wrap">
              <Donut size={140} thickness={18} segments={RESOURCE_BREAKDOWN} />
              <div className="legend">
                {RESOURCE_BREAKDOWN.map((s) => (
                  <div key={s.name} className="legend-item">
                    <span className="legend-swatch" style={{ background: s.color }} />
                    <span style={{ minWidth: 80 }}>{s.name}</span>
                    <span className="muted mono tabular">{fmtMoneyK(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="split-2-1" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Tenants by Spend</div>
              <div className="card-sub">Click any row to deep-dive</div>
            </div>
            <Link href="/tenants" className="btn btn-sm btn-ghost">
              View all <Icon name="arrow-right" size={12} />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Region</th>
                  <th>Plan</th>
                  <th style={{ textAlign: 'right' }}>Monthly</th>
                  <th style={{ textAlign: 'right' }}>Trend</th>
                  <th>Compliance</th>
                  <th>SLA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((t) => (
                  <tr
                    key={t.id}
                    className="clickable"
                    onClick={() => router.push('/tenants/' + t.id)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="tenant-pip" style={{ background: t.color }}>
                          {t.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{t.name}</div>
                          <div className="mono dim" style={{ fontSize: 11 }}>
                            {t.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{t.region}</td>
                    <td>
                      <span className="pill">{t.plan}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono tabular">
                      {fmtMoney(t.monthly)}
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono tabular">
                      <span
                        style={{ color: t.trend > 0 ? 'var(--danger)' : 'var(--ok)' }}
                      >
                        {t.trend > 0 ? '+' : ''}
                        {t.trend}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="bar" style={{ width: 80 }}>
                          <span
                            style={{
                              width: t.compliance + '%',
                              background:
                                t.compliance > 85
                                  ? 'var(--ok)'
                                  : t.compliance > 70
                                  ? 'var(--warn)'
                                  : 'var(--danger)',
                            }}
                          />
                        </div>
                        <span
                          className="mono tabular dim"
                          style={{ fontSize: 12, minWidth: 36 }}
                        >
                          {t.compliance}%
                        </span>
                      </div>
                    </td>
                    <td className="mono tabular">{t.sla}%</td>
                    <td>
                      <span
                        className={`pill ${
                          t.status === 'crit'
                            ? 'danger'
                            : t.status === 'warn'
                            ? 'warn'
                            : 'ok'
                        }`}
                      >
                        <span className="dot" />
                        {t.status === 'crit'
                          ? 'Critical'
                          : t.status === 'warn'
                          ? 'Warn'
                          : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Tenant Health Heatmap</div>
              <span className="muted" style={{ fontSize: 11 }}>
                {TENANTS.length} tenants
              </span>
            </div>
            <div className="card-body">
              <div className="tenant-grid">
                {heatmap.map((t) => (
                  <div
                    key={t.id}
                    className="tenant-cell"
                    title={`${t.name} · ${t.compliance}% · ${t.alerts} alerts`}
                    onClick={() => router.push('/tenants/' + t.id)}
                    style={{
                      background:
                        t.status === 'crit'
                          ? 'var(--danger)'
                          : t.status === 'warn'
                          ? 'var(--warn)'
                          : 'var(--ok)',
                      opacity: 0.35 + (t.compliance / 100) * 0.65,
                    }}
                  />
                ))}
              </div>
              <div
                className="row"
                style={{ justifyContent: 'space-between', marginTop: 14, fontSize: 11 }}
              >
                <span className="muted">Color = status</span>
                <div className="row" style={{ gap: 10 }}>
                  <span className="legend-item">
                    <span className="legend-swatch" style={{ background: 'var(--ok)' }} />
                    Healthy
                  </span>
                  <span className="legend-item">
                    <span className="legend-swatch" style={{ background: 'var(--warn)' }} />
                    Warn
                  </span>
                  <span className="legend-item">
                    <span
                      className="legend-swatch"
                      style={{ background: 'var(--danger)' }}
                    />
                    Crit
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Critical Attention</div>
              <Link href="/alerts" className="btn btn-sm btn-ghost">
                All alerts
              </Link>
            </div>
            <div style={{ padding: '4px 8px 12px' }}>
              {criticalTenants.map((t) => (
                <button
                  key={t.id}
                  className="nav-item"
                  onClick={() => router.push('/tenants/' + t.id)}
                  style={{ padding: '10px 12px' }}
                >
                  <div
                    className="tenant-pip"
                    style={{ background: t.color, width: 22, height: 22, fontSize: 10 }}
                  >
                    {t.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>
                      {t.name}
                    </div>
                    <div className="dim" style={{ fontSize: 11 }}>
                      {t.critical} critical · {t.alerts} alerts
                    </div>
                  </div>
                  <Icon name="chevron-right" size={14} className="dim" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

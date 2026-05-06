'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import {
  TENANTS,
  fmtMoney,
  fmtMoneyK,
} from '@/lib/data/mock';

type ViewMode = 'table' | 'grid';
type StatusFilter = 'all' | 'ok' | 'warn' | 'crit';

export default function TenantsPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [view, setView] = useState<ViewMode>('table');

  const filtered = TENANTS.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (
      q &&
      !t.name.toLowerCase().includes(q.toLowerCase()) &&
      !t.id.toLowerCase().includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-sub">
            {filtered.length} of {TENANTS.length} tenants · grouped by health
          </p>
        </div>
        <div className="page-actions">
          <button className="btn">
            <Icon name="download" size={14} />
            Export
          </button>
          <button className="btn btn-primary">
            <Icon name="plus" size={14} />
            Onboard tenant
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search" style={{ flex: 1, maxWidth: 360 }}>
          <Icon name="search" size={14} className="dim" />
          <input
            placeholder="Search by name or ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="ok">Healthy</option>
          <option value="warn">Warning</option>
          <option value="crit">Critical</option>
        </select>
        <select className="select">
          <option>All plans</option>
        </select>
        <select className="select">
          <option>All regions</option>
        </select>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 4,
            background: 'var(--bg-hover)',
            borderRadius: 6,
            padding: 2,
          }}
        >
          <button
            className={`btn-toggle ${view === 'table' ? 'active' : ''}`}
            onClick={() => setView('table')}
          >
            <Icon name="list" size={14} />
          </button>
          <button
            className={`btn-toggle ${view === 'grid' ? 'active' : ''}`}
            onClick={() => setView('grid')}
          >
            <Icon name="grid" size={14} />
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Region</th>
                  <th>Plan</th>
                  <th>Tier</th>
                  <th style={{ textAlign: 'right' }}>Monthly</th>
                  <th>Compliance</th>
                  <th>SLA</th>
                  <th>Alerts</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
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
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</div>
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
                    <td>
                      <span className="pill">{t.tier}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono tabular">
                      {fmtMoney(t.monthly)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="bar" style={{ width: 60 }}>
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
                        <span className="mono dim" style={{ fontSize: 12 }}>
                          {t.compliance}%
                        </span>
                      </div>
                    </td>
                    <td className="mono tabular dim" style={{ fontSize: 12 }}>
                      {t.sla}%
                    </td>
                    <td>
                      {t.alerts > 0 ? (
                        <span
                          className={`pill ${
                            t.critical > 0 ? 'danger' : t.alerts > 5 ? 'warn' : ''
                          }`}
                        >
                          <span className="dot" />
                          {t.alerts}
                          {t.critical > 0 && ` · ${t.critical} crit`}
                        </span>
                      ) : (
                        <span className="dim">—</span>
                      )}
                    </td>
                    <td>
                      <Icon name="chevron-right" size={14} className="dim" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
            gap: 12,
          }}
        >
          {filtered.map((t) => (
            <div
              key={t.id}
              className="card clickable"
              onClick={() => router.push('/tenants/' + t.id)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    className="tenant-pip"
                    style={{
                      background: t.color,
                      width: 40,
                      height: 40,
                      fontSize: 14,
                      borderRadius: 8,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t.name}
                    </div>
                    <div className="mono dim" style={{ fontSize: 11 }}>
                      {t.id} · {t.region}
                    </div>
                  </div>
                  <span
                    className={`pill ${
                      t.status === 'crit' ? 'danger' : t.status === 'warn' ? 'warn' : 'ok'
                    }`}
                  >
                    <span className="dot" />
                  </span>
                </div>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
                >
                  <div>
                    <div
                      className="muted"
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        marginBottom: 2,
                      }}
                    >
                      Monthly
                    </div>
                    <div
                      className="mono tabular"
                      style={{ fontWeight: 600, fontSize: 14 }}
                    >
                      {fmtMoneyK(t.monthly)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="muted"
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        marginBottom: 2,
                      }}
                    >
                      Compliance
                    </div>
                    <div
                      className="mono tabular"
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color:
                          t.compliance > 85
                            ? 'var(--ok)'
                            : t.compliance > 70
                            ? 'var(--warn)'
                            : 'var(--danger)',
                      }}
                    >
                      {t.compliance}%
                    </div>
                  </div>
                  <div>
                    <div
                      className="muted"
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        marginBottom: 2,
                      }}
                    >
                      SLA
                    </div>
                    <div
                      className="mono tabular"
                      style={{ fontWeight: 600, fontSize: 14 }}
                    >
                      {t.sla}%
                    </div>
                  </div>
                  <div>
                    <div
                      className="muted"
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        marginBottom: 2,
                      }}
                    >
                      Alerts
                    </div>
                    <div
                      className="mono tabular"
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color:
                          t.critical > 0
                            ? 'var(--danger)'
                            : t.alerts > 0
                            ? 'var(--warn)'
                            : 'var(--text)',
                      }}
                    >
                      {t.alerts}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

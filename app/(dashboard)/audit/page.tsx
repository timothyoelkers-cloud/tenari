'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { AUDIT } from '@/lib/data/mock';

const DOUBLED_AUDIT = [...AUDIT, ...AUDIT];

export default function AuditPage() {
  const [query, setQuery] = useState('');

  const filtered = DOUBLED_AUDIT.filter(a =>
    !query || a.action.toLowerCase().includes(query.toLowerCase())
      || a.actor.toLowerCase().includes(query.toLowerCase())
      || a.tenant.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-sub">Immutable record of every action across the platform</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="download" size={14} />Export</button>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="input"
          placeholder="Search…"
          style={{ minWidth: 240 }}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className="select"><option>All actors</option></select>
        <select className="select"><option>All tenants</option></select>
        <select className="select"><option>Last 7 days</option></select>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{filtered.length} events</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Tenant</th><th>IP</th></tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i}>
                  <td className="dim mono" style={{ fontSize: 12 }}>{a.when}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{a.actor}</td>
                  <td style={{ fontSize: 13 }}>{a.action}</td>
                  <td className="mono dim" style={{ fontSize: 12 }}>{a.target}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{a.tenant}</td>
                  <td className="mono dim" style={{ fontSize: 11 }}>
                    10.40.{(i * 7) % 256}.{(i * 13) % 256}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

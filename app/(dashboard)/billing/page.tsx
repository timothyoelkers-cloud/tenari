'use client';

import { KpiCard } from '@/components/kpi-card';
import { Icon } from '@/components/icons';
import { INVOICES, fmtMoney, fmtMoneyK } from '@/lib/data/mock';

export default function BillingPage() {
  const total = INVOICES.reduce((s, i) => s + i.amount, 0);
  const overdue = INVOICES.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const paid = INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Invoicing</h1>
          <p className="page-sub">Multi-tenant invoice generation · auto-rebilling · {INVOICES.length} active invoices</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="settings" size={14} />Margin rules</button>
          <button className="btn"><Icon name="download" size={14} />Statement</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} />Generate run</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="MRR (April)" value={fmtMoneyK(total)} delta="+12.4%" deltaDir="up" sub="vs March" spark={[400, 440, 480, 520, 560, 580, 620, total / 1000]} />
        <KpiCard label="Outstanding" value={fmtMoneyK(total - paid)} delta={`${INVOICES.filter(i => i.status === 'sent').length} invoices sent`} sub="" sparkColor="var(--info)" spark={[10, 15, 12, 18, 20, 16, 14, 12]} />
        <KpiCard label="Overdue" value={fmtMoneyK(overdue)} delta="1 invoice" deltaDir="down" sub="> 30 days" sparkColor="var(--danger)" spark={[0, 0, 2, 4, 6, 8, 8, 8]} />
        <KpiCard label="Avg Margin" value="22.4%" delta="+0.8pp" deltaDir="up" sub="across all tenants" sparkColor="var(--accent-3)" spark={[20, 21, 22, 21, 22, 23, 22, 22]} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Invoice Run Schedule</div>
          <div className="row" style={{ gap: 6 }}>
            <span className="pill ok"><span className="dot" />Auto-run</span>
            <span className="muted mono" style={{ fontSize: 11 }}>Next: 1 Jun 2026, 06:00 UTC</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {[1, 8, 15, 22, 29, 'Jun 1', 'Jun 8'].map((d, i) => (
              <div key={i} style={{
                padding: 10, borderRadius: 6,
                background: i === 5 ? 'rgba(59,130,246,.1)' : 'var(--bg-hover)',
                border: i === 5 ? '1px solid var(--accent)' : '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>May</div>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{d}</div>
                <div style={{ fontSize: 10, marginTop: 4, color: i === 5 ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {i === 5 ? 'Next run' : `${Math.max(0, 60 - i * 8)} sent`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Invoices</div>
          <div className="row" style={{ gap: 8 }}>
            <select className="select"><option>April 2026</option></select>
            <button className="btn btn-sm"><Icon name="filter" size={12} />Filter</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Tenant</th>
                <th>Period</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map(inv => (
                <tr key={inv.id}>
                  <td className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{inv.id}</td>
                  <td>{inv.tenant}</td>
                  <td className="muted">{inv.period}</td>
                  <td className="mono tabular" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtMoney(inv.amount)}</td>
                  <td className="dim" style={{ fontSize: 12 }}>{inv.issued}</td>
                  <td className="dim" style={{ fontSize: 12 }}>{inv.due}</td>
                  <td>
                    <span className={`pill ${inv.status === 'paid' ? 'ok' : inv.status === 'overdue' ? 'danger' : inv.status === 'sent' ? 'info' : ''}`}>
                      <span className="dot" />{inv.status[0].toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn-sm btn-ghost" title="View"><Icon name="eye" size={12} /></button>
                      <button className="btn btn-sm btn-ghost" title="Download"><Icon name="download" size={12} /></button>
                    </div>
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

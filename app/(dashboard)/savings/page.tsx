'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { KpiCard } from '@/components/kpi-card';
import { SAVINGS, TOTAL_SPEND, fmtMoney, fmtMoneyK } from '@/lib/data/mock';
import { useToast } from '@/components/providers';
import type { SavingsOpportunity } from '@/lib/data/types';

// ── Apply Modal ────────────────────────────────────────────────────────────

interface ApplyModalProps {
  saving: SavingsOpportunity;
  onClose: () => void;
  onConfirm: () => void;
}

function ApplyModal({ saving, onClose, onConfirm }: ApplyModalProps) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Apply Recommendation</h2>
            <div className="muted mono" style={{ fontSize: 11 }}>{saving.id} · {saving.tenant}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Change</div>
            <div className="row" style={{ gap: 10, fontSize: 13 }}>
              <span className="mono dim" style={{ textDecoration: 'line-through' }}>{saving.from}</span>
              <Icon name="arrow-right" size={14} className="dim" />
              <span className="mono" style={{ fontWeight: 600 }}>{saving.to}</span>
              <span className="pill ok" style={{ marginLeft: 'auto' }}>−{fmtMoney(saving.monthly)}/mo</span>
            </div>
          </div>

          <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Risk Assessment</div>
          <div className="col" style={{ gap: 8, marginBottom: 16 }}>
            <div className={`risk-step ${saving.risk === 'low' ? 'ok' : saving.risk === 'med' ? 'warn' : 'danger'}`}>
              <div
                className="icon-circle"
                style={{
                  background: saving.risk === 'low' ? 'rgba(52,211,153,.2)' : saving.risk === 'med' ? 'rgba(251,191,36,.2)' : 'rgba(248,113,113,.2)',
                  color: saving.risk === 'low' ? 'var(--ok)' : saving.risk === 'med' ? 'var(--warn)' : 'var(--danger)',
                }}
              >
                <Icon name={saving.risk === 'low' ? 'check' : 'alert-triangle'} size={14} />
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <strong>
                  {saving.risk === 'low' ? 'Low risk · auto-applicable' : saving.risk === 'med' ? 'Medium risk · review carefully' : 'High risk · downtime possible'}
                </strong>
                <div className="muted" style={{ marginTop: 2 }}>{saving.rationale}. Confidence: {saving.confidence}%.</div>
              </div>
            </div>
            {saving.risk !== 'low' && (
              <div className="risk-step warn">
                <div className="icon-circle" style={{ background: 'rgba(251,191,36,.2)', color: 'var(--warn)' }}>
                  <Icon name="info" size={14} />
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <strong>Brief service interruption (~30s)</strong> while resource is reconfigured. We&apos;ll create a snapshot rollback point first.
                </div>
              </div>
            )}
            <div className="risk-step">
              <div className="icon-circle" style={{ background: 'var(--bg-hover)' }}>
                <Icon name="clock" size={14} />
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <strong>Reversible</strong> for 7 days · automatic rollback if SLA degrades by &gt; 0.1%.
              </div>
            </div>
          </div>

          <label className="row" style={{ gap: 8, fontSize: 12, marginBottom: 6 }}>
            <input type="checkbox" defaultChecked />
            <span>Notify <strong>{saving.tenant}</strong> via email when applied</span>
          </label>
          <label className="row" style={{ gap: 8, fontSize: 12 }}>
            <input type="checkbox" />
            <span>Schedule for change window (Sat 02:00 UTC)</span>
          </label>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <Icon name="play" size={12} />Apply now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Savings Page ───────────────────────────────────────────────────────────

export default function SavingsPage() {
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'med' | 'high'>('all');
  const [applying, setApplying] = useState<SavingsOpportunity | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const toast = useToast();

  const filtered = SAVINGS.filter((s) => riskFilter === 'all' || s.risk === riskFilter);
  const total = filtered.reduce((sum, s) => sum + s.monthly, 0);
  const annualized = total * 12;
  const lowRiskSavings = SAVINGS.filter((s) => s.risk === 'low');
  const lowRiskTotal = lowRiskSavings.reduce((a, b) => a + b.monthly, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cost &amp; Savings</h1>
          <p className="page-sub">
            {SAVINGS.length} active opportunities · estimated annualized savings {fmtMoneyK(annualized)}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="download" size={14} />Export</button>
          <button className="btn btn-primary">
            <Icon name="play" size={14} />Apply all low-risk ({lowRiskSavings.length})
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Monthly Savings"
          value={fmtMoneyK(total)}
          delta={`${((total / TOTAL_SPEND) * 100).toFixed(1)}%`}
          deltaDir="up"
          sub="of monthly spend"
          sparkColor="var(--accent-3)"
          spark={[10, 12, 15, 18, 22, 24, 28, 30]}
        />
        <KpiCard
          label="Annualized"
          value={fmtMoneyK(annualized)}
          delta="+$240k"
          deltaDir="up"
          sub="vs Q1 plan"
          sparkColor="var(--ok)"
          spark={[20, 28, 32, 40, 48, 56, 60, 68]}
        />
        <KpiCard
          label="Low-risk Auto-applicable"
          value={fmtMoneyK(lowRiskTotal)}
          delta={`${lowRiskSavings.length} items`}
          sub=""
          sparkColor="var(--ok)"
          spark={[5, 8, 10, 12, 14, 16, 18, 20]}
        />
        <KpiCard
          label="Applied This Month"
          value="$8,420"
          delta="14 actions"
          deltaDir="up"
          sub=""
          sparkColor="var(--accent)"
          spark={[2, 4, 6, 8, 10, 12, 14, 14]}
        />
      </div>

      <div className="filter-bar">
        <select
          className="select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as 'all' | 'low' | 'med' | 'high')}
        >
          <option value="all">All risk levels</option>
          <option value="low">Low risk</option>
          <option value="med">Medium risk</option>
          <option value="high">High risk</option>
        </select>
        <select className="select"><option>All types</option></select>
        <select className="select"><option>All tenants</option></select>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{filtered.length} opportunities</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant / Resource</th>
                <th>Recommendation</th>
                <th>Change</th>
                <th>Risk</th>
                <th>Confidence</th>
                <th style={{ textAlign: 'right' }}>Monthly</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isApplied = applied.has(s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{s.tenant}</div>
                      <div className="mono dim" style={{ fontSize: 11 }}>{s.resource}</div>
                    </td>
                    <td><span className="pill accent">{s.type}</span></td>
                    <td>
                      <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono dim" style={{ textDecoration: 'line-through' }}>{s.from}</span>
                        <Icon name="arrow-right" size={12} className="dim" />
                        <span className="mono">{s.to}</span>
                      </div>
                      <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>{s.rationale}</div>
                    </td>
                    <td>
                      <span className={`pill ${s.risk === 'low' ? 'ok' : s.risk === 'med' ? 'warn' : 'danger'}`}>
                        <span className="dot" />{s.risk}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="bar" style={{ width: 50 }}>
                          <span style={{ width: s.confidence + '%', background: s.confidence > 85 ? 'var(--ok)' : 'var(--warn)' }} />
                        </div>
                        <span className="mono tabular dim" style={{ fontSize: 11 }}>{s.confidence}%</span>
                      </div>
                    </td>
                    <td className="mono tabular" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {fmtMoney(s.monthly)}
                    </td>
                    <td>
                      {isApplied ? (
                        <span className="pill ok"><Icon name="check" size={10} />Applied</span>
                      ) : (
                        <div className="row" style={{ gap: 4 }}>
                          <button className="btn btn-sm" onClick={() => setApplying(s)}>Review</button>
                          {s.risk === 'low' && (
                            <button
                              className="btn btn-sm btn-primary"
                              title="Apply immediately"
                              onClick={() => {
                                setApplied((p) => new Set(Array.from(p).concat(s.id)));
                                toast.push(`Applied ${s.id} — saving ${fmtMoney(s.monthly)}/mo`);
                              }}
                            >
                              <Icon name="play" size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {applying && (
        <ApplyModal
          saving={applying}
          onClose={() => setApplying(null)}
          onConfirm={() => {
            setApplied((p) => new Set(Array.from(p).concat(applying.id)));
            toast.push(`Applied ${applying.id}`);
            setApplying(null);
          }}
        />
      )}
    </div>
  );
}

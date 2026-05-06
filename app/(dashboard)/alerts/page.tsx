'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { ALERTS } from '@/lib/data/mock';
import type { Alert, AlertSeverity, AlertStatus } from '@/lib/data/types';

// ── Types ──────────────────────────────────────────────────────────────────

interface TimelineEvent {
  when: string;
  actor: string;
  text: string;
  icon: string;
  color: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sevLabel(sev: AlertSeverity): string {
  return sev === 'crit' ? 'Critical' : sev === 'high' ? 'High' : sev === 'med' ? 'Medium' : 'Low';
}

// ── Alert Drawer ───────────────────────────────────────────────────────────

interface AlertDrawerProps {
  alert: Alert;
  onClose: () => void;
}

function AlertDrawer({ alert, onClose }: AlertDrawerProps) {
  const label = sevLabel(alert.sev);
  const related = ALERTS.filter(
    (a) => a.id !== alert.id && (a.tenant === alert.tenant || a.rule === alert.rule),
  ).slice(0, 4);

  const timeline: TimelineEvent[] = [
    { when: alert.when, actor: 'Defender for Cloud', text: 'Alert raised', icon: 'alert-triangle', color: 'var(--danger)' },
    { when: '7m ago', actor: 'system', text: 'Notification dispatched (PagerDuty + Slack)', icon: 'bell', color: 'var(--info)' },
    { when: '6m ago', actor: 'system', text: 'Auto-snapshot of resource state captured', icon: 'database', color: 'var(--text-muted)' },
    ...(alert.owner
      ? [{ when: '4m ago', actor: alert.owner, text: 'Acknowledged · investigating', icon: 'check', color: 'var(--ok)' }]
      : []),
    ...(alert.status === 'ack' && alert.owner
      ? [{ when: '2m ago', actor: alert.owner, text: 'Comment: "Reviewing logs in workspace eus-prod-law"', icon: 'edit', color: 'var(--text-muted)' }]
      : []),
  ];

  const impactText: Record<AlertSeverity, string> = {
    crit: 'Production data exposure risk · regulatory implications (SOC 2, ISO 27001)',
    high: 'Production attack surface · could lead to data exposure if exploited',
    med: 'Configuration drift · may reduce defense-in-depth posture',
    low: 'Hygiene · operational best practice not yet met',
  };

  const remediationSteps = [
    'Validate impact in non-production first (snapshot taken at 03:14 UTC).',
    'Run remediation playbook: Apply baseline policy template POL-008 to affected scope.',
    'Verify TLS/auth telemetry in Log Analytics workspace eus-prod-law.',
    'Mark alert as resolved with verification evidence attached.',
  ];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
            <span className={`sev ${alert.sev}`} style={{ flex: 'none' }}>{label}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{alert.rule}</div>
              <div className="mono dim" style={{ fontSize: 11, marginTop: 2 }}>
                {alert.id} · raised {alert.when}
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <div className="drawer-body">
          {/* Actions + meta */}
          <div className="drawer-section">
            <div className="row" style={{ gap: 8, marginBottom: 14 }}>
              {alert.status === 'open' && (
                <button className="btn btn-primary"><Icon name="check" size={12} />Acknowledge</button>
              )}
              {alert.status === 'open' && (
                <button className="btn"><Icon name="users" size={12} />Assign</button>
              )}
              <button className="btn"><Icon name="clock" size={12} />Snooze</button>
              <button className="btn"><Icon name="external-link" size={12} />Open in Defender</button>
              <button className="btn btn-ghost" style={{ marginLeft: 'auto' }}>
                <Icon name="x" size={12} />Resolve
              </button>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14,
              padding: 14, background: 'var(--bg-hover)', borderRadius: 8, fontSize: 12,
            }}>
              <div>
                <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Tenant</div>
                <div style={{ fontWeight: 500 }}>{alert.tenant}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Resource</div>
                <div className="mono">{alert.resource}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Owner</div>
                <div className="mono">{alert.owner || 'Unassigned'}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Status</div>
                <div>
                  <span className={`pill ${alert.status === 'open' ? 'danger' : 'info'}`}>
                    <span className="dot" />{alert.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact */}
          <div className="drawer-section">
            <div className="drawer-section-title">Impact</div>
            <div style={{
              padding: '12px 14px', background: 'rgba(248,113,113,.08)',
              borderLeft: '3px solid var(--danger)', borderRadius: 4, fontSize: 13, lineHeight: 1.5,
            }}>
              {impactText[alert.sev]}
            </div>
          </div>

          {/* Remediation */}
          <div className="drawer-section">
            <div className="drawer-section-title">Recommended Remediation</div>
            <ol style={{ margin: 0, padding: '0 0 0 4px', fontSize: 13, lineHeight: 1.7, listStyle: 'none', counterReset: 'step' }}>
              {remediationSteps.map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    flex: 'none', width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="row" style={{ gap: 6, marginTop: 10 }}>
              <button className="btn btn-sm btn-primary"><Icon name="play" size={12} />Run playbook</button>
              <button className="btn btn-sm"><Icon name="sparkles" size={12} />Generate Bicep fix</button>
              <button className="btn btn-sm"><Icon name="file-text" size={12} />View full runbook</button>
            </div>
          </div>

          {/* Timeline */}
          <div className="drawer-section">
            <div className="drawer-section-title">Timeline</div>
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              <div style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: 'var(--border)' }} />
              {timeline.map((e, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: 14, marginLeft: 0 }}>
                  <div style={{
                    position: 'absolute', left: -23, top: 2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--bg-hover)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: e.color,
                  }}>
                    <Icon name={e.icon} size={10} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{e.text}</div>
                  <div className="dim" style={{ fontSize: 11, marginTop: 1 }}>
                    <span className="mono">{e.actor}</span> · {e.when}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Alerts */}
          <div className="drawer-section">
            <div className="drawer-section-title">Related Alerts</div>
            {related.length === 0 ? (
              <div className="dim" style={{ fontSize: 12 }}>No related alerts in last 7 days.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {related.map((r) => (
                  <div key={r.id} className="related-alert">
                    <span className={`sev ${r.sev}`} style={{ flex: 'none', minWidth: 60 }}>
                      {sevLabel(r.sev)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>{r.rule}</div>
                      <div className="mono dim" style={{ fontSize: 11 }}>{r.id} · {r.tenant}</div>
                    </div>
                    <span className="dim" style={{ fontSize: 11 }}>{r.when}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="drawer-section">
            <div className="drawer-section-title">Activity &amp; Comments</div>
            <textarea
              className="input"
              placeholder="Add a comment, mention @user…"
              rows={2}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            />
            <div className="row" style={{ justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
              <button className="btn btn-sm btn-ghost">Attach</button>
              <button className="btn btn-sm btn-primary">Comment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Alerts Page ────────────────────────────────────────────────────────────

type SevFilter = 'all' | AlertSeverity;
type StatusFilter = 'all' | AlertStatus;

export default function AlertsPage() {
  const [sev, setSev] = useState<SevFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Alert | null>(null);

  const filtered = ALERTS.filter(
    (a) => (sev === 'all' || a.sev === sev) && (status === 'all' || a.status === status),
  );

  const counts = {
    crit: ALERTS.filter((a) => a.sev === 'crit' && a.status === 'open').length,
    high: ALERTS.filter((a) => a.sev === 'high' && a.status === 'open').length,
    med: ALERTS.filter((a) => a.sev === 'med' && a.status === 'open').length,
    low: ALERTS.filter((a) => a.sev === 'low' && a.status === 'open').length,
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts &amp; Incidents</h1>
          <p className="page-sub">Defender for Cloud, Policy, and Service Health · across all tenants</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="settings" size={14} />Routing rules</button>
          <button className="btn"><Icon name="bell" size={14} />Notification channels</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label"><span className="sev crit"></span>Critical</div>
          <div className="kpi-value tabular" style={{ color: 'var(--danger)' }}>{counts.crit}</div>
          <div className="kpi-delta muted">2 unacknowledged</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><span className="sev high"></span>High</div>
          <div className="kpi-value tabular" style={{ color: '#fb923c' }}>{counts.high}</div>
          <div className="kpi-delta muted">avg time to ack: 14m</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><span className="sev med"></span>Medium</div>
          <div className="kpi-value tabular" style={{ color: 'var(--warn)' }}>{counts.med}</div>
          <div className="kpi-delta muted">3 trending up</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><span className="sev low"></span>Low / Info</div>
          <div className="kpi-value tabular" style={{ color: 'var(--info)' }}>{counts.low}</div>
          <div className="kpi-delta muted">batched daily</div>
        </div>
      </div>

      <div className="filter-bar">
        <select className="select" value={sev} onChange={(e) => setSev(e.target.value as SevFilter)}>
          <option value="all">All severities</option>
          <option value="crit">Critical</option>
          <option value="high">High</option>
          <option value="med">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="ack">Acknowledged</option>
          <option value="snoozed">Snoozed</option>
        </select>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
          {filtered.length} alerts · click row to inspect
        </span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sev</th>
                <th>Alert</th>
                <th>Tenant</th>
                <th>Resource</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Triggered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="clickable" onClick={() => setSelected(a)}>
                  <td>
                    <span className={`sev ${a.sev}`}>
                      {sevLabel(a.sev)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{a.rule}</div>
                    <div className="mono dim" style={{ fontSize: 11 }}>{a.id}</div>
                  </td>
                  <td>{a.tenant}</td>
                  <td className="mono dim" style={{ fontSize: 12 }}>{a.resource}</td>
                  <td>
                    <span className={`pill ${a.status === 'open' ? 'danger' : a.status === 'ack' ? 'info' : 'warn'}`}>
                      <span className="dot" />
                      {a.status === 'open' ? 'Open' : a.status === 'ack' ? 'Acknowledged' : 'Snoozed'}
                    </span>
                  </td>
                  <td>
                    {a.owner
                      ? <span className="mono" style={{ fontSize: 12 }}>{a.owner}</span>
                      : <span className="dim" style={{ fontSize: 11 }}>—</span>}
                  </td>
                  <td className="dim" style={{ fontSize: 12 }}>{a.when}</td>
                  <td>
                    <div className="row" style={{ gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      {a.status === 'open' && <button className="btn btn-sm">Ack</button>}
                      <button className="btn btn-sm btn-ghost" onClick={() => setSelected(a)}>
                        <Icon name="eye" size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <AlertDrawer alert={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

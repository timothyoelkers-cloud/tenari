'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={onToggle}>
      <div className="toggle-knob" />
    </button>
  );
}

const SECTIONS = [
  'Workspace', 'Identity & SSO', 'Integrations', 'Branding',
  'Billing & Plan', 'API & Webhooks', 'Notifications', 'Data & Retention',
];

export default function SettingsPage() {
  const [active, setActive] = useState('Workspace');
  const [sso, setSso] = useState(true);
  const [mfa, setMfa] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [teamsAlerts, setTeamsAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Workspace, integrations, identity providers</p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {SECTIONS.map(s => (
            <button
              key={s}
              className={`nav-item ${active === s ? 'active' : ''}`}
              onClick={() => setActive(s)}
            >
              <Icon name={
                s === 'Workspace' ? 'layers' :
                s === 'Identity & SSO' ? 'shield-check' :
                s === 'Integrations' ? 'webhook' :
                s === 'Branding' ? 'palette' :
                s === 'Billing & Plan' ? 'receipt' :
                s === 'API & Webhooks' ? 'code' :
                s === 'Notifications' ? 'bell' : 'database'
              } size={15} />
              {s}
            </button>
          ))}
        </div>

        <div className="settings-main">
          {active === 'Workspace' && (
            <div className="card">
              <div className="card-header"><div className="card-title">Workspace</div></div>
              <div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Workspace name</div>
                    <div className="muted" style={{ fontSize: 12 }}>Shown to your users and customers</div>
                  </div>
                  <input className="input" defaultValue="Tenari MSP" style={{ width: 240 }} />
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Primary domain</div>
                    <div className="muted" style={{ fontSize: 12 }}>Used for white-label portal URLs</div>
                  </div>
                  <input className="input" defaultValue="tenari.io" style={{ width: 240 }} />
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Support email</div>
                    <div className="muted" style={{ fontSize: 12 }}>Shown to customers for support requests</div>
                  </div>
                  <input className="input" defaultValue="support@tenari.io" style={{ width: 240 }} />
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Default timezone</div>
                  </div>
                  <select className="select" style={{ width: 240 }}>
                    <option>UTC</option>
                    <option>Europe/London</option>
                    <option>America/New_York</option>
                  </select>
                </div>
                <div className="setting-row" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary">Save changes</button>
                </div>
              </div>
            </div>
          )}

          {active === 'Identity & SSO' && (
            <div className="card">
              <div className="card-header"><div className="card-title">Identity & Single Sign-On</div></div>
              <div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Microsoft Entra ID (multi-tenant)</div>
                    <div className="muted" style={{ fontSize: 12 }}>Required for Azure tenant onboarding and SSO</div>
                  </div>
                  <span className="pill ok"><Icon name="check" size={10} />Connected</span>
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Require SSO for all users</div>
                    <div className="muted" style={{ fontSize: 12 }}>Disable password-based login</div>
                  </div>
                  <Toggle on={sso} onToggle={() => setSso(s => !s)} />
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Enforce MFA</div>
                    <div className="muted" style={{ fontSize: 12 }}>Require authenticator app for all logins</div>
                  </div>
                  <Toggle on={mfa} onToggle={() => setMfa(m => !m)} />
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Entra App Client ID</div>
                  </div>
                  <input className="input" defaultValue="••••••••-••••-••••" style={{ width: 240 }} />
                </div>
              </div>
            </div>
          )}

          {active === 'Integrations' && (
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><div className="card-title">Connected integrations</div></div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                  {[
                    { name: 'PagerDuty', desc: 'On-call alerting', icon: 'bell', connected: true },
                    { name: 'Slack', desc: 'Team notifications', icon: 'send', connected: true },
                    { name: 'Microsoft Teams', desc: 'Channel alerts', icon: 'globe', connected: false },
                    { name: 'Jira', desc: 'Ticket creation from alerts', icon: 'tag', connected: false },
                    { name: 'Grafana', desc: 'Metrics dashboards', icon: 'bar-chart', connected: false },
                    { name: 'Splunk', desc: 'SIEM forwarding', icon: 'activity', connected: false },
                  ].map(intg => (
                    <div key={intg.name} className="integration-card">
                      <div className="row" style={{ marginBottom: 10 }}>
                        <div className="integration-icon"><Icon name={intg.icon} size={18} /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{intg.name}</div>
                          <div className="muted" style={{ fontSize: 11 }}>{intg.desc}</div>
                        </div>
                        <span className={`pill ${intg.connected ? 'ok' : ''}`}>
                          {intg.connected ? 'Connected' : 'Available'}
                        </span>
                      </div>
                      <button className={`btn btn-sm ${intg.connected ? '' : 'btn-primary'}`} style={{ width: '100%' }}>
                        {intg.connected ? 'Configure' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === 'Branding' && (
            <div className="card">
              <div className="card-header"><div className="card-title">White-label Branding</div></div>
              <div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Logo</div>
                    <div className="muted" style={{ fontSize: 12 }}>SVG or PNG, shown in customer portal</div>
                  </div>
                  <button className="btn"><Icon name="upload" size={14} />Upload</button>
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Primary colour</div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#3b82f6', border: '2px solid var(--border)' }} />
                    <input className="input mono" defaultValue="#3b82f6" style={{ width: 120 }} />
                  </div>
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Portal subdomain</div>
                    <div className="muted" style={{ fontSize: 12 }}>Customers access their portal at this URL</div>
                  </div>
                  <div className="row" style={{ gap: 0 }}>
                    <input className="input" defaultValue="portal" style={{ width: 120, borderRadius: '6px 0 0 6px' }} />
                    <div className="input" style={{ borderLeft: 0, borderRadius: '0 6px 6px 0', color: 'var(--text-muted)' }}>.tenari.io</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'Billing & Plan' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Billing & Plan</div>
                <span className="pill accent">Enterprise</span>
              </div>
              <div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Managed tenants', value: '60', limit: 'Unlimited' },
                      { label: 'Users', value: '8', limit: 'Unlimited' },
                      { label: 'API calls this month', value: '48,200', limit: '500,000' },
                    ].map(m => (
                      <div key={m.label} className="report-stat">
                        <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontWeight: 600, fontSize: 20, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
                        <div className="muted" style={{ fontSize: 11 }}>of {m.limit}</div>
                      </div>
                    ))}
                  </div>
                  <div className="between" style={{ padding: '14px 0', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Enterprise Plan · $4,200 / month</div>
                      <div className="muted" style={{ fontSize: 12 }}>Renews 1 Jun 2026 · Annual billing</div>
                    </div>
                    <button className="btn">Manage subscription</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'API & Webhooks' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">API Keys</div>
                <button className="btn btn-sm btn-primary"><Icon name="plus" size={12} />New key</button>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Name</th><th>Key</th><th>Created</th><th>Last used</th><th></th></tr></thead>
                  <tbody>
                    {[
                      { name: 'Production', key: 'ten_live_••••••••9f2a', created: '2026-01-12', last: '2m ago' },
                      { name: 'CI Pipeline', key: 'ten_live_••••••••3b4c', created: '2026-02-28', last: '1h ago' },
                      { name: 'Dev / Test', key: 'ten_test_••••••••7d8e', created: '2026-03-10', last: '4d ago' },
                    ].map(k => (
                      <tr key={k.name}>
                        <td style={{ fontWeight: 500 }}>{k.name}</td>
                        <td className="mono" style={{ fontSize: 12 }}>{k.key}</td>
                        <td className="dim" style={{ fontSize: 12 }}>{k.created}</td>
                        <td className="muted" style={{ fontSize: 12 }}>{k.last}</td>
                        <td>
                          <div className="row" style={{ gap: 4 }}>
                            <button className="btn btn-sm btn-ghost"><Icon name="copy" size={12} /></button>
                            <button className="btn btn-sm btn-ghost"><Icon name="trash" size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'Notifications' && (
            <div className="card">
              <div className="card-header"><div className="card-title">Notification Preferences</div></div>
              <div>
                {[
                  { label: 'Email alerts', desc: 'Critical and high severity alerts via email', val: emailAlerts, set: setEmailAlerts },
                  { label: 'Slack notifications', desc: 'All alert severities posted to #alerts', val: slackAlerts, set: setSlackAlerts },
                  { label: 'Microsoft Teams', desc: 'Alert digest in Teams channel', val: teamsAlerts, set: setTeamsAlerts },
                  { label: 'Weekly executive report', desc: 'Auto-generated PDF every Monday 08:00 UTC', val: weeklyReport, set: setWeeklyReport },
                ].map(n => (
                  <div key={n.label} className="setting-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{n.label}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{n.desc}</div>
                    </div>
                    <Toggle on={n.val} onToggle={() => n.set((v: boolean) => !v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'Data & Retention' && (
            <div className="card">
              <div className="card-header"><div className="card-title">Data & Retention</div></div>
              <div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Audit log retention</div>
                    <div className="muted" style={{ fontSize: 12 }}>Minimum 90 days required for SOC 2</div>
                  </div>
                  <select className="select" style={{ width: 180 }}>
                    <option>2 years (default)</option>
                    <option>1 year</option>
                    <option>90 days (minimum)</option>
                  </select>
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Cost data granularity</div>
                    <div className="muted" style={{ fontSize: 12 }}>How long to keep daily granularity before aggregating</div>
                  </div>
                  <select className="select" style={{ width: 180 }}>
                    <option>12 months</option>
                    <option>6 months</option>
                    <option>3 months</option>
                  </select>
                </div>
                <div className="setting-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--danger)' }}>Delete workspace</div>
                    <div className="muted" style={{ fontSize: 12 }}>Permanently removes all data. Irreversible.</div>
                  </div>
                  <button className="btn btn-danger">Delete workspace</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

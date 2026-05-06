'use client';

import { Icon } from '@/components/icons';
import { USERS, ROLES, AUDIT } from '@/lib/data/mock';

export default function RbacPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & RBAC</h1>
          <p className="page-sub">{USERS.length} users · {ROLES.length} role types · scoped per-tenant access</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="shield-check" size={14} />Audit access</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} />Invite user</button>
        </div>
      </div>

      <div className="split-2-1">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Users</div>
            <span className="muted mono">{USERS.length}</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Tenants</th><th>MFA</th><th>Last active</th><th></th></tr>
              </thead>
              <tbody>
                {USERS.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: u.role.startsWith('Customer') ? 'linear-gradient(135deg,#a78bfa,#f472b6)' : undefined }}>
                          {u.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                          <div className="dim mono" style={{ fontSize: 11 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`pill ${u.role === 'Owner' ? 'accent' : ''}`}>{u.role}</span></td>
                    <td className="mono tabular">{u.tenants}</td>
                    <td>
                      {u.mfa
                        ? <span className="pill ok"><Icon name="check" size={10} />On</span>
                        : <span className="pill danger"><Icon name="x" size={10} />Off</span>
                      }
                    </td>
                    <td className="dim" style={{ fontSize: 12 }}>{u.last}</td>
                    <td><button className="btn btn-sm btn-ghost"><Icon name="more-horizontal" size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Roles</div></div>
          <div style={{ padding: '4px 0' }}>
            {ROLES.map(r => (
              <div key={r.name} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div className="between">
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                  <span className="mono dim" style={{ fontSize: 11 }}>{r.users} {r.users === 1 ? 'user' : 'users'}</span>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{r.scope} · {r.perms}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Recent Audit Log</div>
          <button className="btn btn-sm btn-ghost"><Icon name="external-link" size={12} />Full log</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Tenant</th></tr></thead>
            <tbody>
              {AUDIT.map((a, i) => (
                <tr key={i}>
                  <td className="dim mono" style={{ fontSize: 12 }}>{a.when}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{a.actor}</td>
                  <td style={{ fontSize: 13 }}>{a.action}</td>
                  <td className="mono dim" style={{ fontSize: 12 }}>{a.target}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{a.tenant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

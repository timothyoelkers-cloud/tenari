(function(){
/* Cost & Savings + Alerts + Billing + RBAC + Reports */

// ============= SAVINGS =============
const SavingsPage = () => {
  const { SAVINGS, fmtMoney, fmtMoneyK } = window.AegisData;
  const [riskFilter, setRiskFilter] = useState('all');
  const [applying, setApplying] = useState(null);
  const [applied, setApplied] = useState(new Set());
  const filtered = SAVINGS.filter(s => riskFilter === 'all' || s.risk === riskFilter);
  const total = filtered.reduce((sum, s) => sum + s.monthly, 0);
  const annualized = total * 12;
  const toast = useToast();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cost & Savings</h1>
          <p className="page-sub">{SAVINGS.length} active opportunities · estimated annualized savings {fmtMoneyK(annualized)}</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="download" size={14} />Export</button>
          <button className="btn btn-primary"><Icon name="play" size={14} />Apply all low-risk ({SAVINGS.filter(s=>s.risk==='low').length})</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="Monthly Savings" value={fmtMoneyK(total)} delta={`${(total/window.AegisData.TOTAL_SPEND*100).toFixed(1)}%`} deltaDir="up" sub="of monthly spend" sparkColor="var(--accent-3)" spark={[10,12,15,18,22,24,28,30]} />
          <KPI label="Annualized" value={fmtMoneyK(annualized)} delta="+$240k" deltaDir="up" sub="vs Q1 plan" sparkColor="var(--ok)" spark={[20,28,32,40,48,56,60,68]} />
          <KPI label="Low-risk Auto-applicable" value={fmtMoneyK(SAVINGS.filter(s=>s.risk==='low').reduce((a,b)=>a+b.monthly,0))} delta={`${SAVINGS.filter(s=>s.risk==='low').length} items`} sub="" sparkColor="var(--ok)" spark={[5,8,10,12,14,16,18,20]} />
          <KPI label="Applied This Month" value="$8,420" delta="14 actions" deltaDir="up" sub="" sparkColor="var(--accent)" spark={[2,4,6,8,10,12,14,14]} />
      </div>

      <div className="filter-bar">
        <select className="select" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="all">All risk levels</option>
          <option value="low">Low risk</option>
          <option value="med">Medium risk</option>
          <option value="high">High risk</option>
        </select>
        <select className="select"><option>All types</option></select>
        <select className="select"><option>All tenants</option></select>
        <span className="muted" style={{marginLeft:'auto',fontSize:12}}>{filtered.length} opportunities</span>
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
                <th style={{textAlign:'right'}}>Monthly</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const isApplied = applied.has(s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{fontWeight:500,fontSize:13}}>{s.tenant}</div>
                      <div className="mono dim" style={{fontSize:11}}>{s.resource}</div>
                    </td>
                    <td><span className="pill accent">{s.type}</span></td>
                    <td>
                      <div style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}>
                        <span className="mono dim" style={{textDecoration:'line-through'}}>{s.from}</span>
                        <Icon name="arrow-right" size={12} className="dim" />
                        <span className="mono">{s.to}</span>
                      </div>
                      <div className="dim" style={{fontSize:11,marginTop:2}}>{s.rationale}</div>
                    </td>
                    <td>
                      <span className={`pill ${s.risk==='low'?'ok':s.risk==='med'?'warn':'danger'}`}><span className="dot" />{s.risk}</span>
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div className="bar" style={{width:50}}><span style={{width: s.confidence + '%', background: s.confidence > 85 ? 'var(--ok)' : 'var(--warn)'}} /></div>
                        <span className="mono tabular dim" style={{fontSize:11}}>{s.confidence}%</span>
                      </div>
                    </td>
                    <td style={{textAlign:'right'}} className="mono tabular" style={{textAlign:'right',fontWeight:600}}>{fmtMoney(s.monthly)}</td>
                    <td>
                      {isApplied ? (
                        <span className="pill ok"><Icon name="check" size={10} />Applied</span>
                      ) : (
                        <div className="row" style={{gap:4}}>
                          <button className="btn btn-sm" onClick={() => setApplying(s)}>Review</button>
                          {s.risk === 'low' && (
                            <button className="btn btn-sm btn-primary"
                              onClick={() => { setApplied(p => new Set([...p, s.id])); toast.push(`Applied ${s.id} — saving ${fmtMoney(s.monthly)}/mo`); }}
                              title="Apply immediately"><Icon name="play" size={10} /></button>
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

      {applying && <ApplyModal saving={applying} onClose={() => setApplying(null)}
        onConfirm={() => { setApplied(p => new Set([...p, applying.id])); toast.push(`Applied ${applying.id}`); setApplying(null); }} />}
    </div>
  );
};

const ApplyModal = ({ saving, onClose, onConfirm }) => {
  const [step, setStep] = useState(0);
  const { fmtMoney } = window.AegisData;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 620}}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Apply Recommendation</h2>
            <div className="muted mono" style={{fontSize:11}}>{saving.id} · {saving.tenant}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{marginBottom:16}}>
            <div className="muted" style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Change</div>
            <div className="row" style={{gap:10,fontSize:13}}>
              <span className="mono dim" style={{textDecoration:'line-through'}}>{saving.from}</span>
              <Icon name="arrow-right" size={14} className="dim" />
              <span className="mono" style={{fontWeight:600}}>{saving.to}</span>
              <span className="pill ok" style={{marginLeft:'auto'}}>−{fmtMoney(saving.monthly)}/mo</span>
            </div>
          </div>

          <div className="muted" style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>Risk Assessment</div>
          <div className="col" style={{gap:8,marginBottom:16}}>
            <div className={`risk-step ${saving.risk==='low'?'ok':saving.risk==='med'?'warn':'danger'}`}>
              <div className="icon-circle" style={{background: saving.risk==='low'?'rgba(52,211,153,.2)':saving.risk==='med'?'rgba(251,191,36,.2)':'rgba(248,113,113,.2)',color: saving.risk==='low'?'var(--ok)':saving.risk==='med'?'var(--warn)':'var(--danger)'}}>
                <Icon name={saving.risk==='low'?'check':'alert-triangle'} size={14} />
              </div>
              <div style={{fontSize:12,lineHeight:1.5}}>
                <strong>{saving.risk === 'low' ? 'Low risk · auto-applicable' : saving.risk === 'med' ? 'Medium risk · review carefully' : 'High risk · downtime possible'}</strong>
                <div className="muted" style={{marginTop:2}}>{saving.rationale}. Confidence: {saving.confidence}%.</div>
              </div>
            </div>
            {saving.risk !== 'low' && (
              <div className="risk-step warn">
                <div className="icon-circle" style={{background:'rgba(251,191,36,.2)',color:'var(--warn)'}}><Icon name="info" size={14} /></div>
                <div style={{fontSize:12,lineHeight:1.5}}>
                  <strong>Brief service interruption (~30s)</strong> while resource is reconfigured. We'll create a snapshot rollback point first.
                </div>
              </div>
            )}
            <div className="risk-step">
              <div className="icon-circle" style={{background:'var(--bg-hover)'}}><Icon name="clock" size={14} /></div>
              <div style={{fontSize:12,lineHeight:1.5}}>
                <strong>Reversible</strong> for 7 days · automatic rollback if SLA degrades by &gt; 0.1%.
              </div>
            </div>
          </div>

          <label className="row" style={{gap:8,fontSize:12,marginBottom:6}}>
            <input type="checkbox" defaultChecked /><span>Notify <strong>{saving.tenant}</strong> via email when applied</span>
          </label>
          <label className="row" style={{gap:8,fontSize:12}}>
            <input type="checkbox" /><span>Schedule for change window (Sat 02:00 UTC)</span>
          </label>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}><Icon name="play" size={12} />Apply now</button>
        </div>
      </div>
    </div>
  );
};

// ============= BILLING =============(AlertsPage moved to page-extras.jsx)
const BillingPage = () => {
  const { INVOICES, fmtMoney, fmtMoneyK } = window.AegisData;
  const total = INVOICES.reduce((s,i) => s + i.amount, 0);
  const overdue = INVOICES.filter(i => i.status === 'overdue').reduce((s,i)=>s+i.amount,0);
  const paid = INVOICES.filter(i => i.status === 'paid').reduce((s,i)=>s+i.amount,0);
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
        <KPI label="MRR (April)" value={fmtMoneyK(total)} delta="+12.4%" deltaDir="up" sub="vs March" spark={[400,440,480,520,560,580,620,total/1000]} />
        <KPI label="Outstanding" value={fmtMoneyK(total - paid)} delta={`${INVOICES.filter(i=>i.status==='sent').length} invoices sent`} sub="" sparkColor="var(--info)" spark={[10,15,12,18,20,16,14,12]} />
        <KPI label="Overdue" value={fmtMoneyK(overdue)} delta="1 invoice" deltaDir="down" sub="> 30 days" sparkColor="var(--danger)" spark={[0,0,2,4,6,8,8,8]} />
        <KPI label="Avg Margin" value="22.4%" delta="+0.8pp" deltaDir="up" sub="across all tenants" sparkColor="var(--accent-3)" spark={[20,21,22,21,22,23,22,22]} />
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-header">
          <div className="card-title">Invoice Run Schedule</div>
          <div className="row" style={{gap:6}}>
            <span className="pill ok"><span className="dot" />Auto-run</span>
            <span className="muted mono" style={{fontSize:11}}>Next: 1 Jun 2026, 06:00 UTC</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
            {[1,8,15,22,29,'Jun 1','Jun 8'].map((d,i) => (
              <div key={i} style={{padding:10,borderRadius:6,background: i === 5 ? 'rgba(59,130,246,.1)' : 'var(--bg-hover)',border: i === 5 ? '1px solid var(--accent)' : '1px solid var(--border)',textAlign:'center'}}>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>May</div>
                <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-mono)'}}>{d}</div>
                <div style={{fontSize:10,marginTop:4,color: i === 5 ? 'var(--accent)' : 'var(--text-muted)'}}>{i === 5 ? 'Next run' : `${(60 - i*8) > 0 ? 60 - i*8 : 0} sent`}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Invoices</div>
          <div className="row" style={{gap:8}}>
            <select className="select"><option>April 2026</option></select>
            <button className="btn btn-sm"><Icon name="filter" size={12} />Filter</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Invoice</th><th>Tenant</th><th>Period</th><th style={{textAlign:'right'}}>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {INVOICES.map(i => (
                <tr key={i.id}>
                  <td className="mono" style={{fontSize:12,fontWeight:500}}>{i.id}</td>
                  <td>{i.tenant}</td>
                  <td className="muted">{i.period}</td>
                  <td style={{textAlign:'right'}} className="mono tabular" style={{textAlign:'right',fontWeight:600}}>{fmtMoney(i.amount)}</td>
                  <td className="dim" style={{fontSize:12}}>{i.issued}</td>
                  <td className="dim" style={{fontSize:12}}>{i.due}</td>
                  <td>
                    <span className={`pill ${i.status==='paid'?'ok':i.status==='overdue'?'danger':i.status==='sent'?'info':''}`}>
                      <span className="dot" />{i.status[0].toUpperCase()+i.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{gap:4}}>
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
};

// ============= RBAC =============
const RbacPage = () => {
  const { USERS, ROLES } = window.AegisData;
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
          <div className="card-header"><div className="card-title">Users</div><span className="muted mono">{USERS.length}</span></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>User</th><th>Role</th><th>Tenants</th><th>MFA</th><th>Last active</th><th></th></tr></thead>
              <tbody>
                {USERS.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="avatar" style={{background: u.role.startsWith('Customer') ? 'linear-gradient(135deg,#a78bfa,#f472b6)' : undefined}}>{u.avatar}</div>
                        <div>
                          <div style={{fontWeight:500,fontSize:13}}>{u.name}</div>
                          <div className="dim mono" style={{fontSize:11}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`pill ${u.role === 'Owner' ? 'accent' : u.role.startsWith('Customer') ? '' : ''}`}>{u.role}</span></td>
                    <td className="mono tabular">{u.tenants}</td>
                    <td>
                      {u.mfa ? <span className="pill ok"><Icon name="check" size={10} />On</span> : <span className="pill danger"><Icon name="x" size={10} />Off</span>}
                    </td>
                    <td className="dim" style={{fontSize:12}}>{u.last}</td>
                    <td><button className="btn btn-sm btn-ghost"><Icon name="more-horizontal" size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Roles</div></div>
          <div style={{padding:'4px 0'}}>
            {ROLES.map(r => (
              <div key={r.name} style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
                <div className="between">
                  <div style={{fontSize:13,fontWeight:600}}>{r.name}</div>
                  <span className="mono dim" style={{fontSize:11}}>{r.users} {r.users === 1 ? 'user' : 'users'}</span>
                </div>
                <div className="muted" style={{fontSize:11,marginTop:2}}>{r.scope} · {r.perms}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="card-header"><div className="card-title">Recent Audit Log</div><button className="btn btn-sm btn-ghost"><Icon name="external-link" size={12} />Full log</button></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Tenant</th></tr></thead>
            <tbody>
              {window.AegisData.AUDIT.map((a,i) => (
                <tr key={i}>
                  <td className="dim mono" style={{fontSize:12}}>{a.when}</td>
                  <td className="mono" style={{fontSize:12}}>{a.actor}</td>
                  <td style={{fontSize:13}}>{a.action}</td>
                  <td className="mono dim" style={{fontSize:12}}>{a.target}</td>
                  <td className="muted" style={{fontSize:12}}>{a.tenant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============= AUDIT, MOBILE (ReportsPage + PortalPage moved to page-extras.jsx) =============
const AuditPage = () => (
  <div className="page">
    <div className="page-header">
      <div><h1 className="page-title">Audit Log</h1><p className="page-sub">Immutable record of every action across the platform</p></div>
      <div className="page-actions"><button className="btn"><Icon name="download" size={14} />Export</button></div>
    </div>
    <div className="filter-bar">
      <input className="input" placeholder="Search…" style={{minWidth:240}} />
      <select className="select"><option>All actors</option></select>
      <select className="select"><option>All tenants</option></select>
      <select className="select"><option>Last 7 days</option></select>
    </div>
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Tenant</th><th>IP</th></tr></thead>
          <tbody>
            {[...window.AegisData.AUDIT, ...window.AegisData.AUDIT].map((a,i) => (
              <tr key={i}>
                <td className="dim mono" style={{fontSize:12}}>{a.when}</td>
                <td className="mono" style={{fontSize:12}}>{a.actor}</td>
                <td style={{fontSize:13}}>{a.action}</td>
                <td className="mono dim" style={{fontSize:12}}>{a.target}</td>
                <td className="muted" style={{fontSize:12}}>{a.tenant}</td>
                <td className="mono dim" style={{fontSize:11}}>10.40.{(i*7)%256}.{(i*13)%256}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const MobilePage = () => (
  <div className="page">
    <div className="page-header">
      <div><h1 className="page-title">Mobile Companion</h1><p className="page-sub">On-call view for after-hours response</p></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,320px))',gap:24,justifyContent:'center',padding:'20px 0'}}>
      <PhoneFrame title="Alerts">
        <div style={{padding:14}}>
          <div style={{fontSize:11,color:'#8a9bb8',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>Critical · 2 open</div>
          {window.AegisData.ALERTS.filter(a => a.sev === 'crit').slice(0,3).map(a => (
            <div key={a.id} style={{background:'#131c30',border:'1px solid #1e2a44',borderRadius:8,padding:12,marginBottom:8}}>
              <div className="row" style={{gap:6,marginBottom:4}}><span className="sev crit"></span><span style={{fontSize:11,color:'#f87171'}}>Critical</span><span style={{fontSize:11,color:'#5a6b86',marginLeft:'auto'}}>{a.when}</span></div>
              <div style={{fontSize:13,color:'#e6edf7',fontWeight:500,marginBottom:2}}>{a.rule}</div>
              <div style={{fontSize:11,color:'#8a9bb8'}}>{a.tenant}</div>
            </div>
          ))}
        </div>
      </PhoneFrame>
      <PhoneFrame title="Spend">
        <div style={{padding:14}}>
          <div style={{fontSize:11,color:'#8a9bb8',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>Today</div>
          <div style={{fontSize:32,fontWeight:600,color:'#e6edf7',marginBottom:4,fontFamily:'var(--font-mono)'}}>$92,140</div>
          <div style={{fontSize:11,color:'#34d399',marginBottom:14}}>↓ 4.2% vs yesterday</div>
          <SparkBigMobile />
          <div style={{fontSize:11,color:'#8a9bb8',textTransform:'uppercase',letterSpacing:'.05em',margin:'14px 0 6px'}}>Top tenants</div>
          {window.AegisData.TENANTS.slice(0,4).map(t => (
            <div key={t.id} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'1px solid #1e2a44'}}>
              <div className="tenant-pip" style={{background:t.color,width:20,height:20,fontSize:9}}>{t.initials}</div>
              <span style={{fontSize:12,color:'#e6edf7',flex:1}}>{t.name}</span>
              <span style={{fontSize:12,color:'#8a9bb8',fontFamily:'var(--font-mono)'}}>${(t.monthly/1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
      </PhoneFrame>
      <PhoneFrame title="Approve">
        <div style={{padding:14}}>
          <div style={{fontSize:11,color:'#8a9bb8',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>Pending approval</div>
          <div style={{background:'#131c30',border:'1px solid #1e2a44',borderRadius:10,padding:14}}>
            <div style={{fontSize:11,color:'#a3e635',marginBottom:6}}>Saving $1,840 / mo</div>
            <div style={{fontSize:13,fontWeight:500,color:'#e6edf7',marginBottom:2}}>Reserved Instance · sqldb-warehouse</div>
            <div style={{fontSize:11,color:'#8a9bb8',marginBottom:14}}>Meridian Capital · Confidence 87%</div>
            <button style={{width:'100%',padding:'10px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,marginBottom:6}}>Approve</button>
            <button style={{width:'100%',padding:'10px',background:'transparent',color:'#8a9bb8',border:'1px solid #1e2a44',borderRadius:6,fontSize:13}}>Defer</button>
          </div>
        </div>
      </PhoneFrame>
    </div>
  </div>
);

const SparkBigMobile = () => {
  const data = [40,42,45,52,48,55,60,58,65,68,72,75];
  const max = Math.max(...data); const min = Math.min(...data);
  const w = 260, h = 60;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h - ((v-min)/(max-min))*h*.9 - h*.05}`).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(59,130,246,.18)" />
      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
    </svg>
  );
};

const PhoneFrame = ({ title, children }) => (
  <div style={{background:'#0b1220',borderRadius:36,padding:8,boxShadow:'0 20px 60px rgba(0,0,0,.4)',border:'1px solid #1e2a44',width:300}}>
    <div style={{background:'#000',borderRadius:30,overflow:'hidden',position:'relative'}}>
      <div style={{height:32,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',color:'#e6edf7',fontSize:11,fontFamily:'var(--font-mono)'}}>
        <span>9:41</span>
        <span>•••</span>
      </div>
      <div style={{background:'#0b1220',padding:'14px 14px 8px',borderBottom:'1px solid #1e2a44'}}>
        <div style={{fontSize:18,fontWeight:600,color:'#e6edf7'}}>{title}</div>
        <div style={{fontSize:11,color:'#8a9bb8'}}>Aegis Cloud · all tenants</div>
      </div>
      <div style={{height:380,background:'#0b1220',overflow:'auto'}}>{children}</div>
    </div>
  </div>
);

// PortalPage moved to page-extras.jsx
Object.assign(window, { SavingsPage, BillingPage, RbacPage, AuditPage, MobilePage });

})();

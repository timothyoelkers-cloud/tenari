(function(){
const { TENANTS: TLIST, POLICIES, SAVINGS, ALERTS, USERS, fmtMoney: fM, fmtMoneyK: fMK, fmtPct: fP, range } = window.AegisData;

const TenantsListPage = ({ setPage, setTenant }) => {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('table');
  const filtered = TLIST.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (q && !t.name.toLowerCase().includes(q.toLowerCase()) && !t.id.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-sub">{filtered.length} of {TLIST.length} tenants · grouped by health</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="download" size={14} />Export</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} />Onboard tenant</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search" style={{flex:1,maxWidth:360}}>
          <Icon name="search" size={14} className="dim" />
          <input placeholder="Search by name or ID…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="ok">Healthy</option><option value="warn">Warning</option><option value="crit">Critical</option>
        </select>
        <select className="select"><option>All plans</option></select>
        <select className="select"><option>All regions</option></select>
        <div style={{marginLeft:'auto',display:'flex',gap:4,background:'var(--bg-hover)',borderRadius:6,padding:2}}>
          <button className={`btn-toggle ${view==='table'?'active':''}`} onClick={() => setView('table')}><Icon name="list" size={14} /></button>
          <button className={`btn-toggle ${view==='grid'?'active':''}`} onClick={() => setView('grid')}><Icon name="grid" size={14} /></button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th><th>Region</th><th>Plan</th><th>Tier</th>
                  <th style={{textAlign:'right'}}>Monthly</th><th>Compliance</th><th>SLA</th><th>Alerts</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="clickable" onClick={() => { setTenant(t.id); setPage('tenant'); }}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="tenant-pip" style={{background: t.color}}>{t.initials}</div>
                        <div>
                          <div style={{fontWeight:500,fontSize:13}}>{t.name}</div>
                          <div className="mono dim" style={{fontSize:11}}>{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{t.region}</td>
                    <td><span className="pill">{t.plan}</span></td>
                    <td><span className="pill">{t.tier}</span></td>
                    <td style={{textAlign:'right'}} className="mono tabular">{fM(t.monthly)}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="bar" style={{width:60}}><span style={{width: t.compliance + '%', background: t.compliance > 85 ? 'var(--ok)' : t.compliance > 70 ? 'var(--warn)' : 'var(--danger)'}}/></div>
                        <span className="mono dim" style={{fontSize:12}}>{t.compliance}%</span>
                      </div>
                    </td>
                    <td className="mono tabular dim" style={{fontSize:12}}>{t.sla}%</td>
                    <td>
                      {t.alerts > 0 ? <span className={`pill ${t.critical > 0 ? 'danger' : t.alerts > 5 ? 'warn' : ''}`}><span className="dot" />{t.alerts}{t.critical > 0 && ` · ${t.critical} crit`}</span> : <span className="dim">—</span>}
                    </td>
                    <td><Icon name="chevron-right" size={14} className="dim" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {filtered.map(t => (
            <div key={t.id} className="card clickable" onClick={() => { setTenant(t.id); setPage('tenant'); }} style={{cursor:'pointer'}}>
              <div style={{padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <div className="tenant-pip" style={{background:t.color, width:40,height:40,fontSize:14, borderRadius:8}}>{t.initials}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.name}</div>
                    <div className="mono dim" style={{fontSize:11}}>{t.id} · {t.region}</div>
                  </div>
                  <span className={`pill ${t.status==='crit'?'danger':t.status==='warn'?'warn':'ok'}`}><span className="dot" /></span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Monthly</div>
                    <div className="mono tabular" style={{fontWeight:600,fontSize:14}}>{fMK(t.monthly)}</div>
                  </div>
                  <div>
                    <div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Compliance</div>
                    <div className="mono tabular" style={{fontWeight:600,fontSize:14, color: t.compliance > 85 ? 'var(--ok)' : t.compliance > 70 ? 'var(--warn)' : 'var(--danger)'}}>{t.compliance}%</div>
                  </div>
                  <div>
                    <div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>SLA</div>
                    <div className="mono tabular" style={{fontWeight:600,fontSize:14}}>{t.sla}%</div>
                  </div>
                  <div>
                    <div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Alerts</div>
                    <div className="mono tabular" style={{fontWeight:600,fontSize:14, color: t.critical > 0 ? 'var(--danger)' : t.alerts > 0 ? 'var(--warn)' : 'var(--text)'}}>{t.alerts}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =================== TENANT DETAIL ===================
const TenantDetailPage = ({ tenantId, setPage }) => {
  const t = TLIST.find(x => x.id === tenantId) || TLIST[0];
  const [tab, setTab] = useState('overview');
  // Per-tenant deterministic counts
  const tHash = t.id.charCodeAt(2) + t.id.charCodeAt(3);
  const policyCount = 12;
  const policyViolations = Math.max(0, Math.round((100 - t.compliance) / 8));
  const tenantSavings = SAVINGS.filter(s => s.tenant === t.name);
  const savingsCount = tenantSavings.length || (3 + (tHash % 5));
  const savingsTotal = tenantSavings.length ? tenantSavings.reduce((a,b)=>a+b.monthly,0) : Math.floor(t.savings * 0.35);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'resources', label: 'Resources', count: 247 },
    { id: 'policies', label: 'Policies', count: policyCount },
    { id: 'savings', label: 'Savings', count: savingsCount },
    { id: 'alerts', label: 'Alerts', count: t.alerts },
    { id: 'tags', label: 'Tags' },
    { id: 'access', label: 'Access' },
  ];
  return (
    <div className="page">
      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'var(--text-muted)',marginBottom:12}}>
        <button className="btn-ghost" onClick={() => setPage('tenants')} style={{cursor:'pointer'}}>Tenants</button>
        <Icon name="chevron-right" size={12} />
        <span style={{color:'var(--text)'}}>{t.name}</span>
      </div>

      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div className="tenant-pip" style={{background: t.color, width: 44, height: 44, fontSize: 16, borderRadius: 10}}>{t.initials}</div>
          <div>
            <h1 className="page-title">{t.name}</h1>
            <p className="page-sub mono">{t.tenantId} · {t.region} · {t.plan}</p>
          </div>
        </div>
        <div className="page-actions">
          <span className={`pill ${t.status === 'crit' ? 'danger' : t.status === 'warn' ? 'warn' : 'ok'}`}><span className="dot" />{t.status === 'crit' ? 'Critical' : t.status === 'warn' ? 'Warning' : 'Healthy'}</span>
          <button className="btn"><Icon name="external-link" size={14} /> Open in Azure</button>
          <button className="btn btn-primary"><Icon name="sparkles" size={14} /> Generate Bicep</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tb => (
          <button key={tb.id} className={`tab ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
            {tb.label}{tb.count !== undefined && <span className="count">{tb.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && <TenantOverview t={t} />}
      {tab === 'resources' && <TenantResources t={t} />}
      {tab === 'policies' && <TenantPolicies t={t} />}
      {tab === 'savings' && <TenantSavings t={t} tenantSavings={tenantSavings} savingsTotal={savingsTotal} />}
      {tab === 'alerts' && <TenantAlerts t={t} />}
      {tab === 'tags' && <TenantTags t={t} />}
      {tab === 'access' && <TenantAccess t={t} />}
    </div>
  );
};

const TenantOverview = ({ t }) => {
  const days = range(30).map((i) => {
    const r = ((i * 9301 + t.subs * 49297) % 233280) / 233280;
    return Math.floor(t.monthly / 30 * (0.7 + r * 0.6));
  });
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Monthly Spend" value={fMK(t.monthly)} delta={`${t.trend > 0 ? '+' : ''}${t.trend}%`} deltaDir={t.trend > 0 ? 'down' : 'up'} sub="vs last month" spark={days} />
        <KPI label="Compliance Score" value={`${t.compliance}%`} delta="+1.4pp" deltaDir="up" sub={`${Math.floor(t.compliance/8)}/12 policies`} sparkColor="var(--accent-2)" spark={[80,82,81,83,84,85,86,t.compliance]} />
        <KPI label="SLA (30d)" value={`${t.sla}%`} delta="No incidents" sub="" spark={Array(12).fill(0).map((_,i)=>i+10)} sparkColor="var(--ok)" />
        <KPI label="Identified Savings" value={fMK(t.savings)} delta={fP(t.savings/t.monthly*100)} deltaDir="up" sub="of spend" sparkColor="var(--accent-3)" spark={[10,14,12,18,16,20,22,t.savings/100]} />
      </div>

      <div className="split-2-1" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Daily Spend (30d)</div>
            <div className="row">
              <span className="pill accent"><span className="dot" />{t.name}</span>
            </div>
          </div>
          <div className="card-body">
            <SpendChart data={days} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Subscriptions</div>
            <span className="muted mono">{t.subs}</span>
          </div>
          <div style={{padding:'4px 0'}}>
            {range(Math.min(t.subs, 6)).map(i => (
              <div key={i} style={{padding:'10px 16px',borderBottom: i < Math.min(t.subs,6) - 1 ? '1px solid var(--border)' : 'none',display:'flex',alignItems:'center',gap:10}}>
                <Icon name="cloud" size={14} className="dim" />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}}>{['prod-eus','prod-weu','dev-eus','staging-uks','sandbox','dr-secondary'][i]}</div>
                  <div className="mono dim" style={{fontSize:10}}>{['8a4f','3c91','7e22','2b56','4d18','9f01'][i]}-…</div>
                </div>
                <span className="mono tabular" style={{fontSize:12}}>{fMK(t.monthly / t.subs * (0.6 + i * 0.15))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

const TenantResources = ({ t }) => {
  const types = [
    { name: 'Virtual Machines', count: 47, icon: 'cpu', spend: t.monthly * 0.4 },
    { name: 'Storage Accounts', count: 23, icon: 'database', spend: t.monthly * 0.12 },
    { name: 'SQL Databases', count: 12, icon: 'database', spend: t.monthly * 0.18 },
    { name: 'App Services', count: 18, icon: 'cloud', spend: t.monthly * 0.09 },
    { name: 'Key Vaults', count: 7, icon: 'lock', spend: t.monthly * 0.02 },
    { name: 'Networking', count: 34, icon: 'globe', spend: t.monthly * 0.08 },
  ];
  return (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Resource Type</th>
              <th style={{textAlign:'right'}}>Count</th>
              <th style={{textAlign:'right'}}>Monthly Spend</th>
              <th>Compliant</th>
              <th>Tagged</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {types.map(r => (
              <tr key={r.name}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <Icon name={r.icon} size={14} className="dim" />
                    <span style={{fontWeight:500}}>{r.name}</span>
                  </div>
                </td>
                <td style={{textAlign:'right'}} className="mono tabular">{r.count}</td>
                <td style={{textAlign:'right'}} className="mono tabular">{fM(r.spend)}</td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div className="bar" style={{width:60}}><span style={{width: '92%', background: 'var(--ok)'}}/></div>
                    <span className="mono dim" style={{fontSize:12}}>92%</span>
                  </div>
                </td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div className="bar" style={{width:60}}><span style={{width: t.tags + '%', background: t.tags > 85 ? 'var(--ok)' : 'var(--warn)'}}/></div>
                    <span className="mono dim" style={{fontSize:12}}>{t.tags}%</span>
                  </div>
                </td>
                <td><Icon name="chevron-right" size={14} className="dim" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =================== TENANT POLICIES ===================
const TenantPolicies = ({ t }) => {
  // Per-tenant policy state derived from tenant + global policy
  const seed = t.id.charCodeAt(2) + t.id.charCodeAt(3) + t.id.charCodeAt(4);
  const tPolicies = POLICIES.map((p, i) => {
    const r = ((seed + i * 37) % 100);
    const total = 8 + (r % 35);
    let nc = 0;
    if (t.compliance < 75) nc = Math.floor(total * (0.10 + (r % 18) / 100));
    else if (t.compliance < 90) nc = Math.floor(total * ((r % 8) / 100));
    else nc = (r % 3 === 0 && p.severity !== 'low') ? 1 : 0;
    return { ...p, t_total: total, t_nc: nc, t_compliant: total - nc, t_compliance: ((total - nc) / total) * 100 };
  });
  const violations = tPolicies.filter(p => p.t_nc > 0);
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Compliance" value={`${t.compliance}%`} delta="+1.4pp" deltaDir="up" sub="across all policies" sparkColor="var(--accent-2)" spark={[78,79,80,82,83,84,85,t.compliance]} />
        <KPI label="Assigned Policies" value="12" delta="0 changes" sub="last 30 days" />
        <KPI label="Violations" value={String(violations.reduce((s,p) => s + p.t_nc, 0))} delta={`${violations.length} policies`} deltaDir={violations.length > 3 ? 'down' : 'up'} sub="" sparkColor="var(--danger)" spark={[18,16,14,12,10,8,7,violations.reduce((s,p)=>s+p.t_nc,0)]} />
        <KPI label="Exemptions" value="3" delta="2 expiring soon" sub="" sparkColor="var(--warn)" />
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-header">
          <div>
            <div className="card-title">Policy Assignments</div>
            <div className="card-sub">Inherited from MSP defaults · {t.name}-specific overrides shown</div>
          </div>
          <button className="btn btn-sm"><Icon name="plus" size={12} />Assign policy</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Policy</th><th>Severity</th><th>Category</th><th style={{textAlign:'right'}}>Resources</th><th>Compliance</th><th>Source</th><th></th></tr></thead>
            <tbody>
              {tPolicies.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{fontWeight:500,fontSize:13}}>{p.name}</div>
                    <div className="mono dim" style={{fontSize:11}}>{p.id}</div>
                  </td>
                  <td><span className={`sev ${p.severity}`}>{p.severity === 'crit' ? 'Critical' : p.severity === 'high' ? 'High' : p.severity === 'med' ? 'Medium' : 'Low'}</span></td>
                  <td><span className="pill">{p.category}</span></td>
                  <td style={{textAlign:'right'}} className="mono tabular">{p.t_total}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="bar" style={{width:60}}><span style={{width: p.t_compliance + '%', background: p.t_compliance > 90 ? 'var(--ok)' : p.t_compliance > 70 ? 'var(--warn)' : 'var(--danger)'}}/></div>
                      <span className="mono dim tabular" style={{fontSize:12,minWidth:36}}>{p.t_nc > 0 ? `${p.t_nc} fail` : '✓'}</span>
                    </div>
                  </td>
                  <td><span className="pill">{p.id === 'POL-005' ? 'Tenant override' : 'MSP default'}</span></td>
                  <td><Icon name="chevron-right" size={14} className="dim" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Open Violations</div>
          <span className="muted mono">{violations.reduce((s,p)=>s+p.t_nc,0)} resources</span>
        </div>
        <div style={{padding:'4px 0'}}>
          {violations.slice(0, 5).map((p,i) => (
            <div key={p.id} style={{padding:'12px 16px',borderBottom: i < Math.min(violations.length,5) - 1 ? '1px solid var(--border)' : 'none',display:'flex',alignItems:'center',gap:12}}>
              <span className={`sev ${p.severity}`} style={{minWidth:60}}>{p.severity === 'crit' ? 'Critical' : p.severity === 'high' ? 'High' : p.severity === 'med' ? 'Medium' : 'Low'}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500}}>{p.name}</div>
                <div className="dim mono" style={{fontSize:11}}>{p.t_nc} non-compliant of {p.t_total} resources</div>
              </div>
              <button className="btn btn-sm">Remediate</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// =================== TENANT SAVINGS ===================
const TenantSavings = ({ t, tenantSavings, savingsTotal }) => {
  // Build deterministic savings list scoped to this tenant
  const seed = t.id.charCodeAt(2) + t.id.charCodeAt(3);
  const generateSavings = () => {
    const types = [
      { type: 'Right-size VM', from: 'D8s_v5', to: 'D4s_v5', icon: 'cpu', risk: 'low', conf: 92, rationale: 'CPU < 18% over 90 days' },
      { type: 'Reserved Instance', from: 'PAYG', to: '3yr RI', icon: 'piggy-bank', risk: 'med', conf: 87, rationale: 'Stable usage 24/7 for 14 months' },
      { type: 'Storage tier', from: 'Hot', to: 'Cool', icon: 'database', risk: 'low', conf: 94, rationale: 'Last access > 60 days' },
      { type: 'Idle resource', from: 'P1v3', to: 'Delete', icon: 'trash', risk: 'med', conf: 89, rationale: 'No traffic in 45 days' },
      { type: 'Orphan cleanup', from: '47 snapshots', to: 'Delete', icon: 'trash', risk: 'low', conf: 96, rationale: 'Source disks deleted' },
      { type: 'Auto-shutdown', from: '24/7', to: '6pm-8am off', icon: 'clock', risk: 'med', conf: 83, rationale: 'Dev workload, business-hours only' },
      { type: 'Autoscale', from: 'Manual 4000 RU/s', to: 'Autoscale', icon: 'activity', risk: 'low', conf: 88, rationale: 'P95 < 1200 RU/s' },
    ];
    const resources = ['vm-prod-app-04','sqldb-warehouse-01','storage-archive','aks-research','app-svc-plan-legacy','vmss-batch-04','cosmos-shared'];
    const count = 4 + (seed % 4);
    return range(count).map(i => {
      const tDef = types[(seed + i) % types.length];
      const monthly = 80 + ((seed * (i+1) * 13) % 1900);
      return {
        id: `S-${t.id.slice(2)}-${i}`,
        resource: resources[(seed + i) % resources.length],
        ...tDef,
        monthly,
      };
    });
  };
  const items = tenantSavings.length ? tenantSavings : generateSavings();
  const total = items.reduce((a,b) => a + b.monthly, 0);
  const annual = total * 12;
  const lowRisk = items.filter(s => s.risk === 'low');
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Monthly Savings Available" value={fMK(total)} delta={fP(total/t.monthly*100)} deltaDir="up" sub="of monthly spend" sparkColor="var(--accent-3)" spark={[8,12,16,20,22,26,28,30]} />
        <KPI label="Annualized" value={fMK(annual)} delta="+12%" deltaDir="up" sub="vs Q1" sparkColor="var(--ok)" spark={[20,30,40,50,60,68,72,76]} />
        <KPI label="Low-risk" value={fMK(lowRisk.reduce((a,b)=>a+b.monthly,0))} delta={`${lowRisk.length} items`} sub="auto-applicable" sparkColor="var(--ok)" spark={[5,8,10,12,14,16,18,20]} />
        <KPI label="Applied YTD" value={fMK(t.savings * 0.18)} delta="6 actions" deltaDir="up" sub="" sparkColor="var(--accent)" spark={[2,4,6,8,10,12,14,14]} />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Savings Opportunities · {t.name}</div>
          <div className="row" style={{gap:6}}>
            <button className="btn btn-sm"><Icon name="filter" size={12} />Filter</button>
            <button className="btn btn-sm btn-primary"><Icon name="play" size={12} />Apply all low-risk</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Resource</th><th>Recommendation</th><th>Change</th><th>Risk</th><th>Confidence</th><th style={{textAlign:'right'}}>Monthly</th><th></th></tr></thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <Icon name={s.icon || 'cpu'} size={14} className="dim" />
                      <div>
                        <div className="mono" style={{fontSize:12,fontWeight:500}}>{s.resource}</div>
                        <div className="dim" style={{fontSize:11}}>{s.rationale || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pill accent">{s.type}</span></td>
                  <td>
                    <div style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}>
                      <span className="mono dim" style={{textDecoration:'line-through'}}>{s.from}</span>
                      <Icon name="arrow-right" size={12} className="dim" />
                      <span className="mono">{s.to}</span>
                    </div>
                  </td>
                  <td><span className={`pill ${s.risk==='low'?'ok':s.risk==='med'?'warn':'danger'}`}><span className="dot" />{s.risk}</span></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div className="bar" style={{width:50}}><span style={{width:(s.confidence||s.conf||85)+'%',background:(s.confidence||s.conf||85) > 85 ? 'var(--ok)' : 'var(--warn)'}}/></div>
                      <span className="mono dim" style={{fontSize:11}}>{s.confidence||s.conf||85}%</span>
                    </div>
                  </td>
                  <td style={{textAlign:'right'}} className="mono tabular" style={{textAlign:'right',fontWeight:600}}>{fM(s.monthly)}</td>
                  <td><div className="row" style={{gap:4}}><button className="btn btn-sm">Review</button>{s.risk==='low' && <button className="btn btn-sm btn-primary"><Icon name="play" size={10} /></button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// =================== TENANT ALERTS ===================
const TenantAlerts = ({ t }) => {
  // Show all alerts that match this tenant + generate filler so count matches
  const seed = t.id.charCodeAt(2) + t.id.charCodeAt(3);
  const matched = ALERTS.filter(a => a.tenant === t.name);
  const filler = range(Math.max(0, t.alerts - matched.length)).map(i => {
    const sevs = ['low','med','high','crit'];
    const rules = ['Backup policy missing','Diagnostic settings not configured','Untagged resources detected','Storage soft-delete < 30 days','TLS < 1.2 allowed','Resource lock missing'];
    const resources = ['vm-app-03','rg-staging','storage-data-01','cosmos-shared','app-svc-checkout','vnet-prod-eus'];
    const sev = i < t.critical ? 'crit' : sevs[(seed + i) % 3];
    return {
      id: `AL-${(8000 + seed + i * 13) % 9999}`,
      sev,
      tenant: t.name,
      resource: resources[(seed + i) % resources.length],
      rule: rules[(seed + i) % rules.length],
      when: `${(i+1) * 3 + (seed % 5)}h ago`,
      status: i % 3 === 0 ? 'ack' : 'open',
      owner: i % 2 === 0 ? null : 'mike.r',
    };
  });
  const all = [...matched, ...filler];
  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label"><span className="sev crit"></span>Critical</div><div className="kpi-value tabular" style={{color:'var(--danger)'}}>{t.critical}</div><div className="kpi-delta muted">unacknowledged</div></div>
        <div className="kpi"><div className="kpi-label"><span className="sev high"></span>High</div><div className="kpi-value tabular" style={{color:'#fb923c'}}>{Math.max(0, Math.floor(t.alerts * 0.3))}</div><div className="kpi-delta muted">avg ack: 14m</div></div>
        <div className="kpi"><div className="kpi-label"><span className="sev med"></span>Medium</div><div className="kpi-value tabular" style={{color:'var(--warn)'}}>{Math.max(0, Math.floor(t.alerts * 0.4))}</div><div className="kpi-delta muted">trending stable</div></div>
        <div className="kpi"><div className="kpi-label">MTTR (30d)</div><div className="kpi-value tabular">42m</div><div className="kpi-delta" style={{color:'var(--ok)'}}>↓ 18%</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Active Alerts · {t.name}</div>
          <div className="row" style={{gap:6}}>
            <select className="select"><option>All severities</option></select>
            <button className="btn btn-sm">Ack all</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Sev</th><th>Alert</th><th>Resource</th><th>Status</th><th>Owner</th><th>Triggered</th><th></th></tr></thead>
            <tbody>
              {all.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign:'center',padding:'40px 16px'}}>
                  <Icon name="check" size={20} className="dim" />
                  <div className="muted" style={{marginTop:8,fontSize:13}}>No active alerts. {t.name} is healthy.</div>
                </td></tr>
              ) : all.map(a => (
                <tr key={a.id}>
                  <td><span className={`sev ${a.sev}`}>{a.sev === 'crit' ? 'Critical' : a.sev === 'high' ? 'High' : a.sev === 'med' ? 'Medium' : 'Low'}</span></td>
                  <td>
                    <div style={{fontWeight:500,fontSize:13}}>{a.rule}</div>
                    <div className="mono dim" style={{fontSize:11}}>{a.id}</div>
                  </td>
                  <td className="mono dim" style={{fontSize:12}}>{a.resource}</td>
                  <td><span className={`pill ${a.status==='open'?'danger':a.status==='ack'?'info':'warn'}`}><span className="dot" />{a.status === 'open' ? 'Open' : 'Acknowledged'}</span></td>
                  <td>{a.owner ? <span className="mono" style={{fontSize:12}}>{a.owner}</span> : <span className="dim" style={{fontSize:11}}>—</span>}</td>
                  <td className="dim" style={{fontSize:12}}>{a.when}</td>
                  <td><div className="row" style={{gap:4}}>{a.status==='open' && <button className="btn btn-sm">Ack</button>}<button className="btn btn-sm btn-ghost"><Icon name="more-horizontal" size={12} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// =================== TENANT TAGS ===================
const TenantTags = ({ t }) => {
  const requiredTags = [
    { name: 'cost-center', coverage: t.tags, missing: Math.floor((100 - t.tags) * 2.4) },
    { name: 'owner', coverage: Math.min(98, t.tags + 6), missing: Math.floor((100 - Math.min(98, t.tags + 6)) * 2.4) },
    { name: 'environment', coverage: Math.min(99, t.tags + 12), missing: Math.floor((100 - Math.min(99, t.tags + 12)) * 2.4) },
    { name: 'data-classification', coverage: Math.max(40, t.tags - 22), missing: Math.floor((100 - Math.max(40, t.tags - 22)) * 2.4) },
  ];
  const distribution = [
    { name: 'prod', count: 142, color: 'var(--danger)' },
    { name: 'staging', count: 58, color: 'var(--warn)' },
    { name: 'dev', count: 89, color: 'var(--accent)' },
    { name: 'sandbox', count: 34, color: 'var(--accent-3)' },
    { name: '(untagged)', count: Math.floor((100 - t.tags) * 1.2), color: 'var(--text-muted)' },
  ];
  const totalEnv = distribution.reduce((s,d) => s + d.count, 0);
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Tag Coverage" value={`${t.tags}%`} delta="+3pp" deltaDir="up" sub="all required tags" sparkColor="var(--accent-2)" spark={[60,64,68,72,76,80,82,t.tags]} />
        <KPI label="Required Tags" value="4" delta="2 inherited" sub="from MSP" />
        <KPI label="Untagged Resources" value={String(Math.floor((100 - t.tags) * 2.4))} delta={`${requiredTags.reduce((s,r) => s + r.missing, 0)} violations`} deltaDir="down" sub="" sparkColor="var(--danger)" spark={[40,38,36,34,32,30,28,26]} />
        <KPI label="Cost Allocation" value={`${Math.floor(t.tags * 0.94)}%`} delta="+5pp" deltaDir="up" sub="of spend tagged" sparkColor="var(--ok)" />
      </div>

      <div className="split-2-1" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Required Tag Coverage</div>
            <button className="btn btn-sm"><Icon name="plus" size={12} />Add tag</button>
          </div>
          <div style={{padding:'4px 0'}}>
            {requiredTags.map((tag,i) => (
              <div key={tag.name} style={{padding:'14px 16px',borderBottom: i < requiredTags.length - 1 ? '1px solid var(--border)' : 'none'}}>
                <div className="between" style={{marginBottom:6}}>
                  <div className="row" style={{gap:8}}>
                    <Icon name="tag" size={13} className="dim" />
                    <span className="mono" style={{fontSize:13,fontWeight:500}}>{tag.name}</span>
                    <span className="pill">{tag.coverage > 90 ? 'Enforced' : 'Audit'}</span>
                  </div>
                  <span className="mono tabular" style={{fontSize:13,fontWeight:600,color: tag.coverage > 85 ? 'var(--ok)' : tag.coverage > 65 ? 'var(--warn)' : 'var(--danger)'}}>{tag.coverage}%</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div className="bar" style={{flex:1,height:6}}><span style={{width: tag.coverage + '%', background: tag.coverage > 85 ? 'var(--ok)' : tag.coverage > 65 ? 'var(--warn)' : 'var(--danger)'}}/></div>
                  <span className="mono dim" style={{fontSize:11,minWidth:80,textAlign:'right'}}>{tag.missing} missing</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Environment Distribution</div></div>
          <div style={{padding:16}}>
            <div className="donut-wrap">
              <Donut size={140} thickness={18} segments={distribution.map(d => ({ name: d.name, value: d.count, color: d.color }))} />
              <div className="legend">
                {distribution.map(d => (
                  <div key={d.name} className="legend-item">
                    <span className="legend-swatch" style={{background:d.color}} />
                    <span style={{minWidth:80}}>{d.name}</span>
                    <span className="muted mono tabular">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="muted" style={{fontSize:11,textAlign:'center',marginTop:12}}>{totalEnv} total resources tracked</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Untagged Resources</div>
          <button className="btn btn-sm btn-primary"><Icon name="sparkles" size={12} />Auto-tag with AI</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Resource</th><th>Type</th><th>Subscription</th><th>Missing Tags</th><th style={{textAlign:'right'}}>Monthly</th><th></th></tr></thead>
            <tbody>
              {[
                ['vm-legacy-app-12','Virtual Machine','prod-eus','cost-center, owner', 412],
                ['storage-tmp-archive','Storage Account','dev-eus','data-classification', 88],
                ['cosmos-experimental','Cosmos DB','sandbox','cost-center, owner, env', 248],
                ['app-svc-prototype-3','App Service','staging-uks','owner', 124],
                ['kv-secrets-shared','Key Vault','prod-eus','cost-center', 4],
              ].map((r,i) => (
                <tr key={i}>
                  <td className="mono" style={{fontSize:12,fontWeight:500}}>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td className="mono dim" style={{fontSize:11}}>{r[2]}</td>
                  <td>{r[3].split(', ').map(tg => <span key={tg} className="pill warn" style={{marginRight:4}}>{tg}</span>)}</td>
                  <td style={{textAlign:'right'}} className="mono tabular">${r[4]}</td>
                  <td><button className="btn btn-sm">Tag</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// =================== TENANT ACCESS ===================
const TenantAccess = ({ t }) => {
  const seed = t.id.charCodeAt(2) + t.id.charCodeAt(3);
  const tenantUsers = USERS.filter(u => u.tenants === 60 || u.role.includes('Customer')).slice(0, 4 + (seed % 3));
  // Add a customer user specific to this tenant
  const customerUser = { id: 'C-T', name: t.name.split(' ')[0] + ' Admin', email: `admin@${t.name.toLowerCase().replace(/[^a-z]/g,'')}.com`, role: 'Customer Admin', tenants: 1, mfa: true, last: '4h ago', avatar: t.initials };
  const allUsers = [customerUser, ...tenantUsers];
  return (
    <>
      <div className="kpi-grid">
        <KPI label="Users with Access" value={String(allUsers.length)} delta="+1 this month" deltaDir="up" sub={`${allUsers.filter(u=>u.role.includes('Customer')).length} customer · ${allUsers.length - allUsers.filter(u=>u.role.includes('Customer')).length} MSP`} />
        <KPI label="MFA Coverage" value={`${Math.round(allUsers.filter(u=>u.mfa).length/allUsers.length*100)}%`} delta={`${allUsers.filter(u=>!u.mfa).length} without`} deltaDir={allUsers.filter(u=>!u.mfa).length > 0 ? 'down' : 'up'} sub="" sparkColor="var(--ok)" />
        <KPI label="Service Principals" value="14" delta="2 expiring" deltaDir="down" sub="next 30 days" sparkColor="var(--warn)" />
        <KPI label="Privileged Sessions" value="3" delta="JIT activated" sub="last 24h" sparkColor="var(--accent)" />
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-header">
          <div>
            <div className="card-title">Identity & Access</div>
            <div className="card-sub">Federated via {t.name} Entra ID · {t.tenantId.slice(0,8)}…</div>
          </div>
          <div className="row" style={{gap:6}}>
            <button className="btn btn-sm"><Icon name="shield-check" size={12} />Audit access</button>
            <button className="btn btn-sm btn-primary"><Icon name="plus" size={12} />Invite</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>User</th><th>Role on this tenant</th><th>Type</th><th>MFA</th><th>Last sign-in</th><th></th></tr></thead>
            <tbody>
              {allUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div className="avatar" style={{background: u.role.includes('Customer') ? 'linear-gradient(135deg,#a78bfa,#f472b6)' : undefined}}>{u.avatar}</div>
                      <div>
                        <div style={{fontWeight:500,fontSize:13}}>{u.name}</div>
                        <div className="dim mono" style={{fontSize:11}}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pill">{u.role}</span></td>
                  <td>{u.role.includes('Customer') ? <span className="pill accent">Customer</span> : <span className="pill">MSP</span>}</td>
                  <td>{u.mfa ? <span className="pill ok"><Icon name="check" size={10} />On</span> : <span className="pill danger"><Icon name="x" size={10} />Off</span>}</td>
                  <td className="dim" style={{fontSize:12}}>{u.last}</td>
                  <td><button className="btn btn-sm btn-ghost"><Icon name="more-horizontal" size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="split-2-1">
        <div className="card">
          <div className="card-header"><div className="card-title">Service Principals & Workload Identities</div></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>App ID</th><th>Permissions</th><th>Secret expires</th><th></th></tr></thead>
              <tbody>
                {[
                  ['aegis-deployment-sp','b7e1…4c92','Contributor','12 days', 'warn'],
                  ['aegis-monitoring-sp','3d4f…91a8','Reader + Monitoring','89 days', 'ok'],
                  ['aegis-backup-sp','5c81…73e1','Backup Operator','142 days', 'ok'],
                  ['aegis-finops-sp','9a22…45b7','Cost Reader','4 days', 'danger'],
                  ['github-actions-cd','f8c4…1e09','Contributor (rg-prod)','67 days', 'ok'],
                ].map((r,i) => (
                  <tr key={i}>
                    <td className="mono" style={{fontSize:12,fontWeight:500}}>{r[0]}</td>
                    <td className="mono dim" style={{fontSize:11}}>{r[1]}</td>
                    <td><span className="pill">{r[2]}</span></td>
                    <td><span className={`mono tabular ${r[4]==='danger'?'':r[4]==='warn'?'':''}`} style={{fontSize:12,color:r[4]==='danger'?'var(--danger)':r[4]==='warn'?'var(--warn)':'var(--text-muted)'}}>{r[3]}</span></td>
                    <td><button className="btn btn-sm btn-ghost">Rotate</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Privileged Access (PIM)</div></div>
          <div style={{padding:'4px 0'}}>
            {[
              ['sarah.chen','Owner', 'Active · 2h 14m left', 'ok'],
              ['mike.r','Contributor (rg-prod)', 'Active · 47m left', 'ok'],
              ['jamie.k','User Access Admin', 'Pending approval', 'warn'],
              ['priya.s','Cost Management Reader', 'Eligible · not active', 'dim'],
            ].map((r,i) => (
              <div key={i} style={{padding:'12px 16px',borderBottom: i < 3 ? '1px solid var(--border)' : 'none'}}>
                <div className="between" style={{marginBottom:4}}>
                  <span className="mono" style={{fontSize:12,fontWeight:500}}>{r[0]}</span>
                  <span className={`pill ${r[3]==='ok'?'ok':r[3]==='warn'?'warn':''}`}><span className="dot" /></span>
                </div>
                <div style={{fontSize:12}}>{r[1]}</div>
                <div className="dim" style={{fontSize:11,marginTop:2}}>{r[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

window.TenantsListPage = TenantsListPage;
window.TenantDetailPage = TenantDetailPage;

})();

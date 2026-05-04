(function(){
const { ALERTS, TENANTS, INVOICES, USERS, AUDIT, fmtMoney, fmtMoneyK, range, RESOURCE_BREAKDOWN, SPEND_TREND } = window.AegisData;

// =================== EXPANDED ALERTS PAGE ===================
const AlertsPage = () => {
  const [sev, setSev] = useState('all');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const filtered = ALERTS.filter(a => (sev === 'all' || a.sev === sev) && (status === 'all' || a.status === status));
  const counts = {
    crit: ALERTS.filter(a => a.sev==='crit' && a.status==='open').length,
    high: ALERTS.filter(a => a.sev==='high' && a.status==='open').length,
    med:  ALERTS.filter(a => a.sev==='med' && a.status==='open').length,
    low:  ALERTS.filter(a => a.sev==='low' && a.status==='open').length,
  };
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts & Incidents</h1>
          <p className="page-sub">Defender for Cloud, Policy, and Service Health · across all tenants</p>
        </div>
        <div className="page-actions">
          <button className="btn"><Icon name="settings" size={14} />Routing rules</button>
          <button className="btn"><Icon name="bell" size={14} />Notification channels</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label"><span className="sev crit"></span>Critical</div><div className="kpi-value tabular" style={{color:'var(--danger)'}}>{counts.crit}</div><div className="kpi-delta muted">2 unacknowledged</div></div>
        <div className="kpi"><div className="kpi-label"><span className="sev high"></span>High</div><div className="kpi-value tabular" style={{color:'#fb923c'}}>{counts.high}</div><div className="kpi-delta muted">avg time to ack: 14m</div></div>
        <div className="kpi"><div className="kpi-label"><span className="sev med"></span>Medium</div><div className="kpi-value tabular" style={{color:'var(--warn)'}}>{counts.med}</div><div className="kpi-delta muted">3 trending up</div></div>
        <div className="kpi"><div className="kpi-label"><span className="sev low"></span>Low / Info</div><div className="kpi-value tabular" style={{color:'var(--info)'}}>{counts.low}</div><div className="kpi-delta muted">batched daily</div></div>
      </div>

      <div className="filter-bar">
        <select className="select" value={sev} onChange={e => setSev(e.target.value)}>
          <option value="all">All severities</option>
          <option value="crit">Critical</option><option value="high">High</option><option value="med">Medium</option><option value="low">Low</option>
        </select>
        <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="open">Open</option><option value="ack">Acknowledged</option><option value="snoozed">Snoozed</option>
        </select>
        <span className="muted" style={{marginLeft:'auto',fontSize:12}}>{filtered.length} alerts · click row to inspect</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Sev</th><th>Alert</th><th>Tenant</th><th>Resource</th><th>Status</th><th>Owner</th><th>Triggered</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="clickable" onClick={() => setSelected(a)}>
                  <td><span className={`sev ${a.sev}`}>{a.sev === 'crit' ? 'Critical' : a.sev === 'high' ? 'High' : a.sev === 'med' ? 'Medium' : 'Low'}</span></td>
                  <td>
                    <div style={{fontWeight:500,fontSize:13}}>{a.rule}</div>
                    <div className="mono dim" style={{fontSize:11}}>{a.id}</div>
                  </td>
                  <td>{a.tenant}</td>
                  <td className="mono dim" style={{fontSize:12}}>{a.resource}</td>
                  <td>
                    <span className={`pill ${a.status==='open'?'danger':a.status==='ack'?'info':'warn'}`}>
                      <span className="dot" />{a.status === 'open' ? 'Open' : a.status === 'ack' ? 'Acknowledged' : 'Snoozed'}
                    </span>
                  </td>
                  <td>{a.owner ? <span className="mono" style={{fontSize:12}}>{a.owner}</span> : <span className="dim" style={{fontSize:11}}>—</span>}</td>
                  <td className="dim" style={{fontSize:12}}>{a.when}</td>
                  <td>
                    <div className="row" style={{gap:4}} onClick={e => e.stopPropagation()}>
                      {a.status === 'open' && <button className="btn btn-sm">Ack</button>}
                      <button className="btn btn-sm btn-ghost" onClick={() => setSelected(a)}><Icon name="eye" size={12} /></button>
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
};

const AlertDrawer = ({ alert, onClose }) => {
  const sevLabel = alert.sev === 'crit' ? 'Critical' : alert.sev === 'high' ? 'High' : alert.sev === 'med' ? 'Medium' : 'Low';
  const related = ALERTS.filter(a => a.id !== alert.id && (a.tenant === alert.tenant || a.rule === alert.rule)).slice(0, 4);
  // Generate a deterministic timeline
  const timeline = [
    { when: alert.when, actor: 'Defender for Cloud', text: 'Alert raised', icon: 'alert-triangle', color: 'var(--danger)' },
    { when: '7m ago', actor: 'system', text: 'Notification dispatched (PagerDuty + Slack)', icon: 'bell', color: 'var(--info)' },
    { when: '6m ago', actor: 'system', text: 'Auto-snapshot of resource state captured', icon: 'database', color: 'var(--text-muted)' },
    ...(alert.owner ? [{ when: '4m ago', actor: alert.owner, text: 'Acknowledged · investigating', icon: 'check', color: 'var(--ok)' }] : []),
    ...(alert.status === 'ack' ? [{ when: '2m ago', actor: alert.owner, text: 'Comment: "Reviewing logs in workspace eus-prod-law"', icon: 'message', color: 'var(--text-muted)' }] : []),
  ];
  // Severity-specific impact text
  const impactText = {
    crit: 'Production data exposure risk · regulatory implications (SOC 2, ISO 27001)',
    high: 'Production attack surface · could lead to data exposure if exploited',
    med:  'Configuration drift · may reduce defense-in-depth posture',
    low:  'Hygiene · operational best practice not yet met',
  }[alert.sev];
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{display:'flex',alignItems:'flex-start',gap:12,flex:1,minWidth:0}}>
            <span className={`sev ${alert.sev}`} style={{flex:'none'}}>{sevLabel}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:16,fontWeight:600,lineHeight:1.3}}>{alert.rule}</div>
              <div className="mono dim" style={{fontSize:11,marginTop:2}}>{alert.id} · raised {alert.when}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section">
            <div className="row" style={{gap:8,marginBottom:14}}>
              {alert.status === 'open' && <button className="btn btn-primary"><Icon name="check" size={12} />Acknowledge</button>}
              {alert.status === 'open' && <button className="btn"><Icon name="users" size={12} />Assign</button>}
              <button className="btn"><Icon name="clock" size={12} />Snooze</button>
              <button className="btn"><Icon name="external-link" size={12} />Open in Defender</button>
              <button className="btn btn-ghost" style={{marginLeft:'auto'}}><Icon name="x" size={12} />Resolve</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,padding:'14px',background:'var(--bg-hover)',borderRadius:8,fontSize:12}}>
              <div><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>Tenant</div><div style={{fontWeight:500}}>{alert.tenant}</div></div>
              <div><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>Resource</div><div className="mono">{alert.resource}</div></div>
              <div><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>Owner</div><div className="mono">{alert.owner || 'Unassigned'}</div></div>
              <div><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>Status</div><div><span className={`pill ${alert.status==='open'?'danger':'info'}`}><span className="dot" />{alert.status}</span></div></div>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Impact</div>
            <div style={{padding:'12px 14px',background:'rgba(248,113,113,.08)',borderLeft:'3px solid var(--danger)',borderRadius:4,fontSize:13,lineHeight:1.5}}>
              {impactText}
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Recommended Remediation</div>
            <ol style={{margin:0,padding:'0 0 0 4px',fontSize:13,lineHeight:1.7,listStyle:'none',counterReset:'step'}}>
              {[
                'Validate impact in non-production first (snapshot taken at 03:14 UTC).',
                'Run remediation playbook: Apply baseline policy template POL-008 to affected scope.',
                'Verify TLS/auth telemetry in Log Analytics workspace eus-prod-law.',
                'Mark alert as resolved with verification evidence attached.',
              ].map((s,i) => (
                <li key={i} style={{display:'flex',gap:10,marginBottom:8}}>
                  <span style={{flex:'none',width:22,height:22,borderRadius:'50%',background:'var(--accent)',color:'#fff',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center'}}>{i+1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="row" style={{gap:6,marginTop:10}}>
              <button className="btn btn-sm btn-primary"><Icon name="play" size={12} />Run playbook</button>
              <button className="btn btn-sm"><Icon name="sparkles" size={12} />Generate Bicep fix</button>
              <button className="btn btn-sm"><Icon name="file-text" size={12} />View full runbook</button>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Timeline</div>
            <div style={{position:'relative',paddingLeft:24}}>
              <div style={{position:'absolute',left:9,top:6,bottom:6,width:2,background:'var(--border)'}} />
              {timeline.map((e,i) => (
                <div key={i} style={{position:'relative',paddingBottom:14,marginLeft:0}}>
                  <div style={{position:'absolute',left:-23,top:2,width:20,height:20,borderRadius:'50%',background:'var(--bg-hover)',border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',color:e.color}}>
                    <Icon name={e.icon} size={10} />
                  </div>
                  <div style={{fontSize:12,fontWeight:500}}>{e.text}</div>
                  <div className="dim" style={{fontSize:11,marginTop:1}}><span className="mono">{e.actor}</span> · {e.when}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Related Alerts</div>
            {related.length === 0 ? <div className="dim" style={{fontSize:12}}>No related alerts in last 7 days.</div> : (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {related.map(r => (
                  <div key={r.id} className="related-alert">
                    <span className={`sev ${r.sev}`} style={{flex:'none',minWidth:60}}>{r.sev === 'crit' ? 'Critical' : r.sev === 'high' ? 'High' : r.sev === 'med' ? 'Medium' : 'Low'}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13}}>{r.rule}</div>
                      <div className="mono dim" style={{fontSize:11}}>{r.id} · {r.tenant}</div>
                    </div>
                    <span className="dim" style={{fontSize:11}}>{r.when}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Activity & Comments</div>
            <textarea className="input" placeholder="Add a comment, mention @user…" rows="2" style={{width:'100%',resize:'vertical',fontFamily:'inherit',fontSize:13}}></textarea>
            <div className="row" style={{justifyContent:'flex-end',gap:6,marginTop:6}}>
              <button className="btn btn-sm btn-ghost">Attach</button>
              <button className="btn btn-sm btn-primary">Comment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================== EXPANDED REPORTS ===================
const REPORT_TEMPLATES = [
  { id: 'exec', name: 'Executive Summary', desc: 'Spend, savings, posture · 2 pages', icon: 'file-text', kind: 'executive' },
  { id: 'cost', name: 'Cost & Savings Deep Dive', desc: 'Per-resource breakdown', icon: 'piggy-bank', kind: 'cost' },
  { id: 'comp', name: 'Compliance & Audit', desc: 'Policy state + exceptions', icon: 'shield-check', kind: 'compliance' },
  { id: 'tag', name: 'Tag Governance', desc: 'Untagged + violations', icon: 'tag', kind: 'tag' },
  { id: 'sla', name: 'SLA / Uptime', desc: 'Per-tenant 30/90 day', icon: 'activity', kind: 'sla' },
];

const ReportsPage = () => {
  const [previewing, setPreviewing] = useState(null);
  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Reports</h1><p className="page-sub">Build, schedule, and white-label customer reports · click any template to preview</p></div>
        <div className="page-actions">
          <button className="btn"><Icon name="palette" size={14} />Branding</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} />New report</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="Reports Generated" value="142" delta="+18 this month" deltaDir="up" sub="all tenants" sparkColor="var(--accent)" spark={[20,28,32,40,52,68,82,98]} />
        <KPI label="Scheduled" value="14" delta="3 customer-facing" sub="" />
        <KPI label="Avg Open Rate" value="76%" delta="+4pp" deltaDir="up" sub="customers reading reports" sparkColor="var(--ok)" />
        <KPI label="Branded" value="9 of 14" delta="white-labeled" sub="" sparkColor="var(--accent-3)" />
      </div>

      <div style={{marginBottom:16}}>
        <div className="muted" style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>Templates · click to preview</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:10}}>
          {REPORT_TEMPLATES.map(tpl => (
            <button key={tpl.id} className="report-template-card" onClick={() => setPreviewing(tpl)}>
              <div className="report-template-icon"><Icon name={tpl.icon} size={18} /></div>
              <div style={{flex:1,minWidth:0,textAlign:'left'}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{tpl.name}</div>
                <div className="dim" style={{fontSize:11,marginTop:1}}>{tpl.desc}</div>
              </div>
              <Icon name="eye" size={14} className="dim" />
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Scheduled Reports</div><span className="muted mono" style={{fontSize:11}}>Next run: 1 Jun · 06:00 UTC</span></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Report</th><th>Recipients</th><th>Schedule</th><th>Format</th><th>Last sent</th><th>Open rate</th><th></th></tr></thead>
            <tbody>
              {[
                ['Monthly Cost Review','Executive Summary','3 customers','1st of month','PDF + CSV','1 May 06:00','82%'],
                ['Compliance Posture (CISO)','Compliance & Audit','sarah.chen, ciso@*','Weekly Mon','PDF','5 May 08:00','94%'],
                ['Savings Realized','Cost & Savings','customer.cfo@*','Quarterly','PDF','1 Apr 09:00','71%'],
                ['Security Incidents','Custom','ops@aegiscloud.io','Daily','Email','5 May 07:00','68%'],
                ['Tag Governance','Tag Governance','jamie.k','Weekly Fri','CSV','3 May 10:00','—'],
                ['SLA Quarterly','SLA / Uptime','customer.coo@*','Quarterly','PDF','1 Apr 09:00','79%'],
              ].map((r,i) => (
                <tr key={i}>
                  <td>
                    <div style={{fontWeight:500,fontSize:13}}>{r[0]}</div>
                    <div className="dim" style={{fontSize:11}}>from "{r[1]}"</div>
                  </td>
                  <td className="muted mono" style={{fontSize:12}}>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td><span className="pill">{r[4]}</span></td>
                  <td className="dim" style={{fontSize:12}}>{r[5]}</td>
                  <td className="mono tabular" style={{fontSize:12}}>{r[6]}</td>
                  <td><div className="row" style={{gap:4}}><button className="btn btn-sm btn-ghost"><Icon name="play" size={12} /></button><button className="btn btn-sm btn-ghost"><Icon name="edit" size={12} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewing && <ReportPreview tpl={previewing} onClose={() => setPreviewing(null)} />}
    </div>
  );
};

const ReportPreview = ({ tpl, onClose }) => {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 880, width:'90vw', height:'90vh', display:'flex', flexDirection:'column'}}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{tpl.name}</h2>
            <div className="muted" style={{fontSize:11}}>Preview · Meridian Capital · April 2026</div>
          </div>
          <div className="row" style={{gap:6}}>
            <button className="btn btn-sm"><Icon name="download" size={12} />PDF</button>
            <button className="btn btn-sm"><Icon name="download" size={12} />CSV</button>
            <button className="btn btn-sm btn-primary"><Icon name="bell" size={12} />Schedule</button>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
          </div>
        </div>
        <div className="modal-body" style={{flex:1,minHeight:0,overflowY:'auto',background:'var(--bg)',padding:0}}>
          <div className="report-page">
            {tpl.kind === 'executive' && <ExecReport />}
            {tpl.kind === 'cost' && <CostReport />}
            {tpl.kind === 'compliance' && <ComplianceReport />}
            {tpl.kind === 'tag' && <TagReport />}
            {tpl.kind === 'sla' && <SLAReport />}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportHeader = ({ title, subtitle }) => (
  <>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,paddingBottom:16,borderBottom:'2px solid var(--border)'}}>
      <div className="row" style={{gap:12}}>
        <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,#1e3a8a,#3b82f6)'}} />
        <div>
          <div style={{fontWeight:700,fontSize:16}}>Meridian Capital · Cloud Report</div>
          <div className="muted" style={{fontSize:11}}>Powered by Aegis Cloud</div>
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        <div className="mono" style={{fontSize:11,color:'var(--text-muted)'}}>April 2026</div>
        <div className="mono" style={{fontSize:11,color:'var(--text-muted)'}}>Generated 1 May 2026</div>
      </div>
    </div>
    <h1 style={{fontSize:24,margin:'0 0 4px',fontWeight:700}}>{title}</h1>
    {subtitle && <p className="muted" style={{margin:'0 0 24px',fontSize:13}}>{subtitle}</p>}
  </>
);

const ExecReport = () => (
  <>
    <ReportHeader title="Executive Summary" subtitle="High-level snapshot of cloud posture · for distribution to leadership" />
    <div className="report-section">
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
        {[
          ['Monthly Spend','$142,881','+4.2% vs Mar','var(--accent)'],
          ['Compliance','94%','+2pp','var(--ok)'],
          ['Savings YTD','$28,140','14 actions','var(--accent-3)'],
          ['SLA','99.97%','no incidents','var(--ok)'],
        ].map(k => (
          <div key={k[0]} className="report-stat">
            <div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>{k[0]}</div>
            <div className="mono tabular" style={{fontSize:22,fontWeight:600}}>{k[1]}</div>
            <div style={{fontSize:11,color:k[3],marginTop:2}}>{k[2]}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Highlights</h2>
      <ul style={{margin:0,padding:'0 0 0 20px',fontSize:13,lineHeight:1.7}}>
        <li>Spend up 4.2% MoM — driven primarily by new SQL DB warehouse provisioning in West Europe.</li>
        <li>Compliance score improved 2pp — TLS enforcement remediation completed across 12 App Services.</li>
        <li>Identified $1,840/mo additional savings via reserved instance recommendations.</li>
        <li>Zero critical incidents this period · MTTR avg 42 min · down 18% from Q1.</li>
      </ul>
    </div>

    <div className="report-section" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div>
        <h2 className="report-h2">Spend Trend</h2>
        <div style={{height:140,padding:'12px 0'}}>
          <ReportLineChart data={SPEND_TREND.slice(-6).map(v => v * 0.05)} />
        </div>
        <div className="muted" style={{fontSize:11,marginTop:6}}>Last 6 months · USD</div>
      </div>
      <div>
        <h2 className="report-h2">Service Mix</h2>
        <div className="donut-wrap" style={{padding:'8px 0'}}>
          <Donut size={120} thickness={16} segments={RESOURCE_BREAKDOWN.slice(0,5).map(s => ({...s, value: s.value * 0.05}))} />
          <div className="legend">
            {RESOURCE_BREAKDOWN.slice(0,5).map(s => (
              <div key={s.name} className="legend-item">
                <span className="legend-swatch" style={{background:s.color}} />
                <span>{s.name}</span>
                <span className="muted mono tabular">{((s.value/RESOURCE_BREAKDOWN.reduce((a,b)=>a+b.value,0))*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Top Recommendations</h2>
      <table className="table" style={{fontSize:12}}>
        <thead><tr><th>Action</th><th>Resource</th><th>Risk</th><th style={{textAlign:'right'}}>Monthly Save</th></tr></thead>
        <tbody>
          <tr><td>Reserved Instance · 3yr</td><td className="mono dim">sqldb-warehouse-01</td><td><span className="pill warn"><span className="dot" />med</span></td><td style={{textAlign:'right'}} className="mono tabular">$1,840</td></tr>
          <tr><td>Right-size VM</td><td className="mono dim">vm-prod-app-04</td><td><span className="pill ok"><span className="dot" />low</span></td><td style={{textAlign:'right'}} className="mono tabular">$412</td></tr>
          <tr><td>Storage tier · Hot → Cool</td><td className="mono dim">storage-archive</td><td><span className="pill ok"><span className="dot" />low</span></td><td style={{textAlign:'right'}} className="mono tabular">$248</td></tr>
        </tbody>
      </table>
    </div>

    <div className="report-footer">
      <span>Aegis Cloud · MSP Console</span><span className="mono">Page 1 of 2 · CONFIDENTIAL</span>
    </div>
  </>
);

const CostReport = () => (
  <>
    <ReportHeader title="Cost & Savings Deep Dive" subtitle="Per-service and per-resource cost decomposition" />
    <div className="report-section">
      <h2 className="report-h2">Spend by Service · April 2026</h2>
      <table className="table" style={{fontSize:12}}>
        <thead><tr><th>Service</th><th style={{textAlign:'right'}}>Spend</th><th style={{textAlign:'right'}}>Δ MoM</th><th style={{textAlign:'right'}}>% of total</th><th>Trend</th></tr></thead>
        <tbody>
          {[
            ['Compute · VMs', 58420, '+3.2%', 41, [40,42,45,52,48,55,58]],
            ['SQL Databases', 31206, '+12.1%', 22, [20,22,25,28,30,29,31]],
            ['Storage', 18402, '−2.8%', 13, [22,21,20,19,19,18,18]],
            ['App Services', 14288, '+1.4%', 10, [12,13,13,14,14,14,14]],
            ['Networking', 11430, '0.0%', 8, [11,11,11,11,11,11,11]],
            ['AI / ML', 9135, '+24.6%', 6, [3,4,5,6,7,8,9]],
          ].map((r,i) => (
            <tr key={i}>
              <td style={{fontWeight:500}}>{r[0]}</td>
              <td style={{textAlign:'right'}} className="mono tabular">{fmtMoney(r[1])}</td>
              <td className="mono tabular" style={{textAlign:'right',color:r[2].startsWith('+')?'var(--danger)':r[2].startsWith('−')?'var(--ok)':'var(--text-muted)'}}>{r[2]}</td>
              <td style={{textAlign:'right'}} className="mono tabular dim">{r[3]}%</td>
              <td><Sparkline data={r[4]} w={80} h={20} color="var(--accent)" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Top Resources by Cost</h2>
      <table className="table" style={{fontSize:12}}>
        <thead><tr><th>Resource</th><th>Type</th><th>Subscription</th><th style={{textAlign:'right'}}>Spend</th></tr></thead>
        <tbody>
          {[
            ['vm-prod-app-04','VM · D8s_v5','prod-eus',8240],
            ['sqldb-warehouse-01','SQL DB · S6','prod-weu',6920],
            ['aks-prod','AKS · 12 nodes','prod-eus',4810],
            ['storage-data-archive','Storage · Premium','prod-eus',2480],
            ['cosmos-shared','Cosmos DB · 4000 RU','prod-eus',1840],
          ].map((r,i) => (
            <tr key={i}>
              <td className="mono">{r[0]}</td>
              <td className="muted">{r[1]}</td>
              <td className="mono dim" style={{fontSize:11}}>{r[2]}</td>
              <td style={{textAlign:'right'}} className="mono tabular">{fmtMoney(r[3])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Savings Opportunities</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
        {[
          ['$1,840/mo','Reserved Instance','sqldb-warehouse-01','var(--ok)'],
          ['$412/mo','Right-size VM','vm-prod-app-04','var(--ok)'],
          ['$680/mo','Auto-shutdown','vmss-batch-04','var(--warn)'],
        ].map(s => (
          <div key={s[1]} style={{padding:14,background:'var(--bg-hover)',borderRadius:8,borderLeft:'3px solid '+s[3]}}>
            <div className="mono tabular" style={{fontSize:18,fontWeight:600,color:s[3]}}>{s[0]}</div>
            <div style={{fontSize:12,fontWeight:500,marginTop:2}}>{s[1]}</div>
            <div className="dim mono" style={{fontSize:11}}>{s[2]}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="report-footer">
      <span>Aegis Cloud · Cost Report</span><span className="mono">CONFIDENTIAL</span>
    </div>
  </>
);

const ComplianceReport = () => (
  <>
    <ReportHeader title="Compliance & Audit Posture" subtitle="Policy state · April 2026 · for CISO review" />
    <div className="report-section" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:18}}>
      <div className="report-stat" style={{borderLeft:'3px solid var(--ok)'}}>
        <div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Compliance Score</div>
        <div className="mono tabular" style={{fontSize:24,fontWeight:600,color:'var(--ok)'}}>94%</div>
        <div style={{fontSize:11,color:'var(--ok)'}}>+2pp vs March</div>
      </div>
      <div className="report-stat" style={{borderLeft:'3px solid var(--warn)'}}>
        <div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Open Violations</div>
        <div className="mono tabular" style={{fontSize:24,fontWeight:600,color:'var(--warn)'}}>23</div>
        <div className="muted" style={{fontSize:11}}>across 4 policies</div>
      </div>
      <div className="report-stat" style={{borderLeft:'3px solid var(--accent)'}}>
        <div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Frameworks</div>
        <div className="mono tabular" style={{fontSize:24,fontWeight:600}}>4</div>
        <div className="muted" style={{fontSize:11}}>SOC 2 · ISO 27001 · CIS · NIST</div>
      </div>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Policy State by Severity</h2>
      <table className="table" style={{fontSize:12}}>
        <thead><tr><th>Policy</th><th>Severity</th><th style={{textAlign:'right'}}>Compliant</th><th style={{textAlign:'right'}}>Non-compliant</th><th>State</th></tr></thead>
        <tbody>
          {[
            ['Require encryption for SQL DBs','crit',24,2,'Action Required'],
            ['Storage accounts must use HTTPS','crit',18,0,'Compliant'],
            ['AKS clusters must use RBAC','crit',3,0,'Compliant'],
            ['No public IP on VMs','high',47,3,'Action Required'],
            ['NSG required on subnets','high',14,0,'Compliant'],
            ['App Service min TLS 1.2','high',12,0,'Compliant'],
            ['VMs must use managed disks','med',38,2,'Tracking'],
            ['Required tags','med',182,16,'Tracking'],
          ].map((r,i) => (
            <tr key={i}>
              <td>{r[0]}</td>
              <td><span className={`sev ${r[1]}`}>{r[1] === 'crit' ? 'Critical' : r[1] === 'high' ? 'High' : 'Medium'}</span></td>
              <td style={{textAlign:'right'}} className="mono tabular">{r[2]}</td>
              <td className="mono tabular" style={{textAlign:'right',color:r[3]>0?'var(--danger)':'var(--text-muted)'}}>{r[3]}</td>
              <td><span className={`pill ${r[4]==='Compliant'?'ok':r[4]==='Action Required'?'danger':'warn'}`}><span className="dot" />{r[4]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Active Exemptions</h2>
      <table className="table" style={{fontSize:12}}>
        <thead><tr><th>Resource</th><th>Policy</th><th>Reason</th><th>Expires</th></tr></thead>
        <tbody>
          <tr><td className="mono">sqldb-legacy-01</td><td>Encryption</td><td>Migration window — Q3</td><td className="dim">30 Sep 2026</td></tr>
          <tr><td className="mono">vm-vendor-nat</td><td>No public IP</td><td>Vendor appliance · firewalled</td><td className="dim">Permanent</td></tr>
          <tr><td className="mono">storage-public-assets</td><td>HTTPS only</td><td>CDN origin · public by design</td><td className="dim">Permanent</td></tr>
        </tbody>
      </table>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Framework Coverage</h2>
      {[
        ['SOC 2 Type II', 96, 'var(--ok)'],
        ['ISO 27001:2022', 92, 'var(--ok)'],
        ['CIS Azure Benchmark', 88, 'var(--warn)'],
        ['NIST 800-53', 91, 'var(--ok)'],
      ].map(f => (
        <div key={f[0]} style={{display:'flex',alignItems:'center',gap:14,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
          <span style={{fontSize:12,fontWeight:500,minWidth:160}}>{f[0]}</span>
          <div className="bar" style={{flex:1,height:8}}><span style={{width:f[1]+'%',background:f[2]}}/></div>
          <span className="mono tabular" style={{fontSize:12,fontWeight:600,color:f[2],minWidth:40,textAlign:'right'}}>{f[1]}%</span>
        </div>
      ))}
    </div>

    <div className="report-footer">
      <span>Aegis Cloud · Compliance Report</span><span className="mono">CONFIDENTIAL · CISO ONLY</span>
    </div>
  </>
);

const TagReport = () => (
  <>
    <ReportHeader title="Tag Governance" subtitle="Tag coverage and untagged resources · April 2026" />
    <div className="report-section" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
      <div className="report-stat"><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Coverage</div><div className="mono tabular" style={{fontSize:22,fontWeight:600,color:'var(--ok)'}}>89%</div><div style={{fontSize:11,color:'var(--ok)'}}>+3pp</div></div>
      <div className="report-stat"><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Untagged</div><div className="mono tabular" style={{fontSize:22,fontWeight:600,color:'var(--warn)'}}>26</div><div className="muted" style={{fontSize:11}}>resources</div></div>
      <div className="report-stat"><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Cost Allocated</div><div className="mono tabular" style={{fontSize:22,fontWeight:600}}>83%</div><div className="muted" style={{fontSize:11}}>of spend</div></div>
      <div className="report-stat"><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Required Tags</div><div className="mono tabular" style={{fontSize:22,fontWeight:600}}>4</div><div className="muted" style={{fontSize:11}}>enforced</div></div>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Required Tag Coverage</h2>
      {[
        ['cost-center', 89, 26],
        ['owner', 95, 12],
        ['environment', 99, 2],
        ['data-classification', 67, 78],
      ].map(r => (
        <div key={r[0]} style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
          <div className="between" style={{marginBottom:6}}>
            <span className="mono" style={{fontSize:13,fontWeight:500}}>{r[0]}</span>
            <span className="mono tabular" style={{fontSize:13,fontWeight:600,color: r[1] > 85 ? 'var(--ok)' : 'var(--warn)'}}>{r[1]}%</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div className="bar" style={{flex:1,height:6}}><span style={{width: r[1] + '%', background: r[1] > 85 ? 'var(--ok)' : 'var(--warn)'}}/></div>
            <span className="mono dim" style={{fontSize:11,minWidth:80,textAlign:'right'}}>{r[2]} missing</span>
          </div>
        </div>
      ))}
    </div>

    <div className="report-section">
      <h2 className="report-h2">Spend by Cost Center</h2>
      <table className="table" style={{fontSize:12}}>
        <thead><tr><th>cost-center</th><th>Owner</th><th style={{textAlign:'right'}}>Resources</th><th style={{textAlign:'right'}}>Spend</th></tr></thead>
        <tbody>
          {[
            ['CC-1001 · Engineering','d.brooks',142,fmtMoney(48402)],
            ['CC-1002 · Data Platform','m.singh',58,fmtMoney(31206)],
            ['CC-1003 · Marketing','j.lee',24,fmtMoney(12480)],
            ['CC-1004 · Operations','t.ribeiro',47,fmtMoney(28140)],
            ['(unallocated)','—',26,fmtMoney(22653)],
          ].map((r,i) => (
            <tr key={i}>
              <td className={`mono ${i===4?'dim':''}`}>{r[0]}</td>
              <td className="mono">{r[1]}</td>
              <td style={{textAlign:'right'}} className="mono tabular">{r[2]}</td>
              <td style={{textAlign:'right'}} className="mono tabular">{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="report-footer"><span>Aegis Cloud · Tag Report</span><span className="mono">CONFIDENTIAL</span></div>
  </>
);

const SLAReport = () => (
  <>
    <ReportHeader title="Service Level Performance" subtitle="Uptime and incident response · April 2026" />
    <div className="report-section" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
      <div className="report-stat"><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Uptime (30d)</div><div className="mono tabular" style={{fontSize:22,fontWeight:600,color:'var(--ok)'}}>99.97%</div><div style={{fontSize:11,color:'var(--ok)'}}>Above SLA</div></div>
      <div className="report-stat"><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Downtime</div><div className="mono tabular" style={{fontSize:22,fontWeight:600}}>13m</div><div className="muted" style={{fontSize:11}}>across 30 days</div></div>
      <div className="report-stat"><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>Incidents</div><div className="mono tabular" style={{fontSize:22,fontWeight:600}}>2</div><div className="muted" style={{fontSize:11}}>0 P1 · 2 P2</div></div>
      <div className="report-stat"><div className="muted" style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>MTTR</div><div className="mono tabular" style={{fontSize:22,fontWeight:600,color:'var(--ok)'}}>42m</div><div style={{fontSize:11,color:'var(--ok)'}}>↓ 18%</div></div>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Daily Uptime · Last 30 days</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(30,1fr)',gap:3,padding:'8px 0'}}>
        {range(30).map(i => {
          const isIncident = i === 11 || i === 23;
          return (
            <div key={i} style={{aspectRatio:'1',background: isIncident ? 'var(--warn)' : 'var(--ok)',borderRadius:2}} title={`Day ${i+1}: ${isIncident ? '99.84%' : '100%'}`} />
          );
        })}
      </div>
      <div className="muted" style={{fontSize:11,textAlign:'center',marginTop:6}}>2 days with incidents · 28 days at 100%</div>
    </div>

    <div className="report-section">
      <h2 className="report-h2">Incidents This Period</h2>
      <table className="table" style={{fontSize:12}}>
        <thead><tr><th>Incident</th><th>Severity</th><th>Started</th><th>Duration</th><th>Resource</th><th>Resolution</th></tr></thead>
        <tbody>
          <tr>
            <td className="mono">INC-3041</td>
            <td><span className="sev high">P2</span></td>
            <td className="dim">12 Apr 14:22 UTC</td>
            <td className="mono tabular">8m</td>
            <td className="mono dim">app-svc-checkout</td>
            <td>Auto-failover to West Europe</td>
          </tr>
          <tr>
            <td className="mono">INC-3038</td>
            <td><span className="sev high">P2</span></td>
            <td className="dim">24 Apr 03:11 UTC</td>
            <td className="mono tabular">5m</td>
            <td className="mono dim">sqldb-warehouse-01</td>
            <td>Connection pool exhaustion · capacity bumped</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="report-section">
      <h2 className="report-h2">SLA Performance by Service</h2>
      {[
        ['Compute',99.99,'≥ 99.95%','var(--ok)'],
        ['SQL Databases',99.97,'≥ 99.95%','var(--ok)'],
        ['App Services',99.94,'≥ 99.95%','var(--warn)'],
        ['Storage',99.99,'≥ 99.9%','var(--ok)'],
        ['Networking',100.00,'≥ 99.95%','var(--ok)'],
      ].map(r => (
        <div key={r[0]} style={{display:'flex',alignItems:'center',gap:14,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
          <span style={{fontSize:12,fontWeight:500,minWidth:140}}>{r[0]}</span>
          <span className="mono tabular" style={{fontSize:13,fontWeight:600,color:r[3]}}>{r[1].toFixed(2)}%</span>
          <span className="muted" style={{fontSize:11}}>target {r[2]}</span>
          <span className={`pill ${r[3]==='var(--ok)'?'ok':'warn'}`} style={{marginLeft:'auto'}}>{r[3]==='var(--ok)' ? 'Met' : 'Below'}</span>
        </div>
      ))}
    </div>

    <div className="report-footer"><span>Aegis Cloud · SLA Report</span><span className="mono">CONFIDENTIAL</span></div>
  </>
);

const ReportLineChart = ({ data }) => {
  const max = Math.max(...data); const min = Math.min(...data);
  const w = 480, h = 120;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h - ((v-min)/(max-min||1))*h*.85 - h*.075}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(59,130,246,.15)" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {data.map((v,i) => {
        const x = (i/(data.length-1))*w;
        const y = h - ((v-min)/(max-min||1))*h*.85 - h*.075;
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
      })}
    </svg>
  );
};

// =================== EXPANDED CUSTOMER PORTAL ===================
const PortalPage = () => {
  const [portalTab, setPortalTab] = useState('home');
  const tenant = TENANTS.find(t => t.name === 'Meridian Capital') || TENANTS[2];
  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Customer Portal Preview</h1><p className="page-sub">White-labeled view your customers see · viewing as <strong>Lena Hofmann</strong> from {tenant.name}</p></div>
        <div className="page-actions">
          <select className="select"><option>{tenant.name}</option>{TENANTS.slice(0,5).map(t => <option key={t.id}>{t.name}</option>)}</select>
          <button className="btn"><Icon name="palette" size={14} />Branding</button>
          <button className="btn btn-primary"><Icon name="external-link" size={14} />Open as customer</button>
        </div>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="browser-chrome">
          <div style={{display:'flex',gap:6}}>
            <div className="dot-r" /><div className="dot-y" /><div className="dot-g" />
          </div>
          <div className="mono" style={{fontSize:12,color:'var(--text-muted)',marginLeft:12}}>https://meridiancap.aegiscloud.io</div>
          <span className="pill ok" style={{marginLeft:'auto'}}><Icon name="lock" size={10} />SSL</span>
        </div>
        <div className="portal-shell">
          <div className="portal-header">
            <div className="row" style={{gap:12}}>
              <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:14}}>M</div>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>Meridian Capital · Cloud</div>
                <div className="muted" style={{fontSize:11}}>Powered by Aegis</div>
              </div>
            </div>
            <div className="row" style={{gap:8}}>
              <span className="pill ok"><span className="dot" />All systems healthy</span>
              <button className="icon-btn"><Icon name="bell" size={14} /></button>
              <div className="avatar">LH</div>
            </div>
          </div>

          <div className="portal-tabs">
            {[
              ['home','Dashboard','home'],
              ['cost','Cost & Spend','piggy-bank'],
              ['posture','Security & Compliance','shield'],
              ['support','Support','message'],
              ['billing','Billing','receipt'],
              ['team','Team','users'],
            ].map(([id,label,icon]) => (
              <button key={id} className={`portal-tab ${portalTab === id ? 'active' : ''}`} onClick={() => setPortalTab(id)}>
                <Icon name={icon} size={13} />{label}
              </button>
            ))}
          </div>

          <div className="portal-body">
            {portalTab === 'home' && <PortalHome tenant={tenant} />}
            {portalTab === 'cost' && <PortalCost tenant={tenant} />}
            {portalTab === 'posture' && <PortalPosture tenant={tenant} />}
            {portalTab === 'support' && <PortalSupport />}
            {portalTab === 'billing' && <PortalBilling />}
            {portalTab === 'team' && <PortalTeam />}
          </div>
        </div>
      </div>
    </div>
  );
};

const PortalHome = ({ tenant }) => (
  <>
    <h2 style={{margin:'0 0 4px',fontSize:22,fontWeight:700}}>Welcome back, Lena</h2>
    <p className="muted" style={{margin:'0 0 22px',fontSize:13}}>Your Azure environment at a glance</p>

    <div className="kpi-grid">
      <KPI label="This Month" value="$142,881" delta="+4.2%" deltaDir="up" sub="vs last month" sparkColor="var(--accent)" spark={[100,110,120,118,125,130,135,142]} />
      <KPI label="Compliance" value="94%" delta="+2pp" deltaDir="up" sub="" sparkColor="var(--ok)" spark={[88,89,90,91,92,93,94,94]} />
      <KPI label="Open Tickets" value="2" delta="1 in progress" sub="" sparkColor="var(--info)" spark={[5,4,3,2,3,2,3,2]} />
      <KPI label="Savings YTD" value="$28,140" delta="14 actions applied" deltaDir="up" sub="" sparkColor="var(--accent-3)" spark={[2,5,8,12,16,20,24,28]} />
    </div>

    <div className="split-2-1" style={{marginTop:16}}>
      <div className="card">
        <div className="card-header"><div className="card-title">Recent Activity</div><button className="btn btn-sm btn-ghost">View all</button></div>
        <div style={{padding:'4px 0'}}>
          {[
            ['check', 'Savings applied', 'Reserved Instance · sqldb-warehouse-01 · saving $1,840/mo','2h ago','var(--ok)'],
            ['file-text', 'Monthly cost report ready', 'April 2026 · executive summary','1d ago','var(--accent)'],
            ['shield-check', 'Compliance check passed', 'POL-001 · Encryption for SQL DBs','2d ago','var(--ok)'],
            ['bell', 'Alert resolved', 'TLS < 1.2 on app-svc-checkout · auto-remediated','3d ago','var(--info)'],
            ['users', 'New user invited', 'm.singh@meridiancap.com · Tenant Admin','5d ago','var(--text-muted)'],
          ].map((a,i) => (
            <div key={i} style={{padding:'12px 16px',borderBottom: i < 4 ? '1px solid var(--border)' : 'none',display:'flex',gap:12}}>
              <div style={{flex:'none',width:28,height:28,borderRadius:'50%',background:'var(--bg-hover)',display:'flex',alignItems:'center',justifyContent:'center',color:a[4]}}><Icon name={a[0]} size={13} /></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500}}>{a[1]}</div>
                <div className="dim" style={{fontSize:11,marginTop:1}}>{a[2]}</div>
              </div>
              <div className="dim" style={{fontSize:11,whiteSpace:'nowrap'}}>{a[3]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Pending Approvals</div><span className="muted mono" style={{fontSize:11}}>2</span></div>
        <div style={{padding:14}}>
          <div style={{padding:14,background:'var(--bg-hover)',borderRadius:8,marginBottom:10,border:'1px solid var(--border)'}}>
            <div className="pill ok" style={{marginBottom:6}}>Saving $1,840/mo</div>
            <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>Reserved Instance · 3yr</div>
            <div className="dim mono" style={{fontSize:11,marginBottom:10}}>sqldb-warehouse-01 · medium risk</div>
            <div className="row" style={{gap:6}}>
              <button className="btn btn-sm btn-primary" style={{flex:1}}>Approve</button>
              <button className="btn btn-sm" style={{flex:1}}>Defer</button>
            </div>
          </div>
          <div style={{padding:14,background:'var(--bg-hover)',borderRadius:8,border:'1px solid var(--border)'}}>
            <div className="pill warn" style={{marginBottom:6}}>Policy exemption</div>
            <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>storage-public-assets</div>
            <div className="dim" style={{fontSize:11,marginBottom:10}}>HTTPS-only exemption · CDN origin · permanent</div>
            <div className="row" style={{gap:6}}>
              <button className="btn btn-sm btn-primary" style={{flex:1}}>Approve</button>
              <button className="btn btn-sm" style={{flex:1}}>Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

const PortalCost = ({ tenant }) => (
  <>
    <div className="between" style={{marginBottom:14}}>
      <div>
        <h2 style={{margin:'0 0 4px',fontSize:20}}>Cost & Spend</h2>
        <p className="muted" style={{margin:0,fontSize:12}}>Monthly invoice and where your spend goes</p>
      </div>
      <div className="row" style={{gap:6}}>
        <select className="select"><option>April 2026</option><option>March 2026</option></select>
        <button className="btn btn-sm"><Icon name="download" size={12} />CSV</button>
      </div>
    </div>

    <div className="kpi-grid">
      <KPI label="This Month" value="$142,881" delta="+4.2%" deltaDir="up" sub="vs March" sparkColor="var(--accent)" spark={[100,110,118,125,132,138,140,142]} />
      <KPI label="Forecast EOM" value="$148,200" delta="+3.7%" deltaDir="up" sub="based on trend" />
      <KPI label="Budget" value="$160,000" delta="89% used" sub="" sparkColor="var(--warn)" />
      <KPI label="Savings YTD" value="$28,140" delta="14 actions" deltaDir="up" sub="" sparkColor="var(--accent-3)" />
    </div>

    <div className="split-2-1" style={{marginTop:16}}>
      <div className="card">
        <div className="card-header"><div className="card-title">Daily Spend</div><span className="muted mono" style={{fontSize:11}}>April 2026</span></div>
        <div className="card-body" style={{padding:'16px 24px'}}>
          <SpendChart data={range(30).map(i => 4000 + ((i*7+13)%30)*120 + (i%7<5?1500:0))} />
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Where it goes</div></div>
        <div className="card-body">
          <div className="donut-wrap">
            <Donut size={140} thickness={18} segments={RESOURCE_BREAKDOWN.slice(0,5).map(s => ({...s, value: s.value*0.05}))} />
            <div className="legend">
              {RESOURCE_BREAKDOWN.slice(0,5).map(s => (
                <div key={s.name} className="legend-item">
                  <span className="legend-swatch" style={{background:s.color}} />
                  <span style={{minWidth:80}}>{s.name}</span>
                  <span className="muted mono tabular">{fmtMoneyK(s.value*0.05)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="card" style={{marginTop:16}}>
      <div className="card-header"><div className="card-title">Savings Recommendations</div><button className="btn btn-sm btn-primary"><Icon name="play" size={12} />Apply all low-risk</button></div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Recommendation</th><th>Resource</th><th>Risk</th><th style={{textAlign:'right'}}>Monthly</th><th></th></tr></thead>
          <tbody>
            <tr><td>Reserved Instance · 3yr</td><td className="mono dim">sqldb-warehouse-01</td><td><span className="pill warn"><span className="dot" />med</span></td><td className="mono tabular" style={{textAlign:'right',fontWeight:600,color:'var(--ok)'}}>−$1,840</td><td><button className="btn btn-sm">Review</button></td></tr>
            <tr><td>Right-size VM</td><td className="mono dim">vm-prod-app-04</td><td><span className="pill ok"><span className="dot" />low</span></td><td className="mono tabular" style={{textAlign:'right',fontWeight:600,color:'var(--ok)'}}>−$412</td><td><button className="btn btn-sm btn-primary">Approve</button></td></tr>
            <tr><td>Storage tier</td><td className="mono dim">storage-archive</td><td><span className="pill ok"><span className="dot" />low</span></td><td className="mono tabular" style={{textAlign:'right',fontWeight:600,color:'var(--ok)'}}>−$248</td><td><button className="btn btn-sm btn-primary">Approve</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </>
);

const PortalPosture = () => (
  <>
    <div style={{marginBottom:14}}>
      <h2 style={{margin:'0 0 4px',fontSize:20}}>Security & Compliance</h2>
      <p className="muted" style={{margin:0,fontSize:12}}>Posture across your Azure environment</p>
    </div>

    <div className="kpi-grid">
      <KPI label="Compliance Score" value="94%" delta="+2pp" deltaDir="up" sub="across all policies" sparkColor="var(--ok)" />
      <KPI label="Open Issues" value="3" delta="2 high · 1 med" deltaDir="down" sub="" sparkColor="var(--warn)" />
      <KPI label="MFA Coverage" value="100%" delta="all users" sub="" sparkColor="var(--ok)" />
      <KPI label="Frameworks" value="4 met" delta="SOC 2, ISO, CIS, NIST" sub="" />
    </div>

    <div className="card" style={{marginTop:16}}>
      <div className="card-header"><div className="card-title">Open Issues</div><span className="muted" style={{fontSize:11}}>Aegis is on it · ETA 24h</span></div>
      <div style={{padding:'4px 0'}}>
        {[
          ['high','TLS < 1.2 on app-svc-checkout','3 resources','Aegis remediation in progress','2h ago'],
          ['high','NSG flow logs disabled','vnet-prod-eus','Awaiting your approval','2h ago'],
          ['med','Storage soft-delete < 30 days','storage-audit-logs','Auto-fix queued for tonight','4h ago'],
        ].map((r,i) => (
          <div key={i} style={{padding:'14px 16px',borderBottom: i < 2 ? '1px solid var(--border)' : 'none',display:'flex',alignItems:'center',gap:12}}>
            <span className={`sev ${r[0]}`} style={{flex:'none',minWidth:60}}>{r[0]==='high'?'High':'Medium'}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500}}>{r[1]}</div>
              <div className="dim" style={{fontSize:11,marginTop:2}}><span className="mono">{r[2]}</span> · {r[3]}</div>
            </div>
            <span className="dim" style={{fontSize:11}}>{r[4]}</span>
            <button className="btn btn-sm">View</button>
          </div>
        ))}
      </div>
    </div>

    <div className="split-2-1" style={{marginTop:16}}>
      <div className="card">
        <div className="card-header"><div className="card-title">Framework Coverage</div></div>
        <div style={{padding:'4px 0'}}>
          {[
            ['SOC 2 Type II',96,'var(--ok)'],
            ['ISO 27001:2022',92,'var(--ok)'],
            ['CIS Azure Benchmark',88,'var(--warn)'],
            ['NIST 800-53',91,'var(--ok)'],
          ].map((f,i) => (
            <div key={f[0]} style={{padding:'14px 16px',borderBottom: i < 3 ? '1px solid var(--border)' : 'none'}}>
              <div className="between" style={{marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:500}}>{f[0]}</span>
                <span className="mono tabular" style={{fontSize:13,fontWeight:600,color:f[2]}}>{f[1]}%</span>
              </div>
              <div className="bar" style={{height:6}}><span style={{width:f[1]+'%',background:f[2]}}/></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Compliance Trend</div><span className="muted" style={{fontSize:11}}>last 6 months</span></div>
        <div className="card-body" style={{padding:'16px 20px'}}>
          <ReportLineChart data={[88,89,90,91,92,94]} />
          <div className="muted" style={{fontSize:11,textAlign:'center',marginTop:8}}>+6pp improvement since Nov 2025</div>
        </div>
      </div>
    </div>
  </>
);

const PortalSupport = () => (
  <>
    <div className="between" style={{marginBottom:14}}>
      <div>
        <h2 style={{margin:'0 0 4px',fontSize:20}}>Support</h2>
        <p className="muted" style={{margin:0,fontSize:12}}>Get help from your Aegis team · avg response 14 min</p>
      </div>
      <button className="btn btn-primary"><Icon name="plus" size={14} />New ticket</button>
    </div>

    <div className="kpi-grid">
      <KPI label="Open Tickets" value="2" delta="1 in progress" sub="" sparkColor="var(--info)" />
      <KPI label="Avg Response" value="14m" delta="vs 2h SLA" deltaDir="up" sub="" sparkColor="var(--ok)" />
      <KPI label="Satisfaction" value="4.8/5" delta="last 30d" sub="" sparkColor="var(--accent-3)" />
      <KPI label="Closed YTD" value="34" delta="all resolved" sub="" />
    </div>

    <div className="card" style={{marginTop:16}}>
      <div className="card-header"><div className="card-title">Your Tickets</div><div className="row" style={{gap:6}}><select className="select"><option>All statuses</option><option>Open</option><option>Closed</option></select></div></div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>ID</th><th>Subject</th><th>Status</th><th>Assignee</th><th>Updated</th><th></th></tr></thead>
          <tbody>
            {[
              ['TKT-4012','Need help configuring private endpoint for storage-data','open','Sarah C.','12m ago','danger'],
              ['TKT-4011','Question about reserved instance pricing for SQL','in_progress','Mike R.','2h ago','warn'],
              ['TKT-4010','Add new admin user (m.singh@)','closed','Jamie K.','1d ago','ok'],
              ['TKT-4009','Spike in traffic April 18 — cause?','closed','Priya S.','3d ago','ok'],
              ['TKT-4008','Set up NSG for new VNet (eu-west-2)','closed','Sarah C.','1w ago','ok'],
              ['TKT-4007','Policy exemption for legacy SQL','closed','Mike R.','2w ago','ok'],
            ].map((t,i) => (
              <tr key={i} className="clickable">
                <td className="mono" style={{fontSize:12,fontWeight:500}}>{t[0]}</td>
                <td>{t[1]}</td>
                <td><span className={`pill ${t[5]}`}><span className="dot" />{t[2] === 'open' ? 'Open' : t[2] === 'in_progress' ? 'In Progress' : 'Closed'}</span></td>
                <td className="mono" style={{fontSize:12}}>{t[3]}</td>
                <td className="dim" style={{fontSize:12}}>{t[4]}</td>
                <td><Icon name="chevron-right" size={14} className="dim" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="split-2-1" style={{marginTop:16}}>
      <div className="card">
        <div className="card-header"><div className="card-title">Your Aegis Team</div></div>
        <div style={{padding:'4px 0'}}>
          {[
            ['Sarah Chen','Account Lead','SC','online'],
            ['Mike Rodriguez','Senior Cloud Engineer','MR','online'],
            ['Priya Sharma','FinOps Analyst','PS','away'],
            ['Tomás Ribeiro','Billing','TR','offline'],
          ].map((p,i) => (
            <div key={i} style={{padding:'12px 16px',borderBottom: i < 3 ? '1px solid var(--border)' : 'none',display:'flex',alignItems:'center',gap:10}}>
              <div style={{position:'relative'}}>
                <div className="avatar">{p[2]}</div>
                <span style={{position:'absolute',bottom:-1,right:-1,width:9,height:9,borderRadius:'50%',background: p[3]==='online'?'var(--ok)':p[3]==='away'?'var(--warn)':'var(--text-muted)',border:'2px solid var(--card)'}} />
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{p[0]}</div>
                <div className="dim" style={{fontSize:11}}>{p[1]}</div>
              </div>
              <button className="btn btn-sm btn-ghost"><Icon name="message" size={12} /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Knowledge Base</div></div>
        <div style={{padding:'4px 0'}}>
          {[
            ['Setting up private endpoints','Networking · 4 min'],
            ['Understanding reserved instances','FinOps · 6 min'],
            ['Tag governance best practices','Governance · 3 min'],
            ['Disaster recovery checklist','Resilience · 8 min'],
          ].map((k,i) => (
            <button key={i} className="nav-item" style={{padding:'12px 16px',textAlign:'left'}}>
              <Icon name="file-text" size={14} className="dim" />
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:'var(--text)'}}>{k[0]}</div>
                <div className="dim" style={{fontSize:11}}>{k[1]}</div>
              </div>
              <Icon name="external-link" size={12} className="dim" />
            </button>
          ))}
        </div>
      </div>
    </div>
  </>
);

const PortalBilling = () => (
  <>
    <div style={{marginBottom:14}}>
      <h2 style={{margin:'0 0 4px',fontSize:20}}>Billing</h2>
      <p className="muted" style={{margin:0,fontSize:12}}>Invoices and payment history</p>
    </div>

    <div className="kpi-grid">
      <KPI label="Current Balance" value="$142,881" delta="due 15 May" sub="auto-pay enabled" sparkColor="var(--accent)" />
      <KPI label="YTD" value="$498,420" delta="+8% vs 2025" sub="" />
      <KPI label="Payment Method" value="ACH ··3491" delta="default" sub="" />
      <KPI label="Discounts" value="$8,140" delta="annual commit + 5%" deltaDir="up" sub="" sparkColor="var(--ok)" />
    </div>

    <div className="card" style={{marginTop:16}}>
      <div className="card-header"><div className="card-title">Invoices</div><div className="row" style={{gap:6}}><select className="select"><option>2026</option><option>2025</option></select></div></div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Invoice</th><th>Period</th><th style={{textAlign:'right'}}>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {[
              ['INV-2026-0411','Apr 2026',142881.40,'2026-05-01','2026-05-15','sent','info'],
              ['INV-2026-0311','Mar 2026',136920.10,'2026-04-01','2026-04-15','paid','ok'],
              ['INV-2026-0211','Feb 2026',128440.85,'2026-03-01','2026-03-15','paid','ok'],
              ['INV-2026-0111','Jan 2026',124201.00,'2026-02-01','2026-02-15','paid','ok'],
              ['INV-2025-1211','Dec 2025',119804.42,'2026-01-01','2026-01-15','paid','ok'],
            ].map((r,i) => (
              <tr key={i}>
                <td className="mono" style={{fontSize:12,fontWeight:500}}>{r[0]}</td>
                <td className="muted">{r[1]}</td>
                <td className="mono tabular" style={{textAlign:'right',fontWeight:600}}>{fmtMoney(r[2])}</td>
                <td className="dim" style={{fontSize:12}}>{r[3]}</td>
                <td className="dim" style={{fontSize:12}}>{r[4]}</td>
                <td><span className={`pill ${r[6]}`}><span className="dot" />{r[5]==='paid'?'Paid':'Sent'}</span></td>
                <td><div className="row" style={{gap:4}}><button className="btn btn-sm btn-ghost"><Icon name="eye" size={12} /></button><button className="btn btn-sm btn-ghost"><Icon name="download" size={12} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="card" style={{marginTop:16}}>
      <div className="card-header"><div className="card-title">Payment Methods</div><button className="btn btn-sm"><Icon name="plus" size={12} />Add method</button></div>
      <div style={{padding:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div style={{padding:14,border:'2px solid var(--accent)',borderRadius:8,background:'rgba(59,130,246,.06)'}}>
          <div className="between"><span className="pill accent">Default</span><Icon name="check" size={14} style={{color:'var(--accent)'}} /></div>
          <div style={{fontSize:14,fontWeight:600,marginTop:8}}>ACH · ending 3491</div>
          <div className="dim" style={{fontSize:11}}>Bank of America · auto-pay enabled</div>
        </div>
        <div style={{padding:14,border:'1px solid var(--border)',borderRadius:8}}>
          <div style={{fontSize:14,fontWeight:600}}>Visa · ending 0042</div>
          <div className="dim" style={{fontSize:11}}>Backup method · expires 09/27</div>
        </div>
      </div>
    </div>
  </>
);

const PortalTeam = () => (
  <>
    <div className="between" style={{marginBottom:14}}>
      <div>
        <h2 style={{margin:'0 0 4px',fontSize:20}}>Team</h2>
        <p className="muted" style={{margin:0,fontSize:12}}>Manage who has access to your Meridian Capital portal</p>
      </div>
      <button className="btn btn-primary"><Icon name="plus" size={14} />Invite user</button>
    </div>

    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>User</th><th>Role</th><th>MFA</th><th>Last sign-in</th><th></th></tr></thead>
          <tbody>
            {[
              ['Lena Hofmann','lena@meridiancap.com','Admin','LH',true,'just now'],
              ['Marcus Singh','m.singh@meridiancap.com','Tenant Admin','MS',true,'2h ago'],
              ['Diana Liu','d.liu@meridiancap.com','Cost Reader','DL',true,'1d ago'],
              ['Felix Brand','f.brand@meridiancap.com','Read-only','FB',false,'3d ago'],
              ['Yuki Tanaka','y.tanaka@meridiancap.com','Read-only','YT',true,'5d ago'],
            ].map((u,i) => (
              <tr key={i}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div className="avatar">{u[3]}</div>
                    <div>
                      <div style={{fontWeight:500,fontSize:13}}>{u[0]}</div>
                      <div className="dim mono" style={{fontSize:11}}>{u[1]}</div>
                    </div>
                  </div>
                </td>
                <td><span className="pill">{u[2]}</span></td>
                <td>{u[4] ? <span className="pill ok"><Icon name="check" size={10} />On</span> : <span className="pill danger"><Icon name="x" size={10} />Off</span>}</td>
                <td className="dim" style={{fontSize:12}}>{u[5]}</td>
                <td><button className="btn btn-sm btn-ghost"><Icon name="more-horizontal" size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="card" style={{marginTop:16}}>
      <div className="card-header"><div className="card-title">Single Sign-On</div><span className="pill ok"><Icon name="check" size={10} />Active</span></div>
      <div style={{padding:18}}>
        <div className="row" style={{gap:12,marginBottom:14}}>
          <div style={{width:40,height:40,borderRadius:8,background:'#0078D4',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>M</div>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>Microsoft Entra ID</div>
            <div className="dim mono" style={{fontSize:11}}>meridiancap.onmicrosoft.com · {TENANTS[2].tenantId.slice(0,16)}…</div>
          </div>
          <button className="btn btn-sm" style={{marginLeft:'auto'}}>Configure</button>
        </div>
        <div style={{padding:12,background:'var(--bg-hover)',borderRadius:6,fontSize:12,color:'var(--text-muted)'}}>
          <Icon name="info" size={12} /> All users must sign in via SSO. MFA enforced by your IdP policy.
        </div>
      </div>
    </div>
  </>
);

// =================== SETTINGS PAGE ===================
const SettingsPage = () => {
  const [section, setSection] = useState('workspace');
  const sections = [
    { id: 'workspace', label: 'Workspace', icon: 'home' },
    { id: 'identity', label: 'Identity & SSO', icon: 'shield-check' },
    { id: 'integrations', label: 'Integrations', icon: 'layers' },
    { id: 'branding', label: 'Branding & Portal', icon: 'palette' },
    { id: 'billing', label: 'Billing & Plan', icon: 'receipt' },
    { id: 'api', label: 'API & Webhooks', icon: 'cpu' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'data', label: 'Data & Retention', icon: 'database' },
  ];
  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Settings</h1><p className="page-sub">Workspace · identity · integrations · branding</p></div>
      </div>
      <div className="settings-layout">
        <div className="settings-sidebar">
          {sections.map(s => (
            <button key={s.id} className={`nav-item ${section === s.id ? 'active' : ''}`} onClick={() => setSection(s.id)}>
              <Icon name={s.icon} size={14} className="icon" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <div className="settings-main">
          {section === 'workspace' && <SettingsWorkspace />}
          {section === 'identity' && <SettingsIdentity />}
          {section === 'integrations' && <SettingsIntegrations />}
          {section === 'branding' && <SettingsBranding />}
          {section === 'billing' && <SettingsBilling />}
          {section === 'api' && <SettingsAPI />}
          {section === 'notifications' && <SettingsNotifications />}
          {section === 'data' && <SettingsData />}
        </div>
      </div>
    </div>
  );
};

const SettingRow = ({ label, desc, children }) => (
  <div className="setting-row">
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{label}</div>
      {desc && <div className="muted" style={{fontSize:11,maxWidth:480}}>{desc}</div>}
    </div>
    <div style={{flex:'none'}}>{children}</div>
  </div>
);

const SettingsWorkspace = () => (
  <>
    <div className="settings-h">Workspace</div>
    <div className="card">
      <SettingRow label="Workspace name" desc="Shown to your team in the sidebar header">
        <input className="input" defaultValue="Aegis MSP" style={{width:280}} />
      </SettingRow>
      <SettingRow label="Workspace URL" desc="Used for tenant portal subdomains">
        <div className="row" style={{gap:0}}>
          <input className="input" defaultValue="aegiscloud" style={{width:180,borderRadius:'6px 0 0 6px',borderRight:'none'}} />
          <span style={{padding:'8px 12px',background:'var(--bg-hover)',border:'1px solid var(--border)',borderRadius:'0 6px 6px 0',fontSize:13,color:'var(--text-muted)'}}>.aegiscloud.io</span>
        </div>
      </SettingRow>
      <SettingRow label="Default region" desc="Used as fallback when onboarding new tenants">
        <select className="select" defaultValue="East US"><option>East US</option><option>West US 2</option><option>North Europe</option><option>UK South</option></select>
      </SettingRow>
      <SettingRow label="Time zone" desc="For scheduled report runs and audit timestamps">
        <select className="select" defaultValue="UTC"><option>UTC</option><option>America/New_York</option><option>Europe/London</option></select>
      </SettingRow>
      <SettingRow label="Currency" desc="Display currency for cost reports">
        <select className="select" defaultValue="USD"><option>USD</option><option>EUR</option><option>GBP</option></select>
      </SettingRow>
    </div>

    <div className="settings-h">Danger Zone</div>
    <div className="card" style={{borderColor:'rgba(248,113,113,.3)'}}>
      <SettingRow label="Transfer workspace ownership" desc="Move ownership to another MSP admin user">
        <button className="btn">Transfer</button>
      </SettingRow>
      <SettingRow label="Delete workspace" desc="Permanently delete the workspace and all 60 tenant configurations. This cannot be undone.">
        <button className="btn btn-danger">Delete workspace</button>
      </SettingRow>
    </div>
  </>
);

const SettingsIdentity = () => (
  <>
    <div className="settings-h">Identity Provider</div>
    <div className="card">
      <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
        <div className="between">
          <div className="row" style={{gap:12}}>
            <div style={{width:40,height:40,borderRadius:8,background:'#0078D4',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>M</div>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>Microsoft Entra ID</div>
              <div className="dim mono" style={{fontSize:11}}>aegiscloud.onmicrosoft.com</div>
            </div>
          </div>
          <span className="pill ok"><Icon name="check" size={10} />Active · primary</span>
        </div>
      </div>
      <SettingRow label="SAML SSO" desc="Single sign-on for all MSP staff users">
        <span className="pill ok"><span className="dot" />Enforced</span>
      </SettingRow>
      <SettingRow label="MFA enforcement" desc="Require MFA for all users in this workspace">
        <Toggle checked />
      </SettingRow>
      <SettingRow label="JIT (Just-In-Time) Privilege" desc="Privileged Identity Management · max 8h elevation">
        <Toggle checked />
      </SettingRow>
      <SettingRow label="Session timeout" desc="Idle sign-out for the MSP console">
        <select className="select" defaultValue="8h"><option>1h</option><option>4h</option><option>8h</option><option>24h</option></select>
      </SettingRow>
    </div>

    <div className="settings-h">Customer SSO</div>
    <div className="card">
      <SettingRow label="Allow customer-controlled IdP" desc="Each customer brings their own Entra/Okta/Auth0 — federated to portal subdomain">
        <Toggle checked />
      </SettingRow>
      <SettingRow label="Default IdP for new tenants" desc="Used when a new customer is onboarded without specifying an IdP">
        <select className="select" defaultValue="Microsoft Entra ID"><option>Microsoft Entra ID</option><option>Okta</option><option>Auth0</option><option>Google Workspace</option></select>
      </SettingRow>
      <SettingRow label="SCIM provisioning" desc="Automatic user lifecycle from customer IdP">
        <Toggle checked />
      </SettingRow>
    </div>
  </>
);

const SettingsIntegrations = () => {
  const integrations = [
    { name:'Microsoft Azure', desc:'Resource graph + cost API', status:'connected', icon:'cloud', tenants:60 },
    { name:'Microsoft Defender for Cloud', desc:'Security alerts + recommendations', status:'connected', icon:'shield', tenants:60 },
    { name:'Microsoft Sentinel', desc:'SIEM correlation', status:'connected', icon:'shield-check', tenants:42 },
    { name:'PagerDuty', desc:'On-call routing for critical alerts', status:'connected', icon:'bell', tenants:'—' },
    { name:'Slack', desc:'Real-time alert notifications', status:'connected', icon:'message', tenants:'#aegis-alerts' },
    { name:'Microsoft Teams', desc:'Customer notifications', status:'connected', icon:'message', tenants:'—' },
    { name:'GitHub', desc:'Bicep template version control', status:'connected', icon:'cpu', tenants:'aegis-cloud-bicep' },
    { name:'Jira', desc:'Convert alerts to incidents', status:'available', icon:'list', tenants:'—' },
    { name:'ServiceNow', desc:'ITSM ticket sync', status:'available', icon:'list', tenants:'—' },
    { name:'Datadog', desc:'Metrics + APM correlation', status:'available', icon:'activity', tenants:'—' },
    { name:'Stripe', desc:'Customer billing & invoicing', status:'connected', icon:'receipt', tenants:'live mode' },
    { name:'QuickBooks', desc:'Sync invoices to AR', status:'connected', icon:'piggy-bank', tenants:'—' },
  ];
  return (
    <>
      <div className="settings-h">Connected Services</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
        {integrations.map(i => (
          <div key={i.name} className="integration-card">
            <div className="between" style={{marginBottom:8}}>
              <div className="integration-icon"><Icon name={i.icon} size={18} /></div>
              {i.status === 'connected' ? <span className="pill ok"><span className="dot" />Connected</span> : <span className="pill">Available</span>}
            </div>
            <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{i.name}</div>
            <div className="dim" style={{fontSize:11,marginBottom:10}}>{i.desc}</div>
            <div className="between">
              <div className="dim mono" style={{fontSize:11}}>{i.tenants !== '—' ? `${i.tenants} ${typeof i.tenants === 'number' ? 'tenants' : ''}` : ''}</div>
              <button className="btn btn-sm btn-ghost">{i.status==='connected'?'Configure':'Connect'}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const SettingsBranding = () => (
  <>
    <div className="settings-h">Customer Portal Branding</div>
    <div className="card">
      <SettingRow label="Default portal logo" desc="Falls back to this if a tenant hasn't uploaded their own">
        <div className="row" style={{gap:8}}>
          <div style={{width:36,height:36,borderRadius:6,background:'linear-gradient(135deg,var(--accent),var(--accent-2))'}} />
          <button className="btn btn-sm">Replace</button>
        </div>
      </SettingRow>
      <SettingRow label="Powered by Aegis footer" desc="Show 'Powered by Aegis Cloud' in customer portals">
        <Toggle checked />
      </SettingRow>
      <SettingRow label="Custom domain support" desc="Let customers map their own domain (cloud.theircompany.com)">
        <Toggle checked />
      </SettingRow>
      <SettingRow label="Email sender" desc="From address for customer notifications">
        <input className="input" defaultValue="aegis@aegiscloud.io" style={{width:260}} />
      </SettingRow>
    </div>

    <div className="settings-h">MSP Console Theme</div>
    <div className="card">
      <SettingRow label="Theme" desc="Default theme for new MSP staff">
        <div className="row" style={{gap:6}}>
          <button className="btn btn-sm" style={{background:'var(--accent)',color:'#fff'}}>Dark</button>
          <button className="btn btn-sm">Light</button>
          <button className="btn btn-sm">System</button>
        </div>
      </SettingRow>
      <SettingRow label="Accent color" desc="Used in primary buttons and chart highlights">
        <div className="row" style={{gap:6}}>
          {['#3b82f6','#22d3ee','#a78bfa','#34d399','#f472b6','#fb923c'].map(c => (
            <div key={c} style={{width:24,height:24,borderRadius:'50%',background:c,cursor:'pointer',border:c==='#3b82f6'?'2px solid var(--text)':'2px solid transparent'}} />
          ))}
        </div>
      </SettingRow>
      <SettingRow label="Density" desc="Affects spacing in tables and cards">
        <select className="select" defaultValue="Comfortable"><option>Compact</option><option>Comfortable</option><option>Spacious</option></select>
      </SettingRow>
    </div>
  </>
);

const SettingsBilling = () => (
  <>
    <div className="settings-h">Your Aegis Plan</div>
    <div className="card" style={{padding:24,marginBottom:16}}>
      <div className="between" style={{marginBottom:14}}>
        <div>
          <div className="pill accent" style={{marginBottom:8}}>Enterprise · MSP</div>
          <div style={{fontSize:24,fontWeight:700}}>$4,200<span className="muted" style={{fontSize:13,fontWeight:400}}>/month</span></div>
          <div className="muted" style={{fontSize:12,marginTop:2}}>Billed monthly · committed for 12 months</div>
        </div>
        <button className="btn">Change plan</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,padding:'14px 0',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div><div className="muted" style={{fontSize:11,marginBottom:2}}>Tenants</div><div className="mono tabular" style={{fontSize:18,fontWeight:600}}>60 / 100</div></div>
        <div><div className="muted" style={{fontSize:11,marginBottom:2}}>MSP seats</div><div className="mono tabular" style={{fontSize:18,fontWeight:600}}>8 / 25</div></div>
        <div><div className="muted" style={{fontSize:11,marginBottom:2}}>Bicep generations</div><div className="mono tabular" style={{fontSize:18,fontWeight:600}}>1,420 / unlimited</div></div>
        <div><div className="muted" style={{fontSize:11,marginBottom:2}}>API calls (mo)</div><div className="mono tabular" style={{fontSize:18,fontWeight:600}}>418k / 1M</div></div>
      </div>
    </div>

    <div className="settings-h">Payment</div>
    <div className="card">
      <SettingRow label="Payment method" desc="Used for monthly subscription billing">
        <div className="row" style={{gap:8}}>
          <span className="mono" style={{fontSize:13}}>Visa · ending 0042</span>
          <button className="btn btn-sm">Update</button>
        </div>
      </SettingRow>
      <SettingRow label="Billing email" desc="Receipts and invoice notifications">
        <input className="input" defaultValue="billing@aegiscloud.io" style={{width:280}} />
      </SettingRow>
      <SettingRow label="Tax ID / VAT" desc="Shown on issued invoices">
        <input className="input" defaultValue="EU123456789" style={{width:200}} />
      </SettingRow>
    </div>

    <div className="settings-h">Recent Charges</div>
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Date</th><th>Description</th><th style={{textAlign:'right'}}>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {[
              ['1 May 2026','Monthly subscription · April',4200,'paid'],
              ['1 Apr 2026','Monthly subscription · March',4200,'paid'],
              ['1 Mar 2026','Monthly subscription · February',4200,'paid'],
              ['15 Feb 2026','Add-on: 10 extra seats',1500,'paid'],
              ['1 Feb 2026','Monthly subscription · January',4200,'paid'],
            ].map((r,i) => (
              <tr key={i}>
                <td className="dim" style={{fontSize:12}}>{r[0]}</td>
                <td>{r[1]}</td>
                <td style={{textAlign:'right'}} className="mono tabular">{fmtMoney(r[2])}</td>
                <td><span className="pill ok"><span className="dot" />Paid</span></td>
                <td><button className="btn btn-sm btn-ghost"><Icon name="download" size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

const SettingsAPI = () => (
  <>
    <div className="settings-h">API Keys</div>
    <div className="card">
      <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
        <div className="between" style={{marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:600}}>Production API key</div>
          <button className="btn btn-sm btn-primary"><Icon name="plus" size={12} />New key</button>
        </div>
        <div className="dim" style={{fontSize:12}}>Programmatic access to all read/write endpoints · rate limit 1000 req/min</div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Key</th><th>Scope</th><th>Created</th><th>Last used</th><th></th></tr></thead>
          <tbody>
            {[
              ['ci-deploy-prod','aeg_live_••••••••••••8a4f','read+write','12 Jan 2026','2m ago'],
              ['monitoring-readonly','aeg_live_••••••••••••3c91','read','03 Mar 2026','14m ago'],
              ['finance-export','aeg_live_••••••••••••7e22','billing:read','22 Apr 2026','1d ago'],
            ].map((r,i) => (
              <tr key={i}>
                <td style={{fontWeight:500}}>{r[0]}</td>
                <td className="mono dim" style={{fontSize:11}}>{r[1]}</td>
                <td><span className="pill">{r[2]}</span></td>
                <td className="dim" style={{fontSize:12}}>{r[3]}</td>
                <td className="dim" style={{fontSize:12}}>{r[4]}</td>
                <td><div className="row" style={{gap:4}}><button className="btn btn-sm btn-ghost">Rotate</button><button className="btn btn-sm btn-ghost"><Icon name="trash" size={12} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="settings-h">Webhooks</div>
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Endpoint</th><th>Events</th><th>Status</th><th>Last delivery</th><th></th></tr></thead>
          <tbody>
            {[
              ['https://hooks.aegiscloud.io/incidents','alert.* · 4 events','active','2m ago · 200 OK','ok'],
              ['https://api.northwind.com/aegis-webhook','savings.applied','active','1h ago · 200 OK','ok'],
              ['https://meridian.zapier.com/aegis','invoice.* · 3 events','failing','3h ago · 503','danger'],
              ['https://aegis-bot.local/test','*','disabled','—','dim'],
            ].map((r,i) => (
              <tr key={i}>
                <td className="mono" style={{fontSize:12}}>{r[0]}</td>
                <td className="muted" style={{fontSize:12}}>{r[1]}</td>
                <td><span className={`pill ${r[4]==='ok'?'ok':r[4]==='danger'?'danger':''}`}><span className="dot" />{r[2]}</span></td>
                <td className="dim" style={{fontSize:12}}>{r[3]}</td>
                <td><button className="btn btn-sm btn-ghost"><Icon name="more-horizontal" size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:14,borderTop:'1px solid var(--border)'}}>
        <button className="btn btn-sm"><Icon name="plus" size={12} />Add webhook</button>
        <button className="btn btn-sm btn-ghost" style={{marginLeft:8}}><Icon name="file-text" size={12} />Webhook docs</button>
      </div>
    </div>
  </>
);

const SettingsNotifications = () => (
  <>
    <div className="settings-h">Channels</div>
    <div className="card">
      {[
        ['Email','sarah.chen@aegiscloud.io','message','ok'],
        ['Slack','#aegis-alerts (T-Aegis)','message','ok'],
        ['PagerDuty','aegis-on-call rotation','bell','ok'],
        ['Microsoft Teams','Aegis Operations','message','ok'],
        ['SMS','+1 555 ··· 8204','smartphone','warn'],
      ].map((r,i) => (
        <SettingRow key={r[0]} label={r[0]} desc={r[1]}>
          <span className={`pill ${r[3]}`}><span className="dot" />{r[3]==='ok'?'Active':'Pending verify'}</span>
        </SettingRow>
      ))}
    </div>

    <div className="settings-h">Routing Rules</div>
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Severity</th><th>Channel</th><th>Time window</th><th>Recipients</th><th></th></tr></thead>
          <tbody>
            <tr><td><span className="sev crit">Critical</span></td><td>PagerDuty + SMS</td><td>24/7</td><td>aegis-on-call</td><td><button className="btn btn-sm btn-ghost"><Icon name="edit" size={12} /></button></td></tr>
            <tr><td><span className="sev high">High</span></td><td>Slack + Email</td><td>24/7</td><td>#aegis-alerts</td><td><button className="btn btn-sm btn-ghost"><Icon name="edit" size={12} /></button></td></tr>
            <tr><td><span className="sev med">Medium</span></td><td>Slack</td><td>Business hours</td><td>#aegis-noisy</td><td><button className="btn btn-sm btn-ghost"><Icon name="edit" size={12} /></button></td></tr>
            <tr><td><span className="sev low">Low</span></td><td>Email digest</td><td>Daily 09:00</td><td>aegis-team@</td><td><button className="btn btn-sm btn-ghost"><Icon name="edit" size={12} /></button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </>
);

const SettingsData = () => (
  <>
    <div className="settings-h">Data Retention</div>
    <div className="card">
      <SettingRow label="Audit log retention" desc="Required for SOC 2 / ISO 27001 — minimum 12 months">
        <select className="select" defaultValue="3 years"><option>1 year</option><option>2 years</option><option>3 years</option><option>7 years</option><option>Forever</option></select>
      </SettingRow>
      <SettingRow label="Cost data retention" desc="Per-resource cost history">
        <select className="select" defaultValue="3 years"><option>90 days</option><option>1 year</option><option>3 years</option><option>5 years</option></select>
      </SettingRow>
      <SettingRow label="Alert history" desc="Resolved alerts with full context">
        <select className="select" defaultValue="2 years"><option>90 days</option><option>1 year</option><option>2 years</option></select>
      </SettingRow>
      <SettingRow label="Bicep generation history" desc="Past AI generations and prompts">
        <select className="select" defaultValue="1 year"><option>30 days</option><option>90 days</option><option>1 year</option><option>Forever</option></select>
      </SettingRow>
    </div>

    <div className="settings-h">Data Residency</div>
    <div className="card">
      <SettingRow label="Storage region" desc="Where Aegis stores your operational data (separate from your Azure tenants)">
        <select className="select" defaultValue="EU (Ireland)"><option>US East (Virginia)</option><option>US West (Oregon)</option><option>EU (Ireland)</option><option>UK (London)</option><option>APAC (Singapore)</option></select>
      </SettingRow>
      <SettingRow label="Customer data isolation" desc="Per-tenant database schema · enforced">
        <span className="pill ok"><Icon name="check" size={10} />Active</span>
      </SettingRow>
      <SettingRow label="At-rest encryption" desc="AES-256 with customer-managed keys (CMK)">
        <span className="pill ok"><Icon name="check" size={10} />Enabled</span>
      </SettingRow>
    </div>

    <div className="settings-h">Export & Delete</div>
    <div className="card">
      <SettingRow label="Export workspace data" desc="Bulk export all data (cost, alerts, audit) as CSV/JSON archive">
        <button className="btn">Request export</button>
      </SettingRow>
      <SettingRow label="GDPR data subject request" desc="Export or delete a single user's data">
        <button className="btn">Open DSR portal</button>
      </SettingRow>
    </div>
  </>
);

// Toggle helper
const Toggle = ({ checked: initial = false }) => {
  const [on, setOn] = useState(initial);
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={() => setOn(!on)} type="button">
      <span className="toggle-knob" />
    </button>
  );
};

window.AlertsPage = AlertsPage;
window.ReportsPage = ReportsPage;
window.PortalPage = PortalPage;
window.SettingsPage = SettingsPage;

})();

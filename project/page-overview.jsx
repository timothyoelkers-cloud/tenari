(function(){
const { TENANTS, TOTAL_SUBS, TOTAL_SPEND, TOTAL_SAVINGS, AVG_COMPLIANCE, TOTAL_ALERTS, TOTAL_CRITICAL, SPEND_TREND, DAILY_SPEND, RESOURCE_BREAKDOWN, fmtMoney, fmtMoneyK, fmtPct, fmtNum } = window.AegisData;
/* Overview (home) — multi-tenant dashboard */
// All AegisData refs are scoped inside components to avoid global collisions across babel scripts.

const KPI = ({ label, value, delta, deltaDir, sub, spark, sparkColor = 'var(--accent)' }) => (
  <div className="kpi">
    <div className="kpi-label">{label}</div>
    <div className="kpi-value tabular">{value}</div>
    <div className="kpi-delta">
      {deltaDir && <Icon name={deltaDir === 'up' ? 'trending-up' : 'trending-down'} size={12} className={deltaDir === 'up' ? 'ok-text' : 'bad-text'} />}
      <span className={deltaDir === 'up' ? 'ok-text' : deltaDir === 'down' ? 'bad-text' : ''} style={{ color: deltaDir === 'up' ? 'var(--ok)' : deltaDir === 'down' ? 'var(--danger)' : 'inherit' }}>{delta}</span>
      <span className="muted">{sub}</span>
    </div>
    {spark && <div className="kpi-spark"><Sparkline data={spark} w={84} h={28} color={sparkColor} area /></div>}
  </div>
);

const OverviewPage = ({ setPage, setTenant }) => {
  const [period, setPeriod] = useState('30d');
  const top10 = [...TENANTS].sort((a, b) => b.monthly - a.monthly).slice(0, 10);
  const criticalTenants = TENANTS.filter(t => t.status === 'crit').slice(0, 6);
  const heatmap = TENANTS.slice(0, 60);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Multi-Tenant Overview</h1>
          <p className="page-sub">Consolidated view across {TENANTS.length} tenants · {TOTAL_SUBS} subscriptions</p>
        </div>
        <div className="page-actions">
          <select className="select" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
          </select>
          <button className="btn"><Icon name="download" size={14} /> Export</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} /> Add tenant</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="Monthly Spend" value={fmtMoneyK(TOTAL_SPEND)} delta="+8.2%" deltaDir="up" sub="vs last month" spark={SPEND_TREND.slice(-12)} />
        <KPI label="Identified Savings" value={fmtMoneyK(TOTAL_SAVINGS)} delta={fmtPct(TOTAL_SAVINGS/TOTAL_SPEND*100)} deltaDir="up" sub="of monthly spend" spark={DAILY_SPEND.slice(-12).map(x => x*0.18)} sparkColor="var(--accent-3)" />
        <KPI label="Avg. Compliance" value={fmtPct(AVG_COMPLIANCE)} delta="+2.1pp" deltaDir="up" sub="across policies" spark={[78,76,77,79,80,82,81,83,84,86,85,AVG_COMPLIANCE]} sparkColor="var(--accent-2)" />
        <KPI label="Open Alerts" value={fmtNum(TOTAL_ALERTS)} delta={`${TOTAL_CRITICAL} critical`} deltaDir="down" sub="" spark={[12,18,15,22,17,28,19,24,21,26,23,TOTAL_ALERTS].map(x=>x*5)} sparkColor="var(--danger)" />
      </div>

      <div className="split-2-1" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Spend Trend</div>
              <div className="card-sub">12-month view, all tenants</div>
            </div>
            <div className="row">
              <span className="pill accent"><span className="dot" />Actuals</span>
              <span className="pill"><span className="dot" style={{background:'var(--text-muted)'}} />Forecast</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <SpendChart data={SPEND_TREND} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Spend by Service</div>
            <button className="btn btn-sm btn-ghost"><Icon name="more-horizontal" size={14} /></button>
          </div>
          <div className="card-body">
            <div className="donut-wrap">
              <Donut size={140} thickness={18} segments={RESOURCE_BREAKDOWN} />
              <div className="legend">
                {RESOURCE_BREAKDOWN.map(s => (
                  <div key={s.name} className="legend-item">
                    <span className="legend-swatch" style={{ background: s.color }} />
                    <span style={{ minWidth: 80 }}>{s.name}</span>
                    <span className="muted mono tabular">{fmtMoneyK(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="split-2-1" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Tenants by Spend</div>
              <div className="card-sub">Click any row to deep-dive</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => setPage('tenants')}>View all <Icon name="arrow-right" size={12} /></button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Region</th>
                  <th>Plan</th>
                  <th style={{textAlign:'right'}}>Monthly</th>
                  <th style={{textAlign:'right'}}>Trend</th>
                  <th>Compliance</th>
                  <th>SLA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {top10.map(t => (
                  <tr key={t.id} className="clickable" onClick={() => { setTenant(t.id); setPage('tenant'); }}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="tenant-pip" style={{ background: t.color }}>{t.initials}</div>
                        <div>
                          <div style={{fontWeight:500}}>{t.name}</div>
                          <div className="mono dim" style={{fontSize:11}}>{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{t.region}</td>
                    <td><span className="pill">{t.plan}</span></td>
                    <td style={{textAlign:'right'}} className="mono tabular">{fmtMoney(t.monthly)}</td>
                    <td style={{textAlign:'right'}} className="mono tabular">
                      <span style={{ color: t.trend > 0 ? 'var(--danger)' : 'var(--ok)' }}>
                        {t.trend > 0 ? '+' : ''}{t.trend}%
                      </span>
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="bar" style={{width:80}}>
                          <span style={{ width: t.compliance + '%', background: t.compliance > 85 ? 'var(--ok)' : t.compliance > 70 ? 'var(--warn)' : 'var(--danger)' }} />
                        </div>
                        <span className="mono tabular dim" style={{fontSize:12,minWidth:36}}>{t.compliance}%</span>
                      </div>
                    </td>
                    <td className="mono tabular">{t.sla}%</td>
                    <td>
                      <span className={`pill ${t.status === 'crit' ? 'danger' : t.status === 'warn' ? 'warn' : 'ok'}`}>
                        <span className="dot" />{t.status === 'crit' ? 'Critical' : t.status === 'warn' ? 'Warn' : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Tenant Health Heatmap</div>
              <span className="muted" style={{fontSize:11}}>{TENANTS.length} tenants</span>
            </div>
            <div className="card-body">
              <div className="tenant-grid">
                {heatmap.map(t => (
                  <div key={t.id}
                    className="tenant-cell"
                    title={`${t.name} · ${t.compliance}% · ${t.alerts} alerts`}
                    onClick={() => { setTenant(t.id); setPage('tenant'); }}
                    style={{
                      background: t.status === 'crit' ? 'var(--danger)' : t.status === 'warn' ? 'var(--warn)' : 'var(--ok)',
                      opacity: 0.35 + (t.compliance / 100) * 0.65
                    }}
                  />
                ))}
              </div>
              <div className="row" style={{justifyContent:'space-between',marginTop:14,fontSize:11}}>
                <span className="muted">Color = status</span>
                <div className="row" style={{gap:10}}>
                  <span className="legend-item"><span className="legend-swatch" style={{background:'var(--ok)'}} />Healthy</span>
                  <span className="legend-item"><span className="legend-swatch" style={{background:'var(--warn)'}} />Warn</span>
                  <span className="legend-item"><span className="legend-swatch" style={{background:'var(--danger)'}} />Crit</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Critical Attention</div>
              <button className="btn btn-sm btn-ghost" onClick={() => setPage('alerts')}>All alerts</button>
            </div>
            <div style={{padding:'4px 8px 12px'}}>
              {criticalTenants.map(t => (
                <button key={t.id} className="nav-item" onClick={() => { setTenant(t.id); setPage('tenant'); }}
                  style={{padding:'10px 12px'}}>
                  <div className="tenant-pip" style={{ background: t.color, width: 22, height: 22, fontSize: 10 }}>{t.initials}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:500,fontSize:13,color:'var(--text)'}}>{t.name}</div>
                    <div className="dim" style={{fontSize:11}}>{t.critical} critical · {t.alerts} alerts</div>
                  </div>
                  <Icon name="chevron-right" size={14} className="dim" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Spend chart (large area chart)
const SpendChart = ({ data }) => {
  const w = 720, h = 220, pad = { l: 50, r: 10, t: 10, b: 24 };
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const xs = (i) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
  const ys = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const path = data.map((v, i) => `${i ? 'L' : 'M'} ${xs(i)} ${ys(v)}`).join(' ');
  const areaPath = `${path} L ${xs(data.length - 1)} ${h - pad.b} L ${xs(0)} ${h - pad.b} Z`;
  const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
  const yTicks = 4;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{maxHeight:260}}>
      <defs>
        <linearGradient id="spendgrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[...Array(yTicks + 1)].map((_, i) => {
        const y = pad.t + (i / yTicks) * (h - pad.t - pad.b);
        const v = max - (i / yTicks) * (max - min);
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
            <text x={pad.l - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end" className="mono">{fmtMoneyK(v)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#spendgrad)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={xs(i)} cy={ys(v)} r="3" fill="var(--bg-elev)" stroke="var(--accent)" strokeWidth="1.5" />
      ))}
      {months.map((m, i) => (
        <text key={i} x={xs(i)} y={h - 6} fill="var(--text-muted)" fontSize="10" textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
};

window.OverviewPage = OverviewPage;
window.KPI = KPI;
window.SpendChart = SpendChart;

})();

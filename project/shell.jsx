/* Shared shell: Sidebar, Topbar, TenantSwitcher, ThemeToggle, helpers */
const { useState, useRef, useEffect, useMemo, useCallback } = React;

// Tiny sparkline
const Sparkline = ({ data, w = 80, h = 24, color = 'currentColor', area = false }) => {
  if (!data || !data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / span) * (h - 4) - 2}`).join(' ');
  const areaPath = `M0,${h} L${points.replace(/,/g, ' ').split(' ').map((_, i, a) => i % 2 ? a[i-1] + ',' + a[i] : '').filter(Boolean).join(' L')} L${w},${h} Z`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      {area && <polyline points={`0,${h} ${points} ${w},${h}`} fill={color} fillOpacity="0.15" stroke="none" />}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Bars = ({ data, w = 100, h = 28, color = 'var(--accent)' }) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data) || 1;
  const bw = (w - (data.length - 1) * 2) / data.length;
  return (
    <svg width={w} height={h}>
      {data.map((v, i) => (
        <rect key={i} x={i * (bw + 2)} y={h - (v / max) * h} width={bw} height={(v / max) * h} fill={color} rx="1" />
      ))}
    </svg>
  );
};

// Donut chart
const Donut = ({ size = 120, thickness = 14, segments }) => {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--bg-hover)" strokeWidth={thickness} fill="none" />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dasharray = `${len} ${c - len}`;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r}
            stroke={s.color} strokeWidth={thickness} fill="none"
            strokeDasharray={dasharray}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
};

// Topbar
const TenantSwitcher = ({ tenant, onChange, allOption = true }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const tenants = window.AegisData.TENANTS;
  const filtered = tenants.filter(t => t.name.toLowerCase().includes(q.toLowerCase()) || t.id.toLowerCase().includes(q.toLowerCase()));
  const current = tenant === 'ALL' ? null : tenants.find(t => t.id === tenant);
  return (
    <div className="tenant-switcher" ref={ref} onClick={() => setOpen(o => !o)}>
      <div className="tenant-pip" style={{ background: current ? current.color : 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
        {current ? current.initials : <Icon name="layers" size={11} />}
      </div>
      <div className="tenant-info">
        <div className="tenant-name">{current ? current.name : 'All Tenants'}</div>
        <div className="tenant-id mono">{current ? current.id : `${tenants.length} organizations`}</div>
      </div>
      <Icon name="chevron" className="chevron" size={14} />
      {open && (
        <div className="tenant-menu" onClick={e => e.stopPropagation()}>
          <div className="tenant-menu-search">
            <input autoFocus placeholder="Search tenants…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="tenant-menu-list">
            {allOption && (
              <button className={`tenant-menu-item ${tenant === 'ALL' ? 'active' : ''}`}
                onClick={() => { onChange('ALL'); setOpen(false); }}>
                <div className="tenant-pip" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
                  <Icon name="layers" size={11} />
                </div>
                <div className="tenant-info">
                  <div className="tenant-name">All Tenants</div>
                  <div className="tenant-id mono">{tenants.length} organizations</div>
                </div>
                {tenant === 'ALL' && <Icon name="check" size={14} />}
              </button>
            )}
            {filtered.map(t => (
              <button key={t.id} className={`tenant-menu-item ${tenant === t.id ? 'active' : ''}`}
                onClick={() => { onChange(t.id); setOpen(false); }}>
                <div className="tenant-pip" style={{ background: t.color }}>{t.initials}</div>
                <div className="tenant-info">
                  <div className="tenant-name">{t.name}</div>
                  <div className="tenant-id mono">{t.id} · {t.subs} subs</div>
                </div>
                <span className={`pill ${t.status === 'crit' ? 'danger' : t.status === 'warn' ? 'warn' : 'ok'}`} style={{ marginLeft: 'auto' }}>
                  <span className="dot" />{t.status === 'crit' ? 'Critical' : t.status === 'warn' ? 'Warn' : 'OK'}
                </span>
              </button>
            ))}
          </div>
          <div className="tenant-menu-foot">
            <button className="btn btn-sm btn-ghost"><Icon name="plus" size={12} /> Add tenant</button>
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }}><Icon name="settings" size={12} /> Manage</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Topbar = ({ tenant, setTenant, page, allOption }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="topbar">
      <TenantSwitcher tenant={tenant} onChange={setTenant} allOption={allOption} />
      <div className="search">
        <Icon name="search" size={14} className="dim" />
        <input placeholder="Search resources, policies, alerts…" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" title="Refresh"><Icon name="refresh" size={16} /></button>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
        <button className="icon-btn" title="Notifications">
          <Icon name="bell" size={16} />
          <span className="dot" />
        </button>
      </div>
    </div>
  );
};

// Sidebar
const NAV = [
  { group: 'Manage', items: [
    { id: 'home', label: 'Overview', icon: 'home' },
    { id: 'tenants', label: 'Tenants', icon: 'layers', badge: '60' },
    { id: 'tenant', label: 'Tenant Detail', icon: 'cpu', hide: true },
    { id: 'policies', label: 'Policies', icon: 'shield', badge: '12' },
    { id: 'savings', label: 'Cost & Savings', icon: 'piggy-bank', badge: '$284k' },
    { id: 'bicep', label: 'AI Bicep', icon: 'sparkles' },
  ]},
  { group: 'Operate', items: [
    { id: 'alerts', label: 'Alerts', icon: 'bell', alertBadge: '4' },
    { id: 'reports', label: 'Reports', icon: 'file-text' },
    { id: 'billing', label: 'Billing', icon: 'receipt' },
    { id: 'audit', label: 'Audit Log', icon: 'activity' },
  ]},
  { group: 'Admin', items: [
    { id: 'rbac', label: 'Users & RBAC', icon: 'users' },
    { id: 'portal', label: 'Customer Portal', icon: 'palette' },
    { id: 'mobile', label: 'Mobile View', icon: 'smartphone' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]},
];

const Sidebar = ({ page, setPage }) => (
  <div className="sidebar">
    <div className="brand">
      <div className="brand-mark" />
      <div>
        <div className="brand-name">Aegis Cloud</div>
        <div className="brand-tag">MSP Console</div>
      </div>
    </div>
    <nav className="nav">
      {NAV.map(g => (
        <React.Fragment key={g.group}>
          <div className="nav-section">{g.group}</div>
          {g.items.filter(i => !i.hide).map(item => (
            <button key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}>
              <Icon name={item.icon} size={16} className="icon" />
              <span>{item.label}</span>
              {item.badge && <span className="badge mono">{item.badge}</span>}
              {item.alertBadge && <span className="badge alert mono">{item.alertBadge}</span>}
            </button>
          ))}
        </React.Fragment>
      ))}
    </nav>
    <div className="sidebar-footer">
      <div className="user-card">
        <div className="avatar">SC</div>
        <div className="user-info">
          <div className="user-name">Sarah Chen</div>
          <div className="user-role">Owner · Aegis MSP</div>
        </div>
        <Icon name="chevron" size={14} className="dim" />
      </div>
    </div>
  </div>
);

// Theme
const ThemeContext = React.createContext({ theme: 'dark', toggleTheme: () => {} });
const useTheme = () => React.useContext(ThemeContext);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('aegis_theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aegis_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

// Toasts
const ToastCtx = React.createContext({ push: () => {} });
const useToast = () => React.useContext(ToastCtx);
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <Icon name={t.kind === 'ok' ? 'check' : 'alert-triangle'} size={14} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

Object.assign(window, {
  Sparkline, Bars, Donut,
  Topbar, Sidebar, TenantSwitcher,
  ThemeProvider, useTheme,
  ToastProvider, useToast,
});
